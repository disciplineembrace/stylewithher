import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const payload = getUserFromRequest(request)
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const content = await db.siteContent.findMany({
      orderBy: { key: 'asc' },
    })

    return NextResponse.json({ content })
  } catch (error) {
    console.error('Admin content GET error:', error)
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
    const { content } = body

    if (!content || !Array.isArray(content)) {
      return NextResponse.json({ error: 'content array is required' }, { status: 400 })
    }

    const updated = await Promise.all(
      content.map(
        (item: { key: string; value: string; type?: string }) =>
          db.siteContent.upsert({
            where: { key: item.key },
            create: { key: item.key, value: item.value, type: item.type || 'text' },
            update: { value: item.value, type: item.type || 'text' },
          })
      )
    )

    return NextResponse.json({ content: updated })
  } catch (error) {
    console.error('Admin content PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
