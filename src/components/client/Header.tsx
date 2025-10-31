import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, Search, ShoppingCart, User } from 'lucide-react'
import { CategoryMenu } from './CategoryMenu'
import { ExchangeRateDisplay } from './ExchangeRateDisplay'
import { CartDrawer } from './CartDrawer'
import { useCart } from '../../contexts/CartContext'

export function Header() {
  const [showCategoryMenu, setShowCategoryMenu] = useState(false)
  const [showCartDrawer, setShowCartDrawer] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { itemCount } = useCart()
  const navigate = useNavigate()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`)
      setSearchQuery('')
    }
  }

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowCategoryMenu(!showCategoryMenu)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Menu className="w-6 h-6 text-gray-700" />
            </button>

            <Link to="/" className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">
                Mayorista de Sistemas<br/>
                <span className="text-sm text-gray-600">Comunicaciones y Redes de México</span>
              </h1>
            </Link>
          </div>

          <div className="flex-1 max-w-2xl mx-8">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button type="submit" className="absolute left-3 top-2.5">
                <Search className="w-5 h-5 text-gray-400" />
              </button>
            </form>
          </div>

          <div className="flex items-center space-x-6">
            <ExchangeRateDisplay />

            <button
              onClick={() => setShowCartDrawer(true)}
              className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ShoppingCart className="w-6 h-6 text-gray-700" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </button>

            <Link to="/admin" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <User className="w-6 h-6 text-gray-700" />
            </Link>
          </div>
        </div>
      </div>

      {showCategoryMenu && (
        <CategoryMenu onClose={() => setShowCategoryMenu(false)} />
      )}

      <CartDrawer
        isOpen={showCartDrawer}
        onClose={() => setShowCartDrawer(false)}
      />
    </header>
  )
}
