import { useState, useEffect } from 'react';
import { localConfigService } from '../../services/localConfigService';
import { dbClient } from '../../services/databaseClient';
import { Button } from '../../components/shared/Button';
import { Input } from '../../components/shared/Input';
import { Database, Check, X, AlertCircle, RefreshCw } from 'lucide-react';

export default function DatabaseConfig() {
  const [mode, setMode] = useState<'direct' | 'edge_function'>('edge_function');
  const [host, setHost] = useState('');
  const [port, setPort] = useState('3306');
  const [database, setDatabase] = useState('');
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [functionName, setFunctionName] = useState('mysql_bd_mayorista');
  const [isEnabled, setIsEnabled] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    loadConfig();
    checkConnectionStatus();
  }, []);

  const loadConfig = async () => {
    const config = await localConfigService.loadConfig();

    if (config.database) {
      setMode(config.database.mode);
      setIsEnabled(config.database.enabled);

      if (config.database.connection) {
        setHost(config.database.connection.host);
        setPort(config.database.connection.port.toString());
        setDatabase(config.database.connection.database);
        setUser(config.database.connection.user);
        setPassword(config.database.connection.password);
      }

      if (config.database.edgeFunction) {
        setFunctionName(config.database.edgeFunction.functionName);
      }
    }
  };

  const checkConnectionStatus = async () => {
    const status = dbClient.getConnectionStatus();
    setConnectionStatus(status);
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const tempConfig = {
        database: {
          enabled: true,
          mode,
          connection: {
            host,
            port: parseInt(port),
            database,
            user,
            password,
          },
          edgeFunction: {
            enabled: mode === 'edge_function',
            functionName,
          },
        },
      };

      localConfigService.updateConfig(tempConfig);

      const result = await dbClient.checkConnection();

      if (result) {
        setTestResult({
          success: true,
          message: 'Conexión exitosa a la base de datos',
        });
        setConnectionStatus('connected');
      } else {
        setTestResult({
          success: false,
          message: 'No se pudo conectar a la base de datos. Verifica tus credenciales.',
        });
        setConnectionStatus('error');
      }
    } catch (error: any) {
      setTestResult({
        success: false,
        message: `Error: ${error.message}`,
      });
      setConnectionStatus('error');
    } finally {
      setTesting(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);

    try {
      const config = {
        database: {
          enabled: isEnabled,
          mode,
          connection: {
            host,
            port: parseInt(port),
            database,
            user,
            password,
          },
          edgeFunction: {
            enabled: mode === 'edge_function',
            functionName,
          },
        },
      };

      localConfigService.updateConfig(config);

      setTestResult({
        success: true,
        message: 'Configuración guardada correctamente',
      });

      if (isEnabled) {
        await dbClient.checkConnection();
      }
    } catch (error: any) {
      setTestResult({
        success: false,
        message: `Error al guardar: ${error.message}`,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-3 mb-6">
          <Database className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Configuración de Base de Datos
            </h1>
            <p className="text-sm text-gray-600">
              Configura la conexión a tu base de datos MySQL
            </p>
          </div>
        </div>

        <div className="mb-6 p-4 bg-gray-50 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${
                connectionStatus === 'connected'
                  ? 'bg-green-500'
                  : connectionStatus === 'error'
                  ? 'bg-red-500'
                  : 'bg-gray-400'
              }`}
            />
            <span className="text-sm font-medium text-gray-700">
              {connectionStatus === 'connected'
                ? 'Conectado'
                : connectionStatus === 'error'
                ? 'Error de conexión'
                : 'Desconectado'}
            </span>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={checkConnectionStatus}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Verificar Estado
          </Button>
        </div>

        <div className="mb-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={(e) => setIsEnabled(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Habilitar conexión a base de datos
            </span>
          </label>
          <p className="text-xs text-gray-500 mt-1 ml-6">
            Si está deshabilitado, la aplicación funcionará en modo offline con caché local
          </p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Modo de Conexión
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setMode('edge_function')}
              className={`p-4 border-2 rounded-lg text-left transition-colors ${
                mode === 'edge_function'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    mode === 'edge_function'
                      ? 'border-blue-600'
                      : 'border-gray-300'
                  }`}
                >
                  {mode === 'edge_function' && (
                    <div className="w-3 h-3 rounded-full bg-blue-600" />
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Edge Function (Recomendado)</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Conexión segura a través de Supabase Edge Function. Mantiene las credenciales ocultas y seguras.
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setMode('direct')}
              className={`p-4 border-2 rounded-lg text-left transition-colors ${
                mode === 'direct'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    mode === 'direct' ? 'border-blue-600' : 'border-gray-300'
                  }`}
                >
                  {mode === 'direct' && (
                    <div className="w-3 h-3 rounded-full bg-blue-600" />
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Conexión Directa</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Conexión directa desde el navegador. No recomendado para producción.
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {mode === 'edge_function' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre de Edge Function
            </label>
            <Input
              type="text"
              value={functionName}
              onChange={(e) => setFunctionName(e.target.value)}
              placeholder="mysql_bd_mayorista"
              disabled={!isEnabled}
            />
            <p className="text-xs text-gray-500 mt-1">
              La Edge Function debe estar configurada en Supabase con las credenciales de MySQL
            </p>
          </div>
        )}

        {mode === 'direct' && (
          <div className="space-y-4 mb-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Advertencia de Seguridad</p>
                <p>
                  La conexión directa expone las credenciales de tu base de datos en el navegador.
                  Solo usa este modo en desarrollo o entornos controlados.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Host
                </label>
                <Input
                  type="text"
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  placeholder="162.241.2.158"
                  disabled={!isEnabled}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Puerto
                </label>
                <Input
                  type="text"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  placeholder="3306"
                  disabled={!isEnabled}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de la Base de Datos
              </label>
              <Input
                type="text"
                value={database}
                onChange={(e) => setDatabase(e.target.value)}
                placeholder="jonat104_mayorista_de_sistemas"
                disabled={!isEnabled}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Usuario
                </label>
                <Input
                  type="text"
                  value={user}
                  onChange={(e) => setUser(e.target.value)}
                  placeholder="usuario_mysql"
                  disabled={!isEnabled}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={!isEnabled}
                />
              </div>
            </div>
          </div>
        )}

        {testResult && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
              testResult.success
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            {testResult.success ? (
              <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <X className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <p
              className={`text-sm ${
                testResult.success ? 'text-green-800' : 'text-red-800'
              }`}
            >
              {testResult.message}
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <Button
            onClick={testConnection}
            disabled={!isEnabled || testing}
            variant="secondary"
            className="flex-1"
          >
            {testing ? 'Probando...' : 'Probar Conexión'}
          </Button>

          <Button
            onClick={saveConfig}
            disabled={saving}
            className="flex-1"
          >
            {saving ? 'Guardando...' : 'Guardar Configuración'}
          </Button>
        </div>
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">Información Importante</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>La configuración se guarda localmente en tu navegador</li>
          <li>Si usas Edge Function, las credenciales se almacenan de forma segura en Supabase</li>
          <li>En modo offline, puedes consultar productos desde el caché local</li>
          <li>Las operaciones de escritura (crear pedidos, etc.) requieren conexión activa</li>
        </ul>
      </div>
    </div>
  );
}
