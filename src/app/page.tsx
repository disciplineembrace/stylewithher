'use client'

import { useEffect, useState } from 'react'
import { useStore } from '@/store/use-store'
import { useLanguage } from '@/i18n/use-language'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import MobileBottomNav from '@/components/layout/MobileBottomNav'
import HomePage from '@/components/home/HomePage'
import ProductListing from '@/components/products/ProductListing'
import ProductDetailPage from '@/components/products/ProductDetailPage'
import { CartPage } from '@/components/cart/CartPage'
import { WishlistPage } from '@/components/wishlist/WishlistPage'
import CheckoutPage from '@/components/checkout/CheckoutPage'
import { OrdersListPage, OrderDetailPage } from '@/components/orders/OrdersPage'
import { LoginPage, SignupPage, ProfilePage, ForgotPasswordPage } from '@/components/auth/AuthPages'
import AdminPanel from '@/components/admin/AdminPanel'
import SplashScreen from '@/components/splash/SplashScreen'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'

function Toast() {
  const { toastMessage, toastType, clearToast } = useStore()
  if (!toastMessage) return null

  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-[#0B1F3A]',
  }
  const icons = {
    success: <CheckCircle className="h-5 w-5" />,
    error: <AlertCircle className="h-5 w-5" />,
    info: <Info className="h-5 w-5" />,
  }

  return (
    <div className="fixed top-24 right-4 z-[100] animate-slideIn">
      <div className={`${colors[toastType]} text-white px-5 py-3 rounded-lg shadow-xl flex items-center gap-3 max-w-sm`}>
        {icons[toastType]}
        <p className="text-sm font-medium">{toastMessage}</p>
        <button onClick={clearToast} className="ml-2 hover:opacity-70"><X className="h-4 w-4" /></button>
      </div>
    </div>
  )
}

function PageRouter() {
  const { currentPage, user, isAuthenticated } = useStore()

  // Load cart and wishlist on auth
  useEffect(() => {
    if (isAuthenticated && user?.token) {
      fetch('/api/cart', { headers: { 'Authorization': `Bearer ${user.token}` } })
        .then(r => r.json()).then(data => { if (data.cart) useStore.getState().setCart(data.cart) }).catch(() => {})
      fetch('/api/wishlist', { headers: { 'Authorization': `Bearer ${user.token}` } })
        .then(r => r.json()).then(data => { if (data.wishlist) useStore.getState().setWishlistIds(data.wishlist.map((w: { productId: string }) => w.productId)) }).catch(() => {})
    }
  }, [isAuthenticated, user?.token])

  // Admin guard
  if (currentPage === 'admin' || currentPage.startsWith('admin-')) {
    if (!isAuthenticated || user?.role !== 'admin') {
      return (
        <div className="min-h-screen bg-[#FFF5F7] flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-[#0B1F3A] mb-2">Access Denied</h1>
            <p className="text-[#666666] mb-4">You need admin privileges to access this page.</p>
            <button onClick={() => useStore.getState().navigate('login')} className="bg-[#0B1F3A] text-white px-6 py-2 rounded-lg hover:bg-[#0B1F3A]/90">Login as Admin</button>
          </div>
        </div>
      )
    }
    return <AdminPanel />
  }

  switch (currentPage) {
    case 'home': return <HomePage />
    case 'products': return <ProductListing />
    case 'product-detail': return <ProductDetailPage />
    case 'cart': return <CartPage />
    case 'wishlist': return <WishlistPage />
    case 'checkout': return <CheckoutPage />
    case 'orders': return <OrdersListPage />
    case 'order-detail': return <OrderDetailPage />
    case 'login': return <LoginPage />
    case 'signup': return <SignupPage />
    case 'profile': return <ProfilePage />
    case 'forgot-password': return <ForgotPasswordPage />
    default: return <HomePage />
  }
}

export default function App() {
  const [showSplash, setShowSplash] = useState(false)
  const init = useLanguage((s) => s.init)

  useEffect(() => {
    // Check if user has already selected a language
    const saved = localStorage.getItem('stylewithher-locale')
    if (saved && (saved === 'en' || saved === 'hi' || saved === 'gu')) {
      init() // just set the saved locale
    } else {
      setShowSplash(true)
      init() // initialize with default 'en' first
    }
  }, [init])

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {showSplash && <SplashScreen />}
      <Header />
      <main className="flex-1 pb-16 lg:pb-0">
        <PageRouter />
      </main>
      <Footer />
      <MobileBottomNav />
      <Toast />
    </div>
  )
}