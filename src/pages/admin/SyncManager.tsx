import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, ArrowLeft, Activity, Database, Settings } from 'lucide-react';
import { Button } from '../../components/shared/Button';
import CategorySelector from '../../components/admin/CategorySelector';
import SyncMonitor from '../../components/admin/SyncMonitor';
import SyncFilters, { SyncFiltersType } from '../../components/admin/SyncFilters';
import { syncProducts, testSyscomConnection, testTecnosinergiaConnection } from '../../services/syncService';
import { supabase } from '../../lib/supabase';

type SyncSource = 'syscom' | 'tecnosinergia' | 'all';

interface SyncStats {
  status: 'running' | 'success' | 'error' | 'idle';
  source: string;
  productsCollected?: number;
  productsWithStock?: number;
  productsSynced?: number;
  errors?: any[];
  currentCategory?: string;
  categoriesProcessed?: number;
  totalCategories?: number;
  startTime?: number;
  requestsInWindow?: number;
  maxRequests?: number;
}

export default function SyncManager() {
  const [activeTab, setActiveTab] = useState<SyncSource>('syscom');
  const [syncing, setSyncing] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [filters, setFilters] = useState<SyncFiltersType>({
    onlyWithStock: true,
    minStock: 1
  });
  const [syncStats, setSyncStats] = useState<SyncStats | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [recentSyncs, setRecentSyncs] = useState<any[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<{
    syscom: boolean | null;
    tecnosinergia: boolean | null;
  }>({
    syscom: null,
    tecnosinergia: null
  });
  const [selectedCategoriesInfo, setSelectedCategoriesInfo] = useState<any[]>([]);

  useEffect(() => {
    checkConnections();
    loadRecentSyncs();
    loadSelectedCategories();
  }, []);

  const loadSelectedCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('syscom_selected_categories')
        .select('*')
        .eq('is_active', true)
        .order('sync_priority', { ascending: false });

      if (error) throw error;
      setSelectedCategoriesInfo(data || []);
    } catch (error) {
      console.error('Error loading selected categories:', error);
    }
  };

  const checkConnections = async () => {
    addLog('Verificando conexiones a las APIs...');

    const syscomOk = await testSyscomConnection();
    const tecnosinergiaOk = await testTecnosinergiaConnection();

    setConnectionStatus({
      syscom: syscomOk,
      tecnosinergia: tecnosinergiaOk
    });

    if (syscomOk) {
      addLog('✓ SYSCOM: Conexión exitosa');
    } else {
      addLog('✗ SYSCOM: Error de conexión');
    }

    if (tecnosinergiaOk) {
      addLog('✓ TECNOSINERGIA: Conexión exitosa');
    } else {
      addLog('✗ TECNOSINERGIA: Error de conexión');
    }
  };

  const loadRecentSyncs = async () => {
    try {
      const { data, error } = await supabase
        .from('api_sync_logs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentSyncs(data || []);
    } catch (error) {
      console.error('Error loading recent syncs:', error);
    }
  };

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const handleStartSync = async () => {
    if (activeTab === 'syscom') {
      const { data: modeConfig } = await supabase
        .from('system_config')
        .select('value')
        .eq('key', 'syscom_categories_mode')
        .maybeSingle();

      const categoriesMode = modeConfig?.value || 'selected';

      if (categoriesMode === 'selected') {
        const { data: activeCategories } = await supabase
          .from('syscom_selected_categories')
          .select('id')
          .eq('is_active', true);

        if (!activeCategories || activeCategories.length === 0) {
          alert('No hay categorías seleccionadas para sincronizar.\n\nPor favor ve a "Configuración de SYSCOM" y:\n1. Selecciona al menos una categoría, o\n2. Cambia el modo a "Todas las categorías"');
          return;
        }

        addLog(`Modo: Categorías seleccionadas (${activeCategories.length})`);
      } else {
        addLog('Modo: Todas las categorías disponibles');
      }
    }

    setSyncing(true);
    setLogs([]);
    setSyncStats({
      status: 'running',
      source: activeTab,
      startTime: Date.now(),
      requestsInWindow: 0,
      maxRequests: 45
    });

    addLog(`Iniciando sincronización de ${activeTab.toUpperCase()}...`);

    if (activeTab === 'syscom') {
      addLog(`Categorías a sincronizar: validadas`);
    }

    addLog(`Filtros: Stock mínimo: ${filters.minStock || 1}`);

    try {
      const result = await syncProducts({
        source: activeTab,
        categories: selectedCategories,
        filters
      });

      if (result.success && result.results) {
        for (const sourceResult of result.results) {
          addLog(`${sourceResult.source.toUpperCase()}: Sincronización completada`);
          addLog(`  - Productos recolectados: ${sourceResult.productsCollected || 0}`);
          addLog(`  - Productos con stock: ${sourceResult.productsWithStock || 0}`);
          addLog(`  - Productos sincronizados: ${sourceResult.productsSynced || 0}`);

          if (sourceResult.errors && sourceResult.errors.length > 0) {
            addLog(`  - Errores: ${sourceResult.errors.length}`);
          }

          setSyncStats(prev => ({
            ...prev!,
            status: 'success',
            productsCollected: sourceResult.productsCollected,
            productsWithStock: sourceResult.productsWithStock,
            productsSynced: sourceResult.productsSynced,
            errors: sourceResult.errors
          }));
        }
      } else {
        addLog(`ERROR: ${result.error || 'Error desconocido'}`);
        setSyncStats(prev => ({
          ...prev!,
          status: 'error',
          errors: [{ message: result.error }]
        }));
      }

      await loadRecentSyncs();
    } catch (error: any) {
      addLog(`ERROR: ${error.message}`);
      setSyncStats(prev => ({
        ...prev!,
        status: 'error',
        errors: [{ message: error.message }]
      }));
    } finally {
      setSyncing(false);
    }
  };

  const renderTabButton = (tab: SyncSource, label: string) => {
    const isActive = activeTab === tab;
    return (
      <button
        onClick={() => setActiveTab(tab)}
        disabled={syncing}
        className={`px-6 py-3 font-medium text-sm rounded-t-lg transition-colors ${
          isActive
            ? 'bg-white text-blue-600 border-t-2 border-x border-blue-600'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        } ${syncing ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {label}
      </button>
    );
  };

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <Link
                to="/admin"
                className="text-blue-600 hover:text-blue-700 font-medium mb-2 inline-flex items-center"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Volver al Dashboard
              </Link>
              <h1 className="text-4xl font-bold text-gray-900 mt-2">
                Sincronización de Productos
              </h1>
              <p className="text-gray-600 mt-2">
                Panel avanzado de sincronización con control de categorías y monitoreo en tiempo real
              </p>
            </div>
            <Link to="/admin/syscom-config">
              <Button variant="secondary" size="lg">
                <Settings className="w-5 h-5 mr-2" />
                Configurar SYSCOM
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">SYSCOM API</p>
                <p className="text-2xl font-bold text-gray-900">
                  {connectionStatus.syscom === null ? '...' : connectionStatus.syscom ? 'Activa' : 'Inactiva'}
                </p>
              </div>
              <div className={`w-3 h-3 rounded-full ${
                connectionStatus.syscom === null ? 'bg-gray-300' :
                connectionStatus.syscom ? 'bg-green-500' : 'bg-red-500'
              }`} />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">TECNOSINERGIA API</p>
                <p className="text-2xl font-bold text-gray-900">
                  {connectionStatus.tecnosinergia === null ? '...' : connectionStatus.tecnosinergia ? 'Activa' : 'Inactiva'}
                </p>
              </div>
              <div className={`w-3 h-3 rounded-full ${
                connectionStatus.tecnosinergia === null ? 'bg-gray-300' :
                connectionStatus.tecnosinergia ? 'bg-green-500' : 'bg-red-500'
              }`} />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Categorías Activas</p>
                <p className="text-2xl font-bold text-gray-900">{selectedCategoriesInfo.length}</p>
              </div>
              <Database className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rate Limit</p>
                <p className="text-2xl font-bold text-gray-900">48/min</p>
              </div>
              <Activity className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        {selectedCategoriesInfo.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <h3 className="text-sm font-medium text-blue-900 mb-2">
              Categorías seleccionadas para sincronización:
            </h3>
            <div className="flex flex-wrap gap-2">
              {selectedCategoriesInfo.map((cat) => (
                <span
                  key={cat.id}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {cat.category_name}
                </span>
              ))}
            </div>
            <p className="text-xs text-blue-700 mt-2">
              Total de {selectedCategoriesInfo.length} categorías configuradas. Puedes gestionar las categorías en "Configurar SYSCOM".
            </p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="border-b border-gray-200">
            <div className="flex gap-2 px-6 pt-4">
              {renderTabButton('syscom', 'SYSCOM')}
              {renderTabButton('tecnosinergia', 'TECNOSINERGIA')}
              {renderTabButton('all', 'Ambas APIs')}
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {activeTab === 'syscom' && 'Selección de Categorías'}
                    {activeTab === 'tecnosinergia' && 'Configuración'}
                    {activeTab === 'all' && 'Sincronización Completa'}
                  </h3>

                  {activeTab === 'all' ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                      <Database className="w-12 h-12 text-blue-600 mb-3" />
                      <h4 className="text-lg font-semibold text-blue-900 mb-2">
                        Sincronización Completa
                      </h4>
                      <p className="text-sm text-blue-800 mb-3">
                        Se sincronizarán todos los productos disponibles de ambas APIs:
                      </p>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• SYSCOM: Todas las categorías disponibles</li>
                        <li>• TECNOSINERGIA: Catálogo completo</li>
                        <li>• Rate limit: 45 peticiones/minuto por API</li>
                        <li>• Tiempo estimado: 10-20 minutos</li>
                      </ul>
                    </div>
                  ) : (
                    <CategorySelector
                      source={activeTab}
                      onSelectionChange={setSelectedCategories}
                    />
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <SyncFilters onFiltersChange={setFilters} />

                <Button
                  onClick={handleStartSync}
                  disabled={syncing || (activeTab === 'syscom' && selectedCategories.length === 0)}
                  className="w-full"
                  size="lg"
                >
                  {syncing ? (
                    <>
                      <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                      Sincronizando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-5 h-5 mr-2" />
                      Iniciar Sincronización
                    </>
                  )}
                </Button>

                {activeTab === 'syscom' && selectedCategories.length === 0 && !syncing && (
                  <p className="text-sm text-gray-500 text-center">
                    Selecciona al menos una categoría
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <SyncMonitor stats={syncStats} logs={logs} />
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">
              Sincronizaciones Recientes
            </h2>
            <Button variant="secondary" onClick={loadRecentSyncs}>
              Actualizar
            </Button>
          </div>

          {recentSyncs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Database className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>No hay sincronizaciones recientes</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Fecha
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Fuente
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Productos
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Errores
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {recentSyncs.map((sync) => (
                    <tr key={sync.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {formatDate(sync.started_at)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {sync.source}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          sync.status === 'success'
                            ? 'bg-green-100 text-green-800'
                            : sync.status === 'error'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {sync.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {sync.products_synced || 0}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {sync.errors?.length || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
