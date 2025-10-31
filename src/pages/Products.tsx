import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ProductGrid } from '../components/client/ProductGrid'
import { ProductDetailModal } from '../components/client/ProductDetailModal'
import { unifiedProductService, type UnifiedProduct } from '../services/unifiedProductService'
import { useCart } from '../contexts/CartContext'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '../components/shared/Button'

export function Products() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState<UnifiedProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const { addItem } = useCart()

  useEffect(() => {
    const searchQuery = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    setSearch(searchQuery)
    setCurrentPage(page)
    loadProducts(searchQuery, page)
  }, [searchParams])

  async function loadProducts(searchQuery: string, page: number) {
    setLoading(true)
    try {
      const { products: data, pages } = await unifiedProductService.getAllProducts({
        search: searchQuery,
        page,
        limit: 24,
        visibleOnly: true
      })
      setProducts(data)
      setTotalPages(pages)
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

  function handlePageChange(newPage: number) {
    const params = new URLSearchParams(searchParams)
    params.set('page', newPage.toString())
    setSearchParams(params)
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    params.set('page', '1')
    setSearchParams(params)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Catálogo de Productos</h1>

          <form onSubmit={handleSearch} className="flex space-x-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar productos..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button type="submit">Buscar</Button>
          </form>
        </div>

        <ProductGrid
          products={products}
          onAddToCart={handleAddToCart}
          onCardClick={(productId) => setSelectedProductId(productId)}
          loading={loading}
        />

        {totalPages > 1 && (
          <div className="flex items-center justify-center space-x-4 mt-8">
            <Button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              variant="secondary"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>

            <div className="text-gray-700">
              Página {currentPage} de {totalPages}
            </div>

            <Button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              variant="secondary"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        )}

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
