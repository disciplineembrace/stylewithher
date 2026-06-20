'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useStore, ProductData, CategoryData } from '@/store/use-store'
import ProductCard from '@/components/shared/ProductCard'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Star, Shield, Truck, RotateCcw, CreditCard, ArrowRight, ChevronLeft, ChevronRight, Heart, Instagram } from 'lucide-react'

// ─── Hero Carousel Data ──────────────────────────────────────────────────────
const heroSlides = [
  {
    headline: 'Match Together,',
    subtitle: 'Love Together',
    description: 'Discover our curated collection of premium couple clothing designed to make every moment together special.',
    cta: 'Shop Couples Collection',
    gradient: 'from-[#0B1F3A] via-[#0B1F3A]/95 to-[#0B1F3A]/80',
    accent: '#F7C8D0',
    image: 'https://placehold.co/600x800/0B1F3A/F7C8D0?text=Her+%26+Him',
  },
  {
    headline: 'New Arrivals',
    subtitle: 'Spring 2025 Collection',
    description: 'Trendy matching sets that celebrate your unique bond. Premium fabrics, timeless designs.',
    cta: 'Explore New Arrivals',
    gradient: 'from-[#D96C8A] via-[#D96C8A]/90 to-[#F7C8D0]/80',
    accent: '#FFFFFF',
    image: 'https://placehold.co/600x800/D96C8A/FFFFFF?text=Spring+2025',
  },
  {
    headline: 'Premium Quality,',
    subtitle: 'Perfect Fit',
    description: 'Crafted with love for couples who appreciate the finest materials and impeccable style.',
    cta: 'Shop Best Sellers',
    gradient: 'from-[#F7C8D0] via-[#F7C8D0]/90 to-[#FFF5F7]/80',
    accent: '#0B1F3A',
    image: 'https://placehold.co/600x800/F7C8D0/0B1F3A?text=Premium+Style',
  },
]

// ─── Testimonials Data ───────────────────────────────────────────────────────
const testimonials = [
  {
    names: 'Priya & Arjun',
    location: 'Mumbai',
    rating: 5,
    text: 'We ordered matching outfits for our anniversary and the quality exceeded all expectations. The fabric is incredibly soft and the fit is perfect. StyleWithHer is now our go-to for couple fashion!',
    avatar: 'P&A',
  },
  {
    names: 'Sneha & Rohit',
    location: 'Delhi',
    rating: 5,
    text: 'Absolutely love this brand! The matching coordinates are so unique and stylish. We received so many compliments at our friend\'s wedding. Will definitely be ordering more.',
    avatar: 'S&R',
  },
  {
    names: 'Ananya & Vikram',
    location: 'Bangalore',
    rating: 4,
    text: 'The customer service is outstanding and the delivery was super fast. The couple tees we got are our favorites now — comfortable, trendy, and the colors haven\'t faded even after multiple washes.',
    avatar: 'A&V',
  },
]

// ─── Section Heading ─────────────────────────────────────────────────────────
function SectionHeading({ title, subtitle, light = false }: { title: string; subtitle?: string; light?: boolean }) {
  return (
    <div className="text-center mb-10">
      <h2 className={`text-3xl sm:text-4xl font-bold mb-3 ${light ? 'text-white' : 'text-gradient'}`}>
        {title}
      </h2>
      {subtitle && (
        <p className={`text-base sm:text-lg max-w-xl mx-auto ${light ? 'text-white/80' : 'text-gray-500'}`}>
          {subtitle}
        </p>
      )}
      <div className="flex items-center justify-center gap-2 mt-4">
        <span className="w-8 h-[2px] bg-[#F7C8D0]" />
        <span className="w-2 h-2 rounded-full bg-[#D96C8A]" />
        <span className="w-8 h-[2px] bg-[#F7C8D0]" />
      </div>
    </div>
  )
}

