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

// PUT /api/admin/categories/[id] — Update a category
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = getUserFromRequest(request)
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (payload.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, slug: customSlug, description, gender, image, isActive, sortOrder } = body

    // Check category exists
    const existing = await db.category.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    const slug = customSlug?.trim() || (name ? generateSlug(name) : existing.slug)

    // Check slug uniqueness if changed
    if (slug !== existing.slug) {
      const slugTaken = await db.category.findUnique({ where: { slug } })
      if (slugTaken) {
        return NextResponse.json({ error: 'Category with this slug already exists' }, { status: 409 })
      }
    }

    const category = await db.category.update({
      where: { id },
      data: {
        ...(name ? { name: name.trim() } : {}),
        slug,
        ...(description !== undefined ? { description: description?.trim() || null } : {}),
        ...(gender ? { gender } : {}),
        ...(image !== undefined ? { image: image || null } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
        ...(sortOrder !== undefined ? { sortOrder } : {}),
      },
    })

    return NextResponse.json({ category })
  } catch (error) {
    console.error('Admin categories PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/admin/categories/[id] — Delete a category
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = getUserFromRequest(request)
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (payload.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { id } = await params

    // Check category exists
    const existing = await db.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    // Cannot delete if products are assigned
    if (existing._count.products > 0) {
      return NextResponse.json(
        { error: `Cannot delete category "${existing.name}" — it has ${existing._count.products} product(s) assigned. Remove products first or deactivate the category instead.` },
        { status: 409 }
      )
    }

    await db.category.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin categories DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}