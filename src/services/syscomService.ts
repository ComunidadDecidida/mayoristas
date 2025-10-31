import { supabase } from '../lib/supabase'

const SYSCOM_API_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/syscom-api`

interface SyscomProduct {
  id: string
  producto_id: string
  modelo: string
  titulo: string
  descripcion: string
  marca: string
  marca_logo: string
  precio_lista: number
  precio_especial: number | null
  precio_descuento: number | null
  total_existencia: number
  existencia: Record<string, unknown>
  img_portada: string
  imagenes: Array<{ imagen: string; order: number }>
  categorias: Array<{ id: string; nombre: string; nivel: number }>
  caracteristicas: Array<{ nombre: string; valor: string }>
  recursos: Array<{ tipo: string; url: string }>
  productos_relacionados: string[]
  accesorios: string[]
  markup_percentage: number
  final_price: number
  is_visible: boolean
  is_featured: boolean
  link_syscom: string
  last_sync: string
  created_at: string
  updated_at: string
}

interface SyscomApiResponse {
  productos?: Array<Record<string, unknown>>
  categorias?: Array<Record<string, unknown>>
  marcas?: Array<Record<string, unknown>>
  tipocambio?: Record<string, unknown>
  error?: string
}

export const syscomService = {
  async getCategories() {
    const response = await fetch(`${SYSCOM_API_URL}?action=categories`, {
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('Error al obtener categorías de SYSCOM')
    }

    const data: SyscomApiResponse = await response.json()
    return data.categorias || []
  },

  async getBrands() {
    const response = await fetch(`${SYSCOM_API_URL}?action=brands`, {
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('Error al obtener marcas de SYSCOM')
    }

    const data: SyscomApiResponse = await response.json()
    return data.marcas || []
  },

  async getExchangeRate() {
    const response = await fetch(`${SYSCOM_API_URL}?action=exchange-rate`, {
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('Error al obtener tipo de cambio de SYSCOM')
    }

    const data: SyscomApiResponse = await response.json()
    return data.tipocambio
  },

  async getProducts(filters?: {
    categoria?: string
    marca?: string
    busqueda?: string
    pagina?: number
    stock?: boolean
    page?: number
    limit?: number
    visibleOnly?: boolean
  }) {
    const limit = filters?.limit || 60
    const page = filters?.page || 1
    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabase
      .from('syscom_products')
      .select('*', { count: 'exact' })

    if (filters?.visibleOnly !== false) {
      query = query.eq('is_visible', true)
    }

    if (filters?.busqueda) {
      query = query.or(`titulo.ilike.%${filters.busqueda}%,descripcion.ilike.%${filters.busqueda}%,modelo.ilike.%${filters.busqueda}%`)
    }

    if (filters?.marca) {
      query = query.eq('marca', filters.marca)
    }

    if (filters?.stock) {
      query = query.gt('total_existencia', 0)
    }

    query = query.range(from, to).order('created_at', { ascending: false })

    const { data, error, count } = await query

    if (error) throw error

    return {
      products: data as SyscomProduct[],
      count: count || 0,
      total: count || 0,
      pages: Math.ceil((count || 0) / limit)
    }
  },

  async getProductById(id: string) {
    const { data, error } = await supabase
      .from('syscom_products')
      .select('*')
      .eq('id', id)
      .eq('is_visible', true)
      .maybeSingle()

    if (error) throw error
    return data as SyscomProduct | null
  },

  async getProductByProductoId(productoId: string) {
    const { data, error } = await supabase
      .from('syscom_products')
      .select('*')
      .eq('producto_id', productoId)
      .eq('is_visible', true)
      .maybeSingle()

    if (error) throw error
    return data as SyscomProduct | null
  },

  async getProductByModelo(modelo: string) {
    const { data, error } = await supabase
      .from('syscom_products')
      .select('*')
      .eq('modelo', modelo)
      .eq('is_visible', true)
      .maybeSingle()

    if (error) throw error
    return data as SyscomProduct | null
  },

  async getFeaturedProducts(limit: number = 12) {
    const { data, error } = await supabase
      .from('syscom_products')
      .select('*')
      .eq('is_visible', true)
      .eq('is_featured', true)
      .gt('total_existencia', 0)
      .limit(limit)
      .order('created_at', { ascending: false })

    if (error) throw error

    return {
      products: data as SyscomProduct[],
      count: data.length,
      total: data.length,
      pages: 1
    }
  },

  async updateProduct(id: string, updates: Partial<SyscomProduct>) {
    const { data, error } = await supabase
      .from('syscom_products')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .maybeSingle()

    if (error) throw error
    return data
  },

  async updateProductMarkup(id: string, markupPercentage: number) {
    const product = await this.getProductById(id)
    if (!product) throw new Error('Producto no encontrado')

    const basePrice = product.precio_especial || product.precio_lista
    const finalPrice = basePrice * (1 + markupPercentage / 100)

    return this.updateProduct(id, {
      markup_percentage: markupPercentage,
      final_price: finalPrice
    })
  },

  async updateProductByProductoId(productoId: string, markupPercentage: number) {
    const { data: product, error: fetchError } = await supabase
      .from('syscom_products')
      .select('*')
      .eq('producto_id', productoId)
      .maybeSingle()

    if (fetchError || !product) {
      throw new Error('Producto no encontrado')
    }

    const basePrice = product.precio_especial || product.precio_lista
    const finalPrice = basePrice * (1 + markupPercentage / 100)

    const { data, error } = await supabase
      .from('syscom_products')
      .update({
        markup_percentage: markupPercentage,
        final_price: finalPrice,
        updated_at: new Date().toISOString()
      })
      .eq('producto_id', productoId)
      .select()
      .maybeSingle()

    if (error) throw error
    return data
  },

  async toggleFeatured(id: string, isFeatured: boolean) {
    const { data, error } = await supabase
      .from('syscom_products')
      .update({ is_featured: isFeatured })
      .eq('id', id)
      .select()
      .maybeSingle()

    if (error) throw error
    return data
  },

  async toggleVisibility(id: string, isVisible: boolean) {
    const { data, error } = await supabase
      .from('syscom_products')
      .update({ is_visible: isVisible })
      .eq('id', id)
      .select()
      .maybeSingle()

    if (error) throw error
    return data
  },

  async syncFromAPI(filters?: {
    categoria?: string
    marca?: string
    busqueda?: string
    pagina?: number
    stock?: boolean
  }) {
    const params = new URLSearchParams({
      action: 'products'
    })

    if (filters?.categoria) params.append('categoria', filters.categoria)
    if (filters?.marca) params.append('marca', filters.marca)
    if (filters?.busqueda) params.append('busqueda', filters.busqueda)
    if (filters?.pagina) params.append('pagina', filters.pagina.toString())
    if (filters?.stock) params.append('stock', '1')

    const response = await fetch(`${SYSCOM_API_URL}?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('Error al sincronizar productos de SYSCOM')
    }

    const data: SyscomApiResponse = await response.json()
    return data
  },

  async getSelectedCategories() {
    const { data, error } = await supabase
      .from('syscom_selected_categories')
      .select('*')
      .eq('is_active', true)
      .order('category_name')

    if (error) throw error
    return data || []
  },

  async toggleCategorySelection(categoryId: string, categoryName: string, isActive: boolean) {
    const { data: existing } = await supabase
      .from('syscom_selected_categories')
      .select('id')
      .eq('category_id', categoryId)
      .maybeSingle()

    if (existing) {
      const { error } = await supabase
        .from('syscom_selected_categories')
        .update({ is_active: isActive })
        .eq('id', existing.id)

      if (error) throw error
    } else {
      const { error } = await supabase
        .from('syscom_selected_categories')
        .insert({
          category_id: categoryId,
          category_name: categoryName,
          is_active: isActive
        })

      if (error) throw error
    }
  },

  async getTokenStatus() {
    const { data: tokenData } = await supabase
      .from('system_config')
      .select('value')
      .eq('key', 'syscom_token_expires_at')
      .maybeSingle()

    if (!tokenData) {
      return { status: 'unknown', daysRemaining: 0 }
    }

    const expiryDate = new Date(tokenData.value)
    const now = new Date()
    const daysRemaining = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    let status: 'valid' | 'warning' | 'expired' | 'unknown' = 'unknown'
    if (daysRemaining <= 0) {
      status = 'expired'
    } else if (daysRemaining <= 30) {
      status = 'warning'
    } else {
      status = 'valid'
    }

    return { status, daysRemaining }
  }
}

export type { SyscomProduct }