// ─── Product Skeleton Grid ───────────────────────────────────────────────────
function ProductSkeletonGrid({ count = 4, columns = 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' }: { count?: number; columns?: string }) {
  return (
    <div className={`grid ${columns} gap-6`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl overflow-hidden border border-gray-100">
          <Skeleton className="aspect-[3/4] w-full" />
          <div className="p-4 space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Featured Horizontal Scroll Skeleton ─────────────────────────────────────
function FeaturedSkeletonRow() {
  return (
    <div className="flex gap-6 overflow-hidden">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex-shrink-0 w-[240px] bg-white rounded-xl overflow-hidden border border-gray-100">
          <Skeleton className="aspect-[3/4] w-full" />
          <div className="p-4 space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Category Skeleton Grid ──────────────────────────────────────────────────
function CategorySkeletonGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl overflow-hidden border border-gray-100">
          <Skeleton className="aspect-square w-full" />
          <div className="p-4 space-y-2">
            <Skeleton className="h-4 w-24 mx-auto" />
            <Skeleton className="h-3 w-16 mx-auto" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── 1. Hero Banner Carousel ────────────────────────────────────────────────
function HeroBanner() {
  const [current, setCurrent] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const navigate = useStore((s) => s.navigate)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const goTo = useCallback((index: number) => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setCurrent(index)
    setTimeout(() => setIsTransitioning(false), 600)
  }, [isTransitioning])

  const next = useCallback(() => goTo((current + 1) % heroSlides.length), [current, goTo])
  const prev = useCallback(() => goTo((current - 1 + heroSlides.length) % heroSlides.length), [current, goTo])

  useEffect(() => {
    timerRef.current = setInterval(next, 5000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [next])

  const slide = heroSlides[current]

  return (
    <section className="relative w-full h-[500px] sm:h-[560px] lg:h-[620px] overflow-hidden bg-[#0B1F3A]">
      {/* Slides */}
      {heroSlides.map((s, i) => (
        <div
          key={i}
          className={`absolute inset-0 bg-gradient-to-r ${s.gradient} transition-all duration-700 ease-in-out ${
            i === current ? 'opacity-100 translate-x-0' : i < current ? 'opacity-0 -translate-x-full' : 'opacity-0 translate-x-full'
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center">
            <div className="grid lg:grid-cols-2 gap-8 items-center w-full">
              <div className={`space-y-6 transition-all duration-700 delay-200 ${
                i === current ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}>
                <p className="text-sm sm:text-base font-medium tracking-widest uppercase" style={{ color: s.accent }}>
                  StyleWithHer
                </p>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-white">
                  {s.headline}
                  <br />
                  <span style={{ color: s.accent }}>{s.subtitle}</span>
                </h1>
                <p className="text-white/80 text-base sm:text-lg max-w-md leading-relaxed">
                  {s.description}
                </p>
                <div className="flex gap-4 pt-2">
                  <Button
                    onClick={() => navigate('products')}
                    size="lg"
                    className="btn-glow bg-white text-[#0B1F3A] hover:bg-white/90 font-semibold px-8 h-12 rounded-full text-base"
                  >
                    {s.cta} <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className={`hidden lg:flex justify-center transition-all duration-700 delay-300 ${
                i === current ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
              }`}>
                <div className="relative">
                  <div className="w-72 h-96 rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                    <img src={s.image} alt={s.headline} className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-[#D96C8A]/20 rounded-full blur-2xl" />
                  <div className="absolute -top-4 -left-4 w-32 h-32 bg-[#F7C8D0]/20 rounded-full blur-2xl" />
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Arrows */}
      <button
        onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all z-10"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all z-10"
        aria-label="Next slide"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2.5 z-10">
        {heroSlides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`h-2.5 rounded-full transition-all duration-300 ${
              i === current ? 'w-8 bg-white' : 'w-2.5 bg-white/40 hover:bg-white/60'
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  )
}

// ─── 2. Categories Section ───────────────────────────────────────────────────
function CategoriesSection() {
  const [categories, setCategories] = useState<CategoryData[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useStore((s) => s.navigate)

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((data) => setCategories(data.categories || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <section className="py-16 sm:py-20 animate-fadeIn">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <SectionHeading title="Shop by Category" subtitle="Find the perfect match for every occasion" />
        {loading ? (
          <CategorySkeletonGrid />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => navigate('products', { gender: cat.gender, category: cat.slug })}
                className="group cursor-pointer text-left bg-white rounded-xl overflow-hidden border border-gray-100 card-premium"
              >
                <div className="aspect-square bg-[#FFF5F7] overflow-hidden relative">
                  <img
                    src={cat.image || `https://placehold.co/400x400/FFF5F7/0B1F3A?text=${encodeURIComponent(cat.name)}`}
                    alt={cat.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0B1F3A]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="p-4 text-center">
                  <h3 className="font-semibold text-[#222222] text-sm sm:text-base group-hover:text-[#D96C8A] transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    {cat.productCount || cat._count?.products || 0} Products
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

// ─── 3. Featured Products (Horizontal Scroll) ────────────────────────────────
function FeaturedSection() {
  const [products, setProducts] = useState<ProductData[]>([])
  const [loading, setLoading] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/products?featured=true&limit=8')
      .then((r) => r.json())
      .then((data) => setProducts(data.products || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return
    const amount = dir === 'left' ? -280 : 280
    scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' })
  }

  return (
    <section className="py-16 sm:py-20 bg-[#FFF5F7] animate-fadeIn">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gradient">Featured Collection</h2>
            <p className="text-gray-500 text-base mt-2">Handpicked favorites for the season</p>
            <div className="flex items-center gap-2 mt-3">
              <span className="w-8 h-[2px] bg-[#F7C8D0]" />
              <span className="w-2 h-2 rounded-full bg-[#D96C8A]" />
              <span className="w-8 h-[2px] bg-[#F7C8D0]" />
            </div>
          </div>
          <div className="hidden sm:flex gap-2">
            <button
              onClick={() => scroll('left')}
              className="w-10 h-10 rounded-full border border-[#D96C8A]/30 flex items-center justify-center text-[#D96C8A] hover:bg-[#D96C8A] hover:text-white transition-all"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="w-10 h-10 rounded-full border border-[#D96C8A]/30 flex items-center justify-center text-[#D96C8A] hover:bg-[#D96C8A] hover:text-white transition-all"
              aria-label="Scroll right"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
        {loading ? (
          <FeaturedSkeletonRow />
        ) : (
          <div
            ref={scrollRef}
            className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {products.map((product) => (
              <div key={product.id} className="flex-shrink-0 w-[220px] sm:w-[250px] snap-start">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

// ─── 4. Promotional Banner ───────────────────────────────────────────────────
function PromoBanner() {
  const navigate = useStore((s) => s.navigate)
  return (
    <section className="py-16 sm:py-20 animate-fadeIn">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#0B1F3A] via-[#142d50] to-[#D96C8A] p-10 sm:p-14 lg:p-16">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#F7C8D0]/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl" />
          <div className="absolute top-1/2 right-1/4 w-3 h-3 bg-[#F7C8D0] rounded-full opacity-60" />
          <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-white rounded-full opacity-40" />
          <div className="absolute bottom-1/3 left-1/3 w-2 h-2 bg-[#D96C8A] rounded-full opacity-50" />

          <div className="relative z-10 text-center max-w-2xl mx-auto">
            <p className="text-[#F7C8D0] text-sm font-medium tracking-widest uppercase mb-4">Limited Time Offer</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">
              Complete Your
              <span className="block text-[#F7C8D0]">Couple Look</span>
            </h2>
            <p className="text-white/70 text-base sm:text-lg mb-8 leading-relaxed">
              Shop matching sets for him & her and get an exclusive 20% off on your first couple order. 
              Because love looks better when you match.
            </p>
            <Button
              onClick={() => navigate('products')}
              size="lg"
              className="btn-glow bg-[#F7C8D0] text-[#0B1F3A] hover:bg-[#F7C8D0]/90 font-semibold px-10 h-12 rounded-full text-base"
            >
              Shop Matching Sets <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Product Grid Section (reusable for Trending, New, Best Sellers) ─────────
function ProductGridSection({
  title,
  subtitle,
  query,
  limit = 8,
  columns = 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  bgClass = '',
  viewAllParams,
}: {
  title: string
  subtitle: string
  query: string
  limit?: number
  columns?: string
  bgClass?: string
  viewAllParams?: Record<string, string>
}) {
  const [products, setProducts] = useState<ProductData[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useStore((s) => s.navigate)

  useEffect(() => {
    fetch(`/api/products?${query}&limit=${limit}`)
      .then((r) => r.json())
      .then((data) => setProducts(data.products || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [query, limit])

  return (
    <section className={`py-16 sm:py-20 animate-fadeIn ${bgClass}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <SectionHeading title={title} subtitle={subtitle} />
        {loading ? (
          <ProductSkeletonGrid count={limit <= 4 ? 4 : 8} columns={columns} />
        ) : (
          <>
            <div className={`grid ${columns} gap-6`}>
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <div className="text-center mt-10">
              <Button
                onClick={() => navigate('products', viewAllParams || {})}
                variant="outline"
                className="border-[#D96C8A]/30 text-[#D96C8A] hover:bg-[#D96C8A] hover:text-white rounded-full px-8 h-11 font-medium transition-all"
              >
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </div>
    </section>
  )
}

// ─── 8. Testimonials Section ─────────────────────────────────────────────────
function TestimonialsSection() {
  return (
    <section className="py-16 sm:py-20 bg-[#FFF5F7] animate-fadeIn">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <SectionHeading
          title="What Our Couples Say"
          subtitle="Real stories from real couples who love StyleWithHer"
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="bg-white rounded-xl p-6 sm:p-8 border border-gray-100 card-premium relative"
            >
              {/* Quote mark */}
              <div className="absolute -top-3 left-8 w-8 h-8 bg-[#D96C8A] rounded-full flex items-center justify-center">
                <span className="text-white text-lg font-serif leading-none">&ldquo;</span>
              </div>
              {/* Stars */}
              <div className="flex items-center gap-1 mb-4 pt-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`h-4 w-4 ${
                      s <= t.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200 fill-gray-200'
                    }`}
                  />
                ))}
              </div>
              {/* Text */}
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-6">
                &ldquo;{t.text}&rdquo;
              </p>
              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D96C8A] to-[#F7C8D0] flex items-center justify-center text-white text-xs font-bold">
                  {t.avatar}
                </div>
                <div>
                  <p className="font-semibold text-[#0B1F3A] text-sm">{t.names}</p>
                  <p className="text-xs text-gray-400">{t.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── 9. Trust Badges ─────────────────────────────────────────────────────────
function TrustBadges() {
  const badges = [
    { icon: Shield, title: 'Premium Quality', description: 'Finest fabrics & craftsmanship' },
    { icon: Truck, title: 'Free Shipping', description: 'On orders above Rs.999' },
    { icon: RotateCcw, title: 'Easy Returns', description: '7-day hassle-free returns' },
    { icon: CreditCard, title: 'Secure Payment', description: '100% secure checkout' },
  ]

  return (
    <section className="py-16 sm:py-20 animate-fadeIn">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {badges.map((badge, i) => (
            <div
              key={i}
              className="flex flex-col items-center text-center p-6 rounded-xl bg-white border border-gray-100 card-premium group"
            >
              <div className="w-14 h-14 rounded-full bg-[#FFF5F7] flex items-center justify-center mb-4 group-hover:bg-[#D96C8A] transition-colors duration-300">
                <badge.icon className="h-6 w-6 text-[#D96C8A] group-hover:text-white transition-colors duration-300" />
              </div>
              <h3 className="font-semibold text-[#0B1F3A] text-sm sm:text-base mb-1">{badge.title}</h3>
              <p className="text-xs sm:text-sm text-gray-400">{badge.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── 10. Instagram Feed Section ─────────────────────────────────────────────
function InstagramFeedSection() {
  const posts = [
    { id: 1, image: 'https://placehold.co/400x400/0B1F3A/F7C8D0?text=Post+1', alt: 'StyleWithHer Instagram post 1' },
    { id: 2, image: 'https://placehold.co/400x400/D96C8A/FFFFFF?text=Post+2', alt: 'StyleWithHer Instagram post 2' },
    { id: 3, image: 'https://placehold.co/400x400/F7C8D0/0B1F3A?text=Post+3', alt: 'StyleWithHer Instagram post 3' },
    { id: 4, image: 'https://placehold.co/400x400/0B1F3A/D96C8A?text=Post+4', alt: 'StyleWithHer Instagram post 4' },
    { id: 5, image: 'https://placehold.co/400x400/D96C8A/F7C8D0?text=Post+5', alt: 'StyleWithHer Instagram post 5' },
    { id: 6, image: 'https://placehold.co/400x400/FFF5F7/D96C8A?text=Post+6', alt: 'StyleWithHer Instagram post 6' },
  ]

  return (
    <section className="py-16 sm:py-20 bg-[#0B1F3A] animate-fadeIn">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Instagram className="h-6 w-6 text-[#F7C8D0]" />
            <span className="text-[#F7C8D0] text-sm font-medium tracking-widest uppercase">Follow Us</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">@Style_withher01</h2>
          <p className="text-white/60 text-base max-w-md mx-auto">Follow our journey and get inspired by couple fashion, behind-the-scenes, and exclusive previews</p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <span className="w-8 h-[2px] bg-[#F7C8D0]" />
            <span className="w-2 h-2 rounded-full bg-[#D96C8A]" />
            <span className="w-8 h-[2px] bg-[#F7C8D0]" />
          </div>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {posts.map((post) => (
            <a
              key={post.id}
              href="https://instagram.com/Style_withher01"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative aspect-square rounded-lg overflow-hidden"
            >
              <img
                src={post.image}
                alt={post.alt}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-[#D96C8A]/0 group-hover:bg-[#D96C8A]/50 transition-colors duration-300 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-2 text-white">
                  <Heart className="h-6 w-6 fill-white" />
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Main HomePage Component ─────────────────────────────────────────────────
export default function HomePage() {
  return (
    <main>
      {/* 1. Hero Banner */}
      <HeroBanner />

      {/* 2. Categories */}
      <CategoriesSection />

      {/* 3. Featured Products - Horizontal Scroll */}
      <FeaturedSection />

      {/* 4. Promotional Banner */}
      <PromoBanner />

      {/* 5. Trending Products */}
      <ProductGridSection
        title="Trending Now"
        subtitle="The hottest picks loved by couples everywhere"
        query="trending=true"
        limit={8}
        columns="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
      />

      {/* 6. New Arrivals */}
      <ProductGridSection
        title="New Arrivals"
        subtitle="Fresh styles just dropped for you and your partner"
        query="newArrival=true"
        limit={4}
        columns="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
        bgClass="bg-[#FFF5F7]"
        viewAllParams={{ newArrival: 'true' }}
      />

      {/* 7. Best Sellers */}
      <ProductGridSection
        title="Best Sellers"
        subtitle="Our most loved couple favorites"
        query="bestSeller=true"
        limit={4}
        columns="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
        viewAllParams={{ bestSeller: 'true' }}
      />

      {/* 8. Testimonials */}
      <TestimonialsSection />

      {/* 9. Trust Badges */}
      <TrustBadges />

      {/* 10. Instagram Feed */}
      <InstagramFeedSection />
    </main>
  )
}