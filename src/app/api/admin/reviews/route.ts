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

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const status = searchParams.get('status')

    const where: Record<string, unknown> = {}
    if (status === 'pending') {
      where.isApproved = false
    } else if (status === 'approved') {
      where.isApproved = true
    }

    const [reviews, total] = await Promise.all([
      db.review.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, avatar: true } },
          product: { select: { id: true, name: true, slug: true, images: { select: { url: true }, take: 1 } } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.review.count({ where }),
    ])

    return NextResponse.json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Admin reviews GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const payload = getUserFromRequest(request)
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (payload.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { reviewId, isApproved } = body

    if (!reviewId || isApproved === undefined) {
      return NextResponse.json({ error: 'reviewId and isApproved are required' }, { status: 400 })
    }

    const review = await db.review.findUnique({ where: { id: reviewId } })
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    const updated = await db.review.update({
      where: { id: reviewId },
      data: { isApproved },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        product: { select: { id: true, name: true } },
      },
    })

    if (isApproved) {
      const allReviews = await db.review.findMany({
        where: { productId: review.productId, isApproved: true },
        select: { rating: true },
      })
      const avgRating = allReviews.length > 0
        ? allReviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / allReviews.length
        : 0

      await db.product.update({
        where: { id: review.productId },
        data: {
          avgRating: Math.round(avgRating * 10) / 10,
          reviewCount: allReviews.length,
        },
      })
    }

    return NextResponse.json({ review: updated })
  } catch (error) {
    console.error('Admin reviews PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const payload = getUserFromRequest(request)
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (payload.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const reviewId = searchParams.get('reviewId')

    if (!reviewId) {
      return NextResponse.json({ error: 'reviewId query parameter is required' }, { status: 400 })
    }

    const review = await db.review.findUnique({ where: { id: reviewId } })
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    await db.review.delete({ where: { id: reviewId } })
    return NextResponse.json({ message: 'Review deleted successfully' })
  } catch (error) {
    console.error('Admin reviews DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
