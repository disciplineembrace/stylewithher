import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Types
export type PageRoute =
  | 'home'
  | 'products'
  | 'product-detail'
  | 'cart'
  | 'wishlist'
  | 'checkout'
  | 'orders'
  | 'order-detail'
  | 'profile'
  | 'login'
  | 'signup'
  | 'forgot-password'
  | 'admin'
  | 'admin-products'
  | 'admin-orders'
  | 'admin-customers'
  | 'admin-coupons'
  | 'admin-reviews'
  | 'admin-content'
  | 'admin-inventory'
  | 'about'
  | 'contact'

export interface UserData {
  userId: string
  email: string
  role: string
  token: string
}

export interface CartItemData {
  id: string
  productId: string
  variantId: string | null
  quantity: number
  product: {
    id: string
    name: string
    slug: string
    basePrice: number
    salePrice: number | null
    images: { id: string; url: string; alt: string }[]
    variants: { id: string; color: string; size: string; sku: string; price: number | null }[]
  }
}

export interface ProductData {
  id: string
  name: string
  slug: string
  description: string | null
  basePrice: number
  salePrice: number | null
  categoryId: string
  gender: string
  isFeatured: boolean
  isTrending: boolean
  isNewArrival: boolean
  isBestSeller: boolean
  isActive: boolean
  avgRating: number
  reviewCount: number
  totalSold: number
  material: string | null
  care: string | null
  category: { id: string; name: string; slug: string }
  images: { id: string; url: string; alt: string }[]
  variants: { id: string; color: string; size: string; sku: string; price: number | null; inventory?: { quantity: number; lowStock: number } | null }[]
  reviews?: ReviewData[]
}

export interface ReviewData {
  id: string
  rating: number
  title: string | null
  comment: string | null
  isApproved: boolean
  createdAt: string
  user: { id: string; name: string }
}

export interface OrderData {
  id: string
  orderNumber: string
  status: string
  paymentMethod: string
  paymentStatus: string
  subtotal: number
  discount: number
  tax: number
  shipping: number
  total: number
  createdAt: string
  trackingNumber: string | null
  shippedAt: string | null
  deliveredAt: string | null
  items: {
    id: string
    productName: string
    productImage: string | null
    color: string | null
    size: string | null
    quantity: number
    price: number
    productId: string
  }[]
  address?: {
    fullName: string
    phone: string
    addressLine1: string
    addressLine2: string | null
    city: string
    state: string
    pincode: string
  } | null
}

export interface CategoryData {
  id: string
  name: string
  slug: string
  description: string | null
  gender: string
  image: string | null
  _count?: { products: number }
}

export interface AddressData {
  id: string
  label: string | null
  fullName: string
  phone: string
  addressLine1: string
  addressLine2: string | null
  city: string
  state: string
  pincode: string
  country: string
  isDefault: boolean
}

// Store interface
interface AppStore {
  // Router
  currentPage: PageRoute
  pageParams: Record<string, string>
  navigate: (page: PageRoute, params?: Record<string, string>) => void
  previousPage: PageRoute | null

  // Auth
  user: UserData | null
  setUser: (user: UserData | null) => void
  isAuthenticated: boolean

  // Cart
  cart: CartItemData[]
  cartLoading: boolean
  setCart: (cart: CartItemData[]) => void
  addToCartOptimistic: (item: CartItemData) => void
  removeFromCartOptimistic: (itemId: string) => void
  updateCartQuantityOptimistic: (itemId: string, quantity: number) => void
  getCartCount: () => number
  getCartTotal: () => number

  // Wishlist
  wishlistIds: string[]
  setWishlistIds: (ids: string[]) => void
  toggleWishlist: (productId: string) => void
  isInWishlist: (productId: string) => boolean

  // UI
  searchQuery: string
  setSearchQuery: (q: string) => void
  mobileMenuOpen: boolean
  setMobileMenuOpen: (open: boolean) => void
  toastMessage: string | null
  toastType: 'success' | 'error' | 'info'
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void
  clearToast: () => void

  // Admin
  adminTab: string
  setAdminTab: (tab: string) => void
}

export const useStore = create<AppStore>()(
  persist(
    (set, get) => ({
      currentPage: 'home' as PageRoute,
      pageParams: {},
      previousPage: null,
      navigate: (page, params = {}) => {
        set((s) => ({ previousPage: s.currentPage, currentPage: page, pageParams: params }))
        window.scrollTo({ top: 0, behavior: 'smooth' })
      },

      user: null,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      isAuthenticated: false,

      cart: [],
      cartLoading: false,
      setCart: (cart) => set({ cart }),
      addToCartOptimistic: (item) => set((s) => {
        const existing = s.cart.find(c => c.productId === item.productId && c.variantId === item.variantId)
        if (existing) {
          return { cart: s.cart.map(c => c.id === existing.id ? { ...c, quantity: c.quantity + item.quantity } : c) }
        }
        return { cart: [...s.cart, item] }
      }),
      removeFromCartOptimistic: (itemId) => set((s) => ({ cart: s.cart.filter(c => c.id !== itemId) })),
      updateCartQuantityOptimistic: (itemId, quantity) => set((s) => ({
        cart: s.cart.map(c => c.id === itemId ? { ...c, quantity } : c)
      })),
      getCartCount: () => get().cart.reduce((sum, item) => sum + item.quantity, 0),
      getCartTotal: () => get().cart.reduce((sum, item) => {
        const price = item.product.salePrice || item.product.basePrice
        return sum + price * item.quantity
      }, 0),

      wishlistIds: [],
      setWishlistIds: (ids) => set({ wishlistIds: ids }),
      toggleWishlist: (productId) => set((s) => ({
        wishlistIds: s.wishlistIds.includes(productId)
          ? s.wishlistIds.filter(id => id !== productId)
          : [...s.wishlistIds, productId]
      })),
      isInWishlist: (productId) => get().wishlistIds.includes(productId),

      searchQuery: '',
      setSearchQuery: (q) => set({ searchQuery: q }),
      mobileMenuOpen: false,
      setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
      toastMessage: null,
      toastType: 'success',
      showToast: (message, type = 'success') => {
        set({ toastMessage: message, toastType: type })
        setTimeout(() => set({ toastMessage: null }), 3000)
      },
      clearToast: () => set({ toastMessage: null }),

      adminTab: 'dashboard',
      setAdminTab: (tab) => set({ adminTab: tab }),
    }),
    {
      name: 'stylewithher-store',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        wishlistIds: state.wishlistIds,
      }),
    }
  )
)