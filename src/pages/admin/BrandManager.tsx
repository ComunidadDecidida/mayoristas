import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Eye, EyeOff } from 'lucide-react'
import { Button } from '../../components/shared/Button'
import { brandService, Brand } from '../../services/brandService'
import { BrandEditor } from '../../components/admin/BrandEditor'

function BrandManager() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBrand, setSelectedBrand] = useState<Brand | undefined>()
  const [showEditor, setShowEditor] = useState(false)

  useEffect(() => {
    loadBrands()
  }, [])

  async function loadBrands() {
    try {
      setLoading(true)
      const data = await brandService.getBrands(false)
      setBrands(data)
    } catch (error) {
      console.error('Error loading brands:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleToggleVisibility(brand: Brand) {
    try {
      await brandService.updateBrand(brand.id, { is_visible: !brand.is_visible })
      await loadBrands()
    } catch (error) {
      console.error('Error updating brand:', error)
      alert('Error al actualizar la marca')
    }
  }

  async function handleDelete(brand: Brand) {
    if (!confirm(`¿Eliminar la marca "${brand.name}"?`)) return

    try {
      await brandService.deleteBrand(brand.id)
      await loadBrands()
    } catch (error) {
      console.error('Error deleting brand:', error)
      alert('Error al eliminar la marca')
    }
  }

  function handleEdit(brand: Brand) {
    setSelectedBrand(brand)
    setShowEditor(true)
  }

  function handleNew() {
    setSelectedBrand(undefined)
    setShowEditor(true)
  }

  function handleCloseEditor() {
    setShowEditor(false)
    setSelectedBrand(undefined)
  }

  async function handleSave() {
    await loadBrands()
    handleCloseEditor()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Gestión de Marcas</h2>
        <Button onClick={handleNew}>
          <Plus className="w-5 h-5 mr-2" />
          Nueva Marca
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Logo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slug</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orden</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {brands.map((brand) => (
                <tr key={brand.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {brand.logo_url ? (
                      <img
                        src={brand.logo_url}
                        alt={brand.name}
                        className="h-10 w-20 object-contain"
                      />
                    ) : (
                      <span className="text-gray-400 text-sm">Sin logo</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{brand.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{brand.slug}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{brand.sort_order}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      brand.is_visible ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {brand.is_visible ? 'Visible' : 'Oculta'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleToggleVisibility(brand)}
                        className="text-blue-600 hover:text-blue-900"
                        title={brand.is_visible ? 'Ocultar' : 'Mostrar'}
                      >
                        {brand.is_visible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                      <button
                        onClick={() => handleEdit(brand)}
                        className="text-yellow-600 hover:text-yellow-900"
                        title="Editar"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(brand)}
                        className="text-red-600 hover:text-red-900"
                        title="Eliminar"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {brands.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No hay marcas registradas
            </div>
          )}
        </div>
      )}

      <BrandEditor
        brand={selectedBrand}
        isOpen={showEditor}
        onClose={handleCloseEditor}
        onSave={handleSave}
      />
    </div>
  )
}

export default BrandManager
