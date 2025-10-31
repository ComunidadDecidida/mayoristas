import { supabase } from '../lib/supabase'

export interface Category {
  id: string
  name: string
  slug: string
  parent_id: string | null
  source: string | null
  source_id: string | null
  description: string | null
  image_url: string | null
  is_visible: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export const categoryService = {
  async getCategories(visibleOnly: boolean = true) {
    let query = supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })

    if (visibleOnly) {
      query = query.eq('is_visible', true)
    }

    const { data, error } = await query

    if (error) throw error
    return data as Category[]
  },

  async getCategoryById(id: string) {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as Category[]
  },

  async getProductCategories(productId: string) {
    const { data, error } = await supabase
      .from('product_categories')
      .select(`
        category_id,
        categories (
          id,
          name,
          slug
        )
      `)
      .eq('product_id', productId)

    if (error) throw error
    return data
  },

  async assignCategoriesToProduct(productId: string, categoryIds: string[]) {
    await this.removeProductCategories(productId)

    if (categoryIds.length === 0) return

    const inserts = categoryIds.map(categoryId => ({
      product_id: productId,
      category_id: categoryId
    }))

    const { error } = await supabase
      .from('product_categories')
      .insert(inserts)

    if (error) throw error
  },

  async removeProductCategories(productId: string) {
    const { error } = await supabase
      .from('product_categories')
      .delete()
      .eq('product_id', productId)

    if (error) throw error
  },

  async createCategory(category: Omit<Category, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('categories')
      .insert(category)
      .select()
      .single()

    if (error) throw error
    return data as Category
  },

  async updateCategory(id: string, updates: Partial<Category>) {
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Category
  },

  async deleteCategory(id: string) {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}
