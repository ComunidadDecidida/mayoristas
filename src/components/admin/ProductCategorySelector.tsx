import { useEffect, useState } from 'react'
import { categoryService, Category } from '../../services/categoryService'
import { X } from 'lucide-react'

interface ProductCategorySelectorProps {
  selectedCategories: string[]
  onChange: (categoryIds: string[]) => void
  label?: string
}

export function ProductCategorySelector({ selectedCategories, onChange, label = 'Categorías' }: ProductCategorySelectorProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadCategories()
  }, [])

  async function loadCategories() {
    try {
      const data = await categoryService.getCategories(false)
      setCategories(data)
    } catch (error) {
      console.error('Error loading categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(search.toLowerCase())
  )

  const toggleCategory = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      onChange(selectedCategories.filter(id => id !== categoryId))
    } else {
      onChange([...selectedCategories, categoryId])
    }
  }

  const getSelectedCategoryNames = () => {
    return categories
      .filter(cat => selectedCategories.includes(cat.id))
      .map(cat => cat.name)
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>

      {selectedCategories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {getSelectedCategoryNames().map((name, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
            >
              {name}
              <button
                type="button"
                onClick={() => {
                  const cat = categories.find(c => c.name === name)
                  if (cat) toggleCategory(cat.id)
                }}
                className="hover:text-blue-900"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="border rounded-lg p-4 max-h-64 overflow-y-auto bg-gray-50">
        <input
          type="text"
          placeholder="Buscar categorías..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md mb-3 text-sm"
        />

        {loading ? (
          <div className="text-center py-4 text-gray-500">Cargando categorías...</div>
        ) : filteredCategories.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            {search ? 'No se encontraron categorías' : 'No hay categorías disponibles'}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredCategories.map((category) => (
              <label
                key={category.id}
                className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(category.id)}
                  onChange={() => toggleCategory(category.id)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{category.name}</span>
                {category.source && (
                  <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded">
                    {category.source}
                  </span>
                )}
              </label>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-gray-500">
        {selectedCategories.length === 0
          ? 'Selecciona una o más categorías para este producto'
          : `${selectedCategories.length} categoría(s) seleccionada(s)`}
      </p>
    </div>
  )
}
