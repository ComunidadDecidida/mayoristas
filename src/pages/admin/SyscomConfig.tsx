import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Save, Key, Calendar, Settings, Database, Package, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '../../components/shared/Button';
import { Input } from '../../components/shared/Input';
import { supabase } from '../../lib/supabase';
import { configService } from '../../services/configService';

interface Category {
  id: string;
  nombre: string;
  total_productos?: number;
}

interface SelectedCategory {
  id: string;
  category_id: string;
  category_name: string;
  is_active: boolean;
  total_products: number;
  last_sync_at: string | null;
}

export default function SyscomConfig() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [oauthToken, setOauthToken] = useState('');
  const [tokenExpiresAt, setTokenExpiresAt] = useState('');
  const [categoriesMode, setCategoriesMode] = useState<'selected' | 'all'>('selected');
  const [markupMode, setMarkupMode] = useState<'global' | 'personalized'>('global');
  const [globalMarkup, setGlobalMarkup] = useState('20');
  const [tokenStatus, setTokenStatus] = useState<'valid' | 'expired' | 'warning' | 'unknown'>('unknown');
  const [daysRemaining, setDaysRemaining] = useState<number>(0);

  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<SelectedCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  useEffect(() => {
    loadConfig();
    loadCategories();
  }, []);

  useEffect(() => {
    if (tokenExpiresAt) {
      calculateTokenStatus();
    }
  }, [tokenExpiresAt]);

  const calculateTokenStatus = () => {
    if (!tokenExpiresAt) {
      setTokenStatus('unknown');
      setDaysRemaining(0);
      return;
    }

    try {
      const expiryDate = new Date(tokenExpiresAt);
      const now = new Date();
      const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      setDaysRemaining(daysLeft);

      if (daysLeft <= 0) {
        setTokenStatus('expired');
      } else if (daysLeft <= 30) {
        setTokenStatus('warning');
      } else {
        setTokenStatus('valid');
      }
    } catch (error) {
      console.error('Error calculating token status:', error);
      setTokenStatus('unknown');
      setDaysRemaining(0);
    }
  };

  const loadConfig = async () => {
    setLoading(true);
    try {
      const config = await configService.getAllConfig();

      setOauthToken(config.syscom_oauth_token || '');
      setTokenExpiresAt(config.syscom_token_expires_at || '');
      setCategoriesMode(config.syscom_categories_mode || 'selected');
      setMarkupMode(config.markup_mode || 'global');
      setGlobalMarkup(String(config.global_markup_percentage || 20));
    } catch (error) {
      console.error('Error loading config:', error);
      alert('Error al cargar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    setLoadingCategories(true);
    setCategoriesError(null);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/syscom-api?action=categories`,
        {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const categories = await response.json();
        setAvailableCategories(Array.isArray(categories) ? categories : []);
        setCategoriesError(null);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error fetching categories:', response.status, response.statusText, errorData);
        setAvailableCategories([]);
        setCategoriesError(errorData.error || `Error al obtener categorías: ${response.status} ${response.statusText}`);
      }

      const { data: selected } = await supabase
        .from('syscom_selected_categories')
        .select('*')
        .order('category_name');

      setSelectedCategories(selected || []);
    } catch (error: any) {
      console.error('Error loading categories:', error);
      setAvailableCategories([]);
      setSelectedCategories([]);
      setCategoriesError(error.message || 'Error al cargar categorías. Verifica el token OAuth2.');
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      await configService.updateConfig('syscom_oauth_token', oauthToken, 'Token OAuth2 Bearer de SYSCOM');
      await configService.updateConfig('syscom_token_expires_at', tokenExpiresAt, 'Fecha de expiración del token');
      await configService.updateConfig('syscom_categories_mode', categoriesMode, 'Modo de sincronización de categorías');
      await configService.updateConfig('markup_mode', markupMode, 'Modo de aplicación de markup');
      await configService.updateConfig('global_markup_percentage', parseFloat(globalMarkup), 'Porcentaje de markup global');

      alert('Configuración guardada exitosamente. El markup se aplicará en la próxima sincronización de productos.');

      calculateTokenStatus();
    } catch (error) {
      console.error('Error saving config:', error);
      alert('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleCategory = async (category: Category) => {
    try {
      const existing = selectedCategories.find(c => c.category_id === String(category.id));

      if (existing) {
        await supabase
          .from('syscom_selected_categories')
          .update({ is_active: !existing.is_active })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('syscom_selected_categories')
          .insert({
            category_id: String(category.id),
            category_name: category.nombre,
            is_active: true
          });
      }

      await loadCategories();
    } catch (error) {
      console.error('Error toggling category:', error);
      alert('Error al actualizar categoría');
    }
  };

  const isCategorySelected = (categoryId: string) => {
    const selected = selectedCategories.find(c => c.category_id === categoryId);
    return selected?.is_active || false;
  };

  const getTokenStatusColor = () => {
    switch (tokenStatus) {
      case 'valid': return 'bg-green-50 border-green-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'expired': return 'bg-red-50 border-red-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getTokenStatusIcon = () => {
    switch (tokenStatus) {
      case 'valid': return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'warning': return <AlertTriangle className="w-6 h-6 text-yellow-600" />;
      case 'expired': return <AlertTriangle className="w-6 h-6 text-red-600" />;
      default: return <Key className="w-6 h-6 text-gray-600" />;
    }
  };

  const getTokenStatusText = () => {
    switch (tokenStatus) {
      case 'valid': return `Token válido (${daysRemaining} días restantes)`;
      case 'warning': return `Token por expirar (${daysRemaining} días restantes)`;
      case 'expired': return 'Token expirado';
      default: return 'Estado desconocido';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link
            to="/admin/sync"
            className="text-blue-600 hover:text-blue-700 font-medium mb-2 inline-flex items-center"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Volver a Sincronización
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mt-2">
            Configuración de SYSCOM
          </h1>
          <p className="text-gray-600 mt-2">
            Gestiona el token OAuth2, categorías seleccionadas y modo de markup
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className={`border rounded-lg p-6 ${getTokenStatusColor()}`}>
            <div className="flex items-center justify-between mb-2">
              {getTokenStatusIcon()}
              <Calendar className="w-5 h-5 text-gray-500" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Estado del Token</p>
            <p className="text-lg font-semibold text-gray-900">{getTokenStatusText()}</p>
          </div>

          <div className={`border rounded-lg p-6 ${
            categoriesMode === 'selected' && selectedCategories.filter(c => c.is_active).length === 0
              ? 'bg-yellow-50 border-yellow-300'
              : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <Database className={`w-6 h-6 ${
                categoriesMode === 'selected' && selectedCategories.filter(c => c.is_active).length === 0
                  ? 'text-yellow-600'
                  : 'text-blue-600'
              }`} />
              <Settings className="w-5 h-5 text-gray-500" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Modo de Categorías</p>
            <p className="text-lg font-semibold text-gray-900">
              {categoriesMode === 'all' ? 'Todas las categorías' : `${selectedCategories.filter(c => c.is_active).length} seleccionadas`}
            </p>
            {categoriesMode === 'selected' && selectedCategories.filter(c => c.is_active).length === 0 && (
              <p className="text-xs text-yellow-700 mt-2">
                ⚠️ Sin categorías activas
              </p>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <Package className="w-6 h-6 text-blue-600" />
              <Settings className="w-5 h-5 text-gray-500" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Modo de Markup</p>
            <p className="text-lg font-semibold text-gray-900">
              {markupMode === 'global' ? `Global (${globalMarkup}%)` : 'Personalizado'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
              <Key className="w-6 h-6 mr-2 text-blue-600" />
              Token OAuth2
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Token Bearer
                </label>
                <textarea
                  value={oauthToken}
                  onChange={(e) => setOauthToken(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-xs"
                  placeholder="eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Token OAuth2 de SYSCOM válido por 364 días
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Expiración
                </label>
                <Input
                  type="datetime-local"
                  value={tokenExpiresAt ? new Date(tokenExpiresAt).toISOString().slice(0, 16) : ''}
                  onChange={(e) => setTokenExpiresAt(new Date(e.target.value).toISOString())}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Establece la fecha de expiración del token (364 días desde emisión)
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
              <Settings className="w-6 h-6 mr-2 text-blue-600" />
              Configuración de Markup
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Modo de Markup
                </label>
                <select
                  value={markupMode}
                  onChange={(e) => setMarkupMode(e.target.value as 'global' | 'personalized')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="global">Global - Aplicar a todos los productos</option>
                  <option value="personalized">Personalizado - Por producto individual</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {markupMode === 'global'
                    ? 'El markup global se aplicará a los productos de SYSCOM durante la próxima sincronización'
                    : 'Cada producto puede tener su propio porcentaje de markup personalizado'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Markup Global (%)
                </label>
                <Input
                  type="number"
                  value={globalMarkup}
                  onChange={(e) => setGlobalMarkup(e.target.value)}
                  min="0"
                  max="100"
                  step="0.1"
                  disabled={markupMode === 'personalized'}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Porcentaje de ganancia aplicado sobre el precio base
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Modo de Sincronización de Categorías
                </label>
                <select
                  value={categoriesMode}
                  onChange={(e) => setCategoriesMode(e.target.value as 'selected' | 'all')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="selected">Solo categorías seleccionadas</option>
                  <option value="all">Todas las categorías disponibles</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Define qué categorías se sincronizarán con SYSCOM
                </p>
              </div>
            </div>
          </div>
        </div>

        {categoriesMode === 'selected' && (
          <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
              <Database className="w-6 h-6 mr-2 text-blue-600" />
              Categorías Seleccionadas
            </h2>

            {loadingCategories ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                <p className="text-gray-600">Cargando categorías...</p>
              </div>
            ) : categoriesError ? (
              <div className="p-6 bg-red-50 border-2 border-red-200 rounded-lg">
                <div className="flex items-start">
                  <AlertTriangle className="w-6 h-6 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-red-900 mb-2">Error al obtener categorías</p>
                    <p className="text-sm text-red-700 mb-4">{categoriesError}</p>
                    <Button
                      onClick={loadCategories}
                      size="sm"
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Reintentar
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                {availableCategories.map((category) => {
                  const isSelected = isCategorySelected(String(category.id));
                  const selectedData = selectedCategories.find(c => c.category_id === String(category.id));

                  return (
                    <button
                      key={category.id}
                      onClick={() => handleToggleCategory(category)}
                      className={`text-left p-4 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 mb-1">{category.nombre}</p>
                          {selectedData && selectedData.total_products > 0 && (
                            <p className="text-xs text-gray-500">
                              {selectedData.total_products} productos
                            </p>
                          )}
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          isSelected ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                        }`}>
                          {isSelected && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {selectedCategories.filter(c => c.is_active).length === 0 ? (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
                <div className="flex items-start">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-yellow-900 mb-1">
                      No hay categorías seleccionadas
                    </p>
                    <p className="text-sm text-yellow-800">
                      Debes seleccionar al menos una categoría para poder sincronizar productos de SYSCOM, o cambia el modo a "Todas las categorías disponibles".
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>{selectedCategories.filter(c => c.is_active).length}</strong> categorías seleccionadas para sincronización.
                  Solo los productos de estas categorías se importarán desde SYSCOM.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 flex justify-end">
          <Button
            onClick={handleSaveConfig}
            disabled={saving}
            size="lg"
            className="min-w-[200px]"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Guardar Configuración
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
