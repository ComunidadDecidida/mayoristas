import { supabase } from '../lib/supabase'

export interface Brand {
  id: string
  name: string
  slug: string
  logo_url: string | null
  description: string | null
  is_visible: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export const brandService = {
  async getBrands(visibleOnly: boolean = true) {
    let query = supabase
      .from('brands')
      .select('*')
      .order('sort_order', { ascending: true })

    if (visibleOnly) {
      query = query.eq('is_visible', true)
    }

    const { data, error } = await query

    if (error) throw error
    return data as Brand[]
  },

  async getBrandById(id: string) {
    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as Brand
  },

  async createBrand(brand: Omit<Brand, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('brands')
      .insert(brand)
      .select()
      .single()

    if (error) throw error
    return data as Brand
  },

  async updateBrand(id: string, updates: Partial<Brand>) {
    const { data, error } = await supabase
      .from('brands')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Brand
  },

  async deleteBrand(id: string) {
    const { error } = await supabase
      .from('brands')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}
