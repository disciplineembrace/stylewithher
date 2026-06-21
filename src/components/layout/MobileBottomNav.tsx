'use client'

import { useStore } from '@/store/use-store'
import { Home, Grid3X3, Heart, ShoppingCart, User } from 'lucide-react'

export default function MobileBottomNav() {
  const { navigate, user, isAuthenticated, getCartCount, wishlistIds } = useStore()
  const cartCount = getCartCount()

  const items = [
    { icon: Home, label: 'Home', page: 'home' as const },
    { icon: Grid3X3, label: 'Shop', page: 'products' as const },
    { icon: Heart, label: 'Wishlist', page: 'wishlist' as const, badge: wishlistIds.length },
    { icon: ShoppingCart, label: 'Cart', page: 'cart' as const, badge: cartCount },
    { icon: User, label: isAuthenticated ? 'Account' : 'Login', page: isAuthenticated ? 'profile' as const : 'login' as const },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-around h-16 px-2">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.page)}
              className="relative flex flex-col items-center justify-center gap-0.5 w-16 py-1 group"
            >
              <div className="relative">
                <Icon className="h-5 w-5 text-gray-500 group-hover:text-[#E91663] transition-colors" />
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 h-4 min-w-[16px] px-1 flex items-center justify-center bg-[#E91663] text-white text-[9px] font-bold rounded-full">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium text-gray-500 group-hover:text-[#E91663] transition-colors">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}