import { useState, useEffect } from 'react'
import { X, ShoppingCart, ChevronLeft, ChevronRight, Star, Minus, Plus } from 'lucide-react'
import { Button } from '../shared/Button'
import { unifiedProductService, type UnifiedProduct } from '../../services/unifiedProductService'
import { productService } from '../../services/productService'
import { syscomService } from '../../services/syscomService'
import { getProxiedImageUrl } from '../../utils/imageProxy'

interface ProductDetailModalProps {
  productId: string
  isOpen: boolean
  onClose: () => void
  onAddToCart: (productId: string, quantity: number) => void
  isAdmin?: boolean
}

export function ProductDetailModal({ productId, isOpen, onClose, onAddToCart, isAdmin }: ProductDetailModalProps) {
  const [product, setProduct] = useState<UnifiedProduct | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  useEffect(() => {
    if (isOpen && productId) {
      loadProduct()
    }
  }, [isOpen, productId])

  async function loadProduct() {
    try {
      setLoading(true)
      const data = await unifiedProductService.getProductById(productId)
      setProduct(data)
    } catch (error) {
      console.error('Error loading product:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleToggleFeatured() {
    if (!product || !isAdmin) return
    try {
      if (product.source === 'syscom') {
        await syscomService.toggleFeatured(product.id, !product.is_featured)
      } else {
        await productService.toggleFeatured(product.id, !product.is_featured)
      }
      setProduct({ ...product, is_featured: !product.is_featured })
    } catch (error) {
      console.error('Error toggling featured:', error)
    }
  }

  const handleAddToCart = () => {
    if (product) {
      onAddToCart(product.id, quantity)
      onClose()
    }
  }

  const incrementQuantity = () => {
    if (product && quantity < product.stock) {
      setQuantity(quantity + 1)
    }
  }

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1)
    }
  }

  const nextImage = () => {
    if (product && product.images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % product.images.length)
    }
  }

  const prevImage = () => {
    if (product && product.images.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : product ? (
          <div className="relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
              <div className="space-y-4">
                <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  {product.images && product.images.length > 0 ? (
                    <>
                      <img
                        src={getProxiedImageUrl(product.images[currentImageIndex])}
                        alt={product.title}
                        className="w-full h-full object-contain p-4"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder-product.png'
                        }}
                      />
                      {product.images.length > 1 && (
                        <>
                          <button
                            onClick={prevImage}
                            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white bg-opacity-75 rounded-full hover:bg-opacity-100"
                          >
                            <ChevronLeft className="w-6 h-6" />
                          </button>
                          <button
                            onClick={nextImage}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white bg-opacity-75 rounded-full hover:bg-opacity-100"
                          >
                            <ChevronRight className="w-6 h-6" />
                          </button>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      Sin imagen
                    </div>
                  )}
                </div>

                {product.images && product.images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {product.images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImageIndex(idx)}
                        className={`flex-shrink-0 w-20 h-20 rounded border-2 overflow-hidden ${
                          currentImageIndex === idx ? 'border-blue-600' : 'border-gray-200'
                        }`}
                      >
                        <img
                          src={img}
                          alt={`${product.title} ${idx + 1}`}
                          className="w-full h-full object-contain"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-500 mb-1">SKU: {product.sku}</div>
                  {product.brand && (
                    <div className="text-sm text-blue-600 font-medium mb-2">{product.brand}</div>
                  )}
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{product.title}</h2>
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                    product.stock > 10
                      ? 'bg-green-100 text-green-800'
                      : product.stock > 0
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {product.stock > 0 ? `${product.stock} disponibles` : 'Sin stock'}
                  </span>
                </div>

                {product.description && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Descripción</h3>
                    <p className="text-gray-600 text-sm whitespace-pre-wrap">{product.description}</p>
                  </div>
                )}

                <div className="border-t pt-4">
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-3xl font-bold text-gray-900">
                      ${product.final_price.toFixed(2)}
                    </span>
                    <span className="text-gray-500">MXN</span>
                  </div>

                  {product.stock > 0 && (
                    <>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Cantidad
                        </label>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={decrementQuantity}
                            disabled={quantity <= 1}
                            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Minus className="w-5 h-5" />
                          </button>
                          <input
                            type="number"
                            min="1"
                            max={product.stock}
                            value={quantity}
                            onChange={(e) => {
                              const val = parseInt(e.target.value)
                              if (val > 0 && val <= product.stock) {
                                setQuantity(val)
                              }
                            }}
                            className="w-20 text-center px-4 py-2 border border-gray-300 rounded-lg"
                          />
                          <button
                            onClick={incrementQuantity}
                            disabled={quantity >= product.stock}
                            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      <Button
                        onClick={handleAddToCart}
                        className="w-full flex items-center justify-center gap-2"
                        size="lg"
                      >
                        <ShoppingCart className="w-5 h-5" />
                        Agregar al Carrito
                      </Button>
                    </>
                  )}
                </div>

                {isAdmin && (
                  <div className="border-t pt-4">
                    <Button
                      onClick={handleToggleFeatured}
                      variant="secondary"
                      className="w-full flex items-center justify-center gap-2"
                    >
                      <Star className={`w-5 h-5 ${product.is_featured ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                      {product.is_featured ? 'Quitar de Destacados' : 'Marcar como Destacado'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            No se pudo cargar el producto
          </div>
        )}
      </div>
    </div>
  )
}
