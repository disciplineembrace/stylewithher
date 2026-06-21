import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

// Helper to generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

// GET /api/admin/categories — Fetch all categories (including inactive)
export async function GET(request: NextRequest) {
  try {
    const payload = getUserFromRequest(request)
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (payload.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const categories = await db.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    })

    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Admin categories GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/categories — Create a new category
export async function POST(request: NextRequest) {
  try {
    const payload = getUserFromRequest(request)
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (payload.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { name, slug: customSlug, description, gender, image, isActive, sortOrder } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 })
    }

    const slug = customSlug?.trim() || generateSlug(name)

    // Check if slug already exists
    const existing = await db.category.findUnique({ where: { slug } })
    if (existing) {
      return NextResponse.json({ error: 'Category with this slug already exists' }, { status: 409 })
    }

    const category = await db.category.create({
      data: {
        name: name.trim(),
        slug,
        description: description?.trim() || null,
        gender: gender || 'unisex',
        image: image || null,
        isActive: isActive !== undefined ? isActive : true,
        sortOrder: sortOrder || 0,
      },
    })

    return NextResponse.json({ category }, { status: 201 })
  } catch (error) {
    console.error('Admin categories POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}