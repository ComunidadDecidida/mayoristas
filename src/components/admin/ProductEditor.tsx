import { useState, useEffect } from 'react'
import { Modal } from '../shared/Modal'
import { Input } from '../shared/Input'
import { Textarea } from '../shared/Textarea'
import { Select } from '../shared/Select'
import { Button } from '../shared/Button'
import { Loading } from '../shared/Loading'
import { ProductCategorySelector } from './ProductCategorySelector'
import { supabase } from '../../lib/supabase'
import { categoryService } from '../../services/categoryService'

interface ProductEditorProps {
  productId: string | null
  onClose: () => void
  onSave: () => void
}

export function ProductEditor({ productId, onClose, onSave }: ProductEditorProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  const [formData, setFormData] = useState({
    title: '',
    sku: '',
    description: '',
    base_price: '',
    markup_percentage: '20',
    stock: '',
    image_url: '',
    category_id: '',
    brand_id: '',
    is_visible: true,
    is_featured: false,
    source: 'manual' as 'syscom' | 'tecnosinergia' | 'manual',
  })

  useEffect(() => {
    if (productId) {
      loadProduct()
    }
  }, [productId])

  const loadProduct = async () => {
    if (!productId) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single()

      if (error) throw error

      setFormData({
        title: data.title,
        sku: data.sku,
        description: data.description || '',
        base_price: data.base_price.toString(),
        markup_percentage: data.markup_percentage.toString(),
        stock: data.stock.toString(),
        image_url: (Array.isArray(data.images) && data.images.length > 0) ? data.images[0] : '' || '',
        category_id: data.category_id || '',
        brand_id: data.brand_id || '',
        is_visible: data.is_visible,
        is_featured: data.is_featured || false,
        source: data.source,
      })

      const categories = await categoryService.getProductCategories(productId)
      setSelectedCategories(categories.map(cat => cat.id))
    } catch (error) {
      console.error('Error loading product:', error)
      alert('Error al cargar el producto')
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) newErrors.title = 'El título es requerido'
    if (!formData.sku.trim()) newErrors.sku = 'El SKU es requerido'
    if (!formData.base_price || parseFloat(formData.base_price) <= 0) {
      newErrors.base_price = 'El precio base debe ser mayor a 0'
    }
    if (!formData.markup_percentage || parseFloat(formData.markup_percentage) < 0) {
      newErrors.markup_percentage = 'El markup debe ser mayor o igual a 0'
    }
    if (!formData.stock || parseInt(formData.stock) < 0) {
      newErrors.stock = 'El stock debe ser mayor o igual a 0'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      setSaving(true)

      const basePrice = parseFloat(formData.base_price)
      const markupPercentage = parseFloat(formData.markup_percentage)
      const finalPrice = basePrice * (1 + markupPercentage / 100)

      const productData = {
        title: formData.title,
        sku: formData.sku,
        description: formData.description,
        base_price: basePrice,
        markup_percentage: markupPercentage,
        final_price: finalPrice,
        stock: parseInt(formData.stock),
        images: formData.image_url ? [formData.image_url] : [],
        category_id: formData.category_id || null,
        brand_id: formData.brand_id || null,
        is_visible: formData.is_visible,
        is_featured: formData.is_featured,
        source: formData.source,
      }

      let savedProductId = productId

      if (productId) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', productId)

        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('products')
          .insert(productData)
          .select('id')
          .single()

        if (error) throw error
        savedProductId = data.id
      }

      if (savedProductId) {
        await categoryService.assignCategoriesToProduct(savedProductId, selectedCategories)
      }

      onSave()
    } catch (error) {
      console.error('Error saving product:', error)
      alert('Error al guardar el producto')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    const finalValue = type === 'checkbox'
      ? (e.target as HTMLInputElement).checked
      : value

    setFormData(prev => ({ ...prev, [name]: finalValue }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={productId ? 'Editar Producto' : 'Nuevo Producto'}
      size="lg"
    >
      {loading ? (
        <Loading text="Cargando producto..." />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Input
                label="Título"
                name="title"
                value={formData.title}
                onChange={handleChange}
                error={errors.title}
                required
              />
            </div>

            <Input
              label="SKU"
              name="sku"
              value={formData.sku}
              onChange={handleChange}
              error={errors.sku}
              required
            />

            <Select
              label="Origen"
              name="source"
              value={formData.source}
              onChange={handleChange}
              options={[
                { value: 'manual', label: 'Manual' },
                { value: 'syscom', label: 'SYSCOM' },
                { value: 'tecnosinergia', label: 'TECNOSINERGIA' },
              ]}
            />

            <div className="md:col-span-2">
              <Textarea
                label="Descripción"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                style={{ unicodeBidi: 'plaintext' }}
              />
            </div>

            <Input
              label="Precio Base"
              name="base_price"
              type="number"
              step="0.01"
              value={formData.base_price}
              onChange={handleChange}
              error={errors.base_price}
              required
            />

            <Input
              label="Markup (%)"
              name="markup_percentage"
              type="number"
              step="0.01"
              value={formData.markup_percentage}
              onChange={handleChange}
              error={errors.markup_percentage}
              required
            />

            <Input
              label="Stock"
              name="stock"
              type="number"
              value={formData.stock}
              onChange={handleChange}
              error={errors.stock}
              required
            />

            <Input
              label="URL de Imagen"
              name="image_url"
              type="url"
              value={formData.image_url}
              onChange={handleChange}
              placeholder="https://ejemplo.com/imagen.jpg"
            />

            <div className="md:col-span-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="is_visible"
                  checked={formData.is_visible}
                  onChange={handleChange}
                  className="rounded"
                />
                <span className="text-sm font-medium text-gray-700">
                  Producto visible en el catálogo
                </span>
              </label>
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="is_featured"
                  checked={formData.is_featured}
                  onChange={handleChange}
                  className="rounded"
                />
                <span className="text-sm font-medium text-gray-700">
                  ⭐ Producto Destacado (se mostrará en la página principal)
                </span>
              </label>
            </div>

            <div className="md:col-span-2">
              <ProductCategorySelector
                selectedCategories={selectedCategories}
                onChange={setSelectedCategories}
                label="Categorías del Producto"
              />
            </div>
          </div>

          {formData.base_price && formData.markup_percentage && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Precio Final:</span>
                <span className="text-2xl font-bold text-blue-600">
                  {new Intl.NumberFormat('es-MX', {
                    style: 'currency',
                    currency: 'MXN',
                  }).format(
                    parseFloat(formData.base_price) *
                      (1 + parseFloat(formData.markup_percentage) / 100)
                  )}
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
