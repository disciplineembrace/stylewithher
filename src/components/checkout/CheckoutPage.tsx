'use client'

import { useState, useEffect } from 'react'
import { useStore } from '@/store/use-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { MapPin, CreditCard, Truck, Tag, ArrowLeft, Check, Shield, Lock } from 'lucide-react'
import type { AddressData } from '@/store/use-store'

interface CouponValidation {
  valid: boolean
  code: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  maxDiscount?: number
  message: string
}

export default function CheckoutPage() {
  const {
    navigate,
    isAuthenticated,
    user,
    cart,
    getCartTotal,
    showToast,
    setCart,
    addToCartOptimistic,
  } = useStore()

  // Address state
  const [addresses, setAddresses] = useState<AddressData[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string>('')
  const [addressesLoading, setAddressesLoading] = useState(true)
  const [showNewAddress, setShowNewAddress] = useState(false)
  const [newAddress, setNewAddress] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
  })
  const [savingAddress, setSavingAddress] = useState(false)

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState('cod')
  const [simulatedPayment, setSimulatedPayment] = useState(false)

  // Coupon state
  const [couponCode, setCouponCode] = useState('')
  const [couponValidation, setCouponValidation] = useState<CouponValidation | null>(null)
  const [validatingCoupon, setValidatingCoupon] = useState(false)

  // Order notes
  const [notes, setNotes] = useState('')

  // Placing order
  const [placingOrder, setPlacingOrder] = useState(false)

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('login')
    }
  }, [isAuthenticated, navigate])

  // Fetch addresses
  useEffect(() => {
    if (!isAuthenticated || !user?.token) return
    const fetchAddresses = async () => {
      try {
        setAddressesLoading(true)
        const res = await fetch('/api/addresses', {
          headers: { Authorization: `Bearer ${user.token}` },
        })
        if (res.ok) {
          const data = await res.json()
          setAddresses(data.addresses || [])
          const defaultAddr = (data.addresses || []).find((a: AddressData) => a.isDefault)
          if (defaultAddr) setSelectedAddressId(defaultAddr.id)
          else if (data.addresses?.length > 0) setSelectedAddressId(data.addresses[0].id)
        }
      } catch {
        showToast('Failed to load addresses', 'error')
      } finally {
        setAddressesLoading(false)
      }
    }
    fetchAddresses()
  }, [isAuthenticated, user?.token, showToast])

  const subtotal = getCartTotal()
  const tax = Math.round(subtotal * 0.18)
  const shipping = subtotal >= 999 ? 0 : 99
  const discountAmount = couponValidation?.valid
    ? couponValidation.discountType === 'percentage'
      ? Math.min(Math.round(subtotal * couponValidation.discountValue / 100), couponValidation.maxDiscount || Infinity)
      : couponValidation.discountValue
    : 0
  const total = subtotal + tax + shipping - discountAmount

  if (!isAuthenticated) return null

  if (cart.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <div className="w-20 h-20 bg-[#FFF5F7] rounded-full flex items-center justify-center mb-6">
          <Truck className="w-10 h-10 text-[#D96C8A]" />
        </div>
        <h2 className="text-2xl font-bold text-[#0B1F3A] mb-2">Your Cart is Empty</h2>
        <p className="text-[#222222]/60 mb-6 text-center max-w-md">
          Looks like you haven&apos;t added anything to your cart yet. Browse our collection and find something you love!
        </p>
        <Button
          onClick={() => navigate('products')}
          className="bg-[#0B1F3A] hover:bg-[#0B1F3A]/90 text-white px-8"
        >
          Shop Now
        </Button>
      </div>
    )
  }

  const handleSaveNewAddress = async () => {
    if (!user?.token) return
    if (!newAddress.fullName || !newAddress.phone || !newAddress.addressLine1 || !newAddress.city || !newAddress.state || !newAddress.pincode) {
      showToast('Please fill in all required fields', 'error')
      return
    }
    try {
      setSavingAddress(true)
      const res = await fetch('/api/addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          ...newAddress,
          country: 'India',
          isDefault: addresses.length === 0,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setAddresses((prev) => [...prev, data.address])
        setSelectedAddressId(data.address.id)
        setShowNewAddress(false)
        setNewAddress({ fullName: '', phone: '', addressLine1: '', addressLine2: '', city: '', state: '', pincode: '' })
        showToast('Address saved successfully!', 'success')
      } else {
        const err = await res.json()
        showToast(err.error || 'Failed to save address', 'error')
      }
    } catch {
      showToast('Failed to save address', 'error')
    } finally {
      setSavingAddress(false)
    }
  }

  const handleValidateCoupon = async () => {
    if (!couponCode.trim() || !user?.token) return
    try {
      setValidatingCoupon(true)
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ code: couponCode.trim(), orderAmount: subtotal }),
      })
      const data = await res.json()
      if (res.ok && data.valid) {
        setCouponValidation(data)
        showToast(`Coupon applied! ${data.message}`, 'success')
      } else {
        setCouponValidation(null)
        showToast(data.error || 'Invalid coupon code', 'error')
      }
    } catch {
      showToast('Failed to validate coupon', 'error')
    } finally {
      setValidatingCoupon(false)
    }
  }

  const handleRemoveCoupon = () => {
    setCouponCode('')
    setCouponValidation(null)
  }

  const getItemPrice = (item: typeof cart[0]) => {
    if (item.variantId) {
      const variant = item.product.variants.find((v) => v.id === item.variantId)
      return variant?.price ?? item.product.salePrice ?? item.product.basePrice
    }
    return item.product.salePrice ?? item.product.basePrice
  }

  const getItemVariant = (item: typeof cart[0]) => {
    if (!item.variantId) return null
    return item.product.variants.find((v) => v.id === item.variantId)
  }

  const handlePlaceOrder = async () => {
    if (!user?.token) return
    if (!selectedAddressId) {
      showToast('Please select or add a shipping address', 'error')
      return
    }

    if (paymentMethod !== 'cod') {
      setSimulatedPayment(true)
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000))
      setSimulatedPayment(false)
    }

    try {
      setPlacingOrder(true)
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          addressId: selectedAddressId,
          paymentMethod,
          couponCode: couponValidation?.valid ? couponCode : null,
          notes: notes || null,
        }),
      })
      if (res.ok) {
        setCart([])
        setCouponCode('')
        setCouponValidation(null)
        showToast('Order placed successfully! 🎉', 'success')
        navigate('orders')
      } else {
        const err = await res.json()
        showToast(err.error || 'Failed to place order', 'error')
      }
    } catch {
      showToast('Failed to place order. Please try again.', 'error')
    } finally {
      setPlacingOrder(false)
    }
  }

  const paymentMethods = [
    { id: 'cod', label: 'Cash on Delivery', description: 'Pay when your order is delivered', icon: Truck },
    { id: 'razorpay', label: 'Razorpay (Online Payment)', description: 'Pay securely via Razorpay gateway', icon: CreditCard },
    { id: 'upi', label: 'UPI', description: 'Google Pay, PhonePe, Paytm, etc.', icon: CreditCard },
    { id: 'card', label: 'Credit / Debit Card', description: 'Visa, Mastercard, RuPay', icon: CreditCard },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-[#0B1F3A] py-6 px-4">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => navigate('cart')}
            className="flex items-center gap-2 text-[#F7C8D0] hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Cart</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Checkout</h1>
          <p className="text-[#F7C8D0] text-sm mt-1">Complete your order</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column - Forms */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Address */}
            <Card className="border-[#F7C8D0]/30 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-[#0B1F3A] text-lg">
                  <MapPin className="w-5 h-5 text-[#D96C8A]" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {addressesLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                ) : addresses.length > 0 ? (
                  <>
                    <div className="space-y-3">
                      {addresses.map((addr) => (
                        <button
                          key={addr.id}
                          onClick={() => { setSelectedAddressId(addr.id); setShowNewAddress(false) }}
                          className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                            selectedAddressId === addr.id
                              ? 'border-[#D96C8A] bg-[#FFF5F7]'
                              : 'border-gray-200 hover:border-[#F7C8D0] bg-white'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-[#222222] text-sm">{addr.fullName}</span>
                                {addr.isDefault && (
                                  <Badge className="bg-[#D96C8A]/10 text-[#D96C8A] border-0 text-[10px] px-2 py-0">
                                    Default
                                  </Badge>
                                )}
                                {addr.label && (
                                  <Badge variant="outline" className="text-[10px] px-2 py-0 border-[#F7C8D0] text-[#222222]/60">
                                    {addr.label}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-[#222222]/70">{addr.phone}</p>
                              <p className="text-sm text-[#222222]/70 mt-1">
                                {addr.addressLine1}
                                {addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
                              </p>
                              <p className="text-sm text-[#222222]/70">
                                {addr.city}, {addr.state} - {addr.pincode}
                              </p>
                            </div>
                            {selectedAddressId === addr.id && (
                              <div className="w-5 h-5 bg-[#D96C8A] rounded-full flex items-center justify-center shrink-0 ml-2">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setShowNewAddress(!showNewAddress)}
                      className="w-full border-dashed border-2 border-[#F7C8D0] text-[#D96C8A] hover:bg-[#FFF5F7] hover:text-[#D96C8A] py-3"
                    >
                      + Add New Address
                    </Button>
                  </>
                ) : (
                  <p className="text-sm text-[#222222]/60 mb-3">No saved addresses. Please add a new one.</p>
                )}

                {showNewAddress && (
                  <div className="border-2 border-[#F7C8D0]/50 rounded-xl p-4 sm:p-6 bg-[#FFF5F7]/30 space-y-4">
                    <h4 className="font-semibold text-[#0B1F3A] text-sm">New Address</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="fullName" className="text-xs font-medium text-[#222222]">Full Name *</Label>
                        <Input
                          id="fullName"
                          value={newAddress.fullName}
                          onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
                          placeholder="John Doe"
                          className="bg-white border-[#F7C8D0]/50 focus-visible:ring-[#D96C8A]/30"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="phone" className="text-xs font-medium text-[#222222]">Phone Number *</Label>
                        <Input
                          id="phone"
                          value={newAddress.phone}
                          onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                          placeholder="9876543210"
                          className="bg-white border-[#F7C8D0]/50 focus-visible:ring-[#D96C8A]/30"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="addressLine1" className="text-xs font-medium text-[#222222]">Address Line 1 *</Label>
                      <Input
                        id="addressLine1"
                        value={newAddress.addressLine1}
                        onChange={(e) => setNewAddress({ ...newAddress, addressLine1: e.target.value })}
                        placeholder="House/Flat No., Building, Street"
                        className="bg-white border-[#F7C8D0]/50 focus-visible:ring-[#D96C8A]/30"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="addressLine2" className="text-xs font-medium text-[#222222]">Address Line 2</Label>
                      <Input
                        id="addressLine2"
                        value={newAddress.addressLine2}
                        onChange={(e) => setNewAddress({ ...newAddress, addressLine2: e.target.value })}
                        placeholder="Landmark, Area (optional)"
                        className="bg-white border-[#F7C8D0]/50 focus-visible:ring-[#D96C8A]/30"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="city" className="text-xs font-medium text-[#222222]">City *</Label>
                        <Input
                          id="city"
                          value={newAddress.city}
                          onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                          placeholder="Mumbai"
                          className="bg-white border-[#F7C8D0]/50 focus-visible:ring-[#D96C8A]/30"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="state" className="text-xs font-medium text-[#222222]">State *</Label>
                        <Input
                          id="state"
                          value={newAddress.state}
                          onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                          placeholder="Maharashtra"
                          className="bg-white border-[#F7C8D0]/50 focus-visible:ring-[#D96C8A]/30"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="pincode" className="text-xs font-medium text-[#222222]">Pincode *</Label>
                        <Input
                          id="pincode"
                          value={newAddress.pincode}
                          onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })}
                          placeholder="400001"
                          className="bg-white border-[#F7C8D0]/50 focus-visible:ring-[#D96C8A]/30"
                        />
                      </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <Button
                        onClick={handleSaveNewAddress}
                        disabled={savingAddress}
                        className="bg-[#0B1F3A] hover:bg-[#0B1F3A]/90 text-white"
                      >
                        {savingAddress ? 'Saving...' : 'Save Address'}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => setShowNewAddress(false)}
                        className="text-[#222222]/60 hover:text-[#222222]"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card className="border-[#F7C8D0]/30 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-[#0B1F3A] text-lg">
                  <CreditCard className="w-5 h-5 text-[#D96C8A]" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
                  {paymentMethods.map((method) => {
                    const Icon = method.icon
                    return (
                      <label
                        key={method.id}
                        htmlFor={`payment-${method.id}`}
                        className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                          paymentMethod === method.id
                            ? 'border-[#D96C8A] bg-[#FFF5F7]'
                            : 'border-gray-200 hover:border-[#F7C8D0] bg-white'
                        }`}
                      >
                        <RadioGroupItem value={method.id} id={`payment-${method.id}`} className="data-[state=checked]:border-[#D96C8A]" />
                        <Icon className="w-5 h-5 text-[#D96C8A] shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-[#222222] text-sm">{method.label}</p>
                          <p className="text-xs text-[#222222]/50">{method.description}</p>
                        </div>
                        {paymentMethod === method.id && (
                          <div className="w-5 h-5 bg-[#D96C8A] rounded-full flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </label>
                    )
                  })}
                </RadioGroup>

                {/* Simulated Payment Area */}
                {paymentMethod !== 'cod' && (
                  <div className="mt-4 border-2 border-[#F7C8D0]/50 rounded-xl p-4 sm:p-6 bg-[#FFF5F7]/30">
                    <div className="flex items-center gap-2 mb-4">
                      <Lock className="w-4 h-4 text-[#D96C8A]" />
                      <h4 className="font-semibold text-[#0B1F3A] text-sm">Simulated Payment</h4>
                      <Badge className="bg-amber-100 text-amber-700 border-0 text-[10px] px-2 py-0">
                        Demo Mode
                      </Badge>
                    </div>
                    {simulatedPayment ? (
                      <div className="flex flex-col items-center gap-3 py-6">
                        <div className="w-10 h-10 border-3 border-[#D96C8A] border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm font-medium text-[#222222]">Processing payment...</p>
                        <p className="text-xs text-[#222222]/50">Please do not close this page</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-green-200">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                            <Shield className="w-4 h-4 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-green-700">Secure Payment Simulation</p>
                            <p className="text-xs text-green-600/70">
                              In production, this would redirect to {paymentMethod === 'razorpay' ? 'Razorpay' : paymentMethod === 'upi' ? 'your UPI app' : 'the card payment gateway'}
                            </p>
                          </div>
                        </div>
                        <div className="p-3 bg-white rounded-lg border border-gray-100">
                          <p className="text-xs text-[#222222]/50">
                            {paymentMethod === 'razorpay' && 'Razorpay supports cards, UPI, wallets, and netbanking. A secure popup would appear for authentication.'}
                            {paymentMethod === 'upi' && 'You would be redirected to your UPI app (GPay, PhonePe, Paytm) to complete the payment.'}
                            {paymentMethod === 'card' && 'Enter your card details in a secure iframe. We never store your card information.'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-[#222222]/40">
                          <Lock className="w-3 h-3" />
                          <span>256-bit SSL encrypted</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {paymentMethod === 'cod' && (
                  <div className="mt-3 flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <Truck className="w-4 h-4 text-amber-600 shrink-0" />
                    <p className="text-xs text-amber-700">Cash will be collected at the time of delivery. Please keep exact change ready.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Notes */}
            <Card className="border-[#F7C8D0]/30 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-[#0B1F3A] text-lg">Order Notes (Optional)</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special instructions for delivery (e.g., leave at reception, ring doorbell twice)..."
                  className="min-h-[80px] border-[#F7C8D0]/50 focus-visible:ring-[#D96C8A]/30 resize-none"
                  maxLength={500}
                />
                <p className="text-[10px] text-[#222222]/40 mt-1 text-right">{notes.length}/500</p>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <Card className="border-[#F7C8D0]/30 shadow-sm sticky top-24">
              <CardHeader className="pb-4">
                <CardTitle className="text-[#0B1F3A] text-lg">Order Summary</CardTitle>
                <p className="text-xs text-[#222222]/50">{cart.length} item{cart.length !== 1 ? 's' : ''} in cart</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Cart Items */}
                <div className="max-h-72 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                  {cart.map((item) => {
                    const variant = getItemVariant(item)
                    const price = getItemPrice(item)
                    const image = item.product.images?.[0]?.url
                    return (
                      <div key={item.id} className="flex gap-3 py-2">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-[#FFF5F7] shrink-0">
                          {image ? (
                            <img src={image} alt={item.product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[#D96C8A]/30">
                              <Truck className="w-6 h-6" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#222222] truncate">{item.product.name}</p>
                          {variant && (
                            <p className="text-[11px] text-[#222222]/50">
                              {variant.color && <span className="text-[#D96C8A]">{variant.color}</span>}
                              {variant.color && variant.size && ' / '}
                              {variant.size && <span>{variant.size}</span>}
                            </p>
                          )}
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs text-[#222222]/50">Qty: {item.quantity}</span>
                            <span className="text-sm font-semibold text-[#0B1F3A]">
                              ₹{(price * item.quantity).toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <Separator className="bg-[#F7C8D0]/30" />

                {/* Coupon */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-[#D96C8A]" />
                    <span className="text-sm font-medium text-[#222222]">Coupon Code</span>
                  </div>
                  {couponValidation?.valid ? (
                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-green-700">{couponCode.toUpperCase()}</p>
                        <p className="text-xs text-green-600/70">{couponValidation.message}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveCoupon}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 text-xs h-7 px-2"
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder="Enter coupon code"
                        className="flex-1 h-9 text-sm border-[#F7C8D0]/50 focus-visible:ring-[#D96C8A]/30"
                        onKeyDown={(e) => e.key === 'Enter' && handleValidateCoupon()}
                      />
                      <Button
                        variant="outline"
                        onClick={handleValidateCoupon}
                        disabled={!couponCode.trim() || validatingCoupon}
                        className="border-[#D96C8A] text-[#D96C8A] hover:bg-[#FFF5F7] hover:text-[#D96C8A] h-9 px-3 text-sm shrink-0"
                      >
                        {validatingCoupon ? '...' : 'Apply'}
                      </Button>
                    </div>
                  )}
                </div>

                <Separator className="bg-[#F7C8D0]/30" />

                {/* Price Breakdown */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#222222]/70">Subtotal</span>
                    <span className="text-[#222222]">₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#222222]/70">Tax (18% GST)</span>
                    <span className="text-[#222222]">₹{tax.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#222222]/70">Shipping</span>
                    {shipping === 0 ? (
                      <span className="text-green-600 font-medium text-xs">FREE</span>
                    ) : (
                      <span className="text-[#222222]">₹{shipping.toLocaleString('en-IN')}</span>
                    )}
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-green-600">Discount</span>
                      <span className="text-green-600 font-medium">-₹{discountAmount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <Separator className="bg-[#F7C8D0]/30" />
                  <div className="flex items-center justify-between pt-1">
                    <span className="font-bold text-[#0B1F3A] text-base">Total</span>
                    <span className="font-bold text-[#0B1F3A] text-xl">₹{total.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {subtotal < 999 && (
                  <div className="p-3 bg-[#FFF5F7] rounded-lg border border-[#F7C8D0]/30">
                    <p className="text-xs text-[#D96C8A] text-center font-medium">
                      Add ₹{(999 - subtotal).toLocaleString('en-IN')} more for FREE shipping! 🚚
                    </p>
                  </div>
                )}

                {/* Place Order Button */}
                <Button
                  onClick={handlePlaceOrder}
                  disabled={placingOrder || simulatedPayment || !selectedAddressId}
                  className="w-full bg-[#D96C8A] hover:bg-[#D96C8A]/90 text-white py-6 text-base font-semibold rounded-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {placingOrder ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Placing Order...
                    </span>
                  ) : simulatedPayment ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing Payment...
                    </span>
                  ) : (
                    `Place Order — ₹${total.toLocaleString('en-IN')}`
                  )}
                </Button>

                {/* Security Badge */}
                <div className="flex items-center justify-center gap-2 text-[10px] text-[#222222]/40 pt-1">
                  <Shield className="w-3.5 h-3.5" />
                  <span>100% Secure Checkout · SSL Encrypted</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}