import { useEffect, useState } from 'react'
import { BannerCarousel } from '../components/client/BannerCarousel'
import { ProductGrid } from '../components/client/ProductGrid'
import { ProductDetailModal } from '../components/client/ProductDetailModal'
import { unifiedProductService, type UnifiedProduct } from '../services/unifiedProductService'
import { useCart } from '../contexts/CartContext'

export function Home() {
  const [products, setProducts] = useState<UnifiedProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const { addItem } = useCart()

  useEffect(() => {
    loadProducts()
  }, [])

  async function loadProducts() {
    try {
      const { products: featuredProducts } = await unifiedProductService.getFeaturedProducts(12)
      if (featuredProducts.length === 0) {
        const { products: regularProducts } = await unifiedProductService.getAllProducts({ page: 1, limit: 12 })
        setProducts(regularProducts)
      } else {
        setProducts(featuredProducts)
      }
    } catch (error) {
      console.error('Error cargando productos:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddToCart(productId: string, quantity: number = 1) {
    try {
      await addItem(productId, quantity)
      alert('Producto agregado al carrito correctamente')
    } catch (error) {
      console.error('Error agregando al carrito:', error)
      const message = error instanceof Error ? error.message : 'Error al agregar el producto'
      alert(message)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BannerCarousel />

        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-gray-900">Productos Destacados</h2>
            <a href="/products" className="text-blue-600 hover:text-blue-700 font-medium">
              Ver todos
            </a>
          </div>

          <ProductGrid
            products={products}
            onAddToCart={handleAddToCart}
            onCardClick={(productId) => setSelectedProductId(productId)}
            loading={loading}
          />
        </div>

        <div className="mt-16 bg-white rounded-lg shadow-md p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">1000+</div>
              <div className="text-gray-600">Productos en Catálogo</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">50+</div>
              <div className="text-gray-600">Marcas Distribuidas</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">15+</div>
              <div className="text-gray-600">Años de Experiencia</div>
            </div>
          </div>
        </div>

        <ProductDetailModal
          productId={selectedProductId || ''}
          isOpen={!!selectedProductId}
          onClose={() => setSelectedProductId(null)}
          onAddToCart={handleAddToCart}
        />
      </div>
    </div>
  )
}
