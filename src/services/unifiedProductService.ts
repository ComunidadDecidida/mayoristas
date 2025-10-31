import { productService } from './productService'
import { syscomService, type SyscomProduct } from './syscomService'
import type { Product } from '../types/database'

export interface UnifiedProduct {
  id: string
  source: 'syscom' | 'tecnosinergia' | 'manual'
  sku: string
  title: string
  description: string
  brand: string
  base_price: number
  markup_percentage: number
  final_price: number
  stock: number
  images: string[]
  is_visible: boolean
  is_featured: boolean
  created_at: string
  updated_at: string
  originalData: Product | SyscomProduct
}

function mapProductToUnified(product: Product): UnifiedProduct {
  return {
    id: product.id,
    source: product.source as 'syscom' | 'tecnosinergia' | 'manual',
    sku: product.sku,
    title: product.title,
    description: product.description || '',
    brand: product.brand || '',
    base_price: product.base_price,
    markup_percentage: product.markup_percentage,
    final_price: product.final_price,
    stock: product.stock,
    images: Array.isArray(product.images) ? product.images : [],
    is_visible: product.is_visible,
    is_featured: product.is_featured || false,
    created_at: product.created_at,
    updated_at: product.updated_at,
    originalData: product
  }
}

function mapSyscomToUnified(product: SyscomProduct): UnifiedProduct {
  const images: string[] = []

  if (product.img_portada) {
    images.push(product.img_portada)
  }

  if (Array.isArray(product.imagenes)) {
    const sortedImages = [...product.imagenes].sort((a, b) => (a.order || 0) - (b.order || 0))
    sortedImages.forEach((img: { imagen: string; order?: number }) => {
      if (img && typeof img === 'object' && img.imagen && !images.includes(img.imagen)) {
        images.push(img.imagen)
      }
    })
  }

  if (images.length === 0 && product.img_portada) {
    images.push(product.img_portada)
  }

  return {
    id: product.id,
    source: 'syscom',
    sku: product.modelo,
    title: product.titulo,
    description: product.descripcion || '',
    brand: product.marca || '',
    base_price: product.precio_especial || product.precio_lista,
    markup_percentage: product.markup_percentage,
    final_price: product.final_price,
    stock: product.total_existencia,
    images,
    is_visible: product.is_visible,
    is_featured: product.is_featured,
    created_at: product.created_at,
    updated_at: product.updated_at,
    originalData: product
  }
}

export const unifiedProductService = {
  async getAllProducts(filters?: {
    search?: string
    brand?: string
    category?: string
    page?: number
    limit?: number
    visibleOnly?: boolean
    source?: 'all' | 'syscom' | 'tecnosinergia' | 'manual'
  }) {
    const limit = filters?.limit || 60
    const page = filters?.page || 1
    const source = filters?.source || 'all'

    if (source === 'syscom') {
      const result = await syscomService.getProducts({
        busqueda: filters?.search,
        marca: filters?.brand,
        page,
        limit,
        visibleOnly: filters?.visibleOnly
      })

      return {
        products: result.products.map(mapSyscomToUnified),
        count: result.count,
        total: result.total,
        pages: result.pages
      }
    }

    if (source === 'tecnosinergia' || source === 'manual') {
      const result = await productService.getProducts({
        search: filters?.search,
        brand: filters?.brand,
        page,
        limit,
        visibleOnly: filters?.visibleOnly
      })

      return {
        products: result.products.map(mapProductToUnified),
        count: result.count,
        total: result.total,
        pages: result.pages
      }
    }

    const [regularResult, syscomResult] = await Promise.all([
      productService.getProducts({
        search: filters?.search,
        brand: filters?.brand,
        page,
        limit: Math.ceil(limit / 2),
        visibleOnly: filters?.visibleOnly
      }),
      syscomService.getProducts({
        busqueda: filters?.search,
        marca: filters?.brand,
        page,
        limit: Math.ceil(limit / 2),
        visibleOnly: filters?.visibleOnly
      })
    ])

    const allProducts = [
      ...regularResult.products.map(mapProductToUnified),
      ...syscomResult.products.map(mapSyscomToUnified)
    ]

    const totalCount = regularResult.count + syscomResult.count

    return {
      products: allProducts,
      count: allProducts.length,
      total: totalCount,
      pages: Math.ceil(totalCount / limit)
    }
  },

  async getProductById(id: string, source?: 'syscom' | 'tecnosinergia' | 'manual') {
    if (source === 'syscom') {
      const product = await syscomService.getProductById(id)
      return product ? mapSyscomToUnified(product) : null
    }

    const regularProduct = await productService.getProductById(id).catch(() => null)
    if (regularProduct) {
      return mapProductToUnified(regularProduct)
    }

    const syscomProduct = await syscomService.getProductById(id).catch(() => null)
    if (syscomProduct) {
      return mapSyscomToUnified(syscomProduct)
    }

    return null
  },

  async getFeaturedProducts(limit: number = 12) {
    const [regularResult, syscomResult] = await Promise.all([
      productService.getFeaturedProducts(Math.ceil(limit / 2)),
      syscomService.getFeaturedProducts(Math.ceil(limit / 2))
    ])

    const allProducts = [
      ...regularResult.products.map(mapProductToUnified),
      ...syscomResult.products.map(mapSyscomToUnified)
    ].slice(0, limit)

    return {
      products: allProducts,
      count: allProducts.length,
      total: allProducts.length,
      pages: 1
    }
  },

  async searchProducts(query: string, page: number = 1, limit: number = 60) {
    return this.getAllProducts({
      search: query,
      page,
      limit,
      visibleOnly: true
    })
  }
}

export type { UnifiedProduct }
