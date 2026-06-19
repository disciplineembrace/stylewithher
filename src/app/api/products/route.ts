import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const gender = searchParams.get('gender')
    const search = searchParams.get('search')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const color = searchParams.get('color')
    const size = searchParams.get('size')
    const rating = searchParams.get('rating')
    const availability = searchParams.get('availability')
    const sort = searchParams.get('sort') || 'newest'
    const featured = searchParams.get('featured')
    const trending = searchParams.get('trending')
    const newArrival = searchParams.get('newArrival')
    const bestSeller = searchParams.get('bestSeller')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '12', 10)

    const where: Record<string, unknown> = { isActive: true }

    if (category) {
      where.category = { slug: category }
    }
    if (gender) {
      where.gender = gender
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ]
    }
    if (minPrice !== null && minPrice !== '') {
      where.basePrice = { ...(where.basePrice as Record<string, unknown> | undefined), gte: parseFloat(minPrice) }
    }
    if (maxPrice !== null && maxPrice !== '') {
      where.basePrice = { ...(where.basePrice as Record<string, unknown> | undefined), lte: parseFloat(maxPrice) }
    }
    if (minPrice && maxPrice) {
      where.basePrice = { gte: parseFloat(minPrice), lte: parseFloat(maxPrice) }
    }
    if (color) {
      where.variants = { some: { color } }
    }
    if (size) {
      where.variants = { some: { size } }
    }
    if (rating) {
      where.avgRating = { gte: parseInt(rating, 10) }
    }
    if (availability === 'inStock') {
      where.variants = {
        some: {
          inventory: { quantity: { gt: 0 } },
        },
      }
    }
    if (featured === 'true') {
      where.isFeatured = true
    }
    if (trending === 'true') {
      where.isTrending = true
    }
    if (newArrival === 'true') {
      where.isNewArrival = true
    }
    if (bestSeller === 'true') {
      where.isBestSeller = true
    }

    const orderBy: Record<string, string> = {}
    switch (sort) {
      case 'price-asc':
        orderBy.basePrice = 'asc'
        break
      case 'price-desc':
        orderBy.basePrice = 'desc'
        break
      case 'name-asc':
        orderBy.name = 'asc'
        break
      case 'name-desc':
        orderBy.name = 'desc'
        break
      case 'rating':
        orderBy.avgRating = 'desc'
        break
      case 'popular':
        orderBy.totalSold = 'desc'
        break
      case 'newest':
      default:
        orderBy.createdAt = 'desc'
        break
    }

    const skip = (page - 1) * limit

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          images: { select: { id: true, url: true, alt: true, sortOrder: true }, orderBy: { sortOrder: 'asc' } },
          variants: {
            select: { id: true, color: true, size: true, sku: true, price: true, inventory: { select: { quantity: true } } },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      db.product.count({ where }),
    ])

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Products GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = getUserFromRequest(request)
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { name, slug, description, basePrice, salePrice, categoryId, gender, isFeatured, isTrending, isNewArrival, isBestSeller, material, care, images, variants } = body

    if (!name || !slug || !basePrice || !categoryId) {
      return NextResponse.json({ error: 'Name, slug, basePrice, and categoryId are required' }, { status: 400 })
    }

    const existingProduct = await db.product.findUnique({ where: { slug } })
    if (existingProduct) {
      return NextResponse.json({ error: 'Product slug already exists' }, { status: 400 })
    }

    const product = await db.product.create({
      data: {
        name,
        slug,
        description,
        basePrice,
        salePrice,
        categoryId,
        gender: gender || 'unisex',
        isFeatured: isFeatured || false,
        isTrending: isTrending || false,
        isNewArrival: isNewArrival || false,
        isBestSeller: isBestSeller || false,
        material,
        care,
        images: images ? {
          create: images.map((img: { url: string; alt?: string; sortOrder?: number }) => ({
            url: img.url,
            alt: img.alt,
            sortOrder: img.sortOrder || 0,
          })),
        } : undefined,
        variants: variants ? {
          create: variants.map((v: { color: string; size: string; sku: string; price?: number }) => ({
            color: v.color,
            size: v.size,
            sku: v.sku,
            price: v.price,
            inventory: { create: { quantity: 0 } },
          })),
        } : undefined,
      },
      include: {
        category: true,
        images: true,
        variants: { include: { inventory: true } },
      },
    })

    return NextResponse.json({ product }, { status: 201 })
  } catch (error) {
    console.error('Products POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
