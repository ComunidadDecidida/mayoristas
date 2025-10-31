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

    const { message, test, order_id } = await req.json();

    const { data: configData } = await supabaseClient
      .from('notification_config')
      .select('*')
      .eq('service', 'whatsapp')
      .maybeSingle();

    if (!configData || !configData.is_enabled) {
      return new Response(
        JSON.stringify({ error: 'WhatsApp no está configurado o no está habilitado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const config = configData.config;
    let messageText = message;

    if (!test && order_id) {
      const { data: order } = await supabaseClient
        .from('orders')
        .select('*')
        .eq('id', order_id)
        .single();

      if (order) {
        messageText = `
🛒 *Nuevo Pedido Recibido*

📋 *Pedido:* #${order.order_number}
👤 *Cliente:* ${order.customer_info?.name || 'N/A'}
📧 *Email:* ${order.customer_info?.email || 'N/A'}
📞 *Teléfono:* ${order.customer_info?.phone || 'N/A'}

🛍️ *Productos:*
${order.items?.map((item: any) => `- ${item.title} x${item.quantity} - $${item.price}`).join('\n')}

💰 *Total:* $${order.total} ${order.currency}

✅ *Estado:* ${order.status}
        `.trim();
      }
    }

    console.log('Enviando mensaje de WhatsApp:', {
      phone: config.phone,
      message: messageText,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Mensaje enviado (simulado)',
        config: { phone: config.phone },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error en send-whatsapp:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Error desconocido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
