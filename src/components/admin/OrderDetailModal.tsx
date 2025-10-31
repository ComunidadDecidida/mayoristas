import { useState } from 'react';
import { X, Package, User, MapPin, CreditCard, FileText } from 'lucide-react';
import { Modal } from '../shared/Modal';
import { Button } from '../shared/Button';
import { Select } from '../shared/Select';
import { Textarea } from '../shared/Textarea';
import { orderService } from '../../services/orderService';

interface Order {
  id: string;
  order_number: string;
  created_at: string;
  items: any[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  currency: string;
  status: string;
  payment_method: string;
  payment_id?: string;
  payment_status?: string;
  shipping_address: any;
  billing_address?: any;
  customer_info: any;
  notes?: string;
}

interface OrderDetailModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const statusOptions = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'paid', label: 'Pagado' },
  { value: 'processing', label: 'Procesando' },
  { value: 'shipped', label: 'Enviado' },
  { value: 'delivered', label: 'Entregado' },
  { value: 'cancelled', label: 'Cancelado' },
];

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export function OrderDetailModal({
  order,
  isOpen,
  onClose,
  onUpdate,
}: OrderDetailModalProps) {
  const [status, setStatus] = useState(order.status);
  const [note, setNote] = useState('');
  const [updating, setUpdating] = useState(false);

  const handleStatusUpdate = async () => {
    if (status === order.status && !note) return;

    setUpdating(true);
    try {
      await orderService.updateOrderStatus(order.id, status, note);
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Error al actualizar el pedido');
    } finally {
      setUpdating(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: order.currency || 'MXN',
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Pedido ${order.order_number}`} size="xl">
      <div className="space-y-6">
        {/* Status Badge */}
        <div className="flex items-center justify-between">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[order.status]}`}>
            {statusOptions.find(s => s.value === order.status)?.label}
          </span>
          <span className="text-sm text-gray-500">
            {formatDate(order.created_at)}
          </span>
        </div>

        {/* Customer Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <User className="h-5 w-5 text-gray-400" />
            <h3 className="font-medium text-gray-900">Información del Cliente</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Nombre</p>
              <p className="font-medium">{order.customer_info?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-500">Email</p>
              <p className="font-medium">{order.customer_info?.email || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-500">Teléfono</p>
              <p className="font-medium">{order.customer_info?.phone || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        {order.shipping_address && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-5 w-5 text-gray-400" />
              <h3 className="font-medium text-gray-900">Dirección de Envío</h3>
            </div>
            <div className="text-sm">
              <p>{order.shipping_address.address}</p>
              <p>{order.shipping_address.city}, {order.shipping_address.state}</p>
              <p>CP: {order.shipping_address.postal_code}</p>
            </div>
          </div>
        )}

        {/* Payment Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="h-5 w-5 text-gray-400" />
            <h3 className="font-medium text-gray-900">Información de Pago</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Método de Pago</p>
              <p className="font-medium capitalize">{order.payment_method || 'N/A'}</p>
            </div>
            {order.payment_id && (
              <div>
                <p className="text-gray-500">ID de Transacción</p>
                <p className="font-medium text-xs">{order.payment_id}</p>
              </div>
            )}
            {order.payment_status && (
              <div>
                <p className="text-gray-500">Estado del Pago</p>
                <p className="font-medium capitalize">{order.payment_status}</p>
              </div>
            )}
          </div>
        </div>

        {/* Products */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Package className="h-5 w-5 text-gray-400" />
            <h3 className="font-medium text-gray-900">Productos</h3>
          </div>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Producto
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Cantidad
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Precio
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Subtotal
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {order.items?.map((item: any, index: number) => (
                  <tr key={index}>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-3">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.title}
                            className="h-10 w-10 object-cover rounded"
                          />
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{item.title}</p>
                          <p className="text-xs text-gray-500">SKU: {item.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-right">{item.quantity}</td>
                    <td className="px-4 py-3 text-sm text-right">
                      {formatCurrency(item.price)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium">
                      {formatCurrency(item.price * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">{formatCurrency(order.subtotal)}</span>
            </div>
            {order.tax > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">IVA:</span>
                <span className="font-medium">{formatCurrency(order.tax)}</span>
              </div>
            )}
            {order.shipping > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Envío:</span>
                <span className="font-medium">{formatCurrency(order.shipping)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
              <span>Total:</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-5 w-5 text-gray-400" />
              <h3 className="font-medium text-gray-900">Notas</h3>
            </div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{order.notes}</p>
          </div>
        )}

        {/* Update Status */}
        <div className="border-t border-gray-200 pt-6 space-y-4">
          <h3 className="font-medium text-gray-900">Actualizar Pedido</h3>

          <Select
            label="Estado"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={statusOptions}
          />

          <Textarea
            label="Agregar Nota (opcional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Escribe una nota sobre este cambio..."
          />

          <div className="flex gap-3">
            <Button
              onClick={handleStatusUpdate}
              disabled={updating || (status === order.status && !note)}
              className="flex-1"
            >
              {updating ? 'Actualizando...' : 'Actualizar Pedido'}
            </Button>
            <Button
              onClick={onClose}
              variant="secondary"
              className="flex-1"
            >
              Cerrar
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
