import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const payload = getUserFromRequest(request)
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const cartItems = await db.cartItem.findMany({
      where: { userId: payload.userId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            basePrice: true,
            salePrice: true,
            images: { select: { url: true, alt: true }, take: 1, orderBy: { sortOrder: 'asc' } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ cartItems })
  } catch (error) {
    console.error('Cart GET error:', error)
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
    const { action, productId, variantId, quantity } = body

    if (action === 'clear') {
      await db.cartItem.deleteMany({ where: { userId: payload.userId } })
      return NextResponse.json({ message: 'Cart cleared' })
    }

    if (!productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 })
    }

    const product = await db.product.findUnique({ where: { id: productId } })
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const existingItem = await db.cartItem.findFirst({
      where: {
        userId: payload.userId,
        productId,
        variantId: variantId || null,
      },
    })

    if (existingItem) {
      const updatedItem = await db.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + (quantity || 1) },
        include: {
          product: { select: { id: true, name: true, basePrice: true, salePrice: true, images: { select: { url: true }, take: 1 } } },
        },
      })
      return NextResponse.json({ cartItem: updatedItem })
    }

    const cartItem = await db.cartItem.create({
      data: {
        userId: payload.userId,
        productId,
        variantId: variantId || null,
        quantity: quantity || 1,
      },
      include: {
        product: { select: { id: true, name: true, basePrice: true, salePrice: true, images: { select: { url: true }, take: 1 } } },
      },
    })

    return NextResponse.json({ cartItem }, { status: 201 })
  } catch (error) {
    console.error('Cart POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const payload = getUserFromRequest(request)
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { productId, quantity } = body

    if (!productId || quantity === undefined) {
      return NextResponse.json({ error: 'productId and quantity are required' }, { status: 400 })
    }

    if (quantity < 1) {
      return NextResponse.json({ error: 'Quantity must be at least 1' }, { status: 400 })
    }

    const cartItem = await db.cartItem.findFirst({
      where: { productId, userId: payload.userId },
    })

    if (!cartItem) {
      return NextResponse.json({ error: 'Cart item not found' }, { status: 404 })
    }

    const updated = await db.cartItem.update({
      where: { id: cartItem.id },
      data: { quantity },
      include: {
        product: { select: { id: true, name: true, basePrice: true, salePrice: true, images: { select: { url: true }, take: 1 } } },
      },
    })

    return NextResponse.json({ cartItem: updated })
  } catch (error) {
    console.error('Cart PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
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

    const cartItem = await db.cartItem.findFirst({
      where: { productId, userId: payload.userId },
    })

    if (!cartItem) {
      return NextResponse.json({ message: 'Item not in cart' })
    }

    await db.cartItem.delete({ where: { id: cartItem.id } })
    return NextResponse.json({ message: 'Item removed from cart' })
  } catch (error) {
    console.error('Cart DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
