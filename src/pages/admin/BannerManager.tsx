import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Plus, Edit, Trash2, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { bannerService, Banner } from '../../services/bannerService';
import { BannerEditor } from '../../components/admin/BannerEditor';
import { Button } from '../../components/shared/Button';
import { Loading } from '../../components/shared/Loading';

export default function BannerManager() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBanner, setSelectedBanner] = useState<Banner | undefined>();
  const [showEditor, setShowEditor] = useState(false);

  const loadBanners = async () => {
    setLoading(true);
    try {
      const data = await bannerService.getBanners();
      setBanners(data);
    } catch (error) {
      console.error('Error loading banners:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBanners();
  }, []);

  const handleToggleStatus = async (banner: Banner) => {
    try {
      await bannerService.toggleBannerStatus(banner.id, !banner.is_active);
      loadBanners();
    } catch (error) {
      console.error('Error toggling banner status:', error);
      alert('Error al cambiar el estado del banner');
    }
  };

  const handleDelete = async (banner: Banner) => {
    if (!confirm(`¿Estás seguro de eliminar el banner "${banner.title}"?`)) return;

    try {
      await bannerService.deleteBanner(banner.id);
      loadBanners();
    } catch (error) {
      console.error('Error deleting banner:', error);
      alert('Error al eliminar el banner');
    }
  };

  const handleEdit = (banner: Banner) => {
    setSelectedBanner(banner);
    setShowEditor(true);
  };

  const handleNew = () => {
    setSelectedBanner(undefined);
    setShowEditor(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link to="/admin" className="hover:text-gray-700">
              Admin
            </Link>
            <ChevronLeft className="h-4 w-4 rotate-180" />
            <span className="text-gray-900 font-medium">Gestión de Banners</span>
          </div>
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">
              Banners del Carrusel
            </h1>
            <div className="flex gap-2">
              <Button onClick={loadBanners} variant="secondary">
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualizar
              </Button>
              <Button onClick={handleNew}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Banner
              </Button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow-sm p-12">
            <Loading text="Cargando banners..." />
          </div>
        ) : banners.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-500 mb-4">No hay banners creados</p>
            <Button onClick={handleNew}>
              <Plus className="h-4 w-4 mr-2" />
              Crear Primer Banner
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {banners.map((banner) => (
              <div key={banner.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="relative">
                  <img
                    src={banner.image_url}
                    alt={banner.title}
                    className="w-full h-48 object-cover"
                  />
                  {!banner.is_active && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <span className="text-white font-medium">Inactivo</span>
                    </div>
                  )}
                </div>

                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-medium text-gray-900">{banner.title}</h3>
                    <p className="text-sm text-gray-500">Orden: {banner.sort_order}</p>
                  </div>

                  {banner.link_url && (
                    <p className="text-xs text-gray-500 truncate">
                      Enlace: {banner.link_url}
                    </p>
                  )}

                  {(banner.start_date || banner.end_date) && (
                    <div className="text-xs text-gray-500">
                      {banner.start_date && (
                        <div>Inicio: {new Date(banner.start_date).toLocaleDateString('es-MX')}</div>
                      )}
                      {banner.end_date && (
                        <div>Fin: {new Date(banner.end_date).toLocaleDateString('es-MX')}</div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2 border-t border-gray-200">
                    <button
                      onClick={() => handleEdit(banner)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Edit className="h-4 w-4" />
                      Editar
                    </button>

                    <button
                      onClick={() => handleToggleStatus(banner)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded"
                    >
                      {banner.is_active ? (
                        <>
                          <EyeOff className="h-4 w-4" />
                          Ocultar
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4" />
                          Mostrar
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleDelete(banner)}
                      className="flex items-center justify-center gap-1 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showEditor && (
        <BannerEditor
          banner={selectedBanner}
          isOpen={showEditor}
          onClose={() => {
            setShowEditor(false);
            setSelectedBanner(undefined);
          }}
          onSave={() => {
            loadBanners();
            setShowEditor(false);
            setSelectedBanner(undefined);
          }}
        />
      )}
    </div>
  );
}
