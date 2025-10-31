const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export interface SyncOptions {
  source: 'syscom' | 'tecnosinergia' | 'all';
  categories?: string[];
  filters?: {
    onlyWithStock?: boolean;
    minPrice?: number;
    maxPrice?: number;
    minStock?: number;
  };
}

export interface SyncResult {
  success: boolean;
  results?: Array<{
    source: string;
    status: string;
    productsCollected?: number;
    productsWithStock?: number;
    productsSynced?: number;
    errors?: any[];
  }>;
  error?: string;
}

export const syncProducts = async (options: SyncOptions): Promise<SyncResult> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 600000);

    const response = await fetch(`${SUPABASE_URL}/functions/v1/sync-products`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        source: options.source,
        categories: options.categories || [],
        filters: options.filters || {}
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMsg = 'Error al sincronizar productos';
      try {
        const errorData = await response.json();
        errorMsg = errorData.error || errorMsg;
      } catch {
        errorMsg = `Error ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMsg);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Error in syncProducts:', error);

    let errorMessage = error.message;
    if (error.name === 'AbortError') {
      errorMessage = 'La sincronización tardó demasiado tiempo (más de 10 minutos). Intenta sincronizar menos categorías a la vez o verifica tu conexión a internet.';
    } else if (error.message === 'Failed to fetch') {
      errorMessage = 'No se pudo conectar con el servidor de sincronización. Verifica tu conexión a internet y que las Edge Functions estén desplegadas correctamente.';
    }

    return {
      success: false,
      error: errorMessage
    };
  }
};

export const getSyscomCategories = async () => {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/syscom-api?action=categories`,
      {
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error('Error al obtener categorías de SYSCOM');
    }

    return await response.json();
  } catch (error: any) {
    console.error('Error getting SYSCOM categories:', error);
    throw error;
  }
};

export const testSyscomConnection = async () => {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/syscom-api?action=exchange-rate`,
      {
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.ok;
  } catch (error) {
    return false;
  }
};

export const testTecnosinergiaConnection = async () => {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/tecnosinergia-api?action=status`,
      {
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) return false;

    const data = await response.json();
    return data.status === true;
  } catch (error) {
    return false;
  }
};
