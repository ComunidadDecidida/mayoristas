import { useState, useEffect } from 'react'
import { Modal } from '../shared/Modal'
import { Button } from '../shared/Button'
import { Input } from '../shared/Input'
import { Textarea } from '../shared/Textarea'
import { ImageUploader } from '../shared/ImageUploader'
import { brandService, Brand } from '../../services/brandService'

interface BrandEditorProps {
  brand?: Brand
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

export function BrandEditor({ brand, isOpen, onClose, onSave }: BrandEditorProps) {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    logo_url: '',
    description: '',
    is_visible: true,
    sort_order: 0,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (brand) {
      setFormData({
        name: brand.name,
        slug: brand.slug,
        logo_url: brand.logo_url || '',
        description: brand.description || '',
        is_visible: brand.is_visible,
        sort_order: brand.sort_order,
      })
    } else {
      setFormData({
        name: '',
        slug: '',
        logo_url: '',
        description: '',
        is_visible: true,
        sort_order: 0,
      })
    }
  }, [brand, isOpen])

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    setFormData({
      ...formData,
      name,
      slug: generateSlug(name)
    })
  }

  const handleImageUpload = (url: string) => {
    setFormData({ ...formData, logo_url: url })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.name || !formData.slug) {
      setError('El nombre y el slug son obligatorios')
      return
    }

    setSaving(true)
    try {
      if (brand) {
        await brandService.updateBrand(brand.id, formData)
      } else {
        await brandService.createBrand(formData)
      }

      onSave()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar marca')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={brand ? 'Editar Marca' : 'Nueva Marca'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Nombre de la Marca"
          value={formData.name}
          onChange={handleNameChange}
          required
          placeholder="Ej: Dell, HP, Cisco"
        />

        <Input
          label="Slug (URL amigable)"
          value={formData.slug}
          onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
          required
          placeholder="Se genera automáticamente"
        />

        <ImageUploader
          folder="brands"
          onUploadComplete={handleImageUpload}
          currentImage={formData.logo_url}
          label="Logo de la Marca (recomendado: 200x100px con fondo transparente)"
        />

        {formData.logo_url && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Vista Previa del Logo
            </label>
            <div className="bg-white border border-gray-300 rounded-lg p-4 flex items-center justify-center h-24">
              <img
                src={formData.logo_url}
                alt="Preview"
                className="max-h-full max-w-full object-contain"
              />
            </div>
          </div>
        )}

        <Textarea
          label="Descripción (opcional)"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Información adicional sobre la marca"
          rows={3}
        />

        <Input
          label="Orden de Visualización"
          type="number"
          value={formData.sort_order}
          onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
          min="0"
        />

        <div className="flex items-center">
          <input
            type="checkbox"
            id="is_visible"
            checked={formData.is_visible}
            onChange={(e) => setFormData({ ...formData, is_visible: e.target.checked })}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="is_visible" className="ml-2 block text-sm text-gray-900">
            Marca visible en el sitio
          </label>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-3">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={saving} className="flex-1">
            {saving ? 'Guardando...' : brand ? 'Actualizar Marca' : 'Crear Marca'}
          </Button>
          <Button type="button" onClick={onClose} variant="secondary" className="flex-1">
            Cancelar
          </Button>
        </div>
      </form>
    </Modal>
  )
}
