import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const product = await db.product.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        images: { select: { id: true, url: true, alt: true, sortOrder: true }, orderBy: { sortOrder: 'asc' } },
        variants: { include: { inventory: { select: { id: true, quantity: true, lowStock: true } } } },
        reviews: {
          include: { user: { select: { id: true, name: true, avatar: true } } },
          where: { isApproved: true }, orderBy: { createdAt: 'desc' }, take: 20,
        },
      },
    })
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    return NextResponse.json({ product })
  } catch (error) {
    console.error('Product GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = getUserFromRequest(request)
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()

    const existingProduct = await db.product.findUnique({
      where: { id },
      include: { images: true, variants: { include: { inventory: true } } },
    })
    if (!existingProduct) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

    const {
      name, slug, description, basePrice, salePrice, categoryId, gender,
      isFeatured, isTrending, isNewArrival, isBestSeller, isActive, material, care,
      images, variants,
    } = body

    if (slug && slug !== existingProduct.slug) {
      const slugTaken = await db.product.findUnique({ where: { slug } })
      if (slugTaken) return NextResponse.json({ error: 'Product slug already exists' }, { status: 400 })
    }

    // Handle image updates: delete all existing, recreate with new list
    if (images && Array.isArray(images)) {
      await db.productImage.deleteMany({ where: { productId: id } })
    }

    // Handle variant updates: delete all existing variants + inventory, recreate
    if (variants && Array.isArray(variants)) {
      const existingVariantIds = existingProduct.variants.map(v => v.id)
      const existingInventoryIds = existingProduct.variants
        .filter(v => v.inventory)
        .map(v => v.inventory!.id)

      if (existingInventoryIds.length > 0) {
        await db.inventory.deleteMany({ where: { id: { in: existingInventoryIds } } })
      }
      if (existingVariantIds.length > 0) {
        await db.productVariant.deleteMany({ where: { id: { in: existingVariantIds } } })
      }
    }

    const product = await db.product.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(slug !== undefined && { slug }),
        ...(description !== undefined && { description }),
        ...(basePrice !== undefined && { basePrice }),
        ...(salePrice !== undefined && { salePrice }),
        ...(categoryId !== undefined && { categoryId }),
        ...(gender !== undefined && { gender }),
        ...(isFeatured !== undefined && { isFeatured }),
        ...(isTrending !== undefined && { isTrending }),
        ...(isNewArrival !== undefined && { isNewArrival }),
        ...(isBestSeller !== undefined && { isBestSeller }),
        ...(isActive !== undefined && { isActive }),
        ...(material !== undefined && { material }),
        ...(care !== undefined && { care }),
        ...(images && Array.isArray(images) && {
          images: {
            create: images.map((img: { url: string; alt?: string; sortOrder?: number }) => ({
              url: img.url, alt: img.alt, sortOrder: img.sortOrder || 0,
            })),
          },
        }),
        ...(variants && Array.isArray(variants) && {
          variants: {
            create: variants.map((v: { color: string; size: string; sku: string; price?: number; stock?: number }) => ({
              color: v.color, size: v.size, sku: v.sku, price: v.price,
              inventory: { create: { quantity: v.stock || 0 } },
            })),
          },
        }),
      },
      include: {
        category: true,
        images: { orderBy: { sortOrder: 'asc' } },
        variants: { include: { inventory: true } },
      },
    })

    return NextResponse.json({ product })
  } catch (error) {
    console.error('Product PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = getUserFromRequest(request)
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { id } = await params
    const existingProduct = await db.product.findUnique({ where: { id } })
    if (!existingProduct) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

    await db.product.delete({ where: { id } })
    return NextResponse.json({ message: 'Product deleted successfully' })
  } catch (error) {
    console.error('Product DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}