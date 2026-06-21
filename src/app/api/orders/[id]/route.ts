import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { recordAudit } from '@/lib/audit'
import { getClientIp } from '@/lib/rate-limit'

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
    const { action, status, paymentStatus, trackingNumber } = body
    const ip = getClientIp(request)

    const order = await db.order.findUnique({ where: { id } })
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // ── Admin actions ──
    if (payload.role === 'admin') {
      // Update order status
      if (status) {
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
          // Auto-complete payment on delivery for COD
          if (order.paymentMethod === 'cod' && order.paymentStatus !== 'completed') {
            updateData.paymentStatus = 'completed'
            // Update the payment record too
            await db.payment.updateMany({
              where: { orderId: id },
              data: { status: 'completed' },
            })
          }
        }
        if (status === 'cancelled' || status === 'returned') {
          if (order.paymentStatus === 'completed') {
            updateData.paymentStatus = 'refunded'
            await db.payment.updateMany({
              where: { orderId: id },
              data: { status: 'refunded' },
            })
          }
        }

        const updatedOrder = await db.order.update({
          where: { id },
          data: updateData,
          include: { items: true, payments: true },
        })

        await recordAudit(payload.userId, 'Admin', 'ORDER_STATUS_UPDATE', 
          `Order ${order.orderNumber} status: ${order.status} → ${status}`, ip)

        return NextResponse.json({ order: updatedOrder })
      }

      // Update payment status (for UPI verification)
      if (paymentStatus) {
        const validPaymentStatuses = ['pending', 'submitted', 'verified', 'completed', 'failed', 'refunded']
        if (!validPaymentStatuses.includes(paymentStatus)) {
          return NextResponse.json({ error: 'Invalid payment status' }, { status: 400 })
        }

        const paymentUpdateData: Record<string, unknown> = { paymentStatus }
        
        // If payment verified, also confirm the order
        if (paymentStatus === 'verified' || paymentStatus === 'completed') {
          if (order.status === 'pending') {
            paymentUpdateData.status = 'confirmed'
          }
          // Update payment records
          await db.payment.updateMany({
            where: { orderId: id },
            data: { status: paymentStatus },
          })
        }
        if (paymentStatus === 'failed') {
          if (order.status === 'pending') {
            paymentUpdateData.status = 'cancelled'
          }
          await db.payment.updateMany({
            where: { orderId: id },
            data: { status: 'failed' },
          })
        }
        if (paymentStatus === 'refunded') {
          await db.payment.updateMany({
            where: { orderId: id },
            data: { status: 'refunded' },
          })
        }

        const updatedOrder = await db.order.update({
          where: { id },
          data: paymentUpdateData,
          include: { items: true, payments: true },
        })

        await recordAudit(payload.userId, 'Admin', 'PAYMENT_STATUS_UPDATE', 
          `Order ${order.orderNumber} payment: ${order.paymentStatus} → ${paymentStatus}`, ip)

        return NextResponse.json({ order: updatedOrder })
      }

      // Add tracking number
      if (trackingNumber && !status) {
        const updatedOrder = await db.order.update({
          where: { id },
          data: { trackingNumber },
          include: { items: true },
        })

        await recordAudit(payload.userId, 'Admin', 'TRACKING_ADDED', 
          `Tracking ${trackingNumber} added to order ${order.orderNumber}`, ip)

        return NextResponse.json({ order: updatedOrder })
      }

      return NextResponse.json({ error: 'No valid action specified' }, { status: 400 })
    }

    // ── User actions ──
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
        include: { items: true, payments: true },
      })

      await db.payment.updateMany({
        where: { orderId: id },
        data: { status: 'refunded' },
      })

      const user = await db.user.findUnique({ where: { id: payload.userId } })
      await recordAudit(payload.userId, user?.name || 'Unknown', 'ORDER_CANCELLED', 
        `Order ${order.orderNumber} cancelled by customer`, ip)

      return NextResponse.json({ order: updatedOrder })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Order PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}