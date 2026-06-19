'use client'

import { useState, useEffect, useMemo } from 'react'
import { useStore, ProductData } from '@/store/use-store'
import ProductCard from '@/components/shared/ProductCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Star,
  Heart,
  ShoppingCart,
  Minus,
  Plus,
  ArrowLeft,
  Truck,
  Shield,
  RotateCcw,
  ChevronRight,
} from 'lucide-react'

const COLOR_HEX_MAP: Record<string, string> = {
  'Navy Blue': '#0B1F3A',
  'Soft Pink': '#F7C8D0',
  'White': '#FFFFFF',
  'Black': '#222222',
  'Blush': '#FFF5F7',
  'Rose': '#D96C8A',
  'Charcoal': '#333333',
  'Cream': '#FFFDD0',
  'Lavender': '#E6E6FA',
  'Sage Green': '#B2AC88',
}

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'lg' ? 'h-5 w-5' : size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5'
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`${sizeClass} ${i < Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
        />
      ))}
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Skeleton className="h-5 w-24 mb-8" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        <div className="space-y-4">
          <Skeleton className="aspect-square w-full rounded-2xl bg-gray-100" />
          <div className="flex gap-3">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="w-20 h-20 rounded-lg bg-gray-100" />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-px w-full" />
          <Skeleton className="h-6 w-24" />
          <div className="flex gap-2">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="w-10 h-10 rounded-full bg-gray-100" />
            ))}
          </div>
          <Skeleton className="h-6 w-24" />
          <div className="flex gap-2">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="w-12 h-10 rounded-md bg-gray-100" />
            ))}
          </div>
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      </div>
    </div>
  )
}

export default function ProductDetailPage() {
  const { pageParams, previousPage, navigate, user, isAuthenticated, toggleWishlist, isInWishlist, showToast, setCart } = useStore()

  const productId = pageParams.id || ''
  const [product, setProduct] = useState<ProductData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Image gallery
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  // Variant selection
  const [selectedColor, setSelectedColor] = useState('')
  const [selectedSize, setSelectedSize] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [addingToCart, setAddingToCart] = useState(false)

  // Review form
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewTitle, setReviewTitle] = useState('')
  const [reviewComment, setReviewComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [hoveredStar, setHoveredStar] = useState(0)

  // Related products
  const [relatedProducts, setRelatedProducts] = useState<ProductData[]>([])
  const [relatedLoading, setRelatedLoading] = useState(false)

  // Fetch product
  useEffect(() => {
    if (!productId) return
    setLoading(true)
    setError('')
    fetch(`/api/products/${productId}`)
      .then(res => {
        if (!res.ok) throw new Error('Product not found')
        return res.json()
      })
      .then(data => {
        const p = data.product
        if (!p) throw new Error('Product not found')
        setProduct(p)
        setSelectedImageIndex(0)
        // Set default color and size
        const colors = [...new Set(p.variants?.map(v => v.color).filter(Boolean) || [])]
        const sizes = [...new Set(p.variants?.map(v => v.size).filter(Boolean) || [])]
        if (colors.length > 0) setSelectedColor(colors[0])
        if (sizes.length > 0) setSelectedSize(sizes[0])
      })
      .catch(err => {
        setError(err.message || 'Failed to load product')
      })
      .finally(() => setLoading(false))
  }, [productId])

  // Fetch related products
  useEffect(() => {
    if (!product?.categoryId) return
    setRelatedLoading(true)
    const params = new URLSearchParams({
      categoryId: product.categoryId,
      limit: '4',
    })
    // We don't have a categoryId filter in the API, use category slug
    // Actually the products API uses `category` (slug), let's try that
    const slugParams = new URLSearchParams({
      category: product.category.slug,
      limit: '4',
    })
    fetch(`/api/products?${slugParams.toString()}`)
      .then(res => res.json())
      .then(data => {
        const related = (data.products || []).filter(
          (p: ProductData) => p.id !== product.id
        ).slice(0, 4)
        setRelatedProducts(related)
      })
      .catch(() => {})
      .finally(() => setRelatedLoading(false))
  }, [product?.categoryId, product?.category?.slug, product?.id])

  // Unique colors and sizes
  const uniqueColors = useMemo(() => {
    if (!product?.variants) return []
    return [...new Set(product.variants.map(v => v.color).filter(Boolean))]
  }, [product?.variants])

  const uniqueSizes = useMemo(() => {
    if (!product?.variants) return []
    return [...new Set(product.variants.map(v => v.size).filter(Boolean))]
  }, [product?.variants])

  // Find selected variant
  const selectedVariant = useMemo(() => {
    if (!product?.variants || !selectedColor || !selectedSize) return null
    return product.variants.find(
      v => v.color === selectedColor && v.size === selectedSize
    ) || null
  }, [product?.variants, selectedColor, selectedSize])

  // Check if variant is in stock
  const isVariantInStock = useMemo(() => {
    if (!selectedVariant) return false
    const qty = selectedVariant.inventory?.quantity ?? 0
    return qty > 0
  }, [selectedVariant])

  // Get images filtered by selected color
  const filteredImages = useMemo(() => {
    if (!product?.images) return []
    if (!selectedColor) return product.images
    return product.images
  }, [product?.images, selectedColor])

  // Effective price
  const effectivePrice = useMemo(() => {
    if (selectedVariant?.price) return selectedVariant.price
    return product?.salePrice || product?.basePrice || 0
  }, [selectedVariant?.price, product?.salePrice, product?.basePrice])

  const hasDiscount = product && product.salePrice && product.salePrice < product.basePrice
  const discountPercent = hasDiscount
    ? Math.round(((product!.basePrice - product!.salePrice!) / product!.basePrice) * 100)
    : 0

  // Review distribution
  const reviewDistribution = useMemo(() => {
    const reviews = product?.reviews || []
    const dist: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    reviews.forEach(r => { dist[r.rating] = (dist[r.rating] || 0) + 1 })
    return dist
  }, [product?.reviews])

  const inWishlist = product ? isInWishlist(product.id) : false

  // Handlers
  const handleBack = () => {
    if (previousPage === 'products' || previousPage === 'home') {
      navigate(previousPage)
    } else {
      navigate('products')
    }
  }

  const handleAddToCart = async () => {
    if (!isAuthenticated) { navigate('login'); return }
    if (!selectedVariant) {
      showToast('Please select a size', 'error')
      return
    }
    if (!isVariantInStock) {
      showToast('This variant is out of stock', 'error')
      return
    }
    setAddingToCart(true)
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: product!.id,
          variantId: selectedVariant.id,
          quantity,
        }),
      })
      if (res.ok) {
        showToast('Added to cart!')
        // Refresh cart
        const cartRes = await fetch('/api/cart', {
          headers: { 'Authorization': `Bearer ${user?.token}` },
        })
        if (cartRes.ok) {
          const data = await cartRes.json()
          // Map cart API response to store format
          const cartItems = (data.cartItems || []).map((item: Record<string, unknown>) => ({
            id: item.id,
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            product: {
              id: (item.product as Record<string, unknown>).id,
              name: (item.product as Record<string, unknown>).name,
              slug: (item.product as Record<string, unknown>).slug,
              basePrice: (item.product as Record<string, unknown>).basePrice,
              salePrice: (item.product as Record<string, unknown>).salePrice,
              images: (item.product as Record<string, unknown>).images || [],
              variants: [],
            },
          }))
          setCart(cartItems)
        }
      } else {
        const err = await res.json()
        showToast(err.error || 'Failed to add to cart', 'error')
      }
    } catch {
      showToast('Failed to add to cart', 'error')
    } finally {
      setAddingToCart(false)
    }
  }

  const handleToggleWishlist = async () => {
    if (!isAuthenticated) { navigate('login'); return }
    if (!product) return
    toggleWishlist(product.id)
    showToast(inWishlist ? 'Removed from wishlist' : 'Added to wishlist')
    try {
      await fetch('/api/wishlist', {
        method: inWishlist ? 'DELETE' : 'POST',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json',
        },
        body: inWishlist ? undefined : JSON.stringify({ productId: product.id }),
      })
    } catch { /* silent */ }
  }

  const handleSubmitReview = async () => {
    if (!isAuthenticated) { navigate('login'); return }
    if (reviewRating < 1) {
      showToast('Please select a rating', 'error')
      return
    }
    if (!product) return
    setSubmittingReview(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: product.id,
          rating: reviewRating,
          title: reviewTitle || null,
          comment: reviewComment || null,
        }),
      })
      if (res.ok) {
        showToast('Review submitted! Thank you.')
        setReviewDialogOpen(false)
        setReviewRating(0)
        setReviewTitle('')
        setReviewComment('')
        // Refresh product to get updated reviews
        const prodRes = await fetch(`/api/products/${product.id}`)
        if (prodRes.ok) {
          const data = await prodRes.json()
          setProduct(data.product)
        }
      } else {
        const err = await res.json()
        showToast(err.error || 'Failed to submit review', 'error')
      }
    } catch {
      showToast('Failed to submit review', 'error')
    } finally {
      setSubmittingReview(false)
    }
  }

  // Loading & Error states
  if (loading) return <DetailSkeleton />
  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="w-20 h-20 rounded-full bg-[#FFF5F7] flex items-center justify-center mb-6">
          <Star className="h-8 w-8 text-[#D96C8A]" />
        </div>
        <h2 className="text-xl font-semibold text-[#0B1F3A] mb-2">
          {error || 'Product not found'}
        </h2>
        <p className="text-gray-500 text-sm mb-6">The product you&apos;re looking for doesn&apos;t exist.</p>
        <Button
          onClick={handleBack}
          className="bg-[#0B1F3A] hover:bg-[#0B1F3A]/90 text-white gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Products
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb / Back */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#D96C8A] transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Back
        </button>
      </div>

      {/* Product Detail */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left: Image Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#FFF5F7]">
              {hasDiscount && (
                <Badge className="absolute top-4 left-4 z-10 bg-[#D96C8A] text-white text-sm px-3 py-1 hover:bg-[#D96C8A]">
                  {discountPercent}% OFF
                </Badge>
              )}
              {product.isNewArrival && !hasDiscount && (
                <Badge className="absolute top-4 left-4 z-10 bg-[#0B1F3A] text-white text-sm px-3 py-1 hover:bg-[#0B1F3A]">
                  NEW
                </Badge>
              )}
              <img
                src={filteredImages[selectedImageIndex]?.url || 'https://placehold.co/600x600/0B1F3A/F7C8D0?text=No+Image'}
                alt={filteredImages[selectedImageIndex]?.alt || product.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Thumbnails */}
            {filteredImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {filteredImages.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImageIndex === idx
                        ? 'border-[#D96C8A] ring-2 ring-[#D96C8A]/30'
                        : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <img
                      src={img.url}
                      alt={img.alt || `${product.name} ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Product Info */}
          <div className="space-y-5">
            {/* Category Breadcrumb */}
            <button
              onClick={() => navigate('products', { category: product.category.slug })}
              className="inline-flex items-center gap-1 text-xs font-medium text-[#D96C8A] uppercase tracking-wider hover:text-[#D96C8A]/80 transition-colors"
            >
              {product.category.name}
              <ChevronRight className="h-3 w-3" />
            </button>

            {/* Name */}
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0B1F3A] leading-tight">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-3">
              <StarRating rating={product.avgRating} size="md" />
              <span className="text-sm text-gray-500">
                {product.avgRating.toFixed(1)} ({product.reviewCount} review{product.reviewCount !== 1 ? 's' : ''})
              </span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-[#0B1F3A]">
                Rs.{effectivePrice.toLocaleString()}
              </span>
              {hasDiscount && (
                <>
                  <span className="text-lg text-gray-400 line-through">
                    Rs.{product.basePrice.toLocaleString()}
                  </span>
                  <Badge className="bg-[#FFF5F7] text-[#D96C8A] border border-[#F7C8D0]/50 text-xs hover:bg-[#FFF5F7]">
                    Save Rs.{(product.basePrice - product.salePrice!).toLocaleString()}
                  </Badge>
                </>
              )}
            </div>

            <Separator className="bg-gray-100" />

            {/* Description */}
            {product.description && (
              <p className="text-sm text-gray-600 leading-relaxed">
                {product.description}
              </p>
            )}

            {/* Color Selector */}
            {uniqueColors.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-[#0B1F3A] mb-3">
                  Color: <span className="font-normal text-gray-500">{selectedColor}</span>
                </p>
                <div className="flex flex-wrap gap-3">
                  {uniqueColors.map(color => {
                    const hex = COLOR_HEX_MAP[color] || '#CCCCCC'
                    return (
                      <button
                        key={color}
                        onClick={() => {
                          setSelectedColor(color)
                          setSelectedImageIndex(0)
                        }}
                        className={`w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center ${
                          selectedColor === color
                            ? 'border-[#D96C8A] ring-2 ring-[#D96C8A]/30 scale-110'
                            : 'border-gray-200 hover:border-gray-400 hover:scale-105'
                        }`}
                        style={{ backgroundColor: hex }}
                        title={color}
                        aria-label={`Select color ${color}`}
                      >
                        {color === 'White' && (
                          <div className="w-full h-full rounded-full border border-gray-300" />
                        )}
                        {color === 'Blush' && (
                          <div className="w-full h-full rounded-full border border-gray-200" />
                        )}
                        {color === 'Cream' && (
                          <div className="w-full h-full rounded-full border border-gray-200" />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Size Selector */}
            {uniqueSizes.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-[#0B1F3A] mb-3">
                  Size: <span className="font-normal text-gray-500">{selectedSize}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {uniqueSizes.map(size => {
                    const variant = product.variants?.find(
                      v => v.size === size && v.color === selectedColor
                    )
                    const inStock = (variant?.inventory?.quantity ?? 0) > 0
                    return (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        disabled={!inStock}
                        className={`px-4 py-2.5 text-sm font-medium rounded-lg border transition-all min-w-[3rem] ${
                          selectedSize === size
                            ? 'bg-[#0B1F3A] text-white border-[#0B1F3A]'
                            : inStock
                            ? 'bg-white text-gray-700 border-gray-200 hover:border-[#0B1F3A] hover:text-[#0B1F3A]'
                            : 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed line-through'
                        }`}
                      >
                        {size}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Stock Status */}
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${isVariantInStock ? 'bg-green-500' : 'bg-red-400'}`} />
              <span className={`text-sm font-medium ${isVariantInStock ? 'text-green-600' : 'text-red-500'}`}>
                {isVariantInStock ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>

            {/* Quantity + Add to Cart + Wishlist */}
            <div className="space-y-3">
              {/* Quantity */}
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-[#0B1F3A]">Quantity:</span>
                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="h-10 w-10 flex items-center justify-center hover:bg-gray-50 transition-colors text-gray-600"
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="h-10 w-12 flex items-center justify-center text-sm font-medium text-[#0B1F3A] border-x border-gray-200">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(q => q + 1)}
                    className="h-10 w-10 flex items-center justify-center hover:bg-gray-50 transition-colors text-gray-600"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={handleAddToCart}
                  disabled={addingToCart || !isVariantInStock}
                  className="flex-1 h-12 bg-[#0B1F3A] hover:bg-[#0B1F3A]/90 text-white text-sm font-semibold gap-2 disabled:opacity-50"
                >
                  <ShoppingCart className="h-4 w-4" />
                  {addingToCart ? 'Adding...' : 'Add to Cart'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleToggleWishlist}
                  className="h-12 w-12 p-0 border-gray-200 hover:bg-[#FFF5F7] hover:border-[#D96C8A] group"
                >
                  <Heart
                    className={`h-5 w-5 transition-colors ${
                      inWishlist ? 'fill-[#D96C8A] text-[#D96C8A]' : 'text-gray-400 group-hover:text-[#D96C8A]'
                    }`}
                  />
                </Button>
              </div>
            </div>

            <Separator className="bg-gray-100" />

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col items-center text-center gap-2 p-3 rounded-lg bg-[#FFF5F7]">
                <Truck className="h-5 w-5 text-[#0B1F3A]" />
                <span className="text-[11px] font-medium text-[#0B1F3A] leading-tight">Free Shipping</span>
              </div>
              <div className="flex flex-col items-center text-center gap-2 p-3 rounded-lg bg-[#FFF5F7]">
                <Shield className="h-5 w-5 text-[#0B1F3A]" />
                <span className="text-[11px] font-medium text-[#0B1F3A] leading-tight">Secure Payment</span>
              </div>
              <div className="flex flex-col items-center text-center gap-2 p-3 rounded-lg bg-[#FFF5F7]">
                <RotateCcw className="h-5 w-5 text-[#0B1F3A]" />
                <span className="text-[11px] font-medium text-[#0B1F3A] leading-tight">Easy Returns</span>
              </div>
            </div>

            {/* Specifications */}
            {(product.material || product.care || product.gender) && (
              <>
                <Separator className="bg-gray-100" />
                <div>
                  <h3 className="text-sm font-bold text-[#0B1F3A] mb-3 uppercase tracking-wider">Specifications</h3>
                  <div className="border border-gray-100 rounded-lg overflow-hidden">
                    {product.material && (
                      <div className="flex border-b border-gray-100 last:border-0">
                        <span className="w-32 sm:w-40 px-4 py-3 text-xs font-medium text-gray-500 bg-gray-50">Material</span>
                        <span className="flex-1 px-4 py-3 text-sm text-[#222222]">{product.material}</span>
                      </div>
                    )}
                    {product.care && (
                      <div className="flex border-b border-gray-100 last:border-0">
                        <span className="w-32 sm:w-40 px-4 py-3 text-xs font-medium text-gray-500 bg-gray-50">Care Instructions</span>
                        <span className="flex-1 px-4 py-3 text-sm text-[#222222]">{product.care}</span>
                      </div>
                    )}
                    {product.gender && (
                      <div className="flex">
                        <span className="w-32 sm:w-40 px-4 py-3 text-xs font-medium text-gray-500 bg-gray-50">Gender</span>
                        <span className="flex-1 px-4 py-3 text-sm text-[#222222] capitalize">{product.gender}</span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-[#0B1F3A]">Customer Reviews</h2>
              <p className="text-sm text-gray-500 mt-1">
                {product.reviewCount} review{product.reviewCount !== 1 ? 's' : ''}
              </p>
            </div>
            <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#0B1F3A] hover:bg-[#0B1F3A]/90 text-white text-sm gap-2">
                  <Star className="h-4 w-4" />
                  Write a Review
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-[#0B1F3A]">Write a Review</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label className="text-sm font-medium text-[#0B1F3A] mb-2 block">Rating *</Label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          onMouseEnter={() => setHoveredStar(star)}
                          onMouseLeave={() => setHoveredStar(0)}
                          className="p-1 transition-transform hover:scale-110"
                        >
                          <Star
                            className={`h-7 w-7 ${
                              star <= (hoveredStar || reviewRating)
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-gray-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-[#0B1F3A] mb-2 block">Title</Label>
                    <Input
                      placeholder="Summarize your experience"
                      value={reviewTitle}
                      onChange={e => setReviewTitle(e.target.value)}
                      className="border-gray-200 focus-visible:ring-[#D96C8A]/30"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-[#0B1F3A] mb-2 block">Review</Label>
                    <Textarea
                      placeholder="Tell us more about your experience with this product..."
                      value={reviewComment}
                      onChange={e => setReviewComment(e.target.value)}
                      rows={4}
                      className="border-gray-200 focus-visible:ring-[#D96C8A]/30 resize-none"
                    />
                  </div>
                  <Button
                    onClick={handleSubmitReview}
                    disabled={submittingReview || reviewRating < 1}
                    className="w-full bg-[#0B1F3A] hover:bg-[#0B1F3A]/90 text-white disabled:opacity-50"
                  >
                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Rating Summary */}
            <div className="lg:col-span-1">
              <div className="bg-[#FFF5F7] rounded-xl p-6 text-center sticky top-24">
                <p className="text-5xl font-bold text-[#0B1F3A] mb-2">{product.avgRating.toFixed(1)}</p>
                <StarRating rating={product.avgRating} size="md" />
                <p className="text-sm text-gray-500 mt-2">Based on {product.reviewCount} reviews</p>

                {/* Distribution Bars */}
                <div className="mt-6 space-y-2">
                  {[5, 4, 3, 2, 1].map(star => {
                    const count = reviewDistribution[star] || 0
                    const pct = product.reviewCount > 0 ? (count / product.reviewCount) * 100 : 0
                    return (
                      <div key={star} className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 w-8 text-right">{star}★</span>
                        <div className="flex-1 h-2 bg-white rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-400 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400 w-6">{count}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Reviews List */}
            <div className="lg:col-span-2 space-y-4">
              {(product.reviews || []).length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                  <Star className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No reviews yet. Be the first to review this product!</p>
                </div>
              ) : (
                (product.reviews || []).map(review => (
                  <div key={review.id} className="border border-gray-100 rounded-xl p-5 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#FFF5F7] flex items-center justify-center">
                          <span className="text-sm font-semibold text-[#D96C8A]">
                            {(review.user?.name || 'U').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#0B1F3A]">{review.user?.name || 'Anonymous'}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(review.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                      <StarRating rating={review.rating} size="sm" />
                    </div>
                    {review.title && (
                      <h4 className="text-sm font-semibold text-[#222222] mb-1">{review.title}</h4>
                    )}
                    {review.comment && (
                      <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-[#0B1F3A]">You May Also Like</h2>
                <p className="text-sm text-gray-500 mt-1">More from {product.category.name}</p>
              </div>
              <Button
                variant="outline"
                onClick={() => navigate('products', { category: product.category.slug })}
                className="border-[#0B1F3A] text-[#0B1F3A] hover:bg-[#0B1F3A] hover:text-white text-sm gap-1"
              >
                View All
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {relatedLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="aspect-[3/4] w-full rounded-xl bg-gray-100" />
                    <Skeleton className="h-4 w-3/4 rounded bg-gray-100" />
                    <Skeleton className="h-5 w-1/2 rounded bg-gray-100" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {relatedProducts.map(p => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}