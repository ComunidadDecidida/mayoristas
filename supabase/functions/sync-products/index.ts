import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const RATE_LIMIT_MAX_REQUESTS = 48;
const RATE_LIMIT_WINDOW_MS = 60000;
const MIN_DELAY_MS = 1250;
const DB_BATCH_SIZE = 100;

class RateLimiter {
  private requestTimestamps: number[] = [];
  private maxRequests: number;
  private windowMs: number;
  private minDelay: number;
  private lastRequestTime: number = 0;
  private name: string;

  constructor(name: string, maxRequests = 48, windowMs = 60000, minDelay = 1250) {
    this.name = name;
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.minDelay = minDelay;
  }

  private cleanOldTimestamps(): void {
    const now = Date.now();
    const cutoff = now - this.windowMs;
    this.requestTimestamps = this.requestTimestamps.filter(ts => ts > cutoff);
  }

  async waitForSlot(): Promise<void> {
    this.cleanOldTimestamps();
    const now = Date.now();

    if (this.requestTimestamps.length >= this.maxRequests) {
      const oldestTimestamp = this.requestTimestamps[0];
      const waitTime = (oldestTimestamp + this.windowMs) - now;
      if (waitTime > 0) {
        console.log(`[${this.name}] Rate limit alcanzado. Esperando ${waitTime}ms`);
        await this.sleep(waitTime + 200);
        this.cleanOldTimestamps();
      }
    }

    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.minDelay) {
      const delayTime = this.minDelay - timeSinceLastRequest;
      await this.sleep(delayTime);
    }

    if (this.requestTimestamps.length >= (this.maxRequests * 0.85)) {
      const extraDelay = this.minDelay * 0.5;
      console.log(`[${this.name}] Throttling activo. Agregando ${extraDelay}ms de retraso`);
      await this.sleep(extraDelay);
    }

