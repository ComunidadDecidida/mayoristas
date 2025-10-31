import { Link, useSearchParams } from 'react-router-dom';
import { XCircle, Home, ShoppingCart, RefreshCw } from 'lucide-react';
import { Button } from '../components/shared/Button';

export function PaymentFailure() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id');

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Error Header */}
          <div className="bg-red-50 border-b border-red-100 p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <XCircle className="h-10 w-10 text-red-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Pago No Completado
            </h1>
            <p className="text-lg text-gray-600">
              Hubo un problema al procesar tu pago
            </p>
          </div>

          {/* Details */}
          <div className="p-8 space-y-6">
            <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-yellow-900 mb-3">
                ¿Qué pasó?
              </h3>
              <ul className="space-y-2 text-sm text-yellow-800">
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600">•</span>
                  <span>El pago fue cancelado o rechazado</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600">•</span>
                  <span>Puede haber un problema con tu método de pago</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600">•</span>
                  <span>La sesión de pago puede haber expirado</span>
                </li>
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">
                ¿Qué puedes hacer?
              </h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start gap-2">
                  <RefreshCw className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <span>Verifica la información de tu método de pago</span>
                </li>
                <li className="flex items-start gap-2">
                  <ShoppingCart className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <span>Regresa a tu carrito e intenta nuevamente</span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <span>Prueba con un método de pago diferente</span>
                </li>
              </ul>
            </div>

            {orderId && (
              <div className="text-center text-sm text-gray-500">
                <p>ID de referencia: {orderId}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Link to="/" className="flex-1">
                <Button variant="secondary" className="w-full">
                  <Home className="h-4 w-4 mr-2" />
                  Volver al Inicio
                </Button>
              </Link>
              <Link to="/cart" className="flex-1">
                <Button className="w-full">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Volver al Carrito
                </Button>
              </Link>
            </div>

            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-2">
                ¿Necesitas ayuda?
              </p>
              <p className="text-sm text-gray-500">
                Contáctanos si el problema persiste
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
