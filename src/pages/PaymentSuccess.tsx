import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, Package, Home, FileText } from 'lucide-react';
import { Button } from '../components/shared/Button';
import { Loading } from '../components/shared/Loading';
import { supabase } from '../lib/supabase';

export function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);

  const orderId = searchParams.get('order_id');

  useEffect(() => {
    if (orderId) {
      loadOrder();
    } else {
      setLoading(false);
    }
  }, [orderId]);

  const loadOrder = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (error) throw error;
      setOrder(data);
    } catch (error) {
      console.error('Error loading order:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading text="Verificando tu pago..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Success Header */}
          <div className="bg-green-50 border-b border-green-100 p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              ¡Pago Exitoso!
            </h1>
            <p className="text-lg text-gray-600">
              Tu pedido ha sido confirmado y está siendo procesado
            </p>
          </div>

          {/* Order Details */}
          {order && (
            <div className="p-8 space-y-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Detalles del Pedido
                  </h2>
                  <span className="text-sm font-medium text-gray-500">
                    #{order.order_number}
                  </span>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estado:</span>
                    <span className="font-medium text-green-600">Confirmado</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fecha:</span>
                    <span className="font-medium text-gray-900">
                      {new Date(order.created_at).toLocaleDateString('es-MX', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Método de pago:</span>
                    <span className="font-medium text-gray-900 capitalize">
                      {order.payment_method}
                    </span>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-gray-200">
                    <span className="text-gray-900 font-semibold">Total:</span>
                    <span className="text-xl font-bold text-gray-900">
                      {formatCurrency(order.total)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              {order.customer_info && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Información de Contacto
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                    <p>
                      <span className="text-gray-600">Nombre:</span>{' '}
                      <span className="font-medium">{order.customer_info.name}</span>
                    </p>
                    <p>
                      <span className="text-gray-600">Email:</span>{' '}
                      <span className="font-medium">{order.customer_info.email}</span>
                    </p>
                    {order.customer_info.phone && (
                      <p>
                        <span className="text-gray-600">Teléfono:</span>{' '}
                        <span className="font-medium">{order.customer_info.phone}</span>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Next Steps */}
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">
                  ¿Qué sigue?
                </h3>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <span>Recibirás un correo de confirmación con los detalles de tu pedido</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Package className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <span>Procesaremos tu pedido en las próximas 24-48 horas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FileText className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <span>Te notificaremos cuando tu pedido sea enviado</span>
                  </li>
                </ul>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Link to="/" className="flex-1">
                  <Button variant="secondary" className="w-full">
                    <Home className="h-4 w-4 mr-2" />
                    Volver al Inicio
                  </Button>
                </Link>
                <Link to="/products" className="flex-1">
                  <Button className="w-full">
                    <Package className="h-4 w-4 mr-2" />
                    Ver Más Productos
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {!order && (
            <div className="p-8 text-center">
              <p className="text-gray-600 mb-4">
                No se encontró información del pedido
              </p>
              <Link to="/">
                <Button>
                  <Home className="h-4 w-4 mr-2" />
                  Volver al Inicio
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
