'use client'

import { useState, useEffect } from 'react'
import { useStore } from '@/store/use-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Package, Truck, CheckCircle, Check, Clock, XCircle, ArrowLeft, RotateCcw, MapPin, CreditCard, Copy } from 'lucide-react'

// ─── Status Helpers ────────────────────────────────────────────────────────────

const STATUS_STEPS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'] as const

function getStatusBadge(status: string) {
  const map: Record<string, { label: string; className: string }> = {
    pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    confirmed: { label: 'Confirmed', className: 'bg-blue-100 text-blue-700 border-blue-200' },
    processing: { label: 'Processing', className: 'bg-purple-100 text-purple-700 border-purple-200' },
    shipped: { label: 'Shipped', className: 'bg-orange-100 text-orange-700 border-orange-200' },
    delivered: { label: 'Delivered', className: 'bg-green-100 text-green-700 border-green-200' },
    cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-700 border-red-200' },
  }
  return map[status] || { label: status, className: 'bg-gray-100 text-gray-700 border-gray-200' }
}

function getPaymentMethodLabel(method: string) {
  const map: Record<string, string> = {
    cod: 'Cash on Delivery',
    razorpay: 'Razorpay',
    upi: 'UPI',
    card: 'Credit/Debit Card',
  }
  return map[method] || method
}

