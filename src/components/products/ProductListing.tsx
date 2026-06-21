'use client'

import { useState, useEffect, useCallback } from 'react'
import { useStore, ProductData, CategoryData } from '@/store/use-store'
import ProductCard from '@/components/shared/ProductCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Slider } from '@/components/ui/slider'
import { Star, SlidersHorizontal, X, ChevronDown, ChevronUp, Search } from 'lucide-react'

import { useTranslation } from '@/i18n/use-language'
const COLORS = [
  'Navy Blue', 'Soft Pink', 'White', 'Black', 'Blush',
  'Rose', 'Charcoal', 'Cream', 'Lavender', 'Sage Green',
]

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

const GENDERS = ['Men', 'Women', 'Couple', 'Unisex']

interface FilterSectionProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}

function FilterSection({ title, children, defaultOpen = true }: FilterSectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-gray-100 pb-4 mb-4 last:border-0 last:mb-0 last:pb-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-sm font-semibold text-[#0B1F3A] mb-3 hover:text-[#D96C8A] transition-colors"
      >
        {title}
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {open && <div className="space-y-2">{children}</div>}
    </div>
  )
}

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="aspect-[3/4] w-full rounded-xl bg-gray-100" />
          <Skeleton className="h-3 w-16 rounded bg-gray-100" />
          <Skeleton className="h-4 w-full rounded bg-gray-100" />
          <Skeleton className="h-3 w-20 rounded bg-gray-100" />
          <Skeleton className="h-5 w-24 rounded bg-gray-100" />
        </div>
      ))}
    </div>
  )
}

