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
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { order_id, items, total, currency } = await req.json();

    if (!order_id || !items || !total) {
      return new Response(
        JSON.stringify({ error: 'Faltan parámetros requeridos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: configData, error: configError } = await supabaseClient
      .from('system_config')
      .select('value')
      .eq('key', 'paypal_config')
      .maybeSingle();

    if (configError || !configData) {
      return new Response(
        JSON.stringify({ error: 'Configuración de PayPal no encontrada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const config = configData.value;

    if (!config.enabled) {
      return new Response(
        JSON.stringify({ error: 'PayPal no está habilitado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const baseUrl = config.mode === 'production'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';

    const authResponse = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${config.client_id}:${config.client_secret}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!authResponse.ok) {
      throw new Error('Error al autenticar con PayPal');
    }

    const authData = await authResponse.json();
    const accessToken = authData.access_token;

    const siteUrl = Deno.env.get('SITE_URL') || 'https://tudominio.com';

    const orderData = {
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: order_id,
        amount: {
          currency_code: (currency || 'MXN').toUpperCase(),
          value: total.toFixed(2),
          breakdown: {
            item_total: {
              currency_code: (currency || 'MXN').toUpperCase(),
              value: total.toFixed(2),
            },
          },
        },
        items: items.map((item: any) => ({
          name: item.title.substring(0, 127),
          unit_amount: {
            currency_code: (currency || 'MXN').toUpperCase(),
            value: item.price.toFixed(2),
          },
          quantity: item.quantity.toString(),
        })),
      }],
      application_context: {
        return_url: `${siteUrl}/payment-success?order_id=${order_id}`,
        cancel_url: `${siteUrl}/payment-failure?order_id=${order_id}`,
      },
    };

    const orderResponse = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    if (!orderResponse.ok) {
      const error = await orderResponse.text();
      console.error('PayPal API error:', error);
      return new Response(
        JSON.stringify({ error: 'Error al crear orden de PayPal' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const order = await orderResponse.json();
    const approvalUrl = order.links.find((link: any) => link.rel === 'approve')?.href;

    return new Response(
      JSON.stringify({
        success: true,
        approval_url: approvalUrl,
        order_id: order.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error en paypal-payment:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Error desconocido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
