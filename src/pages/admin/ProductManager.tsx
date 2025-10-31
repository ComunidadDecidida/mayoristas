import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Plus, Edit, Eye, EyeOff, ArrowLeft, Trash2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { useProducts } from '../../hooks/useProducts'
import { Button } from '../../components/shared/Button'
import { Input } from '../../components/shared/Input'
import { Loading } from '../../components/shared/Loading'
import { ProductEditor } from '../../components/admin/ProductEditor'
import { supabase } from '../../lib/supabase'

export default function ProductManager() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [visibleOnly, setVisibleOnly] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const { products, loading, totalPages, totalCount, currentPage, refresh } = useProducts({
    page,
    limit: 20,
    search,
    visibleOnly,
  })

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(price)
  }

  const toggleVisibility = async (productId: string, currentVisibility: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_visible: !currentVisibility })
        .eq('id', productId)

      if (error) throw error
      refresh()
    } catch (error) {
      console.error('Error toggling visibility:', error)
      alert('Error al cambiar la visibilidad del producto')
    }
  }

  const toggleSelectAll = () => {
    if (selectedProducts.size === products.length) {
      setSelectedProducts(new Set())
    } else {
      setSelectedProducts(new Set(products.map(p => p.id)))
    }
  }

  const toggleSelectProduct = (productId: string) => {
    const newSelected = new Set(selectedProducts)
    if (newSelected.has(productId)) {
      newSelected.delete(productId)
    } else {
      newSelected.add(productId)
    }
    setSelectedProducts(newSelected)
  }

  const handleDeleteSelected = async () => {
    if (selectedProducts.size === 0) return

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .in('id', Array.from(selectedProducts))

      if (error) throw error

      setSelectedProducts(new Set())
      setShowDeleteConfirm(false)
      refresh()
      alert(`${selectedProducts.size} productos eliminados correctamente`)
    } catch (error) {
      console.error('Error deleting products:', error)
      alert('Error al eliminar productos')
    }
  }

  const getPageNumbers = () => {
    const pages = []
    const maxVisible = 7

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i)
        pages.push('...')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 3) {
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i)
      } else {
        pages.push(1)
        pages.push('...')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i)
        pages.push('...')
        pages.push(totalPages)
      }
    }

    return pages
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link to="/admin" className="text-blue-600 hover:text-blue-700 font-medium mb-2 inline-block">
              <ArrowLeft className="w-5 h-5 inline mr-2" />
              Volver al Dashboard
            </Link>
            <h1 className="text-4xl font-bold text-gray-900">Gestión de Productos</h1>
          </div>
          <Button onClick={() => setSelectedProductId('new')}>
            <Plus className="w-5 h-5 mr-2" />
            Nuevo Producto
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="md:col-span-2">
              <Input
                placeholder="Buscar por título, SKU o descripción..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={visibleOnly}
                  onChange={(e) => setVisibleOnly(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm font-medium text-gray-700">
                  Solo productos visibles
                </span>
              </label>
            </div>
          </div>
          {selectedProducts.size > 0 && (
            <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3">
              <span className="text-sm font-medium text-blue-900">
                {selectedProducts.size} producto(s) seleccionado(s)
              </span>
              <Button
                variant="secondary"
                onClick={() => setShowDeleteConfirm(true)}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar Seleccionados
              </Button>
            </div>
          )}
        </div>

        {loading ? (
          <Loading text="Cargando productos..." />
        ) : products.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No se encontraron productos
            </h3>
            <p className="text-gray-600 mb-6">
              Comienza agregando productos o sincronizando con las APIs
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => setSelectedProductId('new')}>
                <Plus className="w-5 h-5 mr-2" />
                Agregar Producto
              </Button>
              <Link to="/admin/sync">
                <Button variant="secondary">
                  Sincronizar Productos
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3">
                        <input
                          type="checkbox"
                          checked={selectedProducts.size === products.length && products.length > 0}
                          onChange={toggleSelectAll}
                          className="rounded"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Imagen
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Título / SKU
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Precio Base
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Markup
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Precio Final
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Stock
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Origen
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {products.map((product) => (
                      <tr key={product.id} className={!product.is_visible ? 'bg-gray-50' : ''}>
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedProducts.has(product.id)}
                            onChange={() => toggleSelectProduct(product.id)}
                            className="rounded"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <img
                            src={
                              (Array.isArray(product.images) && product.images.length > 0)
                                ? product.images[0]
                                : 'https://via.placeholder.com/150?text=No+Image'
                            }
                            alt={product.title}
                            className="w-16 h-16 object-cover rounded"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=No+Image'
                            }}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{product.title}</div>
                          <div className="text-sm text-gray-600">{product.sku}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {formatPrice(product.base_price)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {product.markup_percentage}%
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                          {formatPrice(product.final_price)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            product.stock > 10
                              ? 'bg-green-100 text-green-800'
                              : product.stock > 0
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {product.stock}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {product.source}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setSelectedProductId(product.id)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => toggleVisibility(product.id, product.is_visible)}
                              className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                              title={product.is_visible ? 'Ocultar' : 'Mostrar'}
                            >
                              {product.is_visible ? (
                                <Eye className="w-4 h-4" />
                              ) : (
                                <EyeOff className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 bg-white p-4 rounded-lg shadow">
                <div className="text-sm text-gray-700">
                  Mostrando <span className="font-medium">{(currentPage - 1) * 20 + 1}</span> a{' '}
                  <span className="font-medium">{Math.min(currentPage * 20, totalCount || 0)}</span> de{' '}
                  <span className="font-medium">{totalCount || 0}</span> resultados
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Primera página"
                  >
                    <ChevronsLeft className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => setPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Página anterior"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <div className="flex gap-1">
                    {getPageNumbers().map((pageNum, idx) => (
                      pageNum === '...' ? (
                        <span key={`ellipsis-${idx}`} className="px-3 py-2 text-gray-500">
                          ...
                        </span>
                      ) : (
                        <button
                          key={pageNum}
                          onClick={() => setPage(Number(pageNum))}
                          className={`px-3 py-2 rounded ${
                            currentPage === pageNum
                              ? 'bg-blue-600 text-white font-semibold'
                              : 'hover:bg-gray-100 text-gray-700'
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    ))}
                  </div>

                  <button
                    onClick={() => setPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Página siguiente"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => setPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Última página"
                  >
                    <ChevronsRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {selectedProductId && (
        <ProductEditor
          productId={selectedProductId === 'new' ? null : selectedProductId}
          onClose={() => setSelectedProductId(null)}
          onSave={() => {
            setSelectedProductId(null)
            refresh()
          }}
        />
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Confirmar Eliminación
            </h3>
            <p className="text-gray-700 mb-6">
              ¿Estás seguro de que deseas eliminar {selectedProducts.size} producto(s)?
              Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-4 justify-end">
              <Button
                variant="secondary"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleDeleteSelected}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
