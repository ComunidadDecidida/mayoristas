import { useEffect, useRef } from 'react';
import { CheckCircle, XCircle, AlertCircle, Activity, Clock, Package, TrendingUp } from 'lucide-react';

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

interface SyncMonitorProps {
  stats: SyncStats | null;
  logs: string[];
}

export default function SyncMonitor({ stats, logs }: SyncMonitorProps) {
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const getStatusIcon = () => {
    if (!stats) return null;

    switch (stats.status) {
      case 'running':
        return <Activity className="w-5 h-5 text-blue-600 animate-pulse" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = () => {
    if (!stats) return null;

    const badges = {
      running: 'bg-blue-100 text-blue-800',
      success: 'bg-green-100 text-green-800',
      error: 'bg-red-100 text-red-800',
      idle: 'bg-gray-100 text-gray-800'
    };

    const labels = {
      running: 'En progreso',
      success: 'Completado',
      error: 'Error',
      idle: 'Inactivo'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${badges[stats.status]}`}>
        {labels[stats.status]}
      </span>
    );
  };

  const calculateProgress = () => {
    if (!stats || !stats.productsCollected) return 0;

    if (stats.categoriesProcessed && stats.totalCategories) {
      return Math.round((stats.categoriesProcessed / stats.totalCategories) * 100);
    }

    if (stats.productsWithStock && stats.productsSynced) {
      return Math.round((stats.productsSynced / stats.productsWithStock) * 100);
    }

    return 0;
  };

  const calculateElapsedTime = () => {
    if (!stats || !stats.startTime) return '0:00';

    const elapsed = Math.floor((Date.now() - stats.startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const calculateSpeed = () => {
    if (!stats || !stats.startTime || !stats.productsSynced) return '0';

    const elapsed = (Date.now() - stats.startTime) / 1000 / 60;
    const speed = stats.productsSynced / elapsed;

    return speed.toFixed(1);
  };

  const progress = calculateProgress();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Monitor de Sincronización
            </h3>
            {stats?.source && (
              <p className="text-sm text-gray-600">
                Fuente: {stats.source.toUpperCase()}
              </p>
            )}
          </div>
        </div>
        {getStatusBadge()}
      </div>

      {stats && stats.status !== 'idle' && (
        <>
          <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Progreso General</span>
                <span className="text-sm font-semibold text-gray-900">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {stats.currentCategory && (
              <div className="text-sm text-gray-600">
                Procesando: <span className="font-medium">{stats.currentCategory}</span>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-gray-500">
                  <Package className="w-4 h-4" />
                  <span className="text-xs">Recolectados</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.productsCollected || 0}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-gray-500">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-xs">Con Stock</span>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {stats.productsWithStock || 0}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-gray-500">
                  <Activity className="w-4 h-4" />
                  <span className="text-xs">Sincronizados</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.productsSynced || 0}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-gray-500">
                  <XCircle className="w-4 h-4" />
                  <span className="text-xs">Errores</span>
                </div>
                <p className="text-2xl font-bold text-red-600">
                  {stats.errors?.length || 0}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Tiempo transcurrido</p>
                  <p className="text-sm font-semibold text-gray-900">{calculateElapsedTime()}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Velocidad</p>
                  <p className="text-sm font-semibold text-gray-900">{calculateSpeed()} prod/min</p>
                </div>
              </div>

              {stats.requestsInWindow !== undefined && stats.maxRequests && (
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">Rate Limit</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {stats.requestsInWindow}/{stats.maxRequests}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h4 className="text-sm font-semibold text-gray-900">Log de Actividad</h4>
            </div>
            <div className="p-4 max-h-64 overflow-y-auto font-mono text-xs space-y-1">
              {logs.length === 0 ? (
                <p className="text-gray-500">Sin actividad aún...</p>
              ) : (
                logs.map((log, index) => (
                  <div
                    key={index}
                    className={`py-1 ${
                      log.includes('ERROR') || log.includes('Error')
                        ? 'text-red-600'
                        : log.includes('SUCCESS') || log.includes('completado')
                        ? 'text-green-600'
                        : log.includes('WARN')
                        ? 'text-yellow-600'
                        : 'text-gray-700'
                    }`}
                  >
                    {log}
                  </div>
                ))
              )}
              <div ref={logsEndRef} />
            </div>
          </div>
        </>
      )}

      {(!stats || stats.status === 'idle') && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">
            Selecciona una fuente y categorías para iniciar la sincronización
          </p>
        </div>
      )}
    </div>
  );
}
