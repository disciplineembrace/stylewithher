import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = getUserFromRequest(request)
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const order = await db.order.findFirst({
      where: { id, userId: payload.userId },
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
        address: true,
        payments: true,
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json({ order })
  } catch (error) {
    console.error('Order GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = getUserFromRequest(request)
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { action, status, trackingNumber } = body

    const order = await db.order.findUnique({ where: { id } })
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Admin actions
    if (payload.role === 'admin') {
      if (!status) {
        return NextResponse.json({ error: 'Status is required' }, { status: 400 })
      }

      const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned']
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
      }

      const updateData: Record<string, unknown> = { status }
      if (status === 'shipped') {
        updateData.shippedAt = new Date()
        if (trackingNumber) updateData.trackingNumber = trackingNumber
      }
      if (status === 'delivered') {
        updateData.deliveredAt = new Date()
        updateData.paymentStatus = 'completed'
      }
      if (status === 'cancelled' || status === 'returned') {
        updateData.paymentStatus = 'refunded'
      }

      const updatedOrder = await db.order.update({
        where: { id },
        data: updateData,
        include: { items: true },
      })

      return NextResponse.json({ order: updatedOrder })
    }

    // User actions
    if (action === 'cancel') {
      if (order.userId !== payload.userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
      if (!['pending', 'confirmed'].includes(order.status)) {
        return NextResponse.json({ error: 'Order cannot be cancelled at this stage' }, { status: 400 })
      }

      const updatedOrder = await db.order.update({
        where: { id },
        data: { status: 'cancelled', paymentStatus: 'refunded' },
        include: { items: true },
      })

      return NextResponse.json({ order: updatedOrder })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Order PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
