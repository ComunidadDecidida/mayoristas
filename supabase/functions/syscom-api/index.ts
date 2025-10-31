import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SYSCOM_API_BASE = 'https://developers.syscom.mx/api/v1';

let cachedToken: { token: string; expires: Date } | null = null;

async function getAccessToken(supabaseClient: any): Promise<string> {
  if (cachedToken && cachedToken.expires > new Date()) {
    const timeRemaining = Math.round((cachedToken.expires.getTime() - Date.now()) / 1000 / 60 / 60 / 24);
    console.log('Usando token SYSCOM en caché, expira en:', timeRemaining, 'días');
    return cachedToken.token;
  }

  console.log('Obteniendo token OAuth2 desde base de datos...');

  const { data: tokenData, error: tokenError } = await supabaseClient
    .from('system_config')
    .select('value')
    .eq('key', 'syscom_oauth_token')
    .maybeSingle();

  if (tokenError || !tokenData) {
    throw new Error('No se pudo obtener el token OAuth2 de SYSCOM desde la base de datos');
  }

  const { data: expiresData, error: expiresError } = await supabaseClient
    .from('system_config')
    .select('value')
    .eq('key', 'syscom_token_expires_at')
    .maybeSingle();

  if (expiresError || !expiresData) {
    throw new Error('No se pudo obtener la fecha de expiración del token');
  }

  let token = tokenData.value;
  console.log('Token type:', typeof token);
  console.log('Token length:', typeof token === 'string' ? token.length : 'N/A');
  console.log('Token first 20 chars:', typeof token === 'string' ? token.substring(0, 20) : token);

  if (typeof token === 'string') {
    token = token.trim();
    if (token.startsWith('"') && token.endsWith('"')) {
      token = token.slice(1, -1);
      console.log('Removed quotes from token');
    }
    if (token.startsWith('\\"') && token.endsWith('\\"')) {
      token = token.slice(2, -2);
      console.log('Removed escaped quotes from token');
    }
  }

  console.log('Token after processing:', token.substring(0, 20));
  console.log('Final token length:', token.length);

  let expiresAtValue = expiresData.value;
  if (typeof expiresAtValue === 'string') {
    expiresAtValue = expiresAtValue.trim();
    if (expiresAtValue.startsWith('"') && expiresAtValue.endsWith('"')) {
      expiresAtValue = expiresAtValue.slice(1, -1);
    }
  }
  const expiresAt = new Date(expiresAtValue);

  const now = new Date();
  if (expiresAt <= now) {
    throw new Error('El token OAuth2 de SYSCOM ha expirado. Por favor, actualízalo en el panel de administración.');
  }

  const daysRemaining = Math.round((expiresAt.getTime() - now.getTime()) / 1000 / 60 / 60 / 24);
  console.log('Token OAuth2 obtenido correctamente, expira en:', daysRemaining, 'días');

  if (daysRemaining <= 30) {
    console.warn('⚠️ ADVERTENCIA: El token expirará en', daysRemaining, 'días. Considera renovarlo pronto.');
  }

  cachedToken = {
    token: token,
    expires: expiresAt
  };

  return token;
}

async function syscomRequest(
  endpoint: string,
  params: Record<string, string> = {},
  supabaseClient: any
) {
  const token = await getAccessToken(supabaseClient);
  const queryString = new URLSearchParams(params).toString();
  const url = `${SYSCOM_API_BASE}${endpoint}${queryString ? '?' + queryString : ''}`;

  console.log('SYSCOM Request:', {
    url: url.substring(0, 100) + '...',
    endpoint,
    params,
    tokenPreview: token.substring(0, 20) + '...'
  });

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });

  console.log('SYSCOM Response:', {
    status: response.status,
    statusText: response.statusText,
    ok: response.ok,
    headers: {
      contentType: response.headers.get('content-type'),
      contentLength: response.headers.get('content-length')
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('SYSCOM API Error:', {
      status: response.status,
      statusText: response.statusText,
      endpoint,
      url: url,
      error: errorText.substring(0, 500)
    });

    if (response.status === 401) {
      throw new Error('Token OAuth2 no válido o expirado. Por favor, actualízalo en el panel de administración.');
    }

    if (response.status === 429) {
      throw new Error('Límite de peticiones alcanzado (50 req/min). Espera un momento e intenta nuevamente.');
    }

    if (response.status === 404) {
      throw new Error(`Recurso no encontrado en SYSCOM: ${endpoint}`);
    }

    throw new Error(`SYSCOM API error: ${response.status} ${response.statusText} - ${errorText.substring(0, 200)}`);
  }

  const data = await response.json();

  if (endpoint.includes('/productos')) {
    console.log('SYSCOM Response productos:', {
      endpoint,
      hasProductos: !!data.productos,
      productCount: data.productos?.length || 0,
      pagina: data.pagina,
      paginas: data.paginas,
      registros: data.registros
    });
  } else if (endpoint.includes('/categorias')) {
    console.log('SYSCOM Response categorias:', {
      endpoint,
      count: Array.isArray(data) ? data.length : 'N/A'
    });
  } else if (endpoint.includes('/marcas')) {
    console.log('SYSCOM Response marcas:', {
      endpoint,
      count: Array.isArray(data) ? data.length : 'N/A'
    });
  }

  return data;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    switch (action) {
      case 'categories': {
        const id = url.searchParams.get('id');
        const endpoint = id ? `/categorias/${id}` : '/categorias';
        const data = await syscomRequest(endpoint, {}, supabaseClient);
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'products': {
        const params: Record<string, string> = {};
        const id = url.searchParams.get('id');

        if (id) {
          const data = await syscomRequest(`/productos/${id}`, {}, supabaseClient);
          return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        if (url.searchParams.get('categoria')) params.categoria = url.searchParams.get('categoria')!;
        if (url.searchParams.get('marca')) params.marca = url.searchParams.get('marca')!;
        if (url.searchParams.get('busqueda')) params.busqueda = url.searchParams.get('busqueda')!;
        if (url.searchParams.get('pagina')) params.pagina = url.searchParams.get('pagina')!;

        const stockParam = url.searchParams.get('stock');
        if (stockParam === '1' || stockParam === 'true') {
          params.stock = '1';
        }

        const data = await syscomRequest('/productos', params, supabaseClient);
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'brands': {
        const id = url.searchParams.get('id');
        const endpoint = id ? `/marcas/${id}` : '/marcas';
        const data = await syscomRequest(endpoint, {}, supabaseClient);
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'exchange-rate': {
        const data = await syscomRequest('/tipocambio', {}, supabaseClient);
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'invoices': {
        const folio = url.searchParams.get('folio');
        const endpoint = folio ? `/facturas/${folio}` : '/facturas';
        const data = await syscomRequest(endpoint, {}, supabaseClient);
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Acción no válida. Acciones disponibles: categories, products, brands, exchange-rate, invoices' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error: any) {
    console.error('Error en syscom-api:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        details: 'Verifica que el token OAuth2 sea válido y no haya expirado.'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});