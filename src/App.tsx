import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { CartProvider } from './contexts/CartContext'
import { Header } from './components/client/Header'
import { Footer } from './components/client/Footer'
import { Home } from './pages/Home'
import { Products } from './pages/Products'
import { Cart } from './pages/Cart'
import { Checkout } from './pages/Checkout'
import { PaymentSuccess } from './pages/PaymentSuccess'
import { PaymentFailure } from './pages/PaymentFailure'
import { AdminDashboard } from './pages/AdminDashboard'
import { Loading } from './components/shared/Loading'

const ProductManager = lazy(() => import('./pages/admin/ProductManager'))
const SyncManager = lazy(() => import('./pages/admin/SyncManager'))
const SyscomConfig = lazy(() => import('./pages/admin/SyscomConfig'))
const OrdersManager = lazy(() => import('./pages/admin/OrdersManager'))
const BannerManager = lazy(() => import('./pages/admin/BannerManager'))
const BrandManager = lazy(() => import('./pages/admin/BrandManager'))
const ConfigManager = lazy(() => import('./pages/admin/ConfigManager'))
const DatabaseConfig = lazy(() => import('./pages/admin/DatabaseConfig'))

function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-1">
            <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><Loading /></div>}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/products" element={<Products />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/payment-success" element={<PaymentSuccess />} />
                <Route path="/payment-failure" element={<PaymentFailure />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/products" element={<ProductManager />} />
                <Route path="/admin/sync" element={<SyncManager />} />
                <Route path="/admin/syscom-config" element={<SyscomConfig />} />
                <Route path="/admin/orders" element={<OrdersManager />} />
                <Route path="/admin/banners" element={<BannerManager />} />
                <Route path="/admin/brands" element={<BrandManager />} />
                <Route path="/admin/settings" element={<ConfigManager />} />
                <Route path="/admin/database" element={<DatabaseConfig />} />
              </Routes>
            </Suspense>
          </main>
          <Footer />
        </div>
      </CartProvider>
    </BrowserRouter>
  )
}

export default App