    this.lastRequestTime = Date.now();
    this.requestTimestamps.push(this.lastRequestTime);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getStats() {
    this.cleanOldTimestamps();
    return {
      requestsInWindow: this.requestTimestamps.length,
      slotsAvailable: this.maxRequests - this.requestTimestamps.length
    };
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function syncCategories(
  supabaseClient: any,
  categoriesData: any[],
  source: string
) {
  console.log(`${source}: Sincronizando ${categoriesData.length} categorías`);
  let synced = 0;

  for (const cat of categoriesData) {
    try {
      const slug = (cat.nombre || cat.name || '').toLowerCase()
        .replace(/[áàäâ]/g, 'a')
        .replace(/[éèëê]/g, 'e')
        .replace(/[íìïî]/g, 'i')
        .replace(/[óòöô]/g, 'o')
        .replace(/[úùüû]/g, 'u')
        .replace(/ñ/g, 'n')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      const categoryData = {
        name: cat.nombre || cat.name || '',
        slug: `${source}-${slug}-${cat.id}`,
        source: source,
        source_id: String(cat.id || ''),
        description: cat.descripcion || cat.description || null,
        is_visible: true,
        sort_order: 0
      };

      const { error } = await supabaseClient
        .from('categories')
        .upsert(categoryData, { onConflict: 'slug' });

      if (error) throw error;
      synced++;
    } catch (err: any) {
      console.error(`Error syncing category ${cat.nombre || cat.name}:`, err.message);
    }
  }

  console.log(`${source}: ${synced} categorías sincronizadas`);
  return synced;
}

async function syncSyscom(
  supabaseClient: any,
  categories: string[],
  filters: any = {}
) {
  const baseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const authHeader = `Bearer ${serviceRoleKey}`;

  const rateLimiter = new RateLimiter('SYSCOM', RATE_LIMIT_MAX_REQUESTS, RATE_LIMIT_WINDOW_MS, MIN_DELAY_MS);

  const { data: markupConfig } = await supabaseClient
    .from('system_config')
    .select('value')
    .eq('key', 'global_markup_percentage')
    .maybeSingle();

  const markupPercentage = parseFloat(markupConfig?.value || '0');
  console.log(`SYSCOM: Markup global configurado: ${markupPercentage}%`);

  console.log('SYSCOM: Obteniendo categorías desde API...');
  const categoriesUrl = `${baseUrl}/functions/v1/syscom-api?action=categories`;
  const categoriesResponse = await fetch(categoriesUrl, {
    headers: { 'Authorization': authHeader }
  });

  if (!categoriesResponse.ok) {
    throw new Error('Error al obtener categorías de SYSCOM');
  }

  const categoriesResult = await categoriesResponse.json();
  const allCategories = categoriesResult.categorias || [];
  console.log(`SYSCOM: ${allCategories.length} categorías disponibles en la API`);

  await syncCategories(supabaseClient, allCategories, 'syscom');

  const { data: categoriesModeConfig } = await supabaseClient
    .from('system_config')
    .select('value')
    .eq('key', 'syscom_categories_mode')
    .maybeSingle();

  const categoriesMode = categoriesModeConfig?.value || 'selected';
  console.log(`SYSCOM: Modo de categorías: ${categoriesMode}`);

  let categoriesToSync: any[] = [];

  if (categoriesMode === 'all' || (categories.length > 0 && categories.includes('all'))) {
    console.log('SYSCOM: Sincronizando TODAS las categorías disponibles');
    categoriesToSync = allCategories;
  } else {
    const { data: selectedCategories } = await supabaseClient
      .from('syscom_selected_categories')
      .select('category_id')
      .eq('is_active', true);

    if (!selectedCategories || selectedCategories.length === 0) {
      const errorMsg = 'No hay categorías seleccionadas para sincronización. Por favor ve a "Configuración de SYSCOM" y selecciona al menos una categoría, o cambia el modo a "Todas las categorías".';
      console.error('SYSCOM:', errorMsg);
      return {
        productsCollected: 0,
        productsWithStock: 0,
        productsSynced: 0,
        errors: [{ message: errorMsg }]
      };
    }

    const selectedIds = selectedCategories.map((c: any) => c.category_id);
    categoriesToSync = allCategories.filter((cat: any) =>
      selectedIds.includes(String(cat.id))
    );

    if (categoriesToSync.length === 0) {
      const errorMsg = `Las ${selectedCategories.length} categorías seleccionadas no se encontraron en SYSCOM. Verifica que las categorías aún existan en la API.`;
      console.error('SYSCOM:', errorMsg);
      return {
        productsCollected: 0,
        productsWithStock: 0,
        productsSynced: 0,
        errors: [{ message: errorMsg }]
      };
    }

    console.log(`SYSCOM: ${categoriesToSync.length} categorías seleccionadas para sincronizar`);
  }

  let allProducts: any[] = [];
  let errors: any[] = [];

  const { data: maxCategoriesConfig } = await supabaseClient
    .from('system_config')
    .select('value')
    .eq('key', 'syscom_max_categories_per_sync')
    .maybeSingle();

  const MAX_CATEGORIES_PER_SYNC = parseInt(maxCategoriesConfig?.value || '0');
  const categoriesToProcess = MAX_CATEGORIES_PER_SYNC > 0
    ? categoriesToSync.slice(0, MAX_CATEGORIES_PER_SYNC)
    : categoriesToSync;

  if (MAX_CATEGORIES_PER_SYNC > 0 && categoriesToSync.length > MAX_CATEGORIES_PER_SYNC) {
    console.log(`SYSCOM: Procesando solo las primeras ${MAX_CATEGORIES_PER_SYNC} de ${categoriesToSync.length} categorías para evitar timeout`);
  } else {
    console.log(`SYSCOM: Procesando TODAS las ${categoriesToProcess.length} categorías seleccionadas`);
  }

  for (const category of categoriesToProcess) {
    console.log(`SYSCOM: Procesando categoría ${category.id} - ${category.nombre}`);

    const { data: maxPagesConfig } = await supabaseClient
      .from('system_config')
      .select('value')
      .eq('key', 'syscom_max_pages_per_category')
      .maybeSingle();

    const MAX_PAGES_PER_CATEGORY = parseInt(maxPagesConfig?.value || '0');
    let pagina = 1;
    let hasMorePages = true;

    while (hasMorePages && (MAX_PAGES_PER_CATEGORY === 0 || pagina <= MAX_PAGES_PER_CATEGORY)) {
      try {
        await rateLimiter.waitForSlot();
        const stats = rateLimiter.getStats();
        console.log(`SYSCOM: Rate limiter - ${stats.requestsInWindow}/${RATE_LIMIT_MAX_REQUESTS} req/min`);

        const productsUrl = `${baseUrl}/functions/v1/syscom-api?action=products&categoria=${category.id}&pagina=${pagina}&stock=1`;
        console.log(`SYSCOM: Obteniendo página ${pagina} de categoría ${category.nombre}...`);

        const response = await fetch(productsUrl, {
          headers: { 'Authorization': authHeader }
        });

        if (!response.ok) {
          if (response.status === 429) {
            console.error(`SYSCOM: Rate limit 429 recibido. Esperando 65 segundos...`);
            await sleep(65000);
            continue;
          }
          const errorText = await response.text();
          console.error(`SYSCOM: Error ${response.status} en categoría ${category.nombre}:`, errorText.substring(0, 200));
          hasMorePages = false;
          continue;
        }

        const data = await response.json();
        const products = data.productos || [];

        console.log(`SYSCOM: Página ${pagina} de categoría ${category.nombre}: ${products.length} productos recibidos`);

        if (products.length > 0 && pagina === 1) {
          const sampleProduct = products[0];
          console.log(`SYSCOM: Estructura del producto (muestra):`, {
            producto_id: sampleProduct.producto_id,
            modelo: sampleProduct.modelo,
            has_precios: !!sampleProduct.precios,
            precios_keys: sampleProduct.precios ? Object.keys(sampleProduct.precios) : [],
            has_precio_especial_direct: !!sampleProduct.precio_especial,
            has_imagen_360: !!sampleProduct.imagen_360,
            imagen_360_length: sampleProduct.imagen_360?.length || 0,
            has_imagenes: !!sampleProduct.imagenes,
            has_categorias: !!sampleProduct.categorias,
            categorias_length: sampleProduct.categorias?.length || 0
          });
        }

        if (products.length > 0) {
          allProducts.push(...products);
          console.log(`SYSCOM: Total acumulado: ${allProducts.length} productos`);
        }

        if (!data.pagina_siguiente || products.length === 0 || (MAX_PAGES_PER_CATEGORY > 0 && pagina >= MAX_PAGES_PER_CATEGORY)) {
          if (MAX_PAGES_PER_CATEGORY > 0 && pagina >= MAX_PAGES_PER_CATEGORY && data.pagina_siguiente) {
            console.log(`SYSCOM: Límite de ${MAX_PAGES_PER_CATEGORY} páginas alcanzado para categoría ${category.nombre}`);
          } else if (!data.pagina_siguiente) {
            console.log(`SYSCOM: Todas las páginas de categoría ${category.nombre} procesadas (${pagina} páginas)`);
          }
          hasMorePages = false;
        } else {
          pagina++;
        }
      } catch (err: any) {
        console.error(`SYSCOM: Error en página ${pagina} de categoría ${category.nombre}:`, err.message);
        errors.push({ category: category.nombre, page: pagina, error: err.message });
        hasMorePages = false;
      }
    }

    console.log(`SYSCOM: Categoría ${category.nombre} completada. Total productos: ${allProducts.length}`);

    if (categoriesToProcess.indexOf(category) < categoriesToProcess.length - 1) {
      console.log('SYSCOM: Esperando 2 segundos antes de siguiente categoría...');
      await sleep(2000);
    }
  }

  console.log(`SYSCOM: Total ${allProducts.length} productos obtenidos`);

  const productsWithStock = allProducts.filter(p => {
    const stock = parseInt(p.total_existencia || '0');
    return stock > 0;
  });
  console.log(`SYSCOM: ${productsWithStock.length} productos con stock`);

  const { data: markupModeData } = await supabaseClient
    .from('system_config')
    .select('value')
    .eq('key', 'markup_mode')
    .maybeSingle();

  const markupMode = markupModeData?.value || 'global';
  console.log(`SYSCOM: Modo de markup: ${markupMode}, porcentaje global: ${markupPercentage}%`);

  const productIds = productsWithStock.map((p: any) => String(p.producto_id)).filter(Boolean);
  const { data: existingProducts } = await supabaseClient
    .from('syscom_products')
    .select('producto_id, markup_percentage')
    .in('producto_id', productIds);

  const existingMarkups = new Map(
    (existingProducts || []).map((p: any) => [p.producto_id, p.markup_percentage])
  );

  let productsSynced = 0;
  const insertErrors: any[] = [];

  for (let i = 0; i < productsWithStock.length; i += DB_BATCH_SIZE) {
    const batch = productsWithStock.slice(i, i + DB_BATCH_SIZE);
    console.log(`SYSCOM: Procesando lote ${Math.floor(i / DB_BATCH_SIZE) + 1} de ${Math.ceil(productsWithStock.length / DB_BATCH_SIZE)} (${batch.length} productos)`);

    const batchData = [];

    for (const product of batch) {
      try {
        const stock = parseInt(product.total_existencia || 0);
        const productoId = String(product.producto_id || '');
        const modelo = product.modelo || '';
        const titulo = product.titulo || '';

        if (!productoId || !modelo || stock <= 0) continue;

        const precios = product.precios || {};
        const precioLista = parseFloat(precios.precio_lista || product.precio_lista || 0);
        const precioEspecial = precios.precio_especial ? parseFloat(precios.precio_especial) :
                              (product.precio_especial ? parseFloat(product.precio_especial) : null);
        const precioDescuento = precios.precio_descuento ? parseFloat(precios.precio_descuento) :
                               (product.precio_descuento ? parseFloat(product.precio_descuento) : null);

        const basePriceForMarkup = precioEspecial || precioLista;
        if (basePriceForMarkup <= 0) continue;

        let finalMarkup = markupPercentage;
        if (markupMode === 'personalized' && existingMarkups.has(productoId)) {
          const existingMarkup = existingMarkups.get(productoId);
          if (existingMarkup != null) {
            finalMarkup = existingMarkup;
          }
        }

        const finalPrice = basePriceForMarkup * (1 + finalMarkup / 100);

        const imgPortada = product.img_portada || '';
        const imagenesArray = product.imagenes || [];

        const imagenesProcessed = Array.isArray(imagenesArray) && imagenesArray.length > 0
          ? imagenesArray.map((img: any, index: number) => {
              if (typeof img === 'string') {
                return { imagen: img, order: index };
              } else if (typeof img === 'object' && img !== null) {
                return {
                  imagen: img.imagen || img.url || '',
                  order: img.order !== undefined ? img.order : index
                };
              }
              return { imagen: '', order: index };
            }).filter(img => img.imagen)
          : (imgPortada ? [{ imagen: imgPortada, order: 0 }] : []);

        const categoriasArray = Array.isArray(product.categorias)
          ? product.categorias.map((cat: any) => ({
              id: cat.id || cat.categoria_id || '',
              nombre: cat.nombre || cat.name || '',
              nivel: cat.nivel || cat.level || 0
            }))
          : [];

        const caracteristicasArray = Array.isArray(product.especificaciones)
          ? product.especificaciones
          : (Array.isArray(product.caracteristicas) ? product.caracteristicas : []);

        const recursosArray = Array.isArray(product.recursos)
          ? product.recursos.map((rec: any) => {
              if (typeof rec === 'object' && rec !== null) {
                return {
                  tipo: rec.tipo || rec.type || '',
                  url: rec.url || rec.link || '',
                  titulo: rec.titulo || rec.title || ''
                };
              }
              return rec;
            })
          : [];

        const parseNumeric = (value: any): number | null => {
          if (!value || value === '-' || value === '') return null;
          const parsed = parseFloat(String(value));
          return isNaN(parsed) ? null : parsed;
        };

        const productData = {
          producto_id: productoId,
          modelo: modelo,
          sat_key: product.sat_key || product.clave_sat || null,
          sat_description: product.sat_description || null,
          titulo: titulo,
          descripcion: product.descripcion || '',
          marca: product.marca || '',
          marca_logo: product.marca_logo || product.img_marca || '',
          garantia: product.garantia || null,
          precio_lista: precioLista,
          precio_especial: precioEspecial,
          precio_descuento: precioDescuento,
          pvol: product.pvol || null,
          precios_volumen: precios.volumen || {},
          total_existencia: stock,
          existencia: product.existencia || {},
          existencia_asterisco: product.existencia?.asterisco || {},
          peso: parseNumeric(product.peso),
          alto: parseNumeric(product.alto),
          largo: parseNumeric(product.largo),
          ancho: parseNumeric(product.ancho),
          unidad_de_medida: product.unidad_de_medida || {},
          img_portada: imgPortada,
          imagenes: imagenesProcessed,
          imagen_360: Array.isArray(product.imagen_360) ? product.imagen_360 : [],
          recursos: recursosArray,
          categorias: categoriasArray,
          iconos: product.iconos || {},
          caracteristicas: caracteristicasArray,
          productos_relacionados: Array.isArray(product.productos_relacionados) ? product.productos_relacionados : [],
          accesorios: Array.isArray(product.accesorios) ? product.accesorios : [],
          markup_percentage: finalMarkup,
          final_price: finalPrice,
          is_visible: true,
          is_featured: false,
          link_syscom: product.link || '',
          link_privado: product.link_privado || null,
          link: product.link || null,
          last_sync: new Date().toISOString()
        };

        batchData.push(productData);

      } catch (err: any) {
        console.error(`Error preparando producto ${product.modelo}:`, err.message);
        insertErrors.push({ sku: product.modelo, error: err.message });
      }
    }

    if (batchData.length > 0) {
      try {
        const { error, count } = await supabaseClient
          .from('syscom_products')
          .upsert(batchData, { onConflict: 'producto_id' });

        if (error) {
          console.error(`Error insertando lote ${Math.floor(i / DB_BATCH_SIZE) + 1}:`, error.message);
          insertErrors.push({ batch: Math.floor(i / DB_BATCH_SIZE) + 1, error: error.message });
        } else {
          productsSynced += batchData.length;
          console.log(`SYSCOM: Lote ${Math.floor(i / DB_BATCH_SIZE) + 1} insertado exitosamente (${batchData.length} productos)`);
        }
      } catch (err: any) {
        console.error(`Error en batch insert:`, err.message);
        insertErrors.push({ batch: Math.floor(i / DB_BATCH_SIZE) + 1, error: err.message });
      }
    }

    await sleep(100);
  }

  return {
    productsCollected: allProducts.length,
    productsWithStock: productsWithStock.length,
    productsSynced,
    errors: [...errors, ...insertErrors]
  };
}

async function syncTecnosinergia(
  supabaseClient: any,
  filters: any = {}
) {
  const baseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const authHeader = `Bearer ${serviceRoleKey}`;

  console.log('TECNOSINERGIA: Iniciando sincronización');

  const categoriesUrl = `${baseUrl}/functions/v1/tecnosinergia-api?action=categories`;
  const categoriesResponse = await fetch(categoriesUrl, {
    headers: { 'Authorization': authHeader }
  });

  if (!categoriesResponse.ok) {
    throw new Error('Error al obtener categorías de Tecnosinergia');
  }

  const categoriesData = await categoriesResponse.json();
  await syncCategories(supabaseClient, categoriesData.categories || [], 'tecnosinergia');

  const productsUrl = `${baseUrl}/functions/v1/tecnosinergia-api?action=products`;
  const productsResponse = await fetch(productsUrl, {
    headers: { 'Authorization': authHeader }
  });

  if (!productsResponse.ok) {
    throw new Error('Error al obtener productos de Tecnosinergia');
  }

  const productsData = await productsResponse.json();
  const allProducts = productsData.products || [];
  console.log(`TECNOSINERGIA: ${allProducts.length} productos obtenidos`);

  const productsWithStock = filters.onlyWithStock
    ? allProducts.filter((p: any) => (p.stock || 0) > 0)
    : allProducts;

  console.log(`TECNOSINERGIA: ${productsWithStock.length} productos con stock`);

  let productsSynced = 0;
  const errors: any[] = [];

  for (let i = 0; i < productsWithStock.length; i += DB_BATCH_SIZE) {
    const batch = productsWithStock.slice(i, i + DB_BATCH_SIZE);
    console.log(`TECNOSINERGIA: Insertando lote ${Math.floor(i / DB_BATCH_SIZE) + 1} (${batch.length} productos)`);

    for (const product of batch) {
      try {
        const productData = {
          sku: product.sku || `TECNO-${Date.now()}-${i}`,
          name: product.name || '',
          description: product.description || '',
          price: parseFloat(product.price || 0),
          stock: parseInt(product.stock || 0),
          category_id: product.category_id || null,
          brand: product.brand || '',
          images: product.images || [],
          is_visible: true,
          is_featured: false,
          source: 'tecnosinergia'
        };

        const { error } = await supabaseClient
          .from('products')
          .upsert(productData, { onConflict: 'sku' });

        if (error) throw error;
        productsSynced++;
      } catch (err: any) {
        errors.push({ sku: product.sku, error: err.message });
      }
    }

    await sleep(100);
  }

  return {
    productsCollected: allProducts.length,
    productsWithStock: productsWithStock.length,
    productsSynced,
    errors
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { source, categories = [], filters = {} } = body;

    console.log(`Iniciando sincronización: source=${source}, categories=${JSON.stringify(categories)}`);

    const results: any[] = [];

    if (source === 'syscom' || source === 'all') {
      try {
        const result = await syncSyscom(supabaseClient, categories, filters);
        results.push({ source: 'syscom', status: 'completed', ...result });
      } catch (error: any) {
        console.error('Error en sincronización de SYSCOM:', error.message);
        results.push({ source: 'syscom', status: 'error', error: error.message });
      }
    }

    if (source === 'tecnosinergia' || source === 'all') {
      try {
        const result = await syncTecnosinergia(supabaseClient, filters);
        results.push({ source: 'tecnosinergia', status: 'completed', ...result });
      } catch (error: any) {
        console.error('Error en sincronización de Tecnosinergia:', error.message);
        results.push({ source: 'tecnosinergia', status: 'error', error: error.message });
      }
    }

    const hasErrors = results.some(r => r.status === 'error' || (r.errors && r.errors.length > 0));

    return new Response(
      JSON.stringify({
        success: !hasErrors,
        results
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: any) {
    console.error('Error general en sincronización:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});