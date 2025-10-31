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
      .eq('key', 'stripe_config')
      .maybeSingle();

    if (configError || !configData) {
      return new Response(
        JSON.stringify({ error: 'Configuración de Stripe no encontrada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const config = configData.value;

    if (!config.enabled) {
      return new Response(
        JSON.stringify({ error: 'Stripe no está habilitado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const lineItems = items.map((item: any) => ({
      price_data: {
        currency: (currency || 'mxn').toLowerCase(),
        product_data: {
          name: item.title,
          description: item.sku || '',
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    const siteUrl = Deno.env.get('SITE_URL') || 'https://tudominio.com';

    const sessionData = {
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${siteUrl}/payment-success?order_id=${order_id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/payment-failure?order_id=${order_id}`,
      customer_email: customer_info?.email,
      metadata: {
        order_id: order_id,
      },
    };

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.secret_key}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(
        Object.entries(sessionData).reduce((acc: any, [key, value]) => {
          if (key === 'line_items') {
            lineItems.forEach((item: any, index: number) => {
              acc[`line_items[${index}][price_data][currency]`] = item.price_data.currency;
              acc[`line_items[${index}][price_data][product_data][name]`] = item.price_data.product_data.name;
              acc[`line_items[${index}][price_data][unit_amount]`] = item.price_data.unit_amount;
              acc[`line_items[${index}][quantity]`] = item.quantity;
            });
          } else if (key === 'payment_method_types') {
            (value as string[]).forEach((type, index) => {
              acc[`payment_method_types[${index}]`] = type;
            });
          } else if (key === 'metadata') {
            Object.entries(value as any).forEach(([metaKey, metaValue]) => {
              acc[`metadata[${metaKey}]`] = metaValue;
            });
          } else {
            acc[key] = value;
          }
          return acc;
        }, {})
      ),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Stripe API error:', error);
      return new Response(
        JSON.stringify({ error: 'Error al crear sesión de pago' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const session = await response.json();

    return new Response(
      JSON.stringify({
        success: true,
        session_url: session.url,
        session_id: session.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error en stripe-payment:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Error desconocido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
