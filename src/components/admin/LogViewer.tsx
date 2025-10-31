import { useState, useEffect } from 'react';
import { X, RefreshCw, AlertCircle, CheckCircle, Info, XCircle, Trash2, Eye, EyeOff } from 'lucide-react';
import { logService, ApiSyncLog } from '../../services/logService';
import { Button } from '../shared/Button';

interface LogViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LogViewer({ isOpen, onClose }: LogViewerProps) {
  const [logs, setLogs] = useState<ApiSyncLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'syscom' | 'tecnosinergia' | 'errors'>('all');
  const [stats, setStats] = useState<any>(null);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadLogs();
      loadStats();
    }
  }, [isOpen, filter]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      let data;
      if (filter === 'errors') {
        data = await logService.getErrorLogs(100);
      } else if (filter === 'all') {
        data = await logService.getSyncLogs(undefined, 100);
      } else {
        data = await logService.getSyncLogs(filter, 100);
      }
      setLogs(data);
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    const stats = await logService.getLogStats();
    setStats(stats);
  };

  const handleClearOldLogs = async () => {
    if (!confirm('¿Eliminar logs de más de 30 días?')) return;

    const result = await logService.clearOldLogs(30);
    if (result.success) {
      alert('Logs antiguos eliminados');
      loadLogs();
      loadStats();
    } else {
      alert('Error al eliminar logs');
    }
  };

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date(date));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'running':
        return <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />;
      default:
        return <Info className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const classes = {
      success: 'bg-green-100 text-green-800',
      error: 'bg-red-100 text-red-800',
      running: 'bg-blue-100 text-blue-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${classes[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex">
      <div className="ml-auto w-full max-w-4xl bg-white h-full overflow-hidden flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Logs del Sistema</h2>
            <p className="text-sm text-gray-600">Historial de sincronizaciones y errores</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {stats && (
          <div className="p-4 bg-blue-50 border-b">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <div className="text-xs text-gray-600 uppercase">Total Syncs</div>
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              </div>
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <div className="text-xs text-green-600 uppercase">Success</div>
                <div className="text-2xl font-bold text-green-600">{stats.success}</div>
              </div>
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <div className="text-xs text-red-600 uppercase">Errors</div>
                <div className="text-2xl font-bold text-red-600">{stats.errors}</div>
              </div>
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <div className="text-xs text-blue-600 uppercase">Products</div>
                <div className="text-2xl font-bold text-blue-600">{stats.totalProductsSynced}</div>
              </div>
            </div>
          </div>
        )}

        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setFilter('syscom')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'syscom' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                SYSCOM
              </button>
              <button
                onClick={() => setFilter('tecnosinergia')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'tecnosinergia' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                TECNOSINERGIA
              </button>
              <button
                onClick={() => setFilter('errors')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'errors' ? 'bg-red-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                Errores
              </button>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={loadLogs} disabled={loading}>
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button variant="secondary" onClick={handleClearOldLogs}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <AlertCircle className="w-12 h-12 mb-4 text-gray-400" />
              <p>No hay logs disponibles</p>
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      {getStatusIcon(log.status)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900 uppercase text-sm">
                            {log.source}
                          </span>
                          {getStatusBadge(log.status)}
                          <span className="text-xs text-gray-500">
                            {log.sync_type}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">{log.products_synced || 0}</span> productos sincronizados
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {formatDate(log.created_at)}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      {expandedLog === log.id ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {expandedLog === log.id && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="space-y-3">
                        <div>
                          <div className="text-xs font-semibold text-gray-600 uppercase mb-1">
                            Timing
                          </div>
                          <div className="text-sm text-gray-700 space-y-1">
                            <div>Iniciado: {formatDate(log.started_at)}</div>
                            {log.completed_at && (
                              <div>Completado: {formatDate(log.completed_at)}</div>
                            )}
                          </div>
                        </div>

                        {log.errors && log.errors.length > 0 && (
                          <div>
                            <div className="text-xs font-semibold text-red-600 uppercase mb-1">
                              Errores ({log.errors.length})
                            </div>
                            <div className="bg-red-50 rounded-lg p-3 max-h-48 overflow-y-auto">
                              {log.errors.map((error, idx) => (
                                <div key={idx} className="text-sm text-red-800 mb-2 last:mb-0">
                                  {error.message || JSON.stringify(error)}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div>
                          <div className="text-xs font-semibold text-gray-600 uppercase mb-1">
                            ID del Log
                          </div>
                          <div className="text-xs text-gray-500 font-mono bg-gray-50 p-2 rounded">
                            {log.id}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
