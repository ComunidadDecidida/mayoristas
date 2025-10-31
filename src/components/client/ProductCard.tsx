import { ShoppingCart, Package, Star, Image as ImageIcon } from 'lucide-react'
import { Button } from '../shared/Button'
import { productService } from '../../services/productService'
import { syscomService } from '../../services/syscomService'
import type { Product } from '../../types/database'
import type { UnifiedProduct } from '../../services/unifiedProductService'
import { useState } from 'react'
import { getProxiedImageUrl } from '../../utils/imageProxy'

interface ProductCardProps {
  product: Product | UnifiedProduct
  onAddToCart?: (productId: string, quantity: number) => void
  onCardClick?: (productId: string) => void
  showFeaturedButton?: boolean
  onFeaturedChange?: () => void
}

export function ProductCard({ product, onAddToCart, onCardClick, showFeaturedButton = false, onFeaturedChange }: ProductCardProps) {
  const [isFeatured, setIsFeatured] = useState(product.is_featured || false)
  const [updatingFeatured, setUpdatingFeatured] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)

  const getImageUrl = () => {
    if (Array.isArray(product.images) && product.images.length > 0) {
      return getProxiedImageUrl(product.images[0])
    }
    return ''
  }

  const image = getImageUrl()

  const inStock = product.stock > 0

  const handleToggleFeatured = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (updatingFeatured) return

    try {
      setUpdatingFeatured(true)

      const source = 'source' in product ? product.source : 'manual'
      if (source === 'syscom') {
        await syscomService.toggleFeatured(product.id, !isFeatured)
      } else {
        await productService.toggleFeatured(product.id, !isFeatured)
      }

      setIsFeatured(!isFeatured)
      onFeaturedChange?.()
    } catch (error) {
      console.error('Error toggling featured:', error)
      alert('Error al cambiar el estado de destacado')
    } finally {
      setUpdatingFeatured(false)
    }
  }

  return (
    <div
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer"
      onClick={() => onCardClick?.(product.id)}
    >
      <div className="relative aspect-square bg-gray-100 flex items-center justify-center">
        {image && !imageError ? (
          <img
            src={image}
            alt={product.title}
            className="w-full h-full object-contain p-4"
            loading="lazy"
            onLoad={() => setImageLoading(false)}
            onError={() => {
              setImageError(true)
              setImageLoading(false)
            }}
            style={{ display: imageLoading ? 'none' : 'block' }}
          />
        ) : null}
        {(imageError || !image) && (
          <div className="flex flex-col items-center justify-center text-gray-400 p-4">
            <ImageIcon className="w-16 h-16 mb-2" />
            <span className="text-xs text-center">{product.title}</span>
          </div>
        )}
        {imageLoading && image && !imageError && (
          <div className="animate-pulse text-gray-400">
            <ImageIcon className="w-16 h-16" />
          </div>
        )}
        {showFeaturedButton && (
          <button
            onClick={handleToggleFeatured}
            disabled={updatingFeatured}
            className={`absolute top-2 right-2 p-2 rounded-full shadow-lg transition-all ${
              isFeatured
                ? 'bg-yellow-400 text-white hover:bg-yellow-500'
                : 'bg-white text-gray-400 hover:bg-gray-100'
            } ${updatingFeatured ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={isFeatured ? 'Quitar de destacados' : 'Marcar como destacado'}
          >
            <Star className="w-5 h-5" fill={isFeatured ? 'currentColor' : 'none'} />
          </button>
        )}
        {!inStock && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold">
              Agotado
            </span>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="text-xs text-gray-500 mb-1">
          SKU: {product.sku}
        </div>

        {product.brand && (
          <div className="text-xs text-blue-600 font-medium mb-2">
            {product.brand}
          </div>
        )}

        <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[2.5rem]">
          {product.title}
        </h3>

        <div className="flex items-center space-x-2 mb-3">
          <Package className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600">
            {inStock ? `${product.stock} disponibles` : 'Sin stock'}
          </span>
        </div>

        <div className="border-t pt-3 mt-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-xs text-gray-500">Precio</div>
              <div className="text-2xl font-bold text-gray-900">
                ${product.final_price.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500">MXN</div>
            </div>
          </div>

          <Button
            onClick={(e) => {
              e.stopPropagation()
              onAddToCart?.(product.id, 1)
            }}
            disabled={!inStock}
            className="w-full flex items-center justify-center space-x-2"
            size="md"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Agregar al Carrito</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
