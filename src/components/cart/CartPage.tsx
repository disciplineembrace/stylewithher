'use client'

import { useState, useEffect, useCallback } from 'react'
import { useStore } from '@/store/use-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight, Tag, ArrowLeft, Gift, Truck, Loader2 } from 'lucide-react'

import { useTranslation } from '@/i18n/use-language'
interface CartItemApi {
  id: string
  userId: string
  productId: string
  variantId: string | null
  quantity: number
  createdAt: string
  updatedAt: string
  product: {
    id: string
    name: string
    slug: string
    basePrice: number
    salePrice: number | null
    images: { url: string; alt: string | null }[]
  }
}

interface CouponResult {
  valid: boolean
  code?: string
  description?: string
  discountType?: string
  discountValue?: number
  discount?: number
  maxDiscount?: number
  minOrder?: number
  error?: string
}

export function CartPage() {
  const { t } = useTranslation()
  const { user, isAuthenticated, navigate, setCart, removeFromCartOptimistic, updateCartQuantityOptimistic, showToast } = useStore()
  const [cartItems, setCartItems] = useState<CartItemApi[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)

  // Coupon state
  const [couponCode, setCouponCode] = useState('')
  const [couponResult, setCouponResult] = useState<CouponResult | null>(null)
  const [couponLoading, setCouponLoading] = useState(false)

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated || !user) return
    setLoading(true)
    try {
      const res = await fetch('/api/cart', {
        headers: { Authorization: `Bearer ${user.token}` },
      })
      if (res.ok) {
        const data = await res.json()
        const items = data.cartItems || []
        setCartItems(items)
        // Sync with store
        const storeItems = items.map((item: CartItemApi) => ({
          id: item.id,
          productId: item.product.id,
          variantId: item.variantId,
          quantity: item.quantity,
          product: {
            id: item.product.id,
            name: item.product.name,
            slug: item.product.slug,
            basePrice: item.product.basePrice,
            salePrice: item.product.salePrice,
            images: item.product.images.map((img, i) => ({ id: String(i), url: img.url, alt: img.alt || '' })),
            variants: [],
          },
        }))
        setCart(storeItems)
      }
    } catch {
      showToast('Failed to load cart', 'error')
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, user, setCart, showToast])

  useEffect(() => {
    fetchCart()
  }, [fetchCart])

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      // Don't redirect immediately, show login prompt instead
    }
  }, [isAuthenticated, navigate])

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return
    setUpdatingId(itemId)
    updateCartQuantityOptimistic(itemId, newQuantity)
    try {
      const res = await fetch('/api/cart', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${user?.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, quantity: newQuantity }),
      })
      if (res.ok) {
        setCartItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, quantity: newQuantity } : item)))
      } else {
        showToast('Failed to update quantity', 'error')
        fetchCart() // Revert
      }
    } catch {
      showToast('Failed to update quantity', 'error')
      fetchCart() // Revert
    } finally {
      setUpdatingId(null)
    }
  }

  const handleRemoveItem = async (itemId: string) => {
    setRemovingId(itemId)
    removeFromCartOptimistic(itemId)
    try {
      const res = await fetch(`/api/cart?itemId=${itemId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${user?.token}` },
      })
      if (res.ok) {
        setCartItems((prev) => prev.filter((item) => item.id !== itemId))
        showToast('Item removed from cart')
      } else {
        showToast('Failed to remove item', 'error')
        fetchCart() // Revert
      }
    } catch {
      showToast('Failed to remove item', 'error')
      fetchCart() // Revert
    } finally {
      setRemovingId(null)
    }
  }

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return
    setCouponLoading(true)
    setCouponResult(null)
    try {
      const subtotal = getSubtotal()
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode, orderTotal: subtotal }),
      })
      const data = await res.json()
      setCouponResult(data)
      if (!data.valid) {
        showToast(data.error || 'Invalid coupon', 'error')
      } else {
        showToast(`Coupon "${data.code}" applied!`)
      }
    } catch {
      showToast('Failed to validate coupon', 'error')
    } finally {
      setCouponLoading(false)
    }
  }

  const getSubtotal = () => {
    return cartItems.reduce((sum, item) => {
      const price = item.product.salePrice || item.product.basePrice
      return sum + price * item.quantity
    }, 0)
  }

  const getDiscount = () => {
    if (couponResult?.valid && couponResult.discount) {
      return Math.min(couponResult.discount, getSubtotal())
    }
    return 0
  }

  const getTax = () => {
    return (getSubtotal() - getDiscount()) * 0.18
  }

  const getShipping = () => {
    const afterDiscount = getSubtotal() - getDiscount()
    return afterDiscount >= 999 ? 0 : 99
  }

  const getTotal = () => {
    return getSubtotal() - getDiscount() + getTax() + getShipping()
  }

  const getTotalItems = () => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0)
  }

  // Not authenticated - show login prompt
  if (!isAuthenticated) {
    return (
      <section className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="max-w-sm mx-auto">
          <div className="w-20 h-20 rounded-full bg-[#FFF5F7] flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="h-9 w-9 text-[#D96C8A]" />
          </div>
          <h2 className="text-2xl font-bold text-[#222222] mb-3">Your Cart is Waiting</h2>
          <p className="text-gray-500 mb-6">Sign in to view your cart and start shopping.</p>
          <Button
            onClick={() => navigate('login')}
            className="w-full h-11 bg-[#0B1F3A] hover:bg-[#0B1F3A]/90 text-white font-medium rounded-lg"
          >
            Sign In to Continue
          </Button>
          <button
            onClick={() => navigate('products')}
            className="mt-4 text-sm text-[#D96C8A] hover:text-[#D96C8A]/80 font-medium"
          >
            Browse Products Instead
          </button>
        </div>
      </section>
    )
  }

  // Loading state
  if (loading) {
    return (
      <section className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
        <Skeleton className="h-10 w-48 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </section>
    )
  }

  // Empty cart state
  if (cartItems.length === 0) {
    return (
      <section className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="max-w-sm mx-auto">
          <div className="w-24 h-24 rounded-full bg-[#FFF5F7] flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="h-10 w-10 text-gray-300" />
          </div>
          <h2 className="text-2xl font-bold text-[#222222] mb-3">Your Cart is Empty</h2>
          <p className="text-gray-500 mb-8">
            Looks like you haven&apos;t added anything to your cart yet. Explore our collection and find something you love!
          </p>
          <Button
            onClick={() => navigate('products')}
            className="h-11 bg-[#0B1F3A] hover:bg-[#0B1F3A]/90 text-white font-medium rounded-lg px-8"
          >
            <ShoppingBag className="h-4 w-4 mr-2" /> Start Shopping
          </Button>
        </div>
      </section>
    )
  }

  return (
    <section className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => navigate('products')}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-[#222222]" />
        </button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#222222]">Shopping Cart</h1>
          <p className="text-sm text-gray-500 mt-0.5">{getTotalItems()} item{getTotalItems() !== 1 ? 's' : ''} in your cart</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map((item) => {
            const price = item.product.salePrice || item.product.basePrice
            const hasDiscount = item.product.salePrice && item.product.salePrice < item.product.basePrice
            const isUpdating = updatingId === item.id
            const isRemoving = removingId === item.id

            return (
              <div
                key={item.id}
                className="flex gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-gray-200 transition-colors group"
              >
                {/* Image */}
                <button
                  onClick={() => navigate('product-detail', { id: item.productId })}
                  className="flex-shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-lg overflow-hidden bg-[#FFF5F7]"
                >
                  <img
                    src={item.product.images[0]?.url || 'https://placehold.co/200x200/0B1F3A/F7C8D0?text=No+Image'}
                    alt={item.product.images[0]?.alt || item.product.name}
                    className="w-full h-full object-cover"
                  />
                </button>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <button
                      onClick={() => navigate('product-detail', { id: item.productId })}
                      className="text-sm sm:text-base font-medium text-[#222222] hover:text-[#D96C8A] transition-colors text-left line-clamp-2"
                    >
                      {item.product.name}
                    </button>
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      disabled={isRemoving}
                      className="flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      {isRemoving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  {/* Price */}
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-sm sm:text-base font-bold text-[#0B1F3A]">Rs.{price.toLocaleString()}</span>
                    {hasDiscount && (
                      <span className="text-xs text-gray-400 line-through">Rs.{item.product.basePrice.toLocaleString()}</span>
                    )}
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1 || isUpdating}
                        className="w-9 h-9 flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-10 h-9 flex items-center justify-center text-sm font-medium text-[#222222] border-x border-gray-200">
                        {isUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : item.quantity}
                      </span>
                      <button
                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                        disabled={isUpdating}
                        className="w-9 h-9 flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-40"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <span className="text-sm sm:text-base font-bold text-[#0B1F3A]">
                      Rs.{(price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}

          {/* Continue Shopping */}
          <button
            onClick={() => navigate('products')}
            className="inline-flex items-center gap-2 text-sm text-[#D96C8A] hover:text-[#D96C8A]/80 font-medium mt-2"
          >
            <ArrowLeft className="h-4 w-4" /> Continue Shopping
          </button>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="border-0 shadow-sm sticky top-4">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg text-[#222222]">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Subtotal */}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal ({getTotalItems()} items)</span>
                <span className="font-medium text-[#222222]">Rs.{getSubtotal().toLocaleString()}</span>
              </div>

              {/* Tax */}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Estimated Tax (18%)</span>
                <span className="font-medium text-[#222222]">Rs.{getTax().toFixed(0)}</span>
              </div>

              {/* Shipping */}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 flex items-center gap-1">
                  <Truck className="h-3.5 w-3.5" /> Shipping
                </span>
                {getShipping() === 0 ? (
                  <span className="font-medium text-green-600">FREE</span>
                ) : (
                  <span className="font-medium text-[#222222]">Rs.{getShipping()}</span>
                )}
              </div>
              {getShipping() > 0 && (
                <p className="text-xs text-gray-400">
                  Add Rs.{(999 - getSubtotal() + getDiscount()).toFixed(0)} more for free shipping
                </p>
              )}

              <Separator />

              {/* Coupon */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="h-4 w-4 text-[#D96C8A]" />
                  <span className="text-sm font-medium text-[#222222]">Coupon Code</span>
                </div>
                {couponResult?.valid ? (
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                    <div>
                      <p className="text-sm font-semibold text-green-700">{couponResult.code}</p>
                      <p className="text-xs text-green-600">
                        {couponResult.description || `You save Rs.${getDiscount().toFixed(0)}`}
                      </p>
                    </div>
                    <button
                      onClick={() => { setCouponResult(null); setCouponCode('') }}
                      className="text-xs text-red-500 hover:text-red-600 font-medium"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Enter code"
                      className="h-10 text-sm border-gray-200 focus:border-[#D96C8A] focus:ring-[#D96C8A]/20 uppercase"
                      onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                    />
                    <Button
                      onClick={handleApplyCoupon}
                      disabled={couponLoading || !couponCode.trim()}
                      variant="outline"
                      className="h-10 px-4 border-[#0B1F3A] text-[#0B1F3A] hover:bg-[#0B1F3A] hover:text-white flex-shrink-0"
                    >
                      {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
                    </Button>
                  </div>
                )}
              </div>

              {/* Discount */}
              {getDiscount() > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-green-600 flex items-center gap-1">
                    <Gift className="h-3.5 w-3.5" /> Discount
                  </span>
                  <span className="font-medium text-green-600">-Rs.{getDiscount().toFixed(0)}</span>
                </div>
              )}

              <Separator />

              {/* Total */}
              <div className="flex justify-between items-center">
                <span className="text-base font-bold text-[#222222]">Total</span>
                <span className="text-xl font-bold text-[#0B1F3A]">Rs.{getTotal().toFixed(0)}</span>
              </div>

              {/* Checkout Button */}
              <Button
                onClick={() => navigate('checkout')}
                className="w-full h-12 bg-[#0B1F3A] hover:bg-[#0B1F3A]/90 text-white font-medium rounded-lg text-base"
              >
                Proceed to Checkout <ArrowRight className="h-4 w-4 ml-2" />
              </Button>

              {/* Secure checkout hint */}
              <p className="text-xs text-center text-gray-400 mt-2">
                Secure checkout powered by SSL encryption
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}