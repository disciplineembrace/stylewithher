import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const payload = getUserFromRequest(request)
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (payload.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const [
      totalSales,
      totalOrders,
      totalCustomers,
      totalProducts,
      recentOrders,
      topProducts,
      orderStatusCounts,
      revenueByMonth,
      lowStockProducts,
    ] = await Promise.all([
      db.order.aggregate({
        where: { paymentStatus: 'completed' },
        _sum: { total: true },
      }).catch(() => ({ _sum: { total: 0 } })),
      db.order.count().catch(() => 0),
      db.user.count({ where: { role: 'customer' } }).catch(() => 0),
      db.product.count({ where: { isActive: true } }).catch(() => 0),
      db.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
          items: { select: { productName: true, quantity: true, price: true } },
        },
      }).catch(() => []),
      db.orderItem.groupBy({
        by: ['productId'],
        _sum: { quantity: true },
      }).catch(() => []),
      db.order.groupBy({
        by: ['status'],
        _count: { status: true },
      }).catch(() => []),
      db.order.findMany({
        where: {
          createdAt: { gte: sixMonthsAgo },
          paymentStatus: 'completed',
        },
        select: {
          createdAt: true,
          total: true,
        },
      }).catch(() => []),
      db.inventory.findMany({
        where: { quantity: { lte: 5 } },
        include: {
          variant: {
            include: {
              product: { select: { id: true, name: true, images: { select: { url: true }, take: 1 } } },
            },
          },
        },
        take: 20,
      }).catch(() => []),
    ])

    const topProductsSorted = topProducts
      .sort((a, b) => (b._sum.quantity || 0) - (a._sum.quantity || 0))
      .slice(0, 10)

    const topProductIds = topProductsSorted.map((p) => p.productId)
    const topProductDetails = topProductIds.length > 0
      ? await db.product.findMany({
          where: { id: { in: topProductIds } },
          select: { id: true, name: true, images: { select: { url: true }, take: 1 }, basePrice: true, salePrice: true },
        })
      : []

    const topProductsWithSales = topProductsSorted.map((tp) => {
      const detail = topProductDetails.find((p) => p.id === tp.productId)
      return {
        ...detail,
        totalSold: tp._sum.quantity || 0,
      }
    })

    const monthlyRevenue: Record<string, number> = {}
    for (const order of revenueByMonth) {
      const monthKey = `${order.createdAt.getFullYear()}-${String(order.createdAt.getMonth() + 1).padStart(2, '0')}`
      monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + order.total
    }

    const revenueChartData = Object.entries(monthlyRevenue)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, revenue]) => ({ month, revenue: Math.round(revenue * 100) / 100 }))

    const statusCounts: Record<string, number> = {}
    for (const sc of orderStatusCounts) {
      statusCounts[sc.status] = sc._count.status
    }

    return NextResponse.json({
      totalSales: totalSales._sum.total || 0,
      totalOrders,
      totalCustomers,
      totalProducts,
      recentOrders,
      topProducts: topProductsWithSales,
      orderStatusCounts: statusCounts,
      revenueByMonth: revenueChartData,
      lowStockProducts,
    })
  } catch (error) {
    console.error('Admin dashboard error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
