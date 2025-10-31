import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useCart } from '../contexts/CartContext'
import { Button } from '../components/shared/Button'
import { Input } from '../components/shared/Input'
import { Loading } from '../components/shared/Loading'
import { PaymentMethodSelector } from '../components/checkout/PaymentMethodSelector'
import { paymentService } from '../services/paymentService'
import { supabase } from '../lib/supabase'

export function Checkout() {
  const navigate = useNavigate()
  const { items, loading, subtotal, clearCart } = useCart()
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
  })

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('')

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(price)
  }

  const tax = subtotal * 0.16
  const total = subtotal + tax

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) newErrors.name = 'El nombre es requerido'
    if (!formData.email.trim()) newErrors.email = 'El email es requerido'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email inválido'
    if (!formData.phone.trim()) newErrors.phone = 'El teléfono es requerido'
    if (!formData.address.trim()) newErrors.address = 'La dirección es requerida'
    if (!formData.city.trim()) newErrors.city = 'La ciudad es requerida'
    if (!formData.state.trim()) newErrors.state = 'El estado es requerido'
    if (!formData.zipCode.trim()) newErrors.zipCode = 'El código postal es requerido'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    if (!selectedPaymentMethod) {
      alert('Por favor selecciona un método de pago')
      return
    }

    try {
      setSubmitting(true)

      const orderNumber = `ORD-${Date.now()}`

      const { data: order, error } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          customer_info: {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
          },
          shipping_address: {
            address: formData.address,
            city: formData.city,
            state: formData.state,
            postal_code: formData.zipCode,
          },
          items: items.map(item => ({
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price || 0,
            title: item.title,
            sku: item.sku,
            image: item.image?.[0] || null,
          })),
          subtotal,
          tax,
          shipping: 0,
          total,
          currency: 'MXN',
          status: 'pending',
          payment_method: selectedPaymentMethod,
        })
        .select()
        .single()

      if (error) throw error

      const paymentRequest = {
        order_id: order.id,
        items: items.map(item => ({
          title: item.title || 'Producto',
          quantity: item.quantity,
          price: item.price || 0,
          sku: item.sku,
        })),
        total,
        currency: 'MXN',
        customer_info: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
        },
      }

      const paymentResult = await paymentService.createPayment(
        selectedPaymentMethod as 'mercadopago' | 'stripe' | 'paypal',
        paymentRequest
      )

      if (!paymentResult.success || !paymentResult.redirect_url) {
        throw new Error(paymentResult.error || 'Error al crear el pago')
      }

      await clearCart()

      window.location.href = paymentResult.redirect_url

    } catch (error) {
      console.error('Error creating order:', error)
      alert('Error al procesar el pedido. Por favor intenta nuevamente.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <Loading text="Cargando..." />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Tu carrito está vacío
            </h2>
            <Link to="/products">
              <Button>
                <ArrowLeft className="w-5 h-5 mr-2" />
                Ir a Productos
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Checkout</h1>
          <Link to="/cart">
            <Button variant="secondary">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Volver al Carrito
            </Button>
          </Link>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                  Información de Contacto
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Input
                      label="Nombre Completo"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      error={errors.name}
                      required
                    />
                  </div>
                  <Input
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    error={errors.email}
                    required
                  />
                  <Input
                    label="Teléfono"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    error={errors.phone}
                    required
                  />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                  Dirección de Envío
                </h2>
                <div className="space-y-4">
                  <Input
                    label="Dirección"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    error={errors.address}
                    required
                  />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                      label="Ciudad"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      error={errors.city}
                      required
                    />
                    <Input
                      label="Estado"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      error={errors.state}
                      required
                    />
                    <Input
                      label="Código Postal"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleChange}
                      error={errors.zipCode}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                  Método de Pago
                </h2>
                <PaymentMethodSelector
                  onSelect={setSelectedPaymentMethod}
                  selectedMethod={selectedPaymentMethod}
                />
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Resumen del Pedido
                </h2>

                <div className="space-y-4 mb-6">
                  {items.map((item) => (
                    <div key={item.product_id} className="flex gap-3">
                      <img
                        src={item.image || '/placeholder.jpg'}
                        alt={item.title}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {item.title}
                        </p>
                        <p className="text-sm text-gray-600">
                          Cantidad: {item.quantity}
                        </p>
                        <p className="text-sm font-semibold text-gray-900">
                          {formatPrice((item.price || 0) * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 pt-6 border-t">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>IVA (16%)</span>
                    <span>{formatPrice(tax)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Envío</span>
                    <span>Calculado después</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-2xl font-bold text-gray-900">
                      <span>Total</span>
                      <span>{formatPrice(total)}</span>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full mt-6"
                  disabled={submitting}
                >
                  {submitting ? 'Procesando...' : 'Confirmar Pedido'}
                </Button>

                <p className="text-xs text-gray-600 text-center mt-4">
                  Al confirmar tu pedido, aceptas nuestros términos y condiciones
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
