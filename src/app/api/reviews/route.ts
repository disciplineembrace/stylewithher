import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')

    if (!productId) {
      return NextResponse.json({ error: 'productId query parameter is required' }, { status: 400 })
    }

    const reviews = await db.review.findMany({
      where: { productId, isApproved: true },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ reviews })
  } catch (error) {
    console.error('Reviews GET error:', error)
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
    const { productId, rating, title, comment } = body

    if (!productId || !rating) {
      return NextResponse.json({ error: 'productId and rating are required' }, { status: 400 })
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
    }

    const product = await db.product.findUnique({ where: { id: productId } })
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const existingReview = await db.review.findFirst({
      where: { userId: payload.userId, productId },
    })

    if (existingReview) {
      return NextResponse.json({ error: 'You have already reviewed this product' }, { status: 400 })
    }

    const review = await db.review.create({
      data: {
        userId: payload.userId,
        productId,
        rating,
        title,
        comment,
        isApproved: true,
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    })

    const allReviews = await db.review.findMany({
      where: { productId, isApproved: true },
      select: { rating: true },
    })
    const avgRating = allReviews.length > 0
      ? allReviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / allReviews.length
      : 0

    await db.product.update({
      where: { id: productId },
      data: {
        avgRating: Math.round(avgRating * 10) / 10,
        reviewCount: allReviews.length,
      },
    })

    return NextResponse.json({ review }, { status: 201 })
  } catch (error) {
    console.error('Reviews POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
