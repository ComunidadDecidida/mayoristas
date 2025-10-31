import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json();

    if (body.type === 'payment') {
      const paymentId = body.data.id;

      const { data: configData } = await supabaseClient
        .from('system_config')
        .select('value')
        .eq('key', 'mercadopago_config')
        .maybeSingle();

      if (!configData) {
        return new Response(JSON.stringify({ error: 'Config not found' }), { status: 500 });
      }

      const config = configData.value;
      const mpApiUrl = 'https://api.mercadopago.com';

      const paymentResponse = await fetch(`${mpApiUrl}/v1/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${config.access_token}`,
        },
      });

      if (!paymentResponse.ok) {
        throw new Error('Error al obtener información del pago');
      }

      const payment = await paymentResponse.json();
      const orderId = payment.external_reference;

      let orderStatus = 'pending';
      let paymentStatus = payment.status;

      if (payment.status === 'approved') {
        orderStatus = 'paid';
      } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
        orderStatus = 'cancelled';
      }

      await supabaseClient
        .from('orders')
        .update({
          status: orderStatus,
          payment_status: paymentStatus,
          payment_id: paymentId.toString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (payment.status === 'approved') {
        await supabaseClient.functions.invoke('send-notifications', {
          body: {
            order_id: orderId,
            type: 'new_order',
          },
        });
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Event received' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error en mercadopago-webhook:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Error desconocido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
