import { supabase } from '../lib/supabase'
import type { Product } from '../types/database'

export const productService = {
  async getProducts(filters?: {
    category?: string
    categoryId?: string
    brand?: string
    brandId?: string
    search?: string
    page?: number
    limit?: number
    visibleOnly?: boolean
  }) {
    const limit = filters?.limit || 60
    const page = filters?.page || 1
    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })

    if (filters?.visibleOnly !== false) {
      query = query.eq('is_visible', true)
    }

    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`)
    }

    if (filters?.brand) {
      query = query.eq('brand', filters.brand)
    }

    if (filters?.brandId) {
      query = query.eq('brand_id', filters.brandId)
    }

    if (filters?.categoryId) {
      query = query.eq('category_id', filters.categoryId)
    }

    query = query.range(from, to).order('created_at', { ascending: false })

    const { data, error, count } = await query

    if (error) throw error

    return {
      products: data as Product[],
      count: count || 0,
      total: count || 0,
      pages: Math.ceil((count || 0) / limit)
    }
  },

  async getProductById(id: string) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .eq('is_visible', true)
      .single()

    if (error) throw error
    return data as Product
  },

  async getProductBySku(sku: string) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('sku', sku)
      .eq('is_visible', true)
      .single()

    if (error) throw error
    return data as Product
  },

  async updateProduct(id: string, updates: Partial<Product>) {
    const { data, error } = await supabase
      .from('products')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async updateProductMarkup(id: string, markupPercentage: number) {
    const product = await this.getProductById(id)
    const finalPrice = product.base_price * (1 + markupPercentage / 100)

    return this.updateProduct(id, {
      markup_percentage: markupPercentage,
      final_price: finalPrice
    })
  },

  async syncProducts(source: 'syscom' | 'tecnosinergia' | 'all') {
    const { data, error } = await supabase.functions.invoke('sync-products', {
      body: { source }
    })

    if (error) throw error
    return data
  },

  async getFeaturedProducts(limit: number = 12) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_visible', true)
      .eq('is_featured', true)
      .limit(limit)
      .order('created_at', { ascending: false })

    if (error) throw error

    return {
      products: data as Product[],
      count: data.length,
      total: data.length,
      pages: 1
    }
  },

  async toggleFeatured(id: string, isFeatured: boolean) {
    const { data, error } = await supabase
      .from('products')
      .update({ is_featured: isFeatured })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }
}
