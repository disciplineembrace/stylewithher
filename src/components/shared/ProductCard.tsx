'use client'

import { Star, Heart, ShoppingCart, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useStore, ProductData } from '@/store/use-store'
import { useState } from 'react'

import { useTranslation } from '@/i18n/use-language'
export default function ProductCard({ product }: { product: ProductData }) {
  const { t } = useTranslation()
  const { navigate, user, isAuthenticated, toggleWishlist, isInWishlist, showToast } = useStore()
  const [imgLoaded, setImgLoaded] = useState(false)
  const inWishlist = isInWishlist(product.id)
  const price = product.salePrice || product.basePrice
  const hasDiscount = product.salePrice && product.salePrice < product.basePrice
  const discount = hasDiscount ? Math.round(((product.basePrice - product.salePrice!) / product.basePrice) * 100) : 0

  const handleWishlist = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isAuthenticated) { navigate('login'); return }
    toggleWishlist(product.id)
    showToast(inWishlist ? 'Removed from wishlist' : 'Added to wishlist')
    try {
      await fetch('/api/wishlist', {
        method: inWishlist ? 'DELETE' : 'POST',
        headers: isAuthenticated ? { 'Authorization': `Bearer ${user?.token}`, 'Content-Type': 'application/json' } : {},
        body: inWishlist ? undefined : JSON.stringify({ productId: product.id }),
      })
    } catch { /* silent */ }
  }

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isAuthenticated) { navigate('login'); return }
    const defaultVariant = product.variants[0]
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${user?.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, variantId: defaultVariant?.id || null, quantity: 1 }),
      })
      if (res.ok) {
        showToast('Added to cart!')
        const cartRes = await fetch('/api/cart', { headers: { 'Authorization': `Bearer ${user?.token}` } })
        if (cartRes.ok) { const data = await cartRes.json(); useStore.getState().setCart(data.cart || []) }
      }
    } catch { showToast('Failed to add to cart', 'error') }
  }

  return (
    <div
      onClick={() => navigate('product-detail', { id: product.id })}
      className="group cursor-pointer card-premium bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm"
    >
      {/* Image */}
      <div className="relative aspect-[3/4] bg-[#F5F7FA] overflow-hidden img-zoom-container">
        {!imgLoaded && <div className="absolute inset-0 skeleton-shimmer" />}
        <img
          src={product.images[0]?.url || 'https://placehold.co/400x533/0D182A/E91663?text=No+Image'}
          alt={product.images[0]?.alt || product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          onLoad={() => setImgLoaded(true)}
        />
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {hasDiscount && <Badge className="bg-[#E91663] text-white text-[10px] px-2 py-0.5 hover:bg-[#E91663] rounded-full">{discount}% OFF</Badge>}
          {product.isNewArrival && <Badge className="bg-[#0D182A] text-white text-[10px] px-2 py-0.5 hover:bg-[#0D182A] rounded-full">NEW</Badge>}
          {product.isBestSeller && <Badge className="bg-[#D4AF37] text-white text-[10px] px-2 py-0.5 hover:bg-[#D4AF37] rounded-full">BEST SELLER</Badge>}
        </div>
        {/* Actions */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={handleWishlist} className="w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-[#FFF5F7] transition-colors">
            <Heart className={`h-4 w-4 ${inWishlist ? 'fill-[#E91663] text-[#E91663]' : 'text-[#222222]'}`} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); navigate('product-detail', { id: product.id }) }} className="w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-[#FFF5F7] transition-colors">
            <Eye className="h-4 w-4 text-[#222222]" />
          </button>
        </div>
        {/* Quick Add */}
        <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
          <Button onClick={handleAddToCart} size="sm" className="w-full bg-[#0D182A] hover:bg-[#0D182A]/90 text-white text-xs h-9 gap-1.5">
            <ShoppingCart className="h-3.5 w-3.5" /> Add to Cart
          </Button>
        </div>
      </div>
      {/* Info */}
      <div className="p-4">
        <p className="text-[10px] text-[#E91663] font-medium uppercase tracking-wider mb-1">{product.category.name}</p>
        <h3 className="font-medium text-sm text-[#0D182A] line-clamp-1 mb-1.5 group-hover:text-[#E91663] transition-colors">{product.name}</h3>
        <div className="flex items-center gap-1 mb-2">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className={`h-3 w-3 ${star <= Math.round(product.avgRating) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
            ))}
          </div>
          <span className="text-[10px] text-gray-400">({product.reviewCount})</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-[#0D182A]">Rs.{price.toLocaleString()}</span>
          {hasDiscount && <span className="text-xs text-gray-400 line-through">Rs.{product.basePrice.toLocaleString()}</span>}
        </div>
      </div>
    </div>
  )
}