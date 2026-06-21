import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { writeFile, mkdir, unlink } from 'fs/promises'
import path from 'path'
import { recordAudit } from '@/lib/audit'
import { getClientIp } from '@/lib/rate-limit'

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']
const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB for images
const MAX_VIDEO_SIZE = 50 * 1024 * 1024 // 50MB for videos

export async function GET(request: NextRequest) {
  try {
    const payload = getUserFromRequest(request)
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (payload.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'image', 'video', or null for all
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    const where: Record<string, unknown> = {}
    if (type === 'image') {
      where.mimeType = { in: ALLOWED_IMAGE_TYPES }
    } else if (type === 'video') {
      where.mimeType = { in: ALLOWED_VIDEO_TYPES }
    }

    const [files, total] = await Promise.all([
      db.mediaFile.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, email: true } } },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.mediaFile.count({ where }),
    ])

    return NextResponse.json({ files, total, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } })
  } catch (error) {
    console.error('Media GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = getUserFromRequest(request)
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (payload.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type)
    const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type)

    if (!isImage && !isVideo) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: jpg, png, gif, webp, svg, mp4, webm, mov.' },
        { status: 400 },
      )
    }

    const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File too large. Maximum size: ${isImage ? '10MB' : '50MB'}.` },
        { status: 400 },
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', isImage ? 'images' : 'videos')
    await mkdir(uploadDir, { recursive: true })

    const ext = file.name.split('.').pop()
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
    const filePath = path.join(uploadDir, uniqueName)

    await writeFile(filePath, buffer)
    const url = `/uploads/${isImage ? 'images' : 'videos'}/${uniqueName}`

    const mediaFile = await db.mediaFile.create({
      data: {
        filename: file.name,
        url,
        mimeType: file.type,
        size: file.size,
        alt: formData.get('alt') as string || null,
        uploadedBy: payload.userId,
      },
    })

    const ip = getClientIp(request)
    await recordAudit(payload.userId, 'Admin', 'MEDIA_UPLOAD', 
      `Uploaded ${isImage ? 'image' : 'video'}: ${file.name} (${(file.size / 1024).toFixed(1)}KB)`, ip)

    return NextResponse.json({ file: mediaFile }, { status: 201 })
  } catch (error) {
    console.error('Media POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const payload = getUserFromRequest(request)
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (payload.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get('fileId')

    if (!fileId) {
      return NextResponse.json({ error: 'fileId is required' }, { status: 400 })
    }

    const existing = await db.mediaFile.findUnique({ where: { id: fileId } })
    if (!existing) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Delete the physical file
    try {
      const filePath = path.join(process.cwd(), 'public', existing.url)
      await unlink(filePath)
    } catch {
      // File may not exist on disk, continue with DB deletion
    }

    await db.mediaFile.delete({ where: { id: fileId } })

    const ip = getClientIp(request)
    await recordAudit(payload.userId, 'Admin', 'MEDIA_DELETE', 
      `Deleted media: ${existing.filename}`, ip)

    return NextResponse.json({ message: 'File deleted successfully' })
  } catch (error) {
    console.error('Media DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}