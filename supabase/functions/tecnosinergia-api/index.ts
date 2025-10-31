import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const TECNOSINERGIA_API_TOKEN = Deno.env.get('TECNOSINERGIA_API_TOKEN')!;
const TECNOSINERGIA_API_BASE = 'https://api.tecnosinergia.info/v3';

async function tecnosinergiaRequest(endpoint: string, method: string = 'GET', body?: any) {
  const url = `${TECNOSINERGIA_API_BASE}${endpoint}`;
  
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'api-token': TECNOSINERGIA_API_TOKEN
    }
  };

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`Tecnosinergia API error: ${response.status}`);
  }

  return await response.json();
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    switch (action) {
      case 'status': {
        const data = await tecnosinergiaRequest('/status');
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'products': {
        const itemId = url.searchParams.get('item_id');
        const endpoint = itemId ? `/item/list?item_id=${itemId}` : '/item/list';
        const data = await tecnosinergiaRequest(endpoint);
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'addresses': {
        const addressId = url.searchParams.get('address_id');
        const endpoint = addressId ? `/address/list?address_id=${addressId}` : '/address/list';
        const data = await tecnosinergiaRequest(endpoint);
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'create-order': {
        if (req.method !== 'POST') {
          return new Response(
            JSON.stringify({ error: 'Método no permitido' }),
            { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        const body = await req.json();
        const data = await tecnosinergiaRequest('/order/create', 'POST', body);
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'get-order': {
        const orderId = url.searchParams.get('order_id');
        if (!orderId) {
          return new Response(
            JSON.stringify({ error: 'order_id requerido' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        const data = await tecnosinergiaRequest(`/order?order_id=${orderId}`);
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'create-quote': {
        if (req.method !== 'POST') {
          return new Response(
            JSON.stringify({ error: 'Método no permitido' }),
            { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        const body = await req.json();
        const data = await tecnosinergiaRequest('/quote/create', 'POST', body);
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Acción no válida' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Error en tecnosinergia-api:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});