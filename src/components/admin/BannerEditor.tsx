import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Modal } from '../shared/Modal';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { ImageUploader } from '../shared/ImageUploader';
import { bannerService, Banner } from '../../services/bannerService';

interface BannerEditorProps {
  banner?: Banner;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function BannerEditor({ banner, isOpen, onClose, onSave }: BannerEditorProps) {
  const [formData, setFormData] = useState({
    title: '',
    image_url: '',
    link_url: '',
    sort_order: 0,
    is_active: true,
    start_date: '',
    end_date: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (banner) {
      setFormData({
        title: banner.title,
        image_url: banner.image_url,
        link_url: banner.link_url || '',
        sort_order: banner.sort_order,
        is_active: banner.is_active,
        start_date: banner.start_date ? banner.start_date.split('T')[0] : '',
        end_date: banner.end_date ? banner.end_date.split('T')[0] : '',
      });
    } else {
      setFormData({
        title: '',
        image_url: '',
        link_url: '',
        sort_order: 0,
        is_active: true,
        start_date: '',
        end_date: '',
      });
    }
  }, [banner, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.title || !formData.image_url) {
      setError('El título y la imagen son obligatorios');
      return;
    }

    setSaving(true);
    try {
      const bannerData: any = {
        title: formData.title,
        image_url: formData.image_url,
        link_url: formData.link_url || null,
        sort_order: formData.sort_order,
        is_active: formData.is_active,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
      };

      if (banner) {
        await bannerService.updateBanner(banner.id, bannerData);
      } else {
        await bannerService.createBanner(bannerData);
      }

      onSave();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar banner');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = (url: string) => {
    setFormData({ ...formData, image_url: url });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={banner ? 'Editar Banner' : 'Nuevo Banner'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Título"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
          placeholder="Nombre descriptivo del banner"
        />

        <ImageUploader
          folder="banners"
          onUploadComplete={handleImageUpload}
          currentImage={formData.image_url}
          label="Imagen del Banner (recomendado: 1920x600px)"
        />

        {formData.image_url && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Vista Previa
            </label>
            <img
              src={formData.image_url}
              alt="Preview"
              className="w-full h-48 object-cover rounded-lg border border-gray-300"
            />
          </div>
        )}

        <Input
          label="URL de Enlace (opcional)"
          type="url"
          value={formData.link_url}
          onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
          placeholder="https://ejemplo.com/promocion"
        />

        <Input
          label="Orden de Visualización"
          type="number"
          value={formData.sort_order}
          onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
          min="0"
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Fecha de Inicio (opcional)"
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
          />

          <Input
            label="Fecha de Fin (opcional)"
            type="date"
            value={formData.end_date}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="is_active"
            checked={formData.is_active}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
            Banner activo
          </label>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-3">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={saving} className="flex-1">
            {saving ? 'Guardando...' : banner ? 'Actualizar Banner' : 'Crear Banner'}
          </Button>
          <Button type="button" onClick={onClose} variant="secondary" className="flex-1">
            Cancelar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
