import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const payload = getUserFromRequest(request)
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const status = searchParams.get('status')

    const where: Record<string, unknown> = { userId: payload.userId }
    if (status) {
      where.status = status
    }

    const [orders, total] = await Promise.all([
      db.order.findMany({
        where,
        include: {
          items: {
            select: {
              id: true,
              productName: true,
              productImage: true,
              color: true,
              size: true,
              quantity: true,
              price: true,
            },
          },
          address: { select: { id: true, fullName: true, phone: true, addressLine1: true, city: true, state: true, pincode: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.order.count({ where }),
    ])

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Orders GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = getUserFromRequest(request)
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { addressId, address: inlineAddress, paymentMethod, couponCode, notes } = body

    let resolvedAddressId = addressId || null

    if (!resolvedAddressId && inlineAddress) {
      const { fullName, phone, addressLine1, addressLine2, city, state, pincode } = inlineAddress
      if (!fullName || !phone || !addressLine1 || !city || !state || !pincode) {
        return NextResponse.json({ error: 'Complete address details are required (fullName, phone, addressLine1, city, state, pincode)' }, { status: 400 })
      }
      const newAddress = await db.address.create({
        data: {
          userId: payload.userId,
          fullName,
          phone,
          addressLine1,
          addressLine2: addressLine2 || null,
          city,
          state,
          pincode,
        },
      })
      resolvedAddressId = newAddress.id
    }

    if (!resolvedAddressId) {
      return NextResponse.json({ error: 'addressId or address is required' }, { status: 400 })
    }

    const address = await db.address.findFirst({
      where: { id: resolvedAddressId, userId: payload.userId },
    })
    if (!address) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 })
    }

    const cartItems = await db.cartItem.findMany({
      where: { userId: payload.userId },
      include: {
        product: { select: { id: true, name: true, basePrice: true, salePrice: true, images: { select: { url: true }, take: 1 } } },
      },
    })

    if (cartItems.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
    }

    let subtotal = 0
    const orderItems: Array<{
      productId: string
      variantId: string | null
      productName: string
      productImage: string | null
      color: string | null
      size: string | null
      quantity: number
      price: number
    }> = []

    for (const item of cartItems) {
      const price = item.product.salePrice ?? item.product.basePrice
      const lineTotal = price * item.quantity
      subtotal += lineTotal

      const variant = item.variantId
        ? await db.productVariant.findUnique({ where: { id: item.variantId } })
        : null

      orderItems.push({
        productId: item.productId,
        variantId: item.variantId,
        productName: item.product.name,
        productImage: item.product.images[0]?.url || null,
        color: variant?.color || null,
        size: variant?.size || null,
        quantity: item.quantity,
        price,
      })
    }

    let discount = 0
    let couponId: string | null = null

    if (couponCode) {
      const coupon = await db.coupon.findUnique({ where: { code: couponCode.toUpperCase() } })
      if (coupon && coupon.isActive && coupon.usedCount < (coupon.usageLimit ?? Infinity)) {
        const now = new Date()
        if (now >= coupon.startDate && now <= coupon.endDate && subtotal >= coupon.minOrder) {
          if (coupon.discountType === 'percentage') {
            discount = Math.min((subtotal * coupon.discountValue) / 100, coupon.maxDiscount ?? Infinity)
          } else {
            discount = coupon.discountValue
          }
          couponId = coupon.id
          await db.coupon.update({ where: { id: coupon.id }, data: { usedCount: { increment: 1 } } })
        }
      }
    }

    const tax = 0
    const shipping = subtotal > 500 ? 0 : 49
    const total = Math.max(0, subtotal - discount + tax + shipping)

    const orderNumber = `SWH-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`

    const order = await db.order.create({
      data: {
        orderNumber,
        userId: payload.userId,
        addressId: resolvedAddressId,
        status: 'pending',
        paymentMethod: paymentMethod || 'cod',
        subtotal,
        discount,
        tax,
        shipping,
        total,
        couponId,
        notes,
        items: { create: orderItems },
      },
      include: {
        items: true,
        address: true,
      },
    })

    await db.cartItem.deleteMany({ where: { userId: payload.userId } })

    return NextResponse.json({ order }, { status: 201 })
  } catch (error) {
    console.error('Orders POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
