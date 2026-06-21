'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useStore } from '@/store/use-store'
import { useTranslation } from '@/i18n/use-language'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import {
  Plus, Pencil, Trash2, Search, Upload, X, ImageIcon, GripVertical,
  Star, TrendingUp, Sparkles, Award, Eye, EyeOff, ChevronLeft, ChevronRight,
  Loader2, Package, Camera, Info, ArrowUpDown,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────
interface ProductImage {
  id?: string
  url: string
  alt?: string
  sortOrder: number
  isNew?: boolean
  isDeleted?: boolean
}

interface ProductVariant {
  id?: string
  color: string
  size: string
  sku: string
  price?: number
  stock: number
  isActive: boolean
  isNew?: boolean
  isDeleted?: boolean
}

interface ProductFormState {
  name: string
  slug: string
  categoryId: string
  gender: string
  basePrice: string
  salePrice: string
  material: string
  care: string
  sizeDetails: string
  colorDetails: string
  styleDetails: string
  deliveryInfo: string
  returnInfo: string
  isFeatured: boolean
  isTrending: boolean
  isNewArrival: boolean
  isBestSeller: boolean
  isActive: boolean
  images: ProductImage[]
  variants: ProductVariant[]
}

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', 'Free Size']
const COLORS = [
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Red', hex: '#DC2626' },
  { name: 'Blue', hex: '#2563EB' },
  { name: 'Green', hex: '#16A34A' },
  { name: 'Pink', hex: '#EC4899' },
  { name: 'Navy', hex: '#1E3A5F' },
  { name: 'Maroon', hex: '#800000' },
  { name: 'Yellow', hex: '#EAB308' },
  { name: 'Purple', hex: '#9333EA' },
  { name: 'Orange', hex: '#EA580C' },
  { name: 'Beige', hex: '#D4A574' },
  { name: 'Grey', hex: '#6B7280' },
  { name: 'Teal', hex: '#0D9488' },
  { name: 'Cream', hex: '#FFFDD0' },
  { name: 'Peach', hex: '#FFDAB9' },
  { name: 'Lavender', hex: '#B57EDC' },
  { name: 'Brown', hex: '#92400E' },
  { name: 'Olive', hex: '#606C38' },
  { name: 'Coral', hex: '#FF7F50' },
]

const authHeaders = () => {
  const u = useStore.getState().user
  return u?.token ? { Authorization: `Bearer ${u.token}` } : {}
}
const fmt = (n: number) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(n)

const emptyForm: ProductFormState = {
  name: '', slug: '', categoryId: '', gender: 'unisex',
  basePrice: '', salePrice: '', material: '', care: '',
  sizeDetails: '', colorDetails: '', styleDetails: '', deliveryInfo: '', returnInfo: '',
  isFeatured: false, isTrending: false, isNewArrival: false, isBestSeller: false,
  isActive: true, images: [], variants: [],
}

// ─── Product Image Uploader ─────────────────────────────────────────────────
function ImageUploader({ images, setImages, helperText }: {
  images: ProductImage[]
  setImages: (imgs: ProductImage[]) => void
  helperText?: string
}) {
  const { t } = useTranslation()
  const { showToast } = useStore()
  const [uploading, setUploading] = useState(false)
  const [uploadCount, setUploadCount] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  // Client-side file → base64 (works on any serverless platform, no Sharp needed)
  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsDataURL(file)
    })

  // Resize image on client side using canvas (auto WebP, max 1200px)
  const compressImage = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      if (file.type === 'image/gif' || file.type === 'image/svg+xml') {
        // Can't compress GIF (animation) or SVG — return as-is
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () => reject(new Error('Failed to read file'))
        reader.readAsDataURL(file)
        return
      }
      const img = new Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        const MAX = 1200
        let w = img.width, h = img.height
        if (w > MAX || h > MAX) {
          if (w > h) { h = Math.round(h * MAX / w); w = MAX }
          else { w = Math.round(w * MAX / h); h = MAX }
        }
        const canvas = document.createElement('canvas')
        canvas.width = w; canvas.height = h
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, w, h)
        URL.revokeObjectURL(url)
        const dataUrl = canvas.toDataURL('image/webp', 0.8)
        resolve(dataUrl)
      }
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load image')) }
      img.src = url
    })

  const uploadFiles = async (files: FileList | File[]) => {
    setUploading(true)
    const fileArray = Array.from(files)
    const validFiles = fileArray.filter(f => f.type.startsWith('image/') && f.size <= 10 * 1024 * 1024)
    if (validFiles.length === 0) { showToast('No valid images. Use JPG, PNG, WebP, GIF under 10MB.', 'error'); setUploading(false); return }

    const results: ProductImage[] = []
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i]
      setUploadCount(`${i + 1}/${validFiles.length}`)
      try {
        // Compress on client, get base64 data URL
        const dataUrl = await compressImage(file)
        // Save to DB via API (just stores the data URL string)
        const res = await fetch('/api/admin/media', {
          method: 'POST',
          headers: { ...authHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: file.name, url: dataUrl, mimeType: file.type, size: file.size, alt: file.name }),
        })
        if (res.ok) {
          results.push({ url: dataUrl, alt: file.name, sortOrder: images.length + results.length, isNew: true })
        } else {
          const err = await res.json().catch(() => ({ error: 'Upload failed' }))
          showToast(`${file.name}: ${err.error || 'Upload failed'}`, 'error')
        }
      } catch (err: any) {
        showToast(`${file.name}: ${err.message || 'Error'}`, 'error')
      }
    }
    if (results.length > 0) {
      setImages([...images, ...results])
      showToast(`${results.length} photo${results.length > 1 ? 's' : ''} uploaded!`, 'success')
    }
    setUploadCount('')
    setUploading(false)
  }

  const removeImage = (index: number) => {
    const updated = [...images]
    if (updated[index].id) {
      updated[index] = { ...updated[index], isDeleted: true }
    } else {
      updated.splice(index, 1)
    }
    setImages(updated.filter(i => !i.isDeleted))
  }

  const setMainImage = (index: number) => {
    if (index === 0) return
    const updated = [...images]
    const [main] = updated.splice(index, 1)
    updated.unshift(main)
    updated.forEach((img, i) => { img.sortOrder = i })
    setImages(updated)
  }

  const moveImage = (from: number, to: number) => {
    if (to < 0 || to >= images.length) return
    const updated = [...images]
    const [moved] = updated.splice(from, 1)
    updated.splice(to, 0, moved)
    updated.forEach((img, i) => { img.sortOrder = i })
    setImages(updated)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files)
  }

  const activeImages = images.filter(i => !i.isDeleted)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold flex items-center gap-2">
          <Camera className="h-4 w-4 text-[#D96C8A]" />
          Upload Product Photos
        </Label>
        {activeImages.length > 0 && (
          <span className="text-xs text-muted-foreground">{activeImages.length} photo(s)</span>
        )}
      </div>
      {helperText && <p className="text-xs text-muted-foreground">{helperText}</p>}

      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all
          ${dragOver ? 'border-[#D96C8A] bg-[#FFF5F7]' : 'border-gray-200 hover:border-[#F7C8D0] hover:bg-gray-50'}`}
      >
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => e.target.files && uploadFiles(e.target.files)} />
        <Upload className={`h-8 w-8 mx-auto mb-2 ${dragOver ? 'text-[#D96C8A]' : 'text-gray-400'}`} />
        <p className="text-sm font-medium text-gray-700">
          {uploading ? `Uploading ${uploadCount} — compressing & optimizing...` : 'Click to upload or drag & drop'}
        </p>
        <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP, GIF — Max 10MB each — Multiple photos supported — Auto-compressed</p>
      </div>

      {/* Image Grid */}
      {activeImages.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {activeImages.map((img, idx) => (
            <div key={img.id || img.url} className={`relative group rounded-xl overflow-hidden border-2 transition-all ${idx === 0 ? 'border-[#D96C8A] shadow-md' : 'border-transparent hover:border-gray-200'}`}>
              <div className="aspect-square bg-[#FFF5F7]">
                <img src={img.url} alt={img.alt || `Product ${idx + 1}`} className="w-full h-full object-cover" />
              </div>
              {/* Main Image Badge */}
              {idx === 0 && (
                <div className="absolute top-1.5 left-1.5 bg-[#D96C8A] text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                  Main
                </div>
              )}
              {/* Overlay Actions */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                {idx > 0 && (
                  <button onClick={(e) => { e.stopPropagation(); setMainImage(idx) }} className="w-8 h-8 rounded-full bg-white text-[#0B1F3A] flex items-center justify-center hover:bg-gray-100" title="Set as main image">
                    <Star className="h-4 w-4" />
                  </button>
                )}
                {idx > 0 && (
                  <button onClick={(e) => { e.stopPropagation(); moveImage(idx, idx - 1) }} className="w-8 h-8 rounded-full bg-white text-[#0B1F3A] flex items-center justify-center hover:bg-gray-100" title="Move left">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                )}
                {idx < activeImages.length - 1 && (
                  <button onClick={(e) => { e.stopPropagation(); moveImage(idx, idx + 1) }} className="w-8 h-8 rounded-full bg-white text-[#0B1F3A] flex items-center justify-center hover:bg-gray-100" title="Move right">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                )}
                <button onClick={(e) => { e.stopPropagation(); removeImage(idx) }} className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600" title="Remove">
                  <X className="h-4 w-4" />
                </button>
              </div>
              {/* Reorder Handle */}
              <div className="absolute bottom-1.5 right-1.5 bg-white/90 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical className="h-3.5 w-3.5 text-gray-500" />
              </div>
            </div>
          ))}
        </div>
      )}
      {uploading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Compressing and uploading images...
        </div>
      )}
    </div>
  )
}

// ─── Variant Manager ────────────────────────────────────────────────────────
function VariantManager({ variants, setVariants }: {
  variants: ProductVariant[]
  setVariants: (v: ProductVariant[]) => void
}) {
  const addVariant = () => {
    const existingSkus = variants.filter(v => !v.isDeleted).map(v => v.sku)
    const baseSku = `SKU-${Date.now().toString(36).toUpperCase().slice(-6)}`
    let sku = baseSku
    let counter = 1
    while (existingSkus.includes(sku)) { sku = `${baseSku}-${counter++}` }
    setVariants([...variants, { color: '', size: 'M', sku, stock: 0, isActive: true, isNew: true }])
  }

  const updateVariant = (index: number, field: keyof ProductVariant, value: string | number | boolean) => {
    const updated = [...variants]
    updated[index] = { ...updated[index], [field]: value }
    if (field === 'color') {
      updated[index].sku = `${updated[index].size}-${String(value).toLowerCase()}-${Date.now().toString(36).toUpperCase().slice(-4)}`
    }
    if (field === 'size') {
      updated[index].sku = `${String(value)}-${(updated[index].color || 'default').toLowerCase()}-${Date.now().toString(36).toUpperCase().slice(-4)}`
    }
    setVariants(updated)
  }

  const removeVariant = (index: number) => {
    const updated = [...variants]
    if (updated[index].id) {
      updated[index] = { ...updated[index], isDeleted: true, isActive: false }
    } else {
      updated.splice(index, 1)
    }
    setVariants(updated.filter(v => !v.isDeleted))
  }

  const activeVariants = variants.filter(v => !v.isDeleted)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold flex items-center gap-2">
          <Package className="h-4 w-4 text-[#D96C8A]" />
          Size, Color & Stock Options
        </Label>
        <Button type="button" variant="outline" size="sm" onClick={addVariant} className="text-xs gap-1">
          <Plus className="h-3.5 w-3.5" /> Add Variant
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">Add different sizes and colors with stock quantity. Each combination is a separate variant.</p>

      {activeVariants.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
          <Package className="h-8 w-8 mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-muted-foreground">No variants added yet</p>
          <p className="text-xs text-muted-foreground mt-1">Click &quot;Add Variant&quot; to add size/color combinations</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Header */}
          <div className="hidden sm:grid sm:grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-2">
            <div className="col-span-3">Color</div>
            <div className="col-span-2">Size</div>
            <div className="col-span-2">Stock Qty</div>
            <div className="col-span-3">SKU</div>
            <div className="col-span-2 text-right">Action</div>
          </div>
          {activeVariants.map((v, idx) => (
            <div key={v.id || idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-2 rounded-lg border bg-white items-end">
              {/* Color */}
              <div className="sm:col-span-3">
                <Label className="text-xs text-muted-foreground sm:hidden">Color</Label>
                <Select value={v.color} onValueChange={(val) => updateVariant(idx, 'color', val)}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Select color" /></SelectTrigger>
                  <SelectContent>
                    {COLORS.map(c => (
                      <SelectItem key={c.name} value={c.name}>
                        <div className="flex items-center gap-2">
                          <span className="w-3.5 h-3.5 rounded-full border border-gray-200 inline-block" style={{ backgroundColor: c.hex }} />
                          {c.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Size */}
              <div className="sm:col-span-2">
                <Label className="text-xs text-muted-foreground sm:hidden">Size</Label>
                <Select value={v.size} onValueChange={(val) => updateVariant(idx, 'size', val)}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SIZES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {/* Stock */}
              <div className="sm:col-span-2">
                <Label className="text-xs text-muted-foreground sm:hidden">Stock Quantity</Label>
                <Input type="number" min="0" value={v.stock} onChange={(e) => updateVariant(idx, 'stock', parseInt(e.target.value) || 0)} className="h-9" placeholder="0" />
              </div>
              {/* SKU */}
              <div className="sm:col-span-3">
                <Label className="text-xs text-muted-foreground sm:hidden">SKU</Label>
                <Input value={v.sku} onChange={(e) => updateVariant(idx, 'sku', e.target.value)} className="h-9" placeholder="Auto-generated" />
              </div>
              {/* Remove */}
              <div className="sm:col-span-2 flex justify-end">
                <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => removeVariant(idx)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Product Preview ────────────────────────────────────────────────────────
function ProductPreview({ form, categories }: { form: ProductFormState; categories: any[] }) {
  const cat = categories.find(c => c.id === form.categoryId)
  const price = form.salePrice ? parseFloat(form.salePrice) : parseFloat(form.basePrice) || 0
  const hasDiscount = form.salePrice && parseFloat(form.salePrice) < parseFloat(form.basePrice)
  const discount = hasDiscount ? Math.round(((parseFloat(form.basePrice) - parseFloat(form.salePrice)) / parseFloat(form.basePrice)) * 100) : 0
  const mainImage = form.images.find(i => !i.isDeleted)

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm flex items-center gap-2"><Eye className="h-4 w-4 text-[#D96C8A]" /> Product Preview</h3>
      <div className="border rounded-xl overflow-hidden bg-white max-w-xs mx-auto">
        {/* Image */}
        <div className="aspect-[3/4] bg-[#FFF5F7] flex items-center justify-center">
          {mainImage ? (
            <img src={mainImage.url} alt={form.name || 'Preview'} className="w-full h-full object-cover" />
          ) : (
            <div className="text-center p-4">
              <ImageIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No photo uploaded</p>
            </div>
          )}
        </div>
        {/* Info */}
        <div className="p-4">
          {cat && <p className="text-[10px] text-[#D96C8A] font-medium uppercase tracking-wider mb-1">{cat.name}</p>}
          <h4 className="font-medium text-sm text-[#222222] line-clamp-2 mb-1.5">{form.name || 'Product Name'}</h4>
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#0B1F3A]">Rs.{price.toLocaleString()}</span>
            {hasDiscount && (
              <>
                <span className="text-xs text-gray-400 line-through">Rs.{parseFloat(form.basePrice).toLocaleString()}</span>
                <Badge className="bg-[#D96C8A] text-white text-[10px] px-1.5 py-0">{discount}% OFF</Badge>
              </>
            )}
          </div>
          {form.material && <p className="text-xs text-muted-foreground mt-2">Fabric: {form.material}</p>}
          {form.variants.filter(v => !v.isDeleted).length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">{form.variants.filter(v => !v.isDeleted).length} variant(s) available</p>
          )}
          <div className="flex gap-1 mt-2">
            {form.isNewArrival && <Badge className="bg-[#0B1F3A] text-white text-[10px]">NEW</Badge>}
            {form.isBestSeller && <Badge className="bg-amber-500 text-white text-[10px]">BEST SELLER</Badge>}
            {form.isFeatured && <Badge className="bg-[#D96C8A] text-white text-[10px]">FEATURED</Badge>}
            {form.isTrending && <Badge className="bg-purple-500 text-white text-[10px]">TRENDING</Badge>}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Product Form ──────────────────────────────────────────────────────
function ProductForm({ form, setForm, categories, loading, onSubmit, submitLabel, showPreview }: {
  form: ProductFormState; setForm: (f: ProductFormState) => void; categories: any[]
  loading: boolean; onSubmit: () => void; submitLabel: string; showPreview: boolean
}) {
  const update = (field: keyof ProductFormState, value: string | boolean | ProductImage[] | ProductVariant[]) => {
    setForm({ ...form, [field]: value })
    if (field === 'name') {
      const slug = String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      setForm((prev: ProductFormState) => ({ ...prev, slug }))
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-h-[80vh] overflow-y-auto pr-1">
      {/* Left: Form */}
      <div className="lg:col-span-2 space-y-6">
        {/* Section: Images */}
        <Card className="border-0 shadow-sm bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Camera className="h-4 w-4 text-[#D96C8A]" /> Product Photos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ImageUploader
              images={form.images}
              setImages={(imgs) => update('images', imgs)}
              helperText="Upload multiple photos. First photo will be the main display image. Drag to reorder."
            />
          </CardContent>
        </Card>

        {/* Section: Basic Info */}
        <Card className="border-0 shadow-sm bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Info className="h-4 w-4 text-[#D96C8A]" /> Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="pf-name">Product Name *</Label>
                <p className="text-[11px] text-muted-foreground">Enter the product name as customers will see it</p>
                <Input id="pf-name" value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="e.g. Rose Pink Couple T-Shirt" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pf-slug">URL Slug *</Label>
                <p className="text-[11px] text-muted-foreground">Auto-generated from name. Edit if needed.</p>
                <Input id="pf-slug" value={form.slug} onChange={(e) => update('slug', e.target.value)} placeholder="product-slug" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Category *</Label>
                <p className="text-[11px] text-muted-foreground">Select the product category</p>
                <Select value={form.categoryId} onValueChange={(v) => update('categoryId', v)}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Gender</Label>
                <p className="text-[11px] text-muted-foreground">Who is this product for?</p>
                <Select value={form.gender} onValueChange={(v) => update('gender', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="women">Women</SelectItem>
                    <SelectItem value="men">Men</SelectItem>
                    <SelectItem value="unisex">Unisex</SelectItem>
                    <SelectItem value="couple">Couple</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section: Pricing */}
        <Card className="border-0 shadow-sm bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="pf-base">Base Price (₹) *</Label>
                <p className="text-[11px] text-muted-foreground">Original MRP of the product</p>
                <Input id="pf-base" type="number" min="0" step="1" value={form.basePrice} onChange={(e) => update('basePrice', e.target.value)} placeholder="e.g. 1299" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pf-sale">Sale Price (₹)</Label>
                <p className="text-[11px] text-muted-foreground">Discounted selling price (leave empty if no discount)</p>
                <Input id="pf-sale" type="number" min="0" step="1" value={form.salePrice} onChange={(e) => update('salePrice', e.target.value)} placeholder="e.g. 999 (optional)" />
                {form.salePrice && form.basePrice && parseFloat(form.salePrice) < parseFloat(form.basePrice) && (
                  <p className="text-xs text-green-600 font-medium mt-1">
                    Discount: {Math.round(((parseFloat(form.basePrice) - parseFloat(form.salePrice)) / parseFloat(form.basePrice)) * 100)}% OFF
                    (Save ₹{fmt(parseFloat(form.basePrice) - parseFloat(form.salePrice))})
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section: Variants (Size, Color, Stock) */}
        <Card className="border-0 shadow-sm bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4 text-[#D96C8A]" /> Size, Color & Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <VariantManager variants={form.variants} setVariants={(v) => update('variants', v)} />
          </CardContent>
        </Card>

        {/* Section: Product Description */}
        <Card className="border-0 shadow-sm bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Product Description</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="pf-material">Fabric / Material</Label>
              <p className="text-[11px] text-muted-foreground">What is the product made of? (e.g. 100% Pure Cotton, Silk Blend)</p>
              <Input id="pf-material" value={form.material} onChange={(e) => update('material', e.target.value)} placeholder="e.g. 100% Pure Cotton" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="pf-sizedetails">Size Details</Label>
                <p className="text-[11px] text-muted-foreground">Describe the fit and measurements</p>
                <Textarea id="pf-sizedetails" value={form.sizeDetails} onChange={(e) => update('sizeDetails', e.target.value)} placeholder="e.g. Slim fit, Model wears size M. Chest: 40in, Length: 27in" rows={2} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pf-colordetails">Color Details</Label>
                <p className="text-[11px] text-muted-foreground">Describe the actual color appearance</p>
                <Textarea id="pf-colordetails" value={form.colorDetails} onChange={(e) => update('colorDetails', e.target.value)} placeholder="e.g. Beautiful pastel pink shade" rows={2} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pf-styledetails">Style Details</Label>
              <p className="text-[11px] text-muted-foreground">Describe the design, pattern, and style</p>
              <Textarea id="pf-styledetails" value={form.styleDetails} onChange={(e) => update('styleDetails', e.target.value)} placeholder="e.g. Elegant couple matching design with printed pattern, round neck, half sleeves" rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pf-care">Care Instructions</Label>
              <p className="text-[11px] text-muted-foreground">How should customers wash/care for this product?</p>
              <Textarea id="pf-care" value={form.care} onChange={(e) => update('care', e.target.value)} placeholder="e.g. Machine wash cold, gentle cycle. Do not bleach. Tumble dry low." rows={2} />
            </div>
          </CardContent>
        </Card>

        {/* Section: Delivery & Returns */}
        <Card className="border-0 shadow-sm bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Delivery & Return Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="pf-delivery">Delivery Information</Label>
              <p className="text-[11px] text-muted-foreground">Shipping details customers should know</p>
              <Textarea id="pf-delivery" value={form.deliveryInfo} onChange={(e) => update('deliveryInfo', e.target.value)} placeholder="e.g. Free shipping on orders above ₹999. Standard delivery in 3-5 business days." rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pf-return">Return / Exchange Information</Label>
              <p className="text-[11px] text-muted-foreground">Return policy for this product</p>
              <Textarea id="pf-return" value={form.returnInfo} onChange={(e) => update('returnInfo', e.target.value)} placeholder="e.g. Easy returns within 15 days. Items must be unused with original tags." rows={2} />
            </div>
          </CardContent>
        </Card>

        {/* Section: Product Flags */}
        <Card className="border-0 shadow-sm bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Visibility & Badges</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border bg-white">
              <div>
                <Label className="text-sm font-medium">Product Status</Label>
                <p className="text-[11px] text-muted-foreground">Available / Out of Stock</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs">{form.isActive ? 'Available' : 'Hidden'}</span>
                <Switch checked={form.isActive} onCheckedChange={(v) => update('isActive', v)} />
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { key: 'isFeatured' as const, label: 'Featured', desc: 'Show in featured section', icon: Star, color: 'text-[#D96C8A]' },
                { key: 'isTrending' as const, label: 'Trending', desc: 'Show in trending section', icon: TrendingUp, color: 'text-purple-500' },
                { key: 'isNewArrival' as const, label: 'New Arrival', desc: 'Mark as new product', icon: Sparkles, color: 'text-blue-500' },
                { key: 'isBestSeller' as const, label: 'Best Seller', desc: 'Mark as popular product', icon: Award, color: 'text-amber-500' },
              ].map(({ key, label, desc, icon: Icon, color }) => (
                <div key={key} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${color}`} />
                    <div>
                      <Label className="text-sm">{label}</Label>
                      <p className="text-[11px] text-muted-foreground">{desc}</p>
                    </div>
                  </div>
                  <Switch id={`pf-${key}`} checked={form[key] as boolean} onCheckedChange={(v) => update(key, v)} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex items-center gap-3 pt-2 pb-4 sticky bottom-0 bg-[#F8F9FA]/95 backdrop-sm border-t py-4 -mx-1 px-1 z-10">
          <Button
            onClick={onSubmit}
            disabled={loading || !form.name || !form.slug || !form.basePrice || !form.categoryId}
            className="flex-1 bg-[#0B1F3A] hover:bg-[#0B1F3A]/90 text-white h-11 font-medium"
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {submitLabel}
          </Button>
        </div>
      </div>

      {/* Right: Preview */}
      {showPreview && (
        <div className="lg:col-span-1">
          <div className="sticky top-4">
            <Card className="border-0 shadow-sm bg-white">
              <CardContent className="pt-6">
                <ProductPreview form={form} categories={categories} />
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Products Tab (Main) ────────────────────────────────────────────────────
export default function AdminProductManager() {
  const { showToast } = useStore()
  const { t } = useTranslation()
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [showPreview, setShowPreview] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ProductFormState>(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const [pRes, cRes] = await Promise.all([
        fetch('/api/products?limit=100', { headers: authHeaders() }),
        fetch('/api/categories'),
      ])
      if (!pRes.ok || !cRes.ok) throw new Error('Failed to fetch')
      const pJson = await pRes.json()
      const cJson = await cRes.json()
      setProducts(pJson.products || [])
      setCategories(cJson.categories || [])
    } catch (err: any) {
      showToast(err.message || 'Error loading products', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setShowPreview(true)
    setFormOpen(true)
  }

  const openEdit = (p: any) => {
    setEditingId(p.id)
    setForm({
      name: p.name, slug: p.slug,
      categoryId: p.categoryId || p.category?.id || '',
      gender: p.gender || 'unisex',
      basePrice: String(p.basePrice),
      salePrice: p.salePrice != null ? String(p.salePrice) : '',
      material: p.material || '', care: p.care || '',
      sizeDetails: '', colorDetails: '', styleDetails: '', deliveryInfo: '', returnInfo: '',
      isFeatured: p.isFeatured, isTrending: p.isTrending,
      isNewArrival: p.isNewArrival, isBestSeller: p.isBestSeller,
      isActive: p.isActive,
      images: (p.images || []).map((img: any) => ({ id: img.id, url: img.url, alt: img.alt, sortOrder: img.sortOrder })),
      variants: (p.variants || []).map((v: any) => ({
        id: v.id, color: v.color, size: v.size, sku: v.sku,
        price: v.price, stock: v.inventory?.quantity || 0,
        isActive: v.isActive, isNew: false,
      })),
    })
    setShowPreview(true)
    setFormOpen(true)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      // Build description from structured fields
      const descParts: string[] = []
      if (form.styleDetails) descParts.push(form.styleDetails)
      if (form.material) descParts.push(`Fabric: ${form.material}`)
      if (form.sizeDetails) descParts.push(`Size: ${form.sizeDetails}`)
      if (form.colorDetails) descParts.push(`Color: ${form.colorDetails}`)
      if (form.care) descParts.push(`Care: ${form.care}`)
      if (form.deliveryInfo) descParts.push(`Delivery: ${form.deliveryInfo}`)
      if (form.returnInfo) descParts.push(`Returns: ${form.returnInfo}`)
      const description = descParts.join('\n\n')

      const body: any = {
        name: form.name, slug: form.slug, description,
        basePrice: parseFloat(form.basePrice),
        salePrice: form.salePrice ? parseFloat(form.salePrice) : null,
        categoryId: form.categoryId, gender: form.gender,
        isFeatured: form.isFeatured, isTrending: form.isTrending,
        isNewArrival: form.isNewArrival, isBestSeller: form.isBestSeller,
        isActive: form.isActive,
        material: form.material, care: form.care,
        images: form.images.map((img, i) => ({ url: img.url, alt: img.alt || form.name, sortOrder: i })),
        variants: form.variants.map(v => ({
          color: v.color, size: v.size, sku: v.sku,
          price: v.price || undefined, stock: v.stock,
        })),
      }

      if (editingId) {
        const res = await fetch(`/api/products/${editingId}`, {
          method: 'PUT', headers: { ...authHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        })
        if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Update failed') }
        showToast('Product updated successfully')
      } else {
        const res = await fetch('/api/products', {
          method: 'POST', headers: { ...authHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        })
        if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Create failed') }
        showToast('Product published successfully')
      }
      setFormOpen(false)
      fetchProducts()
    } catch (err: any) {
      showToast(err.message || 'Error saving product', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/products/${deleteId}`, { method: 'DELETE', headers: authHeaders() })
      if (!res.ok) throw new Error('Delete failed')
      showToast('Product deleted')
      setDeleteId(null)
      fetchProducts()
    } catch (err: any) {
      showToast(err.message || 'Error deleting product', 'error')
    }
  }

  const toggleActive = async (p: any) => {
    setTogglingId(p.id)
    try {
      const res = await fetch(`/api/products/${p.id}`, {
        method: 'PUT', headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !p.isActive }),
      })
      if (!res.ok) throw new Error('Failed to toggle')
      showToast(p.isActive ? 'Product hidden' : 'Product published')
      fetchProducts()
    } catch (err: any) {
      showToast(err.message, 'error')
    } finally {
      setTogglingId(null)
    }
  }

  const filtered = products.filter((p: any) =>
    !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.category?.name?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-60" />
        <Skeleton className="h-10 w-full max-w-sm" />
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#222222]">Products ({products.length})</h2>
          <p className="text-sm text-muted-foreground">Manage your product catalog</p>
        </div>
        <Button onClick={openCreate} className="bg-[#0B1F3A] hover:bg-[#0B1F3A]/90 text-white gap-2 h-10">
          <Plus className="h-4 w-4" /> Add Product
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {/* Product Form Dialog */}
      <Dialog open={formOpen} onOpenChange={(open) => { setFormOpen(open); if (!open) setEditingId(null) }}>
        <DialogContent className="sm:max-w-5xl max-h-[95vh] p-0 overflow-hidden flex flex-col">
          <DialogHeader className="px-6 pt-6 pb-0">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-lg">{editingId ? 'Edit Product' : 'Add New Product'}</DialogTitle>
                <DialogDescription className="text-xs">
                  {editingId ? 'Update product details, photos, and variants.' : 'Fill in details to publish a new product.'}
                </DialogDescription>
              </div>
              <Button
                variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}
                className="text-xs gap-1.5 lg:hidden"
              >
                <Eye className="h-3.5 w-3.5" /> {showPreview ? 'Hide Preview' : 'Show Preview'}
              </Button>
            </div>
          </DialogHeader>
          <ProductForm
            form={form} setForm={setForm} categories={categories} loading={submitting}
            onSubmit={handleSubmit} submitLabel={editingId ? 'Update Product' : 'Publish Product'}
            showPreview={showPreview}
          />
        </DialogContent>
      </Dialog>

      {/* Products Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50">
                <TableHead className="text-xs font-semibold">Image</TableHead>
                <TableHead className="text-xs font-semibold">Product</TableHead>
                <TableHead className="text-xs font-semibold hidden sm:table-cell">Category</TableHead>
                <TableHead className="text-xs font-semibold">Price</TableHead>
                <TableHead className="text-xs font-semibold hidden md:table-cell">Stock</TableHead>
                <TableHead className="text-xs font-semibold">Status</TableHead>
                <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p: any) => {
                const totalStock = p.variants?.reduce((sum: number, v: any) => sum + (v.inventory?.quantity || 0), 0) || 0
                return (
                  <TableRow key={p.id} className="hover:bg-gray-50/50">
                    <TableCell>
                      {p.images?.[0]?.url ? (
                        <img src={p.images[0].url} alt={p.name} className="w-12 h-12 rounded-lg object-cover border" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-[#FFF5F7] flex items-center justify-center"><ImageIcon className="h-5 w-5 text-gray-300" /></div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm text-[#222222]">{p.name}</p>
                        <p className="text-[11px] text-muted-foreground sm:hidden">{p.category?.name || '—'}</p>
                        {p.variants?.length > 0 && (
                          <p className="text-[11px] text-muted-foreground">{p.variants.length} variant(s)</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">{p.category?.name || '—'}</TableCell>
                    <TableCell className="text-sm">
                      {p.salePrice ? (
                        <span>₹{fmt(p.salePrice)} <span className="text-muted-foreground line-through text-xs ml-1">₹{fmt(p.basePrice)}</span></span>
                      ) : (
                        <span className="font-semibold">₹{fmt(p.basePrice)}</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant={totalStock === 0 ? 'destructive' : totalStock <= 5 ? 'secondary' : 'default'} className={totalStock <= 5 && totalStock > 0 ? 'bg-amber-100 text-amber-800' : ''}>
                        {totalStock === 0 ? 'Out of Stock' : totalStock <= 5 ? `Low: ${totalStock}` : totalStock}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.isActive ? 'default' : 'secondary'} className={p.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}>
                        {p.isActive ? 'Active' : 'Hidden'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)} title="Edit product">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost" size="icon" className="h-8 w-8"
                          onClick={() => toggleActive(p)} disabled={togglingId === p.id}
                          title={p.isActive ? 'Hide product' : 'Publish product'}
                        >
                          {togglingId === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> :
                            p.isActive ? <EyeOff className="h-3.5 w-3.5 text-gray-400" /> : <Eye className="h-3.5 w-3.5 text-green-600" />}
                        </Button>
                        <AlertDialog open={deleteId === p.id} onOpenChange={(open) => !open && setDeleteId(null)}>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => setDeleteId(p.id)} title="Delete product">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Product</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete &quot;{p.name}&quot;? This will permanently remove the product and cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete Forever</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <Package className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      {search ? 'No products match your search' : 'No products yet'}
                    </p>
                    {!search && (
                      <Button onClick={openCreate} variant="outline" className="mt-3 text-sm gap-1.5">
                        <Plus className="h-3.5 w-3.5" /> Add Your First Product
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}