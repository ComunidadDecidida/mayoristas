import { Link } from 'react-router-dom'
import { Minus, Plus, Trash2, ShoppingCart, ArrowLeft } from 'lucide-react'
import { useCart } from '../contexts/CartContext'
import { Button } from '../components/shared/Button'
import { Loading } from '../components/shared/Loading'

export function Cart() {
  const { items, loading, itemCount, subtotal, updateQuantity, removeItem, clearCart } = useCart()

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(price)
  }

  const tax = subtotal * 0.16
  const total = subtotal + tax

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <Loading text="Cargando carrito..." />
      </div>
    )
  }

  if (itemCount === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <ShoppingCart className="w-24 h-24 text-gray-300 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Tu carrito está vacío
            </h2>
            <p className="text-gray-600 mb-8">
              Agrega productos para comenzar tu compra
            </p>
            <Link to="/products">
              <Button>
                <ArrowLeft className="w-5 h-5 mr-2" />
                Continuar Comprando
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
          <h1 className="text-4xl font-bold text-gray-900">Carrito de Compras</h1>
          <Link to="/products">
            <Button variant="secondary">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Continuar Comprando
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Productos ({itemCount})
                  </h2>
                  <button
                    onClick={clearCart}
                    className="text-red-600 hover:text-red-700 font-medium text-sm"
                  >
                    Vaciar Carrito
                  </button>
                </div>
              </div>

              <div className="divide-y">
                {items.map((item) => (
                  <div
                    key={item.product_id}
                    className="p-6 flex gap-6"
                  >
                    <img
                      src={item.image || 'https://via.placeholder.com/150?text=No+Image'}
                      alt={item.title}
                      className="w-32 h-32 object-cover rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=No+Image'
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {item.title}
                      </h3>
                      <p className="text-sm text-gray-500 mb-4">
                        SKU: {item.sku}
                      </p>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3 border rounded-lg p-2">
                          <button
                            onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                            className="p-1 rounded hover:bg-gray-100"
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-12 text-center font-medium">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                            className="p-1 rounded hover:bg-gray-100"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <button
                          onClick={() => removeItem(item.product_id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600 mb-2">Precio unitario</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatPrice(item.price)}
                      </p>
                      <p className="text-sm text-gray-600 mt-4">Subtotal</p>
                      <p className="text-xl font-bold text-blue-600">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Resumen del Pedido
              </h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>IVA (16%)</span>
                  <span>{formatPrice(tax)}</span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between text-2xl font-bold text-gray-900">
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>
              </div>

              <Link to="/checkout">
                <Button className="w-full mb-4">
                  Proceder al Pago
                </Button>
              </Link>

              <div className="text-sm text-gray-600 text-center">
                <p>Envío calculado en el checkout</p>
              </div>

              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Aceptamos
                </h3>
                <div className="flex gap-2">
                  <div className="px-3 py-2 border rounded text-xs font-medium">
                    VISA
                  </div>
                  <div className="px-3 py-2 border rounded text-xs font-medium">
                    MasterCard
                  </div>
                  <div className="px-3 py-2 border rounded text-xs font-medium">
                    PayPal
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
