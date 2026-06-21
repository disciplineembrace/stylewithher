'use client'

import { useState, useEffect, useCallback } from 'react'
import { useStore } from '@/store/use-store'
import { useTranslation } from '@/i18n/use-language'
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
  Instagram,
  ExternalLink,
  BarChart3,
  PlusCircle,
  PenLine,
  Upload,
  Activity,
  Copy,
} from 'lucide-react'
import AdminProductManager from './AdminProductManager'

// ─── Helper ───────────────────────────────────────────────────────────────────
const authHeaders = () => {
  const u = useStore.getState().user
  return u?.token ? { Authorization: `Bearer ${u.token}` } : {}
}

const fmt = (n: number) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(n)
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
const fmtDateTime = (d: string) => new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

// ─── Nav items (labels translated via SidebarNav component) ─────────────────
const NAV_ITEMS = [
  { key: 'dashboard', labelKey: 'admin.dashboard', icon: LayoutDashboard },
  { key: 'orders', labelKey: 'admin.orders', icon: ShoppingBag },
  { key: 'payments', labelKey: 'admin.payments', icon: DollarSign },
  { key: 'products', labelKey: 'admin.products', icon: Package },
  { key: 'customers', labelKey: 'admin.customers', icon: Users },
  { key: 'coupons', labelKey: 'admin.coupons', icon: Ticket },
  { key: 'reviews', labelKey: 'admin.reviews', icon: Star },
  { key: 'content', labelKey: 'admin.content', icon: FileText },
  { key: 'posts', labelKey: 'admin.posts', icon: PenLine },
  { key: 'media', labelKey: 'admin.media', icon: ImageIcon },
  { key: 'inventory', labelKey: 'admin.inventory', icon: Warehouse },
  { key: 'settings', labelKey: 'admin.settings', icon: TrendingUp },
  { key: 'instagram', labelKey: 'admin.instagram', icon: Instagram },
  { key: 'activity', labelKey: 'admin.activityLogs', icon: Activity },
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
  submitted: 'bg-blue-100 text-blue-800',
  verified: 'bg-indigo-100 text-indigo-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-orange-100 text-orange-800',
}

