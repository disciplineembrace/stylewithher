import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const position = searchParams.get('position')
    const adminView = searchParams.get('admin') === 'true'

    if (adminView) {
      const payload = getUserFromRequest(request)
      if (!payload || payload.role !== 'admin') {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
      }
      const banners = await db.banner.findMany({
        orderBy: [{ position: 'asc' }, { sortOrder: 'asc' }],
      })
      return NextResponse.json({ banners })
    }

    const where: Record<string, unknown> = { isActive: true }
    if (position) {
      where.position = position
    }

    const banners = await db.banner.findMany({
      where,
      orderBy: [{ position: 'asc' }, { sortOrder: 'asc' }],
    })

    return NextResponse.json({ banners })
  } catch (error) {
    console.error('Banners GET error:', error)
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
    const { title, subtitle, image, link, position, isActive, sortOrder } = body

    if (!title || !image) {
      return NextResponse.json({ error: 'title and image are required' }, { status: 400 })
    }

    const banner = await db.banner.create({
      data: {
        title,
        subtitle,
        image,
        link,
        position: position || 'home',
        isActive: isActive !== undefined ? isActive : true,
        sortOrder: sortOrder || 0,
      },
    })

    return NextResponse.json({ banner }, { status: 201 })
  } catch (error) {
    console.error('Banners POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const payload = getUserFromRequest(request)
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { id, title, subtitle, image, link, position, isActive, sortOrder } = body

    if (!id) {
      return NextResponse.json({ error: 'Banner id is required' }, { status: 400 })
    }

    const existing = await db.banner.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Banner not found' }, { status: 404 })
    }

    const banner = await db.banner.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(subtitle !== undefined && { subtitle }),
        ...(image !== undefined && { image }),
        ...(link !== undefined && { link }),
        ...(position !== undefined && { position }),
        ...(isActive !== undefined && { isActive }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    })

    return NextResponse.json({ banner })
  } catch (error) {
    console.error('Banners PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const payload = getUserFromRequest(request)
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Banner id is required' }, { status: 400 })
    }

    const existing = await db.banner.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Banner not found' }, { status: 404 })
    }

    await db.banner.delete({ where: { id } })
    return NextResponse.json({ message: 'Banner deleted successfully' })
  } catch (error) {
    console.error('Banners DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
