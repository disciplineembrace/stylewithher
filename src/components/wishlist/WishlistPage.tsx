'use client'

import { useState, useEffect, useCallback } from 'react'
import { useStore, ProductData } from '@/store/use-store'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Heart, ArrowLeft, ShoppingBag, Trash2, Loader2 } from 'lucide-react'
import ProductCard from '@/components/shared/ProductCard'

import { useTranslation } from '@/i18n/use-language'
interface WishlistItemApi {
  id: string
  userId: string
  productId: string
  createdAt: string
  product: {
    id: string
    name: string
    slug: string
    basePrice: number
    salePrice: number | null
    avgRating: number
    reviewCount: number
    images: { url: string; alt: string | null }[]
  }
}

export function WishlistPage() {
  const { t } = useTranslation()
  const { user, isAuthenticated, navigate, toggleWishlist, setWishlistIds, showToast } = useStore()
  const [wishlistItems, setWishlistItems] = useState<WishlistItemApi[]>([])
  const [loading, setLoading] = useState(true)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const fetchWishlist = useCallback(async () => {
    if (!isAuthenticated || !user) return
    setLoading(true)
    try {
      const res = await fetch('/api/wishlist', {
        headers: { Authorization: `Bearer ${user.token}` },
      })
      if (res.ok) {
        const data = await res.json()
        const items: WishlistItemApi[] = data.wishlist || []
        setWishlistItems(items)
        // Sync wishlist IDs with store
        setWishlistIds(items.map((item) => item.productId))
      }
    } catch {
      showToast('Failed to load wishlist', 'error')
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, user, setWishlistIds, showToast])

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('login')
      return
    }
    fetchWishlist()
  }, [isAuthenticated, navigate, fetchWishlist])

  const handleRemove = async (productId: string) => {
    setRemovingId(productId)
    toggleWishlist(productId)
    setWishlistItems((prev) => prev.filter((item) => item.productId !== productId))
    try {
      const res = await fetch(`/api/wishlist?productId=${productId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${user?.token}` },
      })
      if (res.ok) {
        showToast('Removed from wishlist')
      } else {
        showToast('Failed to remove item', 'error')
        fetchWishlist() // Revert
      }
    } catch {
      showToast('Failed to remove item', 'error')
      fetchWishlist() // Revert
    } finally {
      setRemovingId(null)
    }
  }

  // Map API wishlist item to ProductData for ProductCard
  const mapToProductData = (item: WishlistItemApi): ProductData => ({
    id: item.product.id,
    name: item.product.name,
    slug: item.product.slug,
    description: null,
    basePrice: item.product.basePrice,
    salePrice: item.product.salePrice,
    categoryId: '',
    gender: 'women',
    isFeatured: false,
    isTrending: false,
    isNewArrival: false,
    isBestSeller: false,
    isActive: true,
    avgRating: item.product.avgRating || 0,
    reviewCount: item.product.reviewCount || 0,
    totalSold: 0,
    material: null,
    care: null,
    category: { id: '', name: '', slug: '' },
    images: item.product.images.map((img, i) => ({
      id: String(i),
      url: img.url,
      alt: img.alt || '',
    })),
    variants: [],
  })

  // Loading state
  if (loading) {
    return (
      <section className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
        <Skeleton className="h-10 w-48 mb-8" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-[3/4] w-full rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </section>
    )
  }

  return (
    <section className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => navigate('home')}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-[#222222]" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#222222]">My Wishlist</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {wishlistItems.length} item{wishlistItems.length !== 1 ? 's' : ''} saved
          </p>
        </div>
      </div>

      {/* Empty State */}
      {wishlistItems.length === 0 && (
        <div className="text-center py-16">
          <div className="w-24 h-24 rounded-full bg-[#FFF5F7] flex items-center justify-center mx-auto mb-6">
            <Heart className="h-10 w-10 text-gray-300" />
          </div>
          <h2 className="text-2xl font-bold text-[#222222] mb-3">Your Wishlist is Empty</h2>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            Save items you love by tapping the heart icon on any product. They&apos;ll appear here for easy access.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              onClick={() => navigate('products')}
              className="h-11 bg-[#0B1F3A] hover:bg-[#0B1F3A]/90 text-white font-medium rounded-lg px-8"
            >
              <ShoppingBag className="h-4 w-4 mr-2" /> Explore Products
            </Button>
          </div>
        </div>
      )}

      {/* Wishlist Grid */}
      {wishlistItems.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {wishlistItems.map((item) => {
            const productData = mapToProductData(item)
            const isRemoving = removingId === item.productId

            return (
              <div key={item.id} className="relative group/card">
                {/* Remove Button */}
                <div className="absolute top-3 right-3 z-20 opacity-0 group-hover/card:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemove(item.productId)
                    }}
                    disabled={isRemoving}
                    className="w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-red-50 transition-colors border border-red-100"
                    title="Remove from wishlist"
                  >
                    {isRemoving ? (
                      <Loader2 className="h-4 w-4 text-red-500 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 text-red-500" />
                    )}
                  </button>
                </div>
                <ProductCard product={productData} />
              </div>
            )
          })}
        </div>
      )}

      {/* Browse More CTA (when items exist) */}
      {wishlistItems.length > 0 && (
        <div className="text-center mt-12">
          <Button
            variant="outline"
            onClick={() => navigate('products')}
            className="h-11 border-[#0B1F3A] text-[#0B1F3A] hover:bg-[#0B1F3A] hover:text-white font-medium rounded-lg px-8"
          >
            <ShoppingBag className="h-4 w-4 mr-2" /> Continue Browsing
          </Button>
        </div>
      )}
    </section>
  )
}