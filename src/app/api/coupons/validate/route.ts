import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, orderTotal } = body

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Coupon code is required' }, { status: 400 })
    }

    const coupon = await db.coupon.findFirst({ where: { code: String(code).toUpperCase() } })

    if (!coupon) {
      return NextResponse.json({ valid: false, error: 'Invalid coupon code' })
    }

    if (!coupon.isActive) {
      return NextResponse.json({ valid: false, error: 'This coupon is no longer active' })
    }

    const now = new Date()
    if (now < coupon.startDate) {
      return NextResponse.json({ valid: false, error: 'This coupon is not yet active' })
    }
    if (now > coupon.endDate) {
      return NextResponse.json({ valid: false, error: 'This coupon has expired' })
    }

    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      return NextResponse.json({ valid: false, error: 'This coupon has reached its usage limit' })
    }

    const total = orderTotal ? parseFloat(orderTotal) : 0
    if (total > 0 && total < coupon.minOrder) {
      return NextResponse.json({
        valid: false,
        error: `Minimum order amount of ₹${coupon.minOrder} required`,
      })
    }

    let discount = 0
    if (coupon.discountType === 'percentage') {
      discount = (total * coupon.discountValue) / 100
      if (coupon.maxDiscount !== null) {
        discount = Math.min(discount, coupon.maxDiscount)
      }
    } else {
      discount = coupon.discountValue
    }

    if (discount > total) {
      discount = total
    }

    return NextResponse.json({
      valid: true,
      code: coupon.code,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discount,
      maxDiscount: coupon.maxDiscount,
      minOrder: coupon.minOrder,
    })
  } catch (error) {
    console.error('Coupon validate error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