export default function ProductListing() {
  const { t } = useTranslation()
  const { searchQuery, pageParams, navigate, showToast } = useStore()

  const SORT_OPTIONS = [
    { value: 'newest', label: t('products.sortLatest') },
    { value: 'popular', label: t('products.sortPopular') },
    { value: 'price-asc', label: t('products.sortPriceLow') },
    { value: 'price-desc', label: t('products.sortPriceHigh') },
  ]

  // Data
  const [products, setProducts] = useState<ProductData[]>([])
  const [categories, setCategories] = useState<CategoryData[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedGenders, setSelectedGenders] = useState<string[]>([])
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [minRating, setMinRating] = useState(0)
  const [inStockOnly, setInStockOnly] = useState(false)
  const [sort, setSort] = useState('newest')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  const [sheetOpen, setSheetOpen] = useState(false)

  const limit = 12

  // Initialize search from store
  useEffect(() => {
    const q = pageParams.search || searchQuery || ''
    if (q) setSearch(q)
  }, [pageParams.search, searchQuery])

  // Fetch categories
  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        const cats: CategoryData[] = (data.categories || []).map((c: Record<string, string>) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          description: c.description,
          gender: c.gender,
          image: c.image,
          _count: { products: c.productCount || 0 },
        }))
        setCategories(cats)
      })
      .catch(() => {})
  }, [])

  // Fetch products
  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('limit', limit.toString())
      params.set('sort', sort)

      if (search) params.set('search', search)
      if (selectedCategory) params.set('category', selectedCategory)
      if (selectedGenders.length > 0) params.set('gender', selectedGenders[0].toLowerCase())
      if (selectedColors.length > 0) params.set('color', selectedColors[0])
      if (selectedSizes.length > 0) params.set('size', selectedSizes[0])
      if (minPrice) params.set('minPrice', minPrice)
      if (maxPrice) params.set('maxPrice', maxPrice)
      if (minRating > 0) params.set('rating', minRating.toString())
      if (inStockOnly) params.set('availability', 'inStock')

      const res = await fetch(`/api/products?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setProducts(data.products || [])
        setTotal(data.pagination?.total || 0)
        setTotalPages(data.pagination?.totalPages || 1)
      }
    } catch {
      showToast('Failed to load products', 'error')
    } finally {
      setLoading(false)
    }
  }, [search, selectedCategory, selectedGenders, selectedColors, selectedSizes, minPrice, maxPrice, minRating, inStockOnly, sort, page, limit, showToast])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [search, selectedCategory, selectedGenders, selectedColors, selectedSizes, minPrice, maxPrice, minRating, inStockOnly, sort])

  // Filter handlers
  const toggleGender = (g: string) => {
    setSelectedGenders(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g])
  }
  const toggleColor = (c: string) => {
    setSelectedColors(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])
  }
  const toggleSize = (s: string) => {
    setSelectedSizes(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }

  const clearAllFilters = () => {
    setSelectedCategory('')
    setSelectedGenders([])
    setSelectedColors([])
    setSelectedSizes([])
    setMinPrice('')
    setMaxPrice('')
    setMinRating(0)
    setInStockOnly(false)
    setSort('newest')
    setSearch('')
  }

  // Active filter tags
  const activeFilters: { key: string; label: string; onClear: () => void }[] = []
  if (search) activeFilters.push({ key: 'search', label: `Search: "${search}"`, onClear: () => setSearch('') })
  if (selectedCategory) {
    const cat = categories.find(c => c.slug === selectedCategory)
    activeFilters.push({ key: 'category', label: cat?.name || selectedCategory, onClear: () => setSelectedCategory('') })
  }
  selectedGenders.forEach(g => activeFilters.push({ key: `gender-${g}`, label: g, onClear: () => toggleGender(g) }))
  selectedColors.forEach(c => activeFilters.push({ key: `color-${c}`, label: c, onClear: () => toggleColor(c) }))
  selectedSizes.forEach(s => activeFilters.push({ key: `size-${s}`, label: `Size: ${s}`, onClear: () => toggleSize(s) }))
  if (minPrice) activeFilters.push({ key: 'minPrice', label: `Min: Rs.${minPrice}`, onClear: () => setMinPrice('') })
  if (maxPrice) activeFilters.push({ key: 'maxPrice', label: `Max: Rs.${maxPrice}`, onClear: () => setMaxPrice('') })
  if (minRating > 0) activeFilters.push({ key: 'rating', label: `${minRating}+ Stars`, onClear: () => setMinRating(0) })
  if (inStockOnly) activeFilters.push({ key: 'stock', label: 'In Stock', onClear: () => setInStockOnly(false) })
  if (sort !== 'newest') {
    const sortLabel = SORT_OPTIONS.find(o => o.value === sort)?.label
    if (sortLabel) activeFilters.push({ key: 'sort', label: `Sort: ${sortLabel}`, onClear: () => setSort('newest') })
  }

  // Sidebar content (shared between desktop and mobile)
  const sidebarContent = (
    <div className="space-y-0">
      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search products..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 h-10 border-gray-200 focus-visible:ring-[#D96C8A]/30"
        />
      </div>

      {/* Category */}
      <FilterSection title="Category">
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {categories.map(cat => (
            <div key={cat.id} className="flex items-center gap-2">
              <Checkbox
                id={`cat-${cat.id}`}
                checked={selectedCategory === cat.slug}
                onCheckedChange={(checked) => {
                  setSelectedCategory(checked ? cat.slug : '')
                }}
                className="data-[state=checked]:bg-[#D96C8A] data-[state=checked]:border-[#D96C8A]"
              />
              <Label
                htmlFor={`cat-${cat.id}`}
                className="text-sm text-gray-600 cursor-pointer flex-1 flex items-center justify-between"
              >
                {cat.name}
                <span className="text-xs text-gray-400">({cat._count?.products || 0})</span>
              </Label>
            </div>
          ))}
          {categories.length === 0 && (
            <p className="text-sm text-gray-400">Loading categories...</p>
          )}
        </div>
      </FilterSection>

      {/* Gender */}
      <FilterSection title="Gender">
        <div className="space-y-2">
          {GENDERS.map(g => (
            <div key={g} className="flex items-center gap-2">
              <Checkbox
                id={`gender-${g}`}
                checked={selectedGenders.includes(g)}
                onCheckedChange={() => toggleGender(g)}
                className="data-[state=checked]:bg-[#D96C8A] data-[state=checked]:border-[#D96C8A]"
              />
              <Label htmlFor={`gender-${g}`} className="text-sm text-gray-600 cursor-pointer">{g}</Label>
            </div>
          ))}
        </div>
      </FilterSection>

      {/* Price Range */}
      <FilterSection title="Price Range">
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={e => setMinPrice(e.target.value)}
            className="h-9 text-sm border-gray-200 focus-visible:ring-[#D96C8A]/30"
            min={0}
          />
          <span className="text-gray-400 text-sm">—</span>
          <Input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={e => setMaxPrice(e.target.value)}
            className="h-9 text-sm border-gray-200 focus-visible:ring-[#D96C8A]/30"
            min={0}
          />
        </div>
        <div className="pt-2 px-1">
          <Slider
            value={[
              minPrice ? Number(minPrice) : 0,
              maxPrice ? Number(maxPrice) : 10000,
            ]}
            onValueChange={(val) => {
              setMinPrice(val[0] === 0 ? '' : val[0].toString())
              setMaxPrice(val[1] === 10000 ? '' : val[1].toString())
            }}
            min={0}
            max={10000}
            step={100}
            className="py-2"
          />
        </div>
      </FilterSection>

      {/* Color */}
      <FilterSection title="Color">
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {COLORS.map(c => (
            <div key={c} className="flex items-center gap-2">
              <Checkbox
                id={`color-${c}`}
                checked={selectedColors.includes(c)}
                onCheckedChange={() => toggleColor(c)}
                className="data-[state=checked]:bg-[#D96C8A] data-[state=checked]:border-[#D96C8A]"
              />
              <Label htmlFor={`color-${c}`} className="text-sm text-gray-600 cursor-pointer">{c}</Label>
            </div>
          ))}
        </div>
      </FilterSection>

      {/* Size */}
      <FilterSection title="Size">
        <div className="flex flex-wrap gap-2">
          {SIZES.map(s => (
            <button
              key={s}
              onClick={() => toggleSize(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                selectedSizes.includes(s)
                  ? 'bg-[#0B1F3A] text-white border-[#0B1F3A]'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-[#0B1F3A] hover:text-[#0B1F3A]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Rating */}
      <FilterSection title="Rating">
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map(r => (
            <button
              key={r}
              onClick={() => setMinRating(minRating === r ? 0 : r)}
              className={`flex items-center gap-1.5 w-full p-1.5 rounded-md transition-colors ${
                minRating === r ? 'bg-[#FFF5F7]' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3.5 w-3.5 ${
                      i < r ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-500">& Up</span>
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Availability */}
      <FilterSection title="Availability" defaultOpen={false}>
        <div className="flex items-center gap-2">
          <Checkbox
            id="in-stock"
            checked={inStockOnly}
            onCheckedChange={(checked) => setInStockOnly(!!checked)}
            className="data-[state=checked]:bg-[#D96C8A] data-[state=checked]:border-[#D96C8A]"
          />
          <Label htmlFor="in-stock" className="text-sm text-gray-600 cursor-pointer">
            In Stock Only
          </Label>
        </div>
      </FilterSection>

      {/* Clear All */}
      {activeFilters.length > 0 && (
        <div className="pt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-[#D96C8A] hover:text-[#D96C8A] hover:bg-[#FFF5F7] text-xs w-full"
          >
            Clear All Filters
          </Button>
        </div>
      )}
    </div>
  )

  // Pagination
  const getPaginationPages = () => {
    const pages: (number | string)[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (page > 3) pages.push('...')
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
        pages.push(i)
      }
      if (page < totalPages - 2) pages.push('...')
      pages.push(totalPages)
    }
    return pages
  }

  return (
    <section className="min-h-screen bg-white">
      {/* Page Header */}
      <div className="bg-[#FFF5F7] border-b border-[#F7C8D0]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0B1F3A]">Shop All Products</h1>
          <p className="text-sm text-gray-500 mt-1">
            {loading ? (
              'Loading...'
            ) : (
              <>Showing {products.length} of {total} products</>
            )}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Top Bar: Sort + Mobile Filter Button */}
        <div className="flex items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-3">
            {/* Mobile filter button */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="lg:hidden border-[#0B1F3A] text-[#0B1F3A] hover:bg-[#0B1F3A] hover:text-white gap-2"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                  {activeFilters.length > 0 && (
                    <Badge className="bg-[#D96C8A] text-white text-[10px] px-1.5 py-0 hover:bg-[#D96C8A] ml-1">
                      {activeFilters.length}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 overflow-y-auto p-6">
                <SheetTitle className="text-lg font-bold text-[#0B1F3A] mb-6">Filters</SheetTitle>
                {sidebarContent}
                <div className="mt-6 lg:hidden">
                  <Button
                    onClick={() => setSheetOpen(false)}
                    className="w-full bg-[#0B1F3A] hover:bg-[#0B1F3A]/90 text-white"
                  >
                    Show {total} Results
                  </Button>
                </div>
              </SheetContent>
            </Sheet>

            {/* Sort dropdown */}
            <div className="relative">
              <select
                value={sort}
                onChange={e => setSort(e.target.value)}
                className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 pr-8 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#D96C8A]/30 cursor-pointer"
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Result count (desktop) */}
          <p className="hidden sm:block text-sm text-gray-500">
            {total} product{total !== 1 ? 's' : ''} found
          </p>
        </div>

        {/* Active Filter Tags */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="text-xs font-medium text-gray-500">Active Filters:</span>
            {activeFilters.map(f => (
              <Badge
                key={f.key}
                variant="secondary"
                className="bg-[#FFF5F7] text-[#0B1F3A] border border-[#F7C8D0]/50 text-xs px-2.5 py-1 gap-1 hover:bg-[#F7C8D0]/30 cursor-pointer"
                onClick={f.onClear}
              >
                {f.label}
                <X className="h-3 w-3" />
              </Badge>
            ))}
            <button
              onClick={clearAllFilters}
              className="text-xs text-[#D96C8A] hover:underline ml-1"
            >
              Clear All
            </button>
          </div>
        )}

        <div className="flex gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24">
              <h2 className="text-sm font-bold text-[#0B1F3A] uppercase tracking-wider mb-4 flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Filters
              </h2>
              {sidebarContent}
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <ProductGridSkeleton />
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-24 h-24 rounded-full bg-[#FFF5F7] flex items-center justify-center mb-6">
                  <Search className="h-10 w-10 text-[#D96C8A]" />
                </div>
                <h3 className="text-xl font-semibold text-[#0B1F3A] mb-2">No products found</h3>
                <p className="text-gray-500 text-sm max-w-md mb-6">
                  We couldn&apos;t find any products matching your current filters. Try adjusting or clearing them to see more results.
                </p>
                <Button
                  onClick={clearAllFilters}
                  className="bg-[#0B1F3A] hover:bg-[#0B1F3A]/90 text-white px-6"
                >
                  Clear All Filters
                </Button>
              </div>
            ) : (
              <>
                {/* Product Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                  {products.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-1 mt-10 pb-4">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      className="h-9 px-3 text-xs border-gray-200 disabled:opacity-40"
                    >
                      Previous
                    </Button>

                    {getPaginationPages().map((p, i) =>
                      typeof p === 'string' ? (
                        <span key={`dots-${i}`} className="px-2 text-gray-400 text-sm">
                          ...
                        </span>
                      ) : (
                        <Button
                          key={p}
                          variant={page === p ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setPage(p)}
                          className={`h-9 w-9 p-0 text-xs ${
                            page === p
                              ? 'bg-[#0B1F3A] hover:bg-[#0B1F3A] text-white'
                              : 'border-gray-200 text-gray-600 hover:text-[#0B1F3A] hover:border-[#0B1F3A]'
                          }`}
                        >
                          {p}
                        </Button>
                      )
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      className="h-9 px-3 text-xs border-gray-200 disabled:opacity-40"
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}