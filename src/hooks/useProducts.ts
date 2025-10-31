import { useState, useEffect } from 'react'
import { productService } from '../services/productService'

export interface Product {
  id: string
  title: string
  sku: string
  description: string
  base_price: number
  final_price: number
  stock: number
  image_url: string
  category_id: string
  brand_id: string
  is_visible: boolean
  markup_percentage: number
  source: 'syscom' | 'tecnosinergia' | 'manual'
  created_at: string
  updated_at: string
}

interface UseProductsOptions {
  page?: number
  limit?: number
  categoryId?: string
  brandId?: string
  search?: string
  visibleOnly?: boolean
}

export function useProducts(options: UseProductsOptions = {}) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)

  const {
    page = 1,
    limit = 20,
    categoryId,
    brandId,
    search,
    visibleOnly = true,
  } = options

  useEffect(() => {
    loadProducts()
  }, [page, limit, categoryId, brandId, search, visibleOnly])

  const loadProducts = async () => {
    try {
      setLoading(true)
      setError(null)

      const { products: data, count } = await productService.getProducts({
        page,
        limit,
        categoryId,
        brandId,
        search,
        visibleOnly,
      })

      setProducts(data)
      setTotalCount(count)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading products')
      console.error('Error loading products:', err)
    } finally {
      setLoading(false)
    }
  }

  const totalPages = Math.ceil(totalCount / limit)

  return {
    products,
    loading,
    error,
    totalCount,
    totalPages,
    currentPage: page,
    refresh: loadProducts,
  }
}
