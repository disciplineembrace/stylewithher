'use client'

import { useState, useEffect, useCallback } from 'react'
import { useStore } from '@/store/use-store'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog'
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
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Ticket,
  Star,
  FileText,
  Warehouse,
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Search,
  Menu,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Save,
  StarHalf,
  RefreshCw,
  ChevronRight,
  Image as ImageIcon,
} from 'lucide-react'

// ─── Helper ───────────────────────────────────────────────────────────────────
const authHeaders = () => {
  const u = useStore.getState().user
  return u?.token ? { Authorization: `Bearer ${u.token}` } : {}
}

const fmt = (n: number) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(n)
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
const fmtDateTime = (d: string) => new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

// ─── Nav items ────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'products', label: 'Products', icon: Package },
  { key: 'orders', label: 'Orders', icon: ShoppingBag },
  { key: 'customers', label: 'Customers', icon: Users },
  { key: 'coupons', label: 'Coupons', icon: Ticket },
  { key: 'reviews', label: 'Reviews', icon: Star },
  { key: 'content', label: 'Content', icon: FileText },
  { key: 'inventory', label: 'Inventory', icon: Warehouse },
]

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  shipped: 'bg-cyan-100 text-cyan-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  returned: 'bg-orange-100 text-orange-800',
}

const PAYMENT_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-orange-100 text-orange-800',
}

// ═══════════════════════════════════════════════════════════════════════════════
// SIDEBAR NAV
// ═══════════════════════════════════════════════════════════════════════════════
function SidebarNav({ className }: { className?: string }) {
  const { adminTab, setAdminTab, navigate } = useStore()

  return (
    <nav className={`flex flex-col gap-1 px-3 py-4 ${className || ''}`}>
      <div className="mb-6 px-3 flex flex-col items-center">
        <img src="/admin-logo.png" alt="StyleWithHer Admin" className="h-16 w-auto rounded-lg mb-2" />
      </div>
      <Separator className="bg-white/10 mb-2" />
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon
        const isActive = adminTab === item.key
        return (
          <button
            key={item.key}
            onClick={() => setAdminTab(item.key)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
              isActive
                ? 'bg-[#1e9ba6]/20 text-[#f9b233]'
                : 'text-white/70 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{item.label}</span>
            {isActive && <ChevronRight className="h-3 w-3 ml-auto text-[#f9b233]" />}
          </button>
        )
      })}
      <Separator className="bg-white/10 my-2" />
      <button
        onClick={() => navigate('home')}
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white transition-all duration-200 cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4 shrink-0" />
        <span>Back to Store</span>
      </button>
    </nav>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD TAB
