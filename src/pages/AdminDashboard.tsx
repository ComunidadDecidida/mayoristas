import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Package, RefreshCw, Settings, ShoppingBag, Image, FileText, Award, Database } from 'lucide-react'
import { LogViewer } from '../components/admin/LogViewer'
import { Button } from '../components/shared/Button'

export function AdminDashboard() {
  const [showLogs, setShowLogs] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Panel de Administración</h1>
          <Button onClick={() => setShowLogs(true)} variant="secondary">
            <FileText className="w-5 h-5 mr-2" />
            Ver Logs del Sistema
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            to="/admin/products"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Package className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Productos</h3>
                <p className="text-gray-600">Gestionar catálogo de productos</p>
              </div>
            </div>
          </Link>

          <Link
            to="/admin/sync"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <RefreshCw className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Sincronización</h3>
                <p className="text-gray-600">Sincronizar con APIs</p>
              </div>
            </div>
          </Link>

          <Link
            to="/admin/orders"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-purple-100 p-3 rounded-lg">
                <ShoppingBag className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Pedidos</h3>
                <p className="text-gray-600">Gestionar pedidos</p>
              </div>
            </div>
          </Link>

          <Link
            to="/admin/banners"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-yellow-100 p-3 rounded-lg">
                <Image className="w-8 h-8 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Banners</h3>
                <p className="text-gray-600">Gestionar banners y promociones</p>
              </div>
            </div>
          </Link>

          <Link
            to="/admin/brands"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-red-100 p-3 rounded-lg">
                <Award className="w-8 h-8 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Marcas</h3>
                <p className="text-gray-600">Gestionar marcas y logos</p>
              </div>
            </div>
          </Link>

          <Link
            to="/admin/database"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-cyan-100 p-3 rounded-lg">
                <Database className="w-8 h-8 text-cyan-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Base de Datos</h3>
                <p className="text-gray-600">Configurar conexión MySQL</p>
              </div>
            </div>
          </Link>

          <Link
            to="/admin/settings"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-gray-100 p-3 rounded-lg">
                <Settings className="w-8 h-8 text-gray-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Configuración</h3>
                <p className="text-gray-600">Ajustes del sistema</p>
              </div>
            </div>
          </Link>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Estadísticas Rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">0</div>
              <div className="text-gray-600">Productos</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">0</div>
              <div className="text-gray-600">Pedidos Hoy</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">$0</div>
              <div className="text-gray-600">Ventas Hoy</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">0</div>
              <div className="text-gray-600">Pendientes</div>
            </div>
          </div>
        </div>

        <LogViewer isOpen={showLogs} onClose={() => setShowLogs(false)} />
      </div>
    </div>
  )
}
