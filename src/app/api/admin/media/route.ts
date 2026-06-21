import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { recordAudit } from '@/lib/audit'
import { getClientIp } from '@/lib/rate-limit'

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']
const MAX_IMAGE_SIZE = 10 * 1024 * 1024
const MAX_VIDEO_SIZE = 50 * 1024 * 1024

export async function GET(request: NextRequest) {
  try {
    const payload = getUserFromRequest(request)
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (payload.role !== 'admin') return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    const where: Record<string, unknown> = {}
    if (type === 'image') { where.mimeType = { in: ALLOWED_IMAGE_TYPES } }
    else if (type === 'video') { where.mimeType = { in: ALLOWED_VIDEO_TYPES } }

    const [files, total] = await Promise.all([
      db.mediaFile.findMany({
        where, orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, email: true } } },
        skip: (page - 1) * limit, take: limit,
      }),
      db.mediaFile.count({ where }),
    ])

    return NextResponse.json({ files, total, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } })
  } catch (error) {
    console.error('Media GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Accept JSON with pre-compressed base64 data URL from client
// No Sharp, no filesystem, no FormData — works on any serverless platform
export async function POST(request: NextRequest) {
  try {
    const payload = getUserFromRequest(request)
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (payload.role !== 'admin') return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const body = await request.json()
    const { filename, url, mimeType, size, alt } = body

    if (!url || !filename) {
      return NextResponse.json({ error: 'url and filename are required' }, { status: 400 })
    }

    if (!url.startsWith('data:')) {
      return NextResponse.json({ error: 'Invalid data URL' }, { status: 400 })
    }

    const mediaFile = await db.mediaFile.create({
      data: {
        filename,
        url,
        mimeType: mimeType || 'image/webp',
        size: size || 0,
        alt: alt || null,
        uploadedBy: payload.userId,
      },
    })

    const ip = getClientIp(request)
    await recordAudit(payload.userId, 'Admin', 'MEDIA_UPLOAD',
      `Uploaded image: ${filename} (${size ? ((size / 1024).toFixed(1) + 'KB') : 'unknown size'})`, ip)

    return NextResponse.json({ file: mediaFile }, { status: 201 })
  } catch (error) {
    console.error('Media POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const payload = getUserFromRequest(request)
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (payload.role !== 'admin') return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get('fileId')
    if (!fileId) return NextResponse.json({ error: 'fileId is required' }, { status: 400 })

    const existing = await db.mediaFile.findUnique({ where: { id: fileId } })
    if (!existing) return NextResponse.json({ error: 'File not found' }, { status: 404 })

    await db.mediaFile.delete({ where: { id: fileId } })

    const ip = getClientIp(request)
    await recordAudit(payload.userId, 'Admin', 'MEDIA_DELETE', `Deleted media: ${existing.filename}`, ip)

    return NextResponse.json({ message: 'File deleted successfully' })
  } catch (error) {
    console.error('Media DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}