import { useEffect, useState } from 'react'
import { X, ChevronRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useNavigate } from 'react-router-dom'

interface Category {
  id: string
  name: string
  slug: string
  source: string
  product_count?: number
}

interface CategoryMenuProps {
  onClose: () => void
}

export function CategoryMenu({ onClose }: CategoryMenuProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    loadCategories()
  }, [])

  async function loadCategories() {
    try {
      setLoading(true)

      const { data: categoriesData, error: catError } = await supabase
        .from('categories')
        .select('id, name, slug, source')
        .eq('is_visible', true)
        .is('parent_id', null)
        .order('name', { ascending: true })

      if (catError) throw catError

      if (!categoriesData || categoriesData.length === 0) {
        setCategories([])
        return
      }

      const categoriesWithCount = await Promise.all(
        categoriesData.map(async (cat) => {
          const { count, error: countError } = await supabase
            .from('products')
            .select('id', { count: 'exact', head: true })
            .eq('is_visible', true)
            .or(`metadata->>categoria_nombre.ilike.%${cat.name}%,metadata->>category_name.ilike.%${cat.name}%`)

          if (countError) {
            console.error('Error counting products for category:', cat.name, countError)
            return { ...cat, product_count: 0 }
          }

          return { ...cat, product_count: count || 0 }
        })
      )

      setCategories(categoriesWithCount.filter(c => c.product_count > 0))
    } catch (error) {
      console.error('Error cargando categorías:', error)
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  const handleCategoryClick = (slug: string, name: string) => {
    navigate(`/products?search=${encodeURIComponent(name)}`)
    onClose()
  }

  return (
    <div className="absolute top-20 left-0 w-64 bg-white shadow-lg border-t border-gray-200 z-40 max-h-96 overflow-y-auto">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Categorías</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {loading ? (
          <div className="py-8 text-center text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm">Cargando...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <p className="text-sm">No hay categorías disponibles</p>
            <p className="text-xs mt-1">Sincroniza productos para ver categorías</p>
          </div>
        ) : (
          <ul className="space-y-1">
            {categories.map((category) => (
              <li key={category.id}>
                <button
                  onClick={() => handleCategoryClick(category.slug, category.name)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-700 group text-left"
                >
                  <span className="text-sm">{category.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full group-hover:bg-gray-200">
                      {category.product_count}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