function getPaymentStatusBadge(status: string) {
  const map: Record<string, { label: string; className: string }> = {
    pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    completed: { label: 'Paid', className: 'bg-green-100 text-green-700 border-green-200' },
    failed: { label: 'Failed', className: 'bg-red-100 text-red-700 border-red-200' },
    refunded: { label: 'Refunded', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  }
  return map[status] || { label: status, className: 'bg-gray-100 text-gray-700 border-gray-200' }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// ─── Orders List Page ─────────────────────────────────────────────────────────

export function OrdersListPage() {
  const { navigate, pageParams, user, isAuthenticated, showToast } = useStore()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState(pageParams?.filter || 'all')

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('login')
      return
    }
    fetchOrders()
  }, [isAuthenticated, user?.token, navigate])

  const fetchOrders = async () => {
    if (!user?.token) return
    try {
      setLoading(true)
      const res = await fetch('/api/orders', {
        headers: { Authorization: `Bearer ${user.token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setOrders(data.orders || [])
      } else {
        showToast('Failed to load orders', 'error')
      }
    } catch {
      showToast('Failed to load orders', 'error')
    } finally {
      setLoading(false)
    }
  }

  const filteredOrders = orders.filter((order) => {
    if (activeFilter === 'all') return true
    if (activeFilter === 'pending') return order.status === 'pending'
    if (activeFilter === 'delivered') return order.status === 'delivered'
    if (activeFilter === 'cancelled') return order.status === 'cancelled'
    return true
  })

  const filterTabs = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'delivered', label: 'Delivered' },
    { id: 'cancelled', label: 'Cancelled' },
  ]

  if (!isAuthenticated) return null

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-[#0B1F3A] py-6 px-4">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={() => navigate('home')}
            className="flex items-center gap-2 text-[#F7C8D0] hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">My Orders</h1>
          <p className="text-[#F7C8D0] text-sm mt-1">Track and manage your orders</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {filterTabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeFilter === tab.id ? 'default' : 'outline'}
              onClick={() => setActiveFilter(tab.id)}
              className={
                activeFilter === tab.id
                  ? 'bg-[#0B1F3A] hover:bg-[#0B1F3A]/90 text-white shrink-0'
                  : 'border-[#F7C8D0] text-[#222222] hover:bg-[#FFF5F7] hover:text-[#D96C8A] shrink-0'
              }
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-36 w-full rounded-xl" />
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-20 h-20 bg-[#FFF5F7] rounded-full flex items-center justify-center mb-6">
              <Package className="w-10 h-10 text-[#D96C8A]" />
            </div>
            <h2 className="text-xl font-bold text-[#0B1F3A] mb-2">
              {activeFilter === 'all' ? 'No Orders Yet' : `No ${activeFilter} Orders`}
            </h2>
            <p className="text-[#222222]/60 text-center max-w-md mb-6">
              {activeFilter === 'all'
                ? "You haven't placed any orders yet. Start shopping and your orders will appear here!"
                : `You don't have any ${activeFilter} orders at the moment.`}
            </p>
            {activeFilter === 'all' && (
              <Button
                onClick={() => navigate('products')}
                className="bg-[#0B1F3A] hover:bg-[#0B1F3A]/90 text-white px-8"
              >
                Start Shopping
              </Button>
            )}
          </div>
        ) : (
          /* Order Cards */
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const badge = getStatusBadge(order.status)
              return (
                <button
                  key={order.id}
                  onClick={() => navigate('order-detail', { id: order.id })}
                  className="w-full text-left group"
                >
                  <Card className="border-[#F7C8D0]/30 shadow-sm hover:shadow-md hover:border-[#D96C8A]/40 transition-all duration-200">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="font-semibold text-[#0B1F3A] text-sm">
                              #{order.orderNumber}
                            </h3>
                            <Badge variant="outline" className={`text-[10px] px-2 py-0 border ${badge.className}`}>
                              {badge.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-[#222222]/50">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(order.createdAt)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Package className="w-3 h-3" />
                              {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-bold text-[#0B1F3A] text-lg">₹{order.total.toLocaleString('en-IN')}</p>
                            <p className="text-[10px] text-[#222222]/40">{getPaymentMethodLabel(order.paymentMethod)}</p>
                          </div>
                          <ArrowLeft className="w-4 h-4 text-[#D96C8A] rotate-180 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>

                      {/* Item Thumbnails */}
                      {order.items && order.items.length > 0 && (
                        <div className="flex gap-2 mt-4 overflow-hidden">
                          {order.items.slice(0, 4).map((item: any, idx: number) => (
                            <div
                              key={idx}
                              className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden bg-[#FFF5F7] shrink-0 border border-[#F7C8D0]/30"
                            >
                              {item.productImage ? (
                                <img
                                  src={item.productImage}
                                  alt={item.productName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className="w-4 h-4 text-[#D96C8A]/30" />
                                </div>
                              )}
                            </div>
                          ))}
                          {order.items.length > 4 && (
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-[#FFF5F7] flex items-center justify-center border border-[#F7C8D0]/30 shrink-0">
                              <span className="text-xs font-medium text-[#D96C8A]">+{order.items.length - 4}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Order Detail Page ────────────────────────────────────────────────────────

export function OrderDetailPage() {
  const { navigate, pageParams, user, isAuthenticated, showToast, addToCartOptimistic } = useStore()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)

  const orderId = pageParams?.id

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('login')
      return
    }
    if (orderId) fetchOrder()
    else navigate('orders')
  }, [isAuthenticated, user?.token, orderId, navigate])

  const fetchOrder = async () => {
    if (!user?.token || !orderId) return
    try {
      setLoading(true)
      const res = await fetch(`/api/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setOrder(data.order)
      } else {
        showToast('Failed to load order details', 'error')
        navigate('orders')
      }
    } catch {
      showToast('Failed to load order details', 'error')
      navigate('orders')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelOrder = async () => {
    if (!user?.token || !orderId) return
    try {
      setCancelling(true)
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ action: 'cancel' }),
      })
      if (res.ok) {
        showToast('Order cancelled successfully', 'success')
        fetchOrder()
      } else {
        const err = await res.json()
        showToast(err.error || 'Failed to cancel order', 'error')
      }
    } catch {
      showToast('Failed to cancel order', 'error')
    } finally {
      setCancelling(false)
    }
  }

  const handleReorder = () => {
    if (!order?.items) return
    order.items.forEach((item: any) => {
      addToCartOptimistic({
        id: `reorder-${item.productId}-${Date.now()}`,
        productId: item.productId,
        variantId: null,
        quantity: item.quantity,
        product: {
          id: item.productId,
          name: item.productName,
          slug: item.productName.toLowerCase().replace(/\s+/g, '-'),
          basePrice: item.price,
          salePrice: null,
          images: item.productImage
            ? [{ id: '1', url: item.productImage, alt: item.productName }]
            : [],
          variants: [],
        },
      })
    })
    showToast(`${order.items.length} item(s) added to cart`, 'success')
  }

  const handleCopyTracking = (trackingNumber: string) => {
    navigator.clipboard.writeText(trackingNumber).then(() => {
      showToast('Tracking number copied!', 'success')
    }).catch(() => {
      showToast('Failed to copy', 'error')
    })
  }

  const currentStepIndex = STATUS_STEPS.indexOf(order?.status as typeof STATUS_STEPS[number])
  const progressPercent = order?.status === 'cancelled'
    ? 0
    : Math.max(0, (currentStepIndex / (STATUS_STEPS.length - 1)) * 100)

  if (!isAuthenticated) return null

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="bg-[#0B1F3A] py-6 px-4">
          <div className="max-w-5xl mx-auto">
            <Skeleton className="h-6 w-24 mb-4 bg-white/10" />
            <Skeleton className="h-8 w-48 bg-white/10" />
            <Skeleton className="h-4 w-64 bg-white/10 mt-2" />
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </div>
    )
  }

  if (!order) return null

  const statusBadge = getStatusBadge(order.status)
  const paymentBadge = getPaymentStatusBadge(order.paymentStatus)
  const canCancel = order.status === 'pending' || order.status === 'confirmed'

  const stepIcons: Record<string, React.ReactNode> = {
    pending: <Clock className="w-4 h-4" />,
    confirmed: <CheckCircle className="w-4 h-4" />,
    processing: <Package className="w-4 h-4" />,
    shipped: <Truck className="w-4 h-4" />,
    delivered: <CheckCircle className="w-4 h-4" />,
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-[#0B1F3A] py-6 px-4">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={() => navigate('orders')}
            className="flex items-center gap-2 text-[#F7C8D0] hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Orders</span>
          </button>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Order #{order.orderNumber}</h1>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                <span className="text-[#F7C8D0] text-sm">Placed on {formatDate(order.createdAt)}</span>
                {order.trackingNumber && (
                  <span className="flex items-center gap-1.5 text-[#F7C8D0] text-sm">
                    <Truck className="w-3.5 h-3.5" />
                    Tracking:
                    <button
                      onClick={() => handleCopyTracking(order.trackingNumber)}
                      className="flex items-center gap-1 hover:text-white transition-colors"
                    >
                      <span className="font-mono font-medium">{order.trackingNumber}</span>
                      <Copy className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
            </div>
            <Badge variant="outline" className={`text-xs px-3 py-1 border w-fit ${statusBadge.className}`}>
              {statusBadge.label}
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Order Progress / Timeline */}
        {order.status !== 'cancelled' && (
          <Card className="border-[#F7C8D0]/30 shadow-sm mb-6">
            <CardContent className="p-4 sm:p-6">
              <h3 className="text-sm font-semibold text-[#0B1F3A] mb-5">Order Progress</h3>
              {/* Progress Bar */}
              <div className="relative mb-8">
                <div className="absolute top-2.5 left-0 right-0 h-1 bg-[#F7C8D0]/30 rounded-full" />
                <div
                  className="absolute top-2.5 left-0 h-1 bg-[#D96C8A] rounded-full transition-all duration-700"
                  style={{ width: `${progressPercent}%` }}
                />
                <div className="relative flex justify-between">
                  {STATUS_STEPS.map((step, idx) => {
                    const isCompleted = idx <= currentStepIndex
                    const isCurrent = idx === currentStepIndex
                    return (
                      <div key={step} className="flex flex-col items-center gap-2" style={{ minWidth: '48px' }}>
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 ${
                            isCompleted
                              ? 'bg-[#D96C8A] text-white'
                              : 'bg-[#F7C8D0]/30 text-[#D96C8A]/40'
                          } ${isCurrent ? 'ring-4 ring-[#D96C8A]/20' : ''}`}
                        >
                          {isCompleted ? (
                            <Check className="w-3 h-3" />
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          )}
                        </div>
                        <span
                          className={`text-[10px] sm:text-xs font-medium capitalize text-center ${
                            isCompleted ? 'text-[#D96C8A]' : 'text-[#222222]/30'
                          }`}
                        >
                          {step}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Timeline Details */}
              <div className="space-y-3 border-l-2 border-[#F7C8D0]/30 pl-4 ml-2.5">
                <div className="relative">
                  <div className="absolute -left-[21px] top-0.5 w-3 h-3 bg-[#D96C8A] rounded-full border-2 border-white" />
                  <div>
                    <p className="text-sm font-medium text-[#222222]">Order Placed</p>
                    <p className="text-xs text-[#222222]/50">{formatDate(order.createdAt)}</p>
                  </div>
                </div>
                {order.status === 'cancelled' ? (
                  <div className="relative">
                    <div className="absolute -left-[21px] top-0.5 w-3 h-3 bg-red-400 rounded-full border-2 border-white" />
                    <div>
                      <p className="text-sm font-medium text-red-600">Order Cancelled</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {currentStepIndex >= 1 && (
                      <div className="relative">
                        <div className="absolute -left-[21px] top-0.5 w-3 h-3 bg-[#D96C8A] rounded-full border-2 border-white" />
                        <div>
                          <p className="text-sm font-medium text-[#222222]">Order Confirmed</p>
                          <p className="text-xs text-[#222222]/50">Your order has been confirmed and is being prepared</p>
                        </div>
                      </div>
                    )}
                    {currentStepIndex >= 2 && (
                      <div className="relative">
                        <div className="absolute -left-[21px] top-0.5 w-3 h-3 bg-[#D96C8A] rounded-full border-2 border-white" />
                        <div>
                          <p className="text-sm font-medium text-[#222222]">Processing</p>
                          <p className="text-xs text-[#222222]/50">Your items are being packed and quality checked</p>
                        </div>
                      </div>
                    )}
                    {currentStepIndex >= 3 && (
                      <div className="relative">
                        <div className="absolute -left-[21px] top-0.5 w-3 h-3 bg-[#D96C8A] rounded-full border-2 border-white" />
                        <div>
                          <p className="text-sm font-medium text-[#222222]">Shipped</p>
                          {order.shippedAt && (
                            <p className="text-xs text-[#222222]/50">Shipped on {formatDate(order.shippedAt)}</p>
                          )}
                          {order.trackingNumber && (
                            <p className="text-xs text-[#D96C8A] font-medium mt-0.5">
                              Tracking: {order.trackingNumber}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                    {currentStepIndex >= 4 && order.deliveredAt && (
                      <div className="relative">
                        <div className="absolute -left-[21px] top-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                        <div>
                          <p className="text-sm font-medium text-green-700">Delivered</p>
                          <p className="text-xs text-[#222222]/50">Delivered on {formatDate(order.deliveredAt)}</p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {order.status === 'cancelled' && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
            <XCircle className="w-5 h-5 text-red-500 shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-700">This order has been cancelled</p>
              <p className="text-xs text-red-600/70">If you were charged, a refund will be processed within 5-7 business days.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Items & Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <Card className="border-[#F7C8D0]/30 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-[#0B1F3A] text-lg">
                  <Package className="w-5 h-5 text-[#D96C8A]" />
                  Order Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.items?.map((item: any, idx: number) => (
                    <div key={idx}>
                      <div className="flex gap-4">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-[#FFF5F7] shrink-0 border border-[#F7C8D0]/20">
                          {item.productImage ? (
                            <img
                              src={item.productImage}
                              alt={item.productName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-6 h-6 text-[#D96C8A]/30" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-[#222222] text-sm truncate">{item.productName}</p>
                          {(item.color || item.size) && (
                            <p className="text-xs text-[#222222]/50 mt-0.5">
                              {item.color && <span className="text-[#D96C8A]">{item.color}</span>}
                              {item.color && item.size && ' / '}
                              {item.size && <span>{item.size}</span>}
                            </p>
                          )}
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-[#222222]/50">Qty: {item.quantity}</span>
                            <span className="font-semibold text-[#0B1F3A] text-sm">
                              ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      </div>
                      {idx < (order.items?.length || 0) - 1 && (
                        <Separator className="mt-4 bg-[#F7C8D0]/20" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            {order.address && (
              <Card className="border-[#F7C8D0]/30 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-[#0B1F3A] text-lg">
                    <MapPin className="w-5 h-5 text-[#D96C8A]" />
                    Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-[#FFF5F7]/50 rounded-xl border border-[#F7C8D0]/20">
                    <p className="font-semibold text-[#222222] text-sm">{order.address.fullName}</p>
                    <p className="text-sm text-[#222222]/70 mt-1">{order.address.phone}</p>
                    <p className="text-sm text-[#222222]/70 mt-1">
                      {order.address.addressLine1}
                      {order.address.addressLine2 ? `, ${order.address.addressLine2}` : ''}
                    </p>
                    <p className="text-sm text-[#222222]/70">
                      {order.address.city}, {order.address.state} - {order.address.pincode}
                    </p>
                    {order.address.country && (
                      <p className="text-sm text-[#222222]/70">{order.address.country}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Summary & Actions */}
          <div className="space-y-6">
            {/* Payment Info */}
            <Card className="border-[#F7C8D0]/30 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-[#0B1F3A] text-base">
                  <CreditCard className="w-5 h-5 text-[#D96C8A]" />
                  Payment Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#222222]/50">Method</span>
                  <span className="text-sm font-medium text-[#222222]">{getPaymentMethodLabel(order.paymentMethod)}</span>
                </div>
                <Separator className="bg-[#F7C8D0]/20" />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#222222]/50">Status</span>
                  <Badge variant="outline" className={`text-[10px] px-2 py-0 border ${paymentBadge.className}`}>
                    {paymentBadge.label}
                  </Badge>
                </div>
                <Separator className="bg-[#F7C8D0]/20" />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#222222]/50">Amount</span>
                  <span className="text-sm font-bold text-[#0B1F3A]">₹{order.total.toLocaleString('en-IN')}</span>
                </div>
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card className="border-[#F7C8D0]/30 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-[#0B1F3A] text-base">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#222222]/70">Subtotal</span>
                  <span className="text-[#222222]">₹{order.subtotal.toLocaleString('en-IN')}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-green-600">Discount</span>
                    <span className="text-green-600 font-medium">-₹{order.discount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#222222]/70">Tax (GST)</span>
                  <span className="text-[#222222]">₹{order.tax.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#222222]/70">Shipping</span>
                  {order.shipping === 0 ? (
                    <span className="text-green-600 font-medium text-xs">FREE</span>
                  ) : (
                    <span className="text-[#222222]">₹{order.shipping.toLocaleString('en-IN')}</span>
                  )}
                </div>
                <Separator className="bg-[#F7C8D0]/30" />
                <div className="flex items-center justify-between pt-1">
                  <span className="font-bold text-[#0B1F3A]">Total</span>
                  <span className="font-bold text-[#0B1F3A] text-xl">₹{order.total.toLocaleString('en-IN')}</span>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="space-y-3">
              <Button
                onClick={handleReorder}
                className="w-full bg-[#0B1F3A] hover:bg-[#0B1F3A]/90 text-white"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reorder Items
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('orders')}
                className="w-full border-[#F7C8D0] text-[#222222] hover:bg-[#FFF5F7] hover:text-[#D96C8A]"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Orders
              </Button>
              {canCancel && (
                <Button
                  variant="outline"
                  onClick={handleCancelOrder}
                  disabled={cancelling}
                  className="w-full border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  {cancelling ? 'Cancelling...' : 'Cancel Order'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}