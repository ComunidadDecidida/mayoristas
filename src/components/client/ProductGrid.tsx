import { ProductCard } from './ProductCard'
import type { Product } from '../../types/database'
import type { UnifiedProduct } from '../../services/unifiedProductService'

interface ProductGridProps {
  products: Product[] | UnifiedProduct[]
  onAddToCart?: (productId: string, quantity: number) => void
  onCardClick?: (productId: string) => void
  loading?: boolean
}

export function ProductGrid({ products, onAddToCart, onCardClick, loading }: ProductGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-gray-200 rounded-lg animate-pulse h-96" />
        ))}
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No se encontraron productos</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={onAddToCart}
          onCardClick={onCardClick}
          showFeaturedButton={false}
        />
      ))}
    </div>
  )
}