// ═══════════════════════════════════════════════════════════════════════════════
// SIDEBAR NAV
// ═══════════════════════════════════════════════════════════════════════════════
function SidebarNav({ className }: { className?: string }) {
  const { adminTab, setAdminTab, navigate } = useStore()
  const { t } = useTranslation()

  return (
    <nav className={`flex flex-col gap-1 px-3 py-4 ${className || ''}`}>
      <div className="mb-6 px-3 flex flex-col items-center">
        <img src="/logo.png" alt="StyleWithHer" className="h-10 w-auto object-contain mb-1" />
        <span className="text-[#F7C8D0] font-bold text-base tracking-wide leading-tight">Admin Panel</span>
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
            <span>{t(item.labelKey)}</span>
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

// PRODUCTS TAB — uses AdminProductManager component

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
  { key: 'social_youtube', label: 'YouTube URL', type: 'input' },
  { key: 'social_pinterest', label: 'Pinterest URL', type: 'input' },
  { key: 'shipping_policy', label: 'Shipping Policy', type: 'textarea', rows: 5 },
  { key: 'return_policy', label: 'Return Policy', type: 'textarea', rows: 5 },
  { key: 'privacy_policy', label: 'Privacy Policy', type: 'textarea', rows: 5 },
  { key: 'terms_of_service', label: 'Terms of Service', type: 'textarea', rows: 5 },
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
// INSTAGRAM TAB
// ═══════════════════════════════════════════════════════════════════════════════
function InstagramTab() {
  const IG_LINK = 'https://instagram.com/Style_withher01'

  const statCards = [
    { label: 'Followers', icon: Users, color: 'bg-[#1e9ba6]/10 text-[#1e9ba6]' },
    { label: 'Posts', icon: ImageIcon, color: 'bg-[#f9b233]/10 text-[#f9b233]' },
    { label: 'Engagement Rate', icon: BarChart3, color: 'bg-[#1e9ba6]/10 text-[#1e9ba6]' },
  ]

  return (
    <div className="space-y-6">
      {/* Connected Account Card */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#f9b233] via-[#D96C8A] to-[#833AB4] flex items-center justify-center">
                <Instagram className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg text-[#4a5a6a]">@Style_withher01</CardTitle>
                <a href={IG_LINK} target="_blank" rel="noopener noreferrer" className="text-sm text-[#1e9ba6] hover:underline flex items-center gap-1">
                  {IG_LINK.replace('https://', '')} <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
              <CheckCircle2 className="h-3 w-3 mr-1" /> Connected
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Quick Actions */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base text-[#4a5a6a]">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <a href={IG_LINK} target="_blank" rel="noopener noreferrer">
              <Button className="bg-[#1e9ba6] hover:bg-[#1e9ba6]/90 text-white">
                <Instagram className="h-4 w-4 mr-2" /> Open Instagram
              </Button>
            </a>
            <a href={IG_LINK} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="border-[#1e9ba6]/30 text-[#1e9ba6] hover:bg-[#1e9ba6]/10">
                <ExternalLink className="h-4 w-4 mr-2" /> View Profile
              </Button>
            </a>
            <a href={IG_LINK} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="border-[#f9b233]/30 text-[#f9b233] hover:bg-[#f9b233]/10">
                <PlusCircle className="h-4 w-4 mr-2" /> Create Post
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Stats Placeholder */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((s) => {
          const Icon = s.icon
          return (
            <Card key={s.label} className="border-0 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-lg ${s.color} flex items-center justify-center`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">{s.label}</p>
                </div>
                <p className="text-sm text-[#4a5a6a]/60 italic">Connect Meta API to view {s.label.toLowerCase()}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Info Note */}
      <Card className="border-0 shadow-sm bg-[#f9b233]/5 border border-[#f9b233]/20">
        <CardContent className="p-5">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-[#f9b233] shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-[#4a5a6a] mb-1">Meta Business Account Required</p>
              <p className="text-sm text-[#4a5a6a]/70 leading-relaxed">
                Full Instagram Graph API integration requires Meta Business Account setup. Connect your Meta Business account to enable automatic posting, analytics, and comment management.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAYMENTS TAB
// ═══════════════════════════════════════════════════════════════════════════════
function PaymentsTab() {
  const { showToast } = useStore()
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterMethod, setFilterMethod] = useState<string>('all')

  const fetchPayments = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterStatus !== 'all') params.set('status', filterStatus)
      if (filterMethod !== 'all') params.set('method', filterMethod)
      const res = await fetch(`/api/admin/payments?${params}`, { headers: authHeaders() })
      if (!res.ok) throw new Error('Failed to fetch')
      const json = await res.json()
      setPayments(json.payments || [])
    } catch (err: any) {
      showToast(err.message || 'Error loading payments', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast, filterStatus, filterMethod])

  useEffect(() => { fetchPayments() }, [fetchPayments])

  const handlePaymentStatus = async (paymentId: string, orderId: string, newStatus: string) => {
    setUpdatingId(paymentId)
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: newStatus }),
      })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Update failed') }
      showToast(`Payment status updated to ${newStatus}`)
      fetchPayments()
    } catch (err: any) {
      showToast(err.message || 'Error updating payment', 'error')
    } finally {
      setUpdatingId(null)
    }
  }

  if (loading) {
    return <div className="space-y-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-xl font-bold">Payments ({payments.length})</h2>
        <div className="flex gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36 h-9 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterMethod} onValueChange={setFilterMethod}>
            <SelectTrigger className="w-32 h-9 text-xs"><SelectValue placeholder="Method" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Methods</SelectItem>
              <SelectItem value="cod">COD</SelectItem>
              <SelectItem value="upi">UPI</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="max-h-[65vh] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Date</TableHead>
                <TableHead className="text-xs">Order #</TableHead>
                <TableHead className="text-xs">Customer</TableHead>
                <TableHead className="text-xs">Method</TableHead>
                <TableHead className="text-xs">Amount</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="text-xs">{fmtDateTime(p.createdAt)}</TableCell>
                  <TableCell className="font-mono text-xs">{p.order?.orderNumber?.slice(0, 16) || '—'}</TableCell>
                  <TableCell>
                    <div className="text-sm">{p.user?.name || '—'}</div>
                    <div className="text-xs text-muted-foreground">{p.user?.email || ''}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs uppercase">{p.method}</Badge>
                  </TableCell>
                  <TableCell className="font-semibold text-sm">₹{fmt(p.amount)}</TableCell>
                  <TableCell>
                    <Badge className={PAYMENT_COLORS[p.status] || ''} variant="secondary">{p.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {updatingId === p.id ? (
                      <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    ) : (
                      <Select value={p.status} onValueChange={(v) => handlePaymentStatus(p.id, p.orderId, v)}>
                        <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="submitted">Submitted</SelectItem>
                          <SelectItem value="verified">Verified</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="failed">Failed</SelectItem>
                          <SelectItem value="refunded">Refunded</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {payments.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No payments found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// SETTINGS TAB
// ═══════════════════════════════════════════════════════════════════════════════
const SETTINGS_FIELDS = [
  { key: 'site_name', label: 'Site Name', type: 'input', group: 'General' },
  { key: 'site_tagline', label: 'Site Tagline', type: 'input', group: 'General' },
  { key: 'site_description', label: 'Site Description', type: 'textarea', rows: 3, group: 'General' },
  { key: 'upi_id', label: 'UPI ID', type: 'input', group: 'Payment' },
  { key: 'currency', label: 'Currency Code', type: 'input', group: 'Payment' },
  { key: 'currency_symbol', label: 'Currency Symbol', type: 'input', group: 'Payment' },
  { key: 'social_instagram', label: 'Instagram URL', type: 'input', group: 'Social Links' },
  { key: 'social_facebook', label: 'Facebook URL', type: 'input', group: 'Social Links' },
  { key: 'social_twitter', label: 'Twitter / X URL', type: 'input', group: 'Social Links' },
  { key: 'social_youtube', label: 'YouTube URL', type: 'input', group: 'Social Links' },
  { key: 'social_pinterest', label: 'Pinterest URL', type: 'input', group: 'Social Links' },
  { key: 'seo_title', label: 'SEO Title', type: 'input', group: 'SEO' },
  { key: 'seo_description', label: 'SEO Description', type: 'textarea', rows: 3, group: 'SEO' },
  { key: 'seo_keywords', label: 'SEO Keywords', type: 'textarea', rows: 2, group: 'SEO' },
  { key: 'google_analytics_id', label: 'Google Analytics ID', type: 'input', group: 'SEO' },
]

function SettingsTab() {
  const { showToast } = useStore()
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetchSettings = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/settings', { headers: authHeaders() })
      if (!res.ok) throw new Error('Failed to fetch')
      const json = await res.json()
      setSettings(json.settings || {})
    } catch (err: any) {
      showToast(err.message || 'Error loading settings', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => { fetchSettings() }, [fetchSettings])

  const updateField = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      })
      if (!res.ok) throw new Error('Save failed')
      showToast('Settings saved successfully')
    } catch (err: any) {
      showToast(err.message || 'Error saving settings', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="space-y-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
  }

  // Group settings by group
  const groups = SETTINGS_FIELDS.reduce((acc, field) => {
    const g = field.group || 'Other'
    if (!acc[g]) acc[g] = []
    acc[g].push(field)
    return acc
  }, {} as Record<string, typeof SETTINGS_FIELDS>)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Settings</h2>
        <Button onClick={handleSave} disabled={saving} className="bg-[#1e9ba6] hover:bg-[#1e9ba6]/90 text-white">
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save Settings
        </Button>
      </div>

      {Object.entries(groups).map(([group, fields]) => (
        <Card key={group} className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{group}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={`settings-${field.key}`} className="text-sm font-medium">{field.label}</Label>
                {field.type === 'textarea' ? (
                  <Textarea
                    id={`settings-${field.key}`}
                    value={settings[field.key] || ''}
                    onChange={(e) => updateField(field.key, e.target.value)}
                    rows={field.rows || 4}
                    placeholder={`Enter ${field.label.toLowerCase()}...`}
                  />
                ) : (
                  <Input
                    id={`settings-${field.key}`}
                    value={settings[field.key] || ''}
                    onChange={(e) => updateField(field.key, e.target.value)}
                    placeholder={`Enter ${field.label.toLowerCase()}...`}
                  />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {/* UPI QR Code Preview */}
      {settings.upi_id && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">UPI QR Code Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="bg-white p-4 rounded-xl border-2 border-dashed border-[#1e9ba6]/30">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=${encodeURIComponent(settings.upi_id)}&pn=StyleWithHer`} 
                  alt="UPI QR Code" 
                  className="w-48 h-48"
                />
              </div>
              <div>
                <p className="text-sm font-medium mb-1">UPI ID: <span className="font-mono text-[#1e9ba6]">{settings.upi_id}</span></p>
                <p className="text-sm text-muted-foreground">Customers can scan this QR code to pay via UPI</p>
                <p className="text-xs text-muted-foreground mt-2">This QR code will be shown to customers during UPI checkout</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ACTIVITY LOGS TAB
// ═══════════════════════════════════════════════════════════════════════════════
function ActivityLogsTab() {
  const { showToast } = useStore()
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterAction, setFilterAction] = useState('')

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterAction) params.set('action', filterAction)
      if (search) params.set('search', search)
      const res = await fetch(`/api/admin/audit-logs?${params}`, { headers: authHeaders() })
      if (!res.ok) throw new Error('Failed to fetch')
      const json = await res.json()
      setLogs(json.logs || [])
    } catch (err: any) {
      showToast(err.message || 'Error loading logs', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast, filterAction, search])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  const getActionColor = (action: string) => {
    if (action.includes('LOGIN')) return 'bg-blue-100 text-blue-800'
    if (action.includes('SIGNUP')) return 'bg-green-100 text-green-800'
    if (action.includes('ORDER')) return 'bg-purple-100 text-purple-800'
    if (action.includes('PAYMENT')) return 'bg-amber-100 text-amber-800'
    if (action.includes('DELETE')) return 'bg-red-100 text-red-800'
    if (action.includes('PASSWORD')) return 'bg-orange-100 text-orange-800'
    if (action.includes('UPLOAD')) return 'bg-cyan-100 text-cyan-800'
    return 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return <div className="space-y-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-xl font-bold">Activity Logs ({logs.length})</h2>
        <div className="flex gap-2">
          <div className="relative w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search logs..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-xs" />
          </div>
          <Select value={filterAction} onValueChange={setFilterAction}>
            <SelectTrigger className="w-36 h-9 text-xs"><SelectValue placeholder="All Actions" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Actions</SelectItem>
              <SelectItem value="LOGIN">Login</SelectItem>
              <SelectItem value="SIGNUP">Signup</SelectItem>
              <SelectItem value="ORDER">Orders</SelectItem>
              <SelectItem value="PAYMENT">Payments</SelectItem>
              <SelectItem value="UPLOAD">Uploads</SelectItem>
              <SelectItem value="PASSWORD">Password</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="max-h-[65vh] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Time</TableHead>
                <TableHead className="text-xs">User</TableHead>
                <TableHead className="text-xs">Action</TableHead>
                <TableHead className="text-xs hidden md:table-cell">Details</TableHead>
                <TableHead className="text-xs hidden lg:table-cell">IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{fmtDateTime(log.createdAt)}</TableCell>
                  <TableCell className="text-sm font-medium">{log.userName}</TableCell>
                  <TableCell>
                    <Badge className={getActionColor(log.action)} variant="secondary" style={{ maxWidth: '160px' }}>
                      <span className="truncate block">{log.action}</span>
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground hidden md:table-cell max-w-[300px] truncate">{log.details || '—'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground font-mono hidden lg:table-cell">{log.ipAddress || '—'}</TableCell>
                </TableRow>
              ))}
              {logs.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No activity logs found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// POSTS TAB
// ═══════════════════════════════════════════════════════════════════════════════
function PostsTab() {
  const { showToast } = useStore()
  const { t } = useTranslation()
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingPost, setEditingPost] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')

  const emptyForm = { title: '', content: '', excerpt: '', category: '', tags: '', featuredImage: '', status: 'draft' as string, scheduledAt: '' }
  const [form, setForm] = useState(emptyForm)

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    try {
      const params = filterStatus !== 'all' ? `?status=${filterStatus}` : ''
      const res = await fetch(`/api/admin/posts${params}`, { headers: authHeaders() })
      if (!res.ok) throw new Error('Failed to fetch posts')
      const json = await res.json()
      setPosts(json.posts || [])
    } catch (err: any) {
      showToast(err.message || 'Error loading posts', 'error')
    } finally {
      setLoading(false)
    }
  }, [filterStatus, showToast])

  useEffect(() => { fetchPosts() }, [fetchPosts])

  const openCreate = () => { setEditingPost(null); setForm(emptyForm); setShowForm(true) }
  const openEdit = (post: any) => {
    setEditingPost(post)
    setForm({
      title: post.title || '',
      content: post.content || '',
      excerpt: post.excerpt || '',
      category: post.category || '',
      tags: post.tags || '',
      featuredImage: post.featuredImage || '',
      status: post.status || 'draft',
      scheduledAt: post.scheduledAt ? new Date(post.scheduledAt).toISOString().slice(0, 16) : '',
    })
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.title.trim()) { showToast('Title is required', 'error'); return }
    setSaving(true)
    try {
      const url = editingPost ? `/api/admin/posts/${editingPost.id}` : '/api/admin/posts'
      const method = editingPost ? 'PUT' : 'POST'
      const body: any = { ...form }
      if (body.status === 'draft' || !body.status) body.scheduledAt = null

      const res = await fetch(url, {
        method,
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to save post')
      }
      showToast(editingPost ? 'Post updated!' : 'Post created!', 'success')
      setShowForm(false)
      fetchPosts()
    } catch (err: any) {
      showToast(err.message || 'Error saving post', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return
    try {
      const res = await fetch(`/api/admin/posts/${id}`, { method: 'DELETE', headers: authHeaders() })
      if (!res.ok) throw new Error('Failed to delete post')
      showToast('Post deleted!', 'success')
      fetchPosts()
    } catch (err: any) {
      showToast(err.message || 'Error deleting post', 'error')
    }
  }

  const handleStatusChange = async (post: any, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/posts/${post.id}`, {
        method: 'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error('Failed to update status')
      showToast(`Post ${newStatus}!`, 'success')
      fetchPosts()
    } catch (err: any) {
      showToast(err.message || 'Error updating status', 'error')
    }
  }

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-700',
      published: 'bg-green-100 text-green-800',
      scheduled: 'bg-blue-100 text-blue-800',
    }
    return <Badge className={`${colors[status] || 'bg-gray-100 text-gray-700'} text-xs`} variant="secondary">{status}</Badge>
  }

  if (loading) return <div className="space-y-4"><Skeleton className="h-12 w-full" /><Skeleton className="h-64 w-full" /><Skeleton className="h-64 w-full" /></div>

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{posts.length} post{posts.length !== 1 ? 's' : ''} found</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36 h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={openCreate} className="bg-[#0B1F3A] hover:bg-[#0B1F3A]/90 text-white h-9">
            <Plus className="h-4 w-4 mr-2" /> Add Post
          </Button>
        </div>
      </div>

      {/* Posts List */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="max-h-[65vh] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Title</TableHead>
                <TableHead className="text-xs hidden md:table-cell">Category</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs hidden lg:table-cell">Date</TableHead>
                <TableHead className="text-xs text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium text-[#0B1F3A]">{post.title}</p>
                      {post.excerpt && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 max-w-[250px]">{post.excerpt}</p>}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm hidden md:table-cell">{post.category || '—'}</TableCell>
                  <TableCell>{statusBadge(post.status)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground hidden lg:table-cell whitespace-nowrap">{fmtDate(post.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      {post.status === 'draft' && (
                        <Button size="sm" variant="ghost" className="h-7 text-xs text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => handleStatusChange(post, 'published')}>
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Publish
                        </Button>
                      )}
                      {post.status === 'published' && (
                        <Button size="sm" variant="ghost" className="h-7 text-xs text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50" onClick={() => handleStatusChange(post, 'draft')}>
                          <XCircle className="h-3.5 w-3.5 mr-1" /> Unpublish
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => openEdit(post)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(post.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {posts.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  <FileText className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p>No posts yet. Create your first post!</p>
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPost ? 'Edit Post' : 'Create New Post'}</DialogTitle>
            <DialogDescription>{editingPost ? 'Update post details below.' : 'Fill in the details to create a new post.'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Enter post title..." />
            </div>
            <div className="space-y-2">
              <Label>Excerpt</Label>
              <Textarea value={form.excerpt} onChange={(e) => setForm(f => ({ ...f, excerpt: e.target.value }))} placeholder="Brief summary..." rows={2} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Input value={form.category} onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))} placeholder="e.g. Fashion Tips" />
              </div>
              <div className="space-y-2">
                <Label>Tags (comma-separated)</Label>
                <Input value={form.tags} onChange={(e) => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="fashion, style, couple" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Featured Image URL</Label>
              <Input value={form.featuredImage} onChange={(e) => setForm(f => ({ ...f, featuredImage: e.target.value }))} placeholder="https://... or /uploads/..." />
              {form.featuredImage && (
                <div className="mt-2 rounded-lg overflow-hidden border max-h-40 bg-gray-50">
                  <img src={form.featuredImage} alt="Preview" className="w-full h-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea value={form.content} onChange={(e) => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Write your post content here... (HTML supported)" rows={8} className="font-mono text-sm" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.status === 'scheduled' && (
                <div className="space-y-2">
                  <Label>Schedule At</Label>
                  <Input type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm(f => ({ ...f, scheduledAt: e.target.value }))} />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">{t('admin.cancel')}</Button></DialogClose>
            <Button onClick={handleSave} disabled={saving} className="bg-[#0B1F3A] hover:bg-[#0B1F3A]/90 text-white">
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingPost ? 'Update Post' : 'Create Post'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MEDIA TAB
// ═══════════════════════════════════════════════════════════════════════════════
function MediaTab() {
  const { showToast } = useStore()
  const [files, setFiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [filterType, setFilterType] = useState('all')

  const fetchMedia = useCallback(async () => {
    setLoading(true)
    try {
      const params = filterType !== 'all' ? `?type=${filterType}` : ''
      const res = await fetch(`/api/admin/media${params}`, { headers: authHeaders() })
      if (!res.ok) throw new Error('Failed to fetch media')
      const json = await res.json()
      setFiles(json.files || [])
    } catch (err: any) {
      showToast(err.message || 'Error loading media', 'error')
    } finally {
      setLoading(false)
    }
  }, [filterType, showToast])

  useEffect(() => { fetchMedia() }, [fetchMedia])

  const uploadFiles = async (fileList: FileList | File[]) => {
    if (fileList.length === 0) return
    setUploading(true)
    let success = 0
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i]
      const fd = new FormData()
      fd.append('file', file)
      try {
        const res = await fetch('/api/admin/media', { method: 'POST', headers: authHeaders(), body: fd })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Upload failed')
        }
        success++
      } catch (err: any) {
        showToast(`${file.name}: ${err.message}`, 'error')
      }
    }
    setUploading(false)
    if (success > 0) {
      showToast(`${success} file${success > 1 ? 's' : ''} uploaded!`, 'success')
      fetchMedia()
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files.length > 0) uploadFiles(e.dataTransfer.files)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) uploadFiles(e.target.files)
    e.target.value = ''
  }

  const handleDelete = async (fileId: string, filename: string) => {
    if (!confirm(`Delete "${filename}"?`)) return
    try {
      const res = await fetch(`/api/admin/media?fileId=${fileId}`, { method: 'DELETE', headers: authHeaders() })
      if (!res.ok) throw new Error('Failed to delete file')
      showToast('File deleted!', 'success')
      fetchMedia()
    } catch (err: any) {
      showToast(err.message || 'Error deleting file', 'error')
    }
  }

  const copyUrl = (url: string) => {
    const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`
    navigator.clipboard.writeText(fullUrl)
    showToast('URL copied to clipboard!', 'success')
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const isImage = (mimeType: string) => mimeType.startsWith('image/')

  if (loading) return <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">{[...Array(8)].map((_, i) => <Skeleton key={i} className="aspect-square rounded-xl" />)}</div>

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{files.length} file{files.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-32 h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="image">Images</SelectItem>
              <SelectItem value="video">Videos</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => document.getElementById('media-file-input')?.click()} className="bg-[#0B1F3A] hover:bg-[#0B1F3A]/90 text-white h-9" disabled={uploading}>
            {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
            {uploading ? 'Uploading...' : 'Upload Files'}
          </Button>
          <input id="media-file-input" type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleFileInput} />
        </div>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          dragOver ? 'border-[#0B1F3A] bg-[#0B1F3A]/5' : 'border-gray-300 hover:border-gray-400 bg-gray-50/50'
        }`}
      >
        <Upload className={`h-10 w-10 mx-auto mb-3 ${dragOver ? 'text-[#0B1F3A]' : 'text-gray-400'}`} />
        <p className="text-sm font-medium text-[#0B1F3A]">Drag & drop files here</p>
        <p className="text-xs text-muted-foreground mt-1">or click Upload above. Images (JPG, PNG, WebP, GIF) up to 10MB, Videos up to 50MB</p>
        <p className="text-xs text-muted-foreground mt-1">Images are auto-compressed to WebP for faster loading</p>
      </div>

      {/* Media Grid */}
      {files.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No media files yet. Upload your first file!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {files.map((file) => (
            <div key={file.id} className="group relative bg-white rounded-xl border shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="aspect-square bg-gray-100 relative">
                {isImage(file.mimeType) ? (
                  <img src={file.url} alt={file.alt || file.filename} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                    <FileText className="h-8 w-8 mb-1" />
                    <span className="text-[10px]">Video</span>
                  </div>
                )}
                {/* Overlay Actions */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <button onClick={() => copyUrl(file.url)} className="h-8 w-8 rounded-full bg-white/90 flex items-center justify-center text-[#0B1F3A] hover:bg-white" title="Copy URL">
                    <Copy className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(file.id, file.filename)} className="h-8 w-8 rounded-full bg-red-500/90 flex items-center justify-center text-white hover:bg-red-600" title="Delete">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="p-2">
                <p className="text-xs font-medium text-[#0B1F3A] truncate">{file.filename}</p>
                <p className="text-[10px] text-muted-foreground">{formatSize(file.size)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
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
      case 'products': return <AdminProductManager />
      case 'orders': return <OrdersTab />
      case 'payments': return <PaymentsTab />
      case 'customers': return <CustomersTab />
      case 'coupons': return <CouponsTab />
      case 'reviews': return <ReviewsTab />
      case 'content': return <ContentTab />
      case 'posts': return <PostsTab />
      case 'media': return <MediaTab />
      case 'inventory': return <InventoryTab />
      case 'settings': return <SettingsTab />
      case 'instagram': return <InstagramTab />
      case 'activity': return <ActivityLogsTab />
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