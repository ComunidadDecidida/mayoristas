import { useState, useEffect } from 'react';
import { CreditCard, CheckCircle } from 'lucide-react';
import { paymentService, PaymentMethod } from '../../services/paymentService';
import { Loading } from '../shared/Loading';

interface PaymentMethodSelectorProps {
  onSelect: (methodId: string) => void;
  selectedMethod?: string;
}

export function PaymentMethodSelector({ onSelect, selectedMethod }: PaymentMethodSelectorProps) {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    setLoading(true);
    try {
      const availableMethods = await paymentService.getAvailablePaymentMethods();
      setMethods(availableMethods);

      if (availableMethods.length > 0 && !selectedMethod) {
        onSelect(availableMethods[0].id);
      }
    } catch (error) {
      console.error('Error loading payment methods:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-8">
        <Loading text="Cargando métodos de pago..." />
      </div>
    );
  }

  if (methods.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <CreditCard className="h-12 w-12 text-yellow-600 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-yellow-900 mb-2">
          No hay métodos de pago disponibles
        </h3>
        <p className="text-sm text-yellow-700">
          Por favor, contacta al administrador para configurar las pasarelas de pago
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700 mb-3">
        Selecciona un método de pago
      </label>

      {methods.map((method) => (
        <button
          key={method.id}
          type="button"
          onClick={() => onSelect(method.id)}
          className={`w-full flex items-center justify-between p-4 border-2 rounded-lg transition-all ${
            selectedMethod === method.id
              ? 'border-blue-600 bg-blue-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded border border-gray-200 flex items-center justify-center overflow-hidden">
              <CreditCard className="h-6 w-6 text-gray-600" />
            </div>
            <div className="text-left">
              <h4 className="font-medium text-gray-900">{method.name}</h4>
              <p className="text-sm text-gray-500">Pago seguro</p>
            </div>
          </div>

          {selectedMethod === method.id && (
            <CheckCircle className="h-6 w-6 text-blue-600" />
          )}
        </button>
      ))}

      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-start gap-2">
          <CreditCard className="h-5 w-5 text-gray-400 mt-0.5" />
          <div className="text-sm text-gray-600">
            <p className="font-medium mb-1">Pago 100% seguro</p>
            <p>
              Tu información está protegida con encriptación SSL. No almacenamos datos de tarjetas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
