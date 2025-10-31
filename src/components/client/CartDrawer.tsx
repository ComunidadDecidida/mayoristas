import { X, Minus, Plus, Trash2, ShoppingCart } from 'lucide-react'
import { useCart } from '../../contexts/CartContext'
import { Button } from '../shared/Button'
import { Loading } from '../shared/Loading'
import { Link } from 'react-router-dom'

interface CartDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { items, loading, itemCount, subtotal, updateQuantity, removeItem } = useCart()

  if (!isOpen) return null

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(price)
  }

  const tax = subtotal * 0.16
  const total = subtotal + tax

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-6 h-6" />
            <h2 className="text-2xl font-semibold">Carrito de Compras</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {loading ? (
          <Loading text="Cargando carrito..." />
        ) : itemCount === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <ShoppingCart className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Tu carrito está vacío
            </h3>
            <p className="text-gray-600 mb-6">
              Agrega productos para comenzar tu compra
            </p>
            <Button onClick={onClose}>Continuar Comprando</Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.product_id}
                    className="flex gap-4 p-4 border rounded-lg"
                  >
                    <img
                      src={item.image || 'https://via.placeholder.com/150?text=No+Image'}
                      alt={item.title}
                      className="w-20 h-20 object-cover rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=No+Image'
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {item.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        SKU: {item.sku}
                      </p>
                      <p className="text-sm text-blue-600 font-semibold mt-1">
                        {formatPrice(item.price)}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                          className="p-1 rounded hover:bg-gray-100"
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-medium">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                          className="p-1 rounded hover:bg-gray-100"
                          disabled={false}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeItem(item.product_id)}
                          className="ml-auto p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        Subtotal: {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t p-6 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({itemCount} productos)</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>IVA (16%)</span>
                  <span>{formatPrice(tax)}</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              <Link to="/cart" onClick={onClose}>
                <Button variant="secondary" className="w-full mb-2">
                  Ver Carrito Completo
                </Button>
              </Link>
              <Link to="/checkout" onClick={onClose}>
                <Button className="w-full">
                  Proceder al Pago
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </>
  )
}
