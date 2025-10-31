import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export interface Category {
  id: string
  name: string
  parent_id: string | null
  is_visible: boolean
  created_at: string
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('categories')
        .select('*')
        .eq('is_visible', true)
        .order('name')

      if (fetchError) throw fetchError

      setCategories(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading categories')
      console.error('Error loading categories:', err)
    } finally {
      setLoading(false)
    }
  }

  const getCategoryById = (id: string) => {
    return categories.find(cat => cat.id === id)
  }

  const getSubcategories = (parentId: string) => {
    return categories.filter(cat => cat.parent_id === parentId)
  }

  const getRootCategories = () => {
    return categories.filter(cat => !cat.parent_id)
  }

  return {
    categories,
    loading,
    error,
    getCategoryById,
    getSubcategories,
    getRootCategories,
    refresh: loadCategories,
  }
}
