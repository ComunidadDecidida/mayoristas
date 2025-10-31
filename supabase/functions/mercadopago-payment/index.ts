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

    const { order_id, items, total, currency, customer_info } = await req.json();

    if (!order_id || !items || !total) {
      return new Response(
        JSON.stringify({ error: 'Faltan parámetros requeridos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: configData, error: configError } = await supabaseClient
      .from('system_config')
      .select('value')
      .eq('key', 'mercadopago_config')
      .maybeSingle();

    if (configError || !configData) {
      return new Response(
        JSON.stringify({ error: 'Configuración de MercadoPago no encontrada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const config = configData.value;

    if (!config.enabled) {
      return new Response(
        JSON.stringify({ error: 'MercadoPago no está habilitado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const mpItems = items.map((item: any) => ({
      title: item.title,
      quantity: item.quantity,
      unit_price: item.price,
      currency_id: currency || 'MXN',
    }));

    const siteUrl = Deno.env.get('SITE_URL') || 'https://tudominio.com';

    const preference = {
      items: mpItems,
      payer: {
        name: customer_info?.name,
        email: customer_info?.email,
        phone: {
          number: customer_info?.phone,
        },
      },
      back_urls: {
        success: `${siteUrl}/payment-success?order_id=${order_id}`,
        failure: `${siteUrl}/payment-failure?order_id=${order_id}`,
        pending: `${siteUrl}/payment-pending?order_id=${order_id}`,
      },
      auto_return: 'approved',
      external_reference: order_id,
      notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mercadopago-webhook`,
    };

    const mpApiUrl = config.mode === 'production'
      ? 'https://api.mercadopago.com'
      : 'https://api.mercadopago.com';

    const response = await fetch(`${mpApiUrl}/checkout/preferences`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preference),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('MercadoPago API error:', error);
      return new Response(
        JSON.stringify({ error: 'Error al crear preferencia de pago' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();

    return new Response(
      JSON.stringify({
        success: true,
        init_point: data.init_point,
        preference_id: data.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error en mercadopago-payment:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Error desconocido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