// ═══════════════════════════════════════════════════════════════════════════════
function DashboardTab() {
  const { showToast } = useStore()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchDashboard = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin', { headers: authHeaders() })
      if (!res.ok) throw new Error('Failed to fetch dashboard')
      const json = await res.json()
      setData(json)
    } catch (err: any) {
      showToast(err.message || 'Error loading dashboard', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => { fetchDashboard() }, [fetchDashboard])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-24 w-full" /></CardContent></Card>
          ))}
        </div>
        <Card><CardContent className="p-6"><Skeleton className="h-72 w-full" /></CardContent></Card>
      </div>
    )
  }

  if (!data) return <p className="text-muted-foreground">No data available.</p>

  const stats = [
    { label: 'Total Revenue', value: `₹${fmt(data.totalSales)}`, icon: DollarSign, color: 'bg-[#4a5a6a]/10 text-[#4a5a6a]' },
    { label: 'Total Orders', value: data.totalOrders, icon: ShoppingBag, color: 'bg-[#1e9ba6]/10 text-[#1e9ba6]' },
    { label: 'Total Customers', value: data.totalCustomers, icon: Users, color: 'bg-[#f9b233]/10 text-[#f9b233]' },
    { label: 'Total Products', value: data.totalProducts, icon: Package, color: 'bg-orange-100 text-orange-700' },
  ]

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    processing: 'bg-purple-100 text-purple-800',
    shipped: 'bg-cyan-100 text-cyan-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    returned: 'bg-orange-100 text-orange-800',
  }

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <Card key={s.label} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{s.label}</p>
                    <p className="text-2xl font-bold mt-1">{s.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${s.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-72">
              {data.revenueByMonth && data.revenueByMonth.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.revenueByMonth} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} tickFormatter={(v: string) => { const [y, m] = v.split('-'); const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']; return months[parseInt(m, 10) - 1] + ' ' + y.slice(2); }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      formatter={(value: number) => [`₹${fmt(value)}`, 'Revenue']}
                      labelFormatter={(label: string) => { const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']; const [y, m] = label.split('-'); return months[parseInt(m, 10) - 1] + ' ' + y; }}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="revenue" fill="#1e9ba6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">No revenue data available</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Order Status Distribution */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Order Status</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {Object.entries(data.orderStatusCounts || {}).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <Badge className={statusColors[status] || 'bg-gray-100 text-gray-800'} variant="secondary">
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Badge>
                  <span className="text-sm font-semibold">{count as number}</span>
                </div>
              ))}
              {(data.orderStatusCounts && Object.keys(data.orderStatusCounts).length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">No orders yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Order #</TableHead>
                    <TableHead className="text-xs">Customer</TableHead>
                    <TableHead className="text-xs">Total</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data.recentOrders || []).slice(0, 5).map((order: any) => (
                    <TableRow key={order.id}>
                      <TableCell className="text-xs font-mono">{order.orderNumber?.slice(0, 16)}</TableCell>
                      <TableCell className="text-xs">{order.user?.name || '—'}</TableCell>
                      <TableCell className="text-xs font-medium">₹{fmt(order.total)}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[order.status] || ''} variant="secondary">
                          {order.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Top Products</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="max-h-96 overflow-y-auto space-y-3">
              {(data.topProducts || []).map((p: any, idx: number) => (
                <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-center w-7 h-7 rounded-full bg-[#F7C8D0]/20 text-[#0B1F3A] text-xs font-bold">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">₹{fmt(p.salePrice || p.basePrice)} • {p.totalSold} sold</p>
                  </div>
                </div>
              ))}
              {(!data.topProducts || data.topProducts.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">No sales data yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alerts */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Low Stock Alerts
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Product</TableHead>
                  <TableHead className="text-xs">Variant</TableHead>
                  <TableHead className="text-xs">Stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data.lowStockProducts || []).map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-sm font-medium">{item.variant?.product?.name || '—'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{item.variant?.color} / {item.variant?.size}</TableCell>
                    <TableCell>
                      <Badge variant={item.quantity === 0 ? 'destructive' : 'secondary'} className={item.quantity === 0 ? '' : 'bg-amber-100 text-amber-800'}>
                        {item.quantity}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {(!data.lowStockProducts || data.lowStockProducts.length === 0) && (
                  <TableRow><TableCell colSpan={3} className="text-center text-sm text-muted-foreground py-4">All stock levels healthy</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRODUCTS TAB
// ═══════════════════════════════════════════════════════════════════════════════
interface ProductFormState {
  name: string; slug: string; description: string; categoryId: string; gender: string;
  basePrice: string; salePrice: string; material: string; care: string;
  isFeatured: boolean; isTrending: boolean; isNewArrival: boolean; isBestSeller: boolean;
}

const emptyProductForm: ProductFormState = {
  name: '', slug: '', description: '', categoryId: '', gender: 'unisex',
  basePrice: '', salePrice: '', material: '', care: '',
  isFeatured: false, isTrending: false, isNewArrival: false, isBestSeller: false,
}

function ProductForm({ form, setForm, categories, loading, onSubmit, submitLabel }: {
  form: ProductFormState; setForm: (f: ProductFormState) => void; categories: any[];
  loading: boolean; onSubmit: () => void; submitLabel: string;
}) {
  const updateField = (field: keyof ProductFormState, value: string | boolean) => {
    setForm({ ...form, [field]: value })
    if (field === 'name') {
      const slug = value.toString().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      setForm((prev: ProductFormState) => ({ ...prev, slug }))
    }
  }

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="pf-name">Product Name *</Label>
          <Input id="pf-name" value={form.name} onChange={(e) => updateField('name', e.target.value)} placeholder="Product name" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pf-slug">Slug *</Label>
          <Input id="pf-slug" value={form.slug} onChange={(e) => updateField('slug', e.target.value)} placeholder="product-slug" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="pf-desc">Description</Label>
        <Textarea id="pf-desc" value={form.description} onChange={(e) => updateField('description', e.target.value)} placeholder="Product description..." rows={3} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Category *</Label>
          <Select value={form.categoryId} onValueChange={(v) => updateField('categoryId', v)}>
            <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
            <SelectContent>
              {categories.map((c: any) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Gender</Label>
          <Select value={form.gender} onValueChange={(v) => updateField('gender', v)}>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="pf-base">Base Price (₹) *</Label>
          <Input id="pf-base" type="number" value={form.basePrice} onChange={(e) => updateField('basePrice', e.target.value)} placeholder="999" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pf-sale">Sale Price (₹)</Label>
          <Input id="pf-sale" type="number" value={form.salePrice} onChange={(e) => updateField('salePrice', e.target.value)} placeholder="799 (optional)" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="pf-material">Material</Label>
          <Input id="pf-material" value={form.material} onChange={(e) => updateField('material', e.target.value)} placeholder="Cotton, Silk, etc." />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pf-care">Care Instructions</Label>
          <Input id="pf-care" value={form.care} onChange={(e) => updateField('care', e.target.value)} placeholder="Machine wash cold" />
        </div>
      </div>
      <Separator />
      <div className="space-y-3">
        <Label className="text-sm font-medium">Product Flags</Label>
        <div className="grid grid-cols-2 gap-3">
          {(['isFeatured', 'isTrending', 'isNewArrival', 'isBestSeller'] as const).map((key) => (
            <div key={key} className="flex items-center justify-between p-2 rounded-lg border">
              <Label htmlFor={`pf-${key}`} className="text-sm cursor-pointer">{key.replace('is', '').replace(/([A-Z])/g, ' $1').trim()}</Label>
              <Switch id={`pf-${key}`} checked={form[key] as boolean} onCheckedChange={(v) => updateField(key, v)} />
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-end pt-2">
        <Button onClick={onSubmit} disabled={loading || !form.name || !form.slug || !form.basePrice || !form.categoryId}>
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </div>
  )
}

function ProductsTab() {
  const { showToast } = useStore()
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ProductFormState>(emptyProductForm)
  const [submitting, setSubmitting] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

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
    setForm(emptyProductForm)
    setFormOpen(true)
  }

  const openEdit = (p: any) => {
    setEditingId(p.id)
    setForm({
      name: p.name, slug: p.slug, description: p.description || '',
      categoryId: p.categoryId, gender: p.gender || 'unisex',
      basePrice: String(p.basePrice), salePrice: p.salePrice != null ? String(p.salePrice) : '',
      material: p.material || '', care: p.care || '',
      isFeatured: p.isFeatured, isTrending: p.isTrending,
      isNewArrival: p.isNewArrival, isBestSeller: p.isBestSeller,
    })
    setFormOpen(true)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const body = {
        ...form,
        basePrice: parseFloat(form.basePrice),
        salePrice: form.salePrice ? parseFloat(form.salePrice) : null,
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
        showToast('Product created successfully')
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

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-40" />
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Products ({products.length})</h2>
        <Dialog open={formOpen} onOpenChange={(open) => { setFormOpen(open); if (!open) setEditingId(null) }}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} className="bg-[#1e9ba6] hover:bg-[#1e9ba6]/90 text-white">
              <Plus className="h-4 w-4 mr-2" /> Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Product' : 'Add Product'}</DialogTitle>
              <DialogDescription>{editingId ? 'Update product details below.' : 'Fill in the details to create a new product.'}</DialogDescription>
            </DialogHeader>
            <ProductForm
              form={form} setForm={setForm} categories={categories} loading={submitting}
              onSubmit={handleSubmit} submitLabel={editingId ? 'Update Product' : 'Create Product'}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="max-h-[65vh] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Image</TableHead>
                <TableHead className="text-xs">Name</TableHead>
                <TableHead className="text-xs hidden sm:table-cell">Category</TableHead>
                <TableHead className="text-xs">Price</TableHead>
                <TableHead className="text-xs hidden md:table-cell">Stock</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => {
                const totalStock = p.variants?.reduce((sum: number, v: any) => sum + (v.inventory?.quantity || 0), 0) || 0
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      {p.images?.[0]?.url ? (
                        <img src={p.images[0].url} alt={p.name} className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center"><ImageIcon className="h-4 w-4 text-muted-foreground" /></div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium text-sm">{p.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">{p.category?.name || '—'}</TableCell>
                    <TableCell className="text-sm">
                      {p.salePrice ? (
                        <span className="text-[#0B1F3A] font-semibold">₹{fmt(p.salePrice)} <span className="text-muted-foreground line-through text-xs ml-1">₹{fmt(p.basePrice)}</span></span>
                      ) : (
                        <span className="font-semibold">₹{fmt(p.basePrice)}</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant={totalStock === 0 ? 'destructive' : totalStock <= 5 ? 'secondary' : 'default'} className={totalStock <= 5 && totalStock > 0 ? 'bg-amber-100 text-amber-800' : ''}>
                        {totalStock}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.isActive ? 'default' : 'secondary'} className={p.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}>
                        {p.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <AlertDialog open={deleteId === p.id} onOpenChange={(open) => !open && setDeleteId(null)}>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => setDeleteId(p.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Product</AlertDialogTitle>
                              <AlertDialogDescription>Are you sure you want to delete &quot;{p.name}&quot;? This action cannot be undone.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
              {products.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No products found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ORDERS TAB
// ═══════════════════════════════════════════════════════════════════════════════
function OrdersTab() {
  const { showToast } = useStore()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      // Admin dashboard has recentOrders, but for full list we use the admin endpoint
      // The orders endpoint is user-scoped, so we fetch from admin for recent orders and combine
      const res = await fetch('/api/admin', { headers: authHeaders() })
      if (!res.ok) throw new Error('Failed to fetch')
      const json = await res.json()
      // The admin endpoint returns recentOrders (10). For a full list we show these for now.
      // To get more, the admin could have a separate endpoint, but we work with what we have.
      setOrders(json.recentOrders || [])
    } catch (err: any) {
      showToast(err.message || 'Error loading orders', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId)
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Update failed') }
      showToast(`Order status updated to ${newStatus}`)
      fetchOrders()
    } catch (err: any) {
      showToast(err.message || 'Error updating order', 'error')
    } finally {
      setUpdatingId(null)
    }
  }

  if (loading) {
    return <div className="space-y-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Orders ({orders.length})</h2>
        <Button variant="outline" size="sm" onClick={fetchOrders} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="max-h-[65vh] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Order #</TableHead>
                <TableHead className="text-xs">Customer</TableHead>
                <TableHead className="text-xs hidden lg:table-cell">Date</TableHead>
                <TableHead className="text-xs hidden sm:table-cell">Items</TableHead>
                <TableHead className="text-xs">Total</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs hidden md:table-cell">Payment</TableHead>
                <TableHead className="text-xs text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-xs">{order.orderNumber?.slice(0, 16)}</TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">{order.user?.name || '—'}</div>
                    <div className="text-xs text-muted-foreground">{order.user?.email || ''}</div>
                  </TableCell>
                  <TableCell className="text-xs hidden lg:table-cell">{fmtDate(order.createdAt)}</TableCell>
                  <TableCell className="text-xs hidden sm:table-cell">{order.items?.length || 0} item(s)</TableCell>
                  <TableCell className="text-sm font-semibold">₹{fmt(order.total)}</TableCell>
                  <TableCell>
                    <Badge className={STATUS_COLORS[order.status] || ''} variant="secondary">{order.status}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge className={PAYMENT_COLORS[order.paymentStatus] || ''} variant="secondary">{order.paymentStatus}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {updatingId === order.id ? (
                      <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    ) : (
                      <Select value={order.status} onValueChange={(v) => handleStatusUpdate(order.id, v)}>
                        <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'].map((s) => (
                            <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {orders.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No orders found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// CUSTOMERS TAB
// ═══════════════════════════════════════════════════════════════════════════════
function CustomersTab() {
  const { showToast } = useStore()
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/customers?limit=100', { headers: authHeaders() })
      if (!res.ok) throw new Error('Failed to fetch')
      const json = await res.json()
      setCustomers(json.customers || [])
    } catch (err: any) {
      showToast(err.message || 'Error loading customers', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => { fetchCustomers() }, [fetchCustomers])

  const toggleActive = async (customer: any) => {
    setTogglingId(customer.id)
    try {
      const res = await fetch('/api/admin/customers', {
        method: 'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: customer.id, isActive: !customer.isActive }),
      })
      if (!res.ok) throw new Error('Update failed')
      showToast(`${customer.name} ${!customer.isActive ? 'activated' : 'deactivated'}`)
      fetchCustomers()
    } catch (err: any) {
      showToast(err.message || 'Error updating customer', 'error')
    } finally {
      setTogglingId(null)
    }
  }

  if (loading) {
    return <div className="space-y-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Customers ({customers.length})</h2>
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="max-h-[65vh] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Name</TableHead>
                <TableHead className="text-xs">Email</TableHead>
                <TableHead className="text-xs hidden sm:table-cell">Phone</TableHead>
                <TableHead className="text-xs hidden md:table-cell">Role</TableHead>
                <TableHead className="text-xs">Active</TableHead>
                <TableHead className="text-xs hidden lg:table-cell">Orders</TableHead>
                <TableHead className="text-xs hidden lg:table-cell">Joined</TableHead>
                <TableHead className="text-xs text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium text-sm">{c.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.email}</TableCell>
                  <TableCell className="text-sm hidden sm:table-cell">{c.phone || '—'}</TableCell>
                  <TableCell className="hidden md:table-cell"><Badge variant="secondary">{c.role || 'customer'}</Badge></TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={c.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {c.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm">{c._count?.orders || 0}</TableCell>
                  <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">{fmtDate(c.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    {togglingId === c.id ? (
                      <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    ) : (
                      <Button
                        variant="ghost" size="sm"
                        className={c.isActive ? 'text-red-500 hover:text-red-700 hover:bg-red-50' : 'text-green-600 hover:text-green-800 hover:bg-green-50'}
                        onClick={() => toggleActive(c)}
                      >
                        {c.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {customers.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No customers found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// COUPONS TAB
// ═══════════════════════════════════════════════════════════════════════════════
interface CouponFormState {
  code: string; description: string; discountType: string; discountValue: string;
  minOrder: string; maxDiscount: string; usageLimit: string; startDate: string; endDate: string;
}

const emptyCouponForm: CouponFormState = {
  code: '', description: '', discountType: 'percentage', discountValue: '',
  minOrder: '', maxDiscount: '', usageLimit: '', startDate: '', endDate: '',
}

function CouponForm({ form, setForm, loading, onSubmit, submitLabel }: {
  form: CouponFormState; setForm: (f: CouponFormState) => void; loading: boolean; onSubmit: () => void; submitLabel: string;
}) {
  const update = (field: keyof CouponFormState, value: string) => setForm({ ...form, [field]: value })

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Coupon Code *</Label>
          <Input value={form.code} onChange={(e) => update('code', e.target.value.toUpperCase())} placeholder="SAVE20" />
        </div>
        <div className="space-y-2">
          <Label>Discount Type</Label>
          <Select value={form.discountType} onValueChange={(v) => update('discountType', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="percentage">Percentage (%)</SelectItem>
              <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Discount Value *</Label>
          <Input type="number" value={form.discountValue} onChange={(e) => update('discountValue', e.target.value)} placeholder={form.discountType === 'percentage' ? '20' : '500'} />
        </div>
        <div className="space-y-2">
          <Label>Min Order Amount (₹)</Label>
          <Input type="number" value={form.minOrder} onChange={(e) => update('minOrder', e.target.value)} placeholder="0" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Max Discount (₹)</Label>
          <Input type="number" value={form.maxDiscount} onChange={(e) => update('maxDiscount', e.target.value)} placeholder="No limit" />
        </div>
        <div className="space-y-2">
          <Label>Usage Limit</Label>
          <Input type="number" value={form.usageLimit} onChange={(e) => update('usageLimit', e.target.value)} placeholder="Unlimited" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Start Date *</Label>
          <Input type="date" value={form.startDate} onChange={(e) => update('startDate', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>End Date *</Label>
          <Input type="date" value={form.endDate} onChange={(e) => update('endDate', e.target.value)} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Input value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="Flat 20% off on all orders" />
      </div>
      <div className="flex justify-end pt-2">
        <Button onClick={onSubmit} disabled={loading || !form.code || !form.discountValue || !form.startDate || !form.endDate}>
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </div>
  )
}

function CouponsTab() {
  const { showToast } = useStore()
  const [coupons, setCoupons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CouponFormState>(emptyCouponForm)
  const [submitting, setSubmitting] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const fetchCoupons = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/coupons', { headers: authHeaders() })
      if (!res.ok) throw new Error('Failed to fetch')
      const json = await res.json()
      setCoupons(json.coupons || [])
    } catch (err: any) {
      showToast(err.message || 'Error loading coupons', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => { fetchCoupons() }, [fetchCoupons])

  const openCreate = () => { setEditingId(null); setForm(emptyCouponForm); setFormOpen(true) }

  const openEdit = (c: any) => {
    setEditingId(c.id)
    setForm({
      code: c.code, description: c.description || '',
      discountType: c.discountType, discountValue: String(c.discountValue),
      minOrder: String(c.minOrder || ''), maxDiscount: c.maxDiscount != null ? String(c.maxDiscount) : '',
      usageLimit: c.usageLimit != null ? String(c.usageLimit) : '',
      startDate: c.startDate?.slice(0, 10) || '', endDate: c.endDate?.slice(0, 10) || '',
    })
    setFormOpen(true)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const body = { ...form, discountValue: parseFloat(form.discountValue) }
      if (editingId) {
        const res = await fetch('/api/coupons', {
          method: 'PUT', headers: { ...authHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editingId, ...body }),
        })
        if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Update failed') }
        showToast('Coupon updated')
      } else {
        const res = await fetch('/api/coupons', {
          method: 'POST', headers: { ...authHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        })
        if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Create failed') }
        showToast('Coupon created')
      }
      setFormOpen(false)
      fetchCoupons()
    } catch (err: any) {
      showToast(err.message || 'Error saving coupon', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/coupons?id=${deleteId}`, { method: 'DELETE', headers: authHeaders() })
      if (!res.ok) throw new Error('Delete failed')
      showToast('Coupon deleted')
      setDeleteId(null)
      fetchCoupons()
    } catch (err: any) {
      showToast(err.message || 'Error deleting coupon', 'error')
    }
  }

  if (loading) {
    return <div className="space-y-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Coupons ({coupons.length})</h2>
        <Dialog open={formOpen} onOpenChange={(open) => { setFormOpen(open); if (!open) setEditingId(null) }}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} className="bg-[#1e9ba6] hover:bg-[#1e9ba6]/90 text-white">
              <Plus className="h-4 w-4 mr-2" /> Create Coupon
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Coupon' : 'Create Coupon'}</DialogTitle>
              <DialogDescription>{editingId ? 'Update coupon details.' : 'Set up a new discount coupon.'}</DialogDescription>
            </DialogHeader>
            <CouponForm form={form} setForm={setForm} loading={submitting} onSubmit={handleSubmit} submitLabel={editingId ? 'Update' : 'Create'} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="max-h-[65vh] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Code</TableHead>
                <TableHead className="text-xs hidden sm:table-cell">Description</TableHead>
                <TableHead className="text-xs">Discount</TableHead>
                <TableHead className="text-xs hidden md:table-cell">Min Order</TableHead>
                <TableHead className="text-xs">Usage</TableHead>
                <TableHead className="text-xs hidden lg:table-cell">Valid Until</TableHead>
                <TableHead className="text-xs">Active</TableHead>
                <TableHead className="text-xs text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono font-bold text-sm">{c.code}</TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden sm:table-cell max-w-[200px] truncate">{c.description || '—'}</TableCell>
                  <TableCell className="text-sm font-semibold">
                    {c.discountType === 'percentage' ? `${c.discountValue}%` : `₹${fmt(c.discountValue)}`}
                  </TableCell>
                  <TableCell className="text-sm hidden md:table-cell">₹{fmt(c.minOrder || 0)}</TableCell>
                  <TableCell className="text-sm">
                    <span className={c.usageLimit && c.usedCount >= c.usageLimit ? 'text-red-600 font-semibold' : ''}>
                      {c.usedCount}{c.usageLimit ? `/${c.usageLimit}` : ''}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs hidden lg:table-cell">{fmtDate(c.endDate)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={c.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}>
                      {c.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <AlertDialog open={deleteId === c.id} onOpenChange={(open) => !open && setDeleteId(null)}>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => setDeleteId(c.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Coupon</AlertDialogTitle>
                            <AlertDialogDescription>Delete coupon &quot;{c.code}&quot;? This cannot be undone.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {coupons.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No coupons found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// REVIEWS TAB
// ═══════════════════════════════════════════════════════════════════════════════
function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const sz = size === 'sm' ? 'h-3.5 w-3.5' : 'h-5 w-5'
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sz} ${star <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`}
        />
      ))}
    </div>
  )
}

function ReviewsTab() {
  const { showToast } = useStore()
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const fetchReviews = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/reviews?limit=100', { headers: authHeaders() })
      if (!res.ok) throw new Error('Failed to fetch')
      const json = await res.json()
      setReviews(json.reviews || [])
    } catch (err: any) {
      showToast(err.message || 'Error loading reviews', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => { fetchReviews() }, [fetchReviews])

  const handleApprove = async (review: any) => {
    setActionLoading(review.id)
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId: review.id, isApproved: !review.isApproved }),
      })
      if (!res.ok) throw new Error('Update failed')
      showToast(review.isApproved ? 'Review unapproved' : 'Review approved')
      fetchReviews()
    } catch (err: any) {
      showToast(err.message || 'Error updating review', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setActionLoading(deleteId)
    try {
      const res = await fetch(`/api/admin/reviews?reviewId=${deleteId}`, { method: 'DELETE', headers: authHeaders() })
      if (!res.ok) throw new Error('Delete failed')
      showToast('Review deleted')
      setDeleteId(null)
      fetchReviews()
    } catch (err: any) {
      showToast(err.message || 'Error deleting review', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return <div className="space-y-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Reviews ({reviews.length})</h2>
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="max-h-[65vh] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Product</TableHead>
                <TableHead className="text-xs hidden sm:table-cell">Customer</TableHead>
                <TableHead className="text-xs">Rating</TableHead>
                <TableHead className="text-xs hidden md:table-cell">Title</TableHead>
                <TableHead className="text-xs hidden lg:table-cell">Date</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviews.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-sm font-medium max-w-[150px] truncate">{r.product?.name || '—'}</TableCell>
                  <TableCell className="text-sm hidden sm:table-cell">{r.user?.name || '—'}</TableCell>
                  <TableCell><StarRating rating={r.rating} /></TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden md:table-cell max-w-[200px] truncate">{r.title || '—'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground hidden lg:table-cell">{fmtDate(r.createdAt)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={r.isApproved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                      {r.isApproved ? 'Approved' : 'Pending'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost" size="sm" className="h-8 text-xs"
                        onClick={() => handleApprove(r)}
                        disabled={actionLoading === r.id}
                      >
                        {actionLoading === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : r.isApproved ? 'Unapprove' : 'Approve'}
                      </Button>
                      <AlertDialog open={deleteId === r.id} onOpenChange={(open) => !open && setDeleteId(null)}>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => setDeleteId(r.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Review</AlertDialogTitle>
                            <AlertDialogDescription>Delete this review? This cannot be undone.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {reviews.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No reviews found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONTENT TAB
// ═══════════════════════════════════════════════════════════════════════════════
const CONTENT_FIELDS = [
  { key: 'about_us', label: 'About Us', type: 'textarea', rows: 6 },
  { key: 'contact_email', label: 'Contact Email', type: 'input' },
  { key: 'contact_phone', label: 'Contact Phone', type: 'input' },
  { key: 'contact_address', label: 'Contact Address', type: 'textarea', rows: 3 },
  { key: 'social_instagram', label: 'Instagram URL', type: 'input' },
  { key: 'social_facebook', label: 'Facebook URL', type: 'input' },
  { key: 'social_twitter', label: 'Twitter / X URL', type: 'input' },
  { key: 'social_pinterest', label: 'Pinterest URL', type: 'input' },
  { key: 'shipping_policy', label: 'Shipping Policy', type: 'textarea', rows: 5 },
  { key: 'return_policy', label: 'Return Policy', type: 'textarea', rows: 5 },
]

function ContentTab() {
  const { showToast } = useStore()
  const [content, setContent] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetchContent = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/content', { headers: authHeaders() })
      if (!res.ok) throw new Error('Failed to fetch')
      const json = await res.json()
      const map: Record<string, string> = {}
      for (const item of json.content || []) {
        map[item.key] = item.value
      }
      setContent(map)
    } catch (err: any) {
      showToast(err.message || 'Error loading content', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => { fetchContent() }, [fetchContent])

  const updateField = (key: string, value: string) => {
    setContent((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const contentArray = CONTENT_FIELDS.map((f) => ({
        key: f.key,
        value: content[f.key] || '',
        type: 'text',
      }))
      const res = await fetch('/api/admin/content', {
        method: 'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: contentArray }),
      })
      if (!res.ok) throw new Error('Save failed')
      showToast('Content saved successfully')
    } catch (err: any) {
      showToast(err.message || 'Error saving content', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="space-y-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Site Content</h2>
        <Button onClick={handleSave} disabled={saving} className="bg-[#1e9ba6] hover:bg-[#1e9ba6]/90 text-white">
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save Changes
        </Button>
      </div>

      <div className="bg-white rounded-xl border shadow-sm p-6 space-y-6">
        {CONTENT_FIELDS.map((field) => (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={`content-${field.key}`} className="text-sm font-medium">{field.label}</Label>
            {field.type === 'textarea' ? (
              <Textarea
                id={`content-${field.key}`}
                value={content[field.key] || ''}
                onChange={(e) => updateField(field.key, e.target.value)}
                rows={field.rows || 4}
                placeholder={`Enter ${field.label.toLowerCase()}...`}
              />
            ) : (
              <Input
                id={`content-${field.key}`}
                value={content[field.key] || ''}
                onChange={(e) => updateField(field.key, e.target.value)}
                placeholder={`Enter ${field.label.toLowerCase()}...`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// INVENTORY TAB
// ═══════════════════════════════════════════════════════════════════════════════
function InventoryTab() {
  const { showToast } = useStore()
  const [inventory, setInventory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchInventory = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/products?limit=100', { headers: authHeaders() })
      if (!res.ok) throw new Error('Failed to fetch')
      const json = await res.json()
      const items: any[] = []
      for (const product of json.products || []) {
        for (const variant of product.variants || []) {
          items.push({
            productId: product.id,
            productName: product.name,
            productImage: product.images?.[0]?.url || null,
            variantId: variant.id,
            color: variant.color,
            size: variant.size,
            sku: variant.sku,
            stock: variant.inventory?.quantity || 0,
            lowStock: variant.inventory?.lowStock || 5,
          })
        }
      }
      setInventory(items)
    } catch (err: any) {
      showToast(err.message || 'Error loading inventory', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => { fetchInventory() }, [fetchInventory])

  const filtered = search
    ? inventory.filter((item) => item.productName.toLowerCase().includes(search.toLowerCase()))
    : inventory

  const getStockStatus = (stock: number, lowStock: number) => {
    if (stock === 0) return { label: 'Out of Stock', className: 'bg-red-100 text-red-800', dot: 'bg-red-500' }
    if (stock <= lowStock) return { label: 'Low Stock', className: 'bg-amber-100 text-amber-800', dot: 'bg-amber-500' }
    return { label: 'In Stock', className: 'bg-green-100 text-green-800', dot: 'bg-green-500' }
  }

  if (loading) {
    return <div className="space-y-4"><Skeleton className="h-10 w-60" />{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-xl font-bold">Inventory ({filtered.length})</h2>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by product name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="max-h-[65vh] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Product</TableHead>
                <TableHead className="text-xs hidden sm:table-cell">Variant</TableHead>
                <TableHead className="text-xs hidden md:table-cell">SKU</TableHead>
                <TableHead className="text-xs">Stock</TableHead>
                <TableHead className="text-xs hidden lg:table-cell">Threshold</TableHead>
                <TableHead className="text-xs">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => {
                const status = getStockStatus(item.stock, item.lowStock)
                return (
                  <TableRow key={item.variantId}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {item.productImage && (
                          <img src={item.productImage} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
                        )}
                        <span className="text-sm font-medium truncate max-w-[180px]">{item.productName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">
                      <span className="inline-flex items-center gap-1">
                        <span className="w-3 h-3 rounded-full border border-gray-300" style={{ backgroundColor: item.color.toLowerCase() === 'white' || item.color.toLowerCase() === 'off white' ? '#f5f5f5' : item.color }} />
                        {item.color} / {item.size}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs hidden md:table-cell">{item.sku}</TableCell>
                    <TableCell className="font-semibold text-sm">{item.stock}</TableCell>
                    <TableCell className="text-sm text-muted-foreground hidden lg:table-cell">{item.lowStock}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={status.className}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${status.dot}`} />
                        {status.label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">{search ? 'No matching items' : 'No inventory data'}</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN ADMIN PANEL
// ═══════════════════════════════════════════════════════════════════════════════
export default function AdminPanel() {
  const { adminTab } = useStore()
  const [mobileOpen, setMobileOpen] = useState(false)

  const renderContent = () => {
    switch (adminTab) {
      case 'dashboard': return <DashboardTab />
      case 'products': return <ProductsTab />
      case 'orders': return <OrdersTab />
      case 'customers': return <CustomersTab />
      case 'coupons': return <CouponsTab />
      case 'reviews': return <ReviewsTab />
      case 'content': return <ContentTab />
      case 'inventory': return <InventoryTab />
      default: return <DashboardTab />
    }
  }

  const currentTabLabel = NAV_ITEMS.find((n) => n.key === adminTab)?.label || 'Dashboard'

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-[#4a5a6a] z-30">
        <SidebarNav />
      </aside>

      {/* Mobile Sidebar (Sheet) */}
      <div className="lg:hidden fixed top-0 left-0 z-40 p-3">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="bg-[#4a5a6a] text-white hover:bg-[#4a5a6a]/90 h-10 w-10 rounded-lg">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 bg-[#4a5a6a] border-none">
            <SheetTitle className="sr-only">Admin Navigation</SheetTitle>
            <SidebarNav className="h-full" />
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content */}
      <main className="flex-1 lg:pl-64 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
          <header className="mb-6">
            <h1 className="text-2xl font-bold text-[#4a5a6a]">{currentTabLabel}</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your store&apos;s {currentTabLabel.toLowerCase()}</p>
          </header>
          {renderContent()}
        </div>
      </main>
    </div>
  )
}