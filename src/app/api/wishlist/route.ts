import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const payload = getUserFromRequest(request)
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const wishlist = await db.wishlist.findMany({
      where: { userId: payload.userId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            basePrice: true,
            salePrice: true,
            avgRating: true,
            reviewCount: true,
            images: { select: { url: true, alt: true }, take: 1, orderBy: { sortOrder: 'asc' } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ wishlist })
  } catch (error) {
    console.error('Wishlist GET error:', error)
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
    const { productId } = body

    if (!productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 })
    }

    const product = await db.product.findUnique({ where: { id: productId } })
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const existing = await db.wishlist.findUnique({
      where: { userId_productId: { userId: payload.userId, productId } },
    })

    if (existing) {
      return NextResponse.json({ message: 'Already in wishlist', wishlistItem: existing })
    }

    const wishlistItem = await db.wishlist.create({
      data: { userId: payload.userId, productId },
      include: {
        product: { select: { id: true, name: true, slug: true, basePrice: true, salePrice: true, images: { select: { url: true }, take: 1 } } },
      },
    })

    return NextResponse.json({ wishlistItem }, { status: 201 })
  } catch (error) {
    console.error('Wishlist POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const payload = getUserFromRequest(request)
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')

    if (!productId) {
      return NextResponse.json({ error: 'productId query parameter is required' }, { status: 400 })
    }

    const wishlistItem = await db.wishlist.findUnique({
      where: { userId_productId: { userId: payload.userId, productId } },
    })

    if (!wishlistItem) {
      return NextResponse.json({ error: 'Wishlist item not found' }, { status: 404 })
    }

    await db.wishlist.delete({ where: { id: wishlistItem.id } })
    return NextResponse.json({ message: 'Removed from wishlist' })
  } catch (error) {
    console.error('Wishlist DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
