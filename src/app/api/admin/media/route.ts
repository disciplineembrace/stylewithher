import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { writeFile, mkdir, unlink } from 'fs/promises'
import path from 'path'
import { recordAudit } from '@/lib/audit'
import { getClientIp } from '@/lib/rate-limit'

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']
const MAX_IMAGE_SIZE = 10 * 1024 * 1024
const MAX_VIDEO_SIZE = 50 * 1024 * 1024

async function compressImage(buffer: Buffer, mimeType: string): Promise<{ buffer: Buffer; ext: string; mimeType: string }> {
  const sharp = (await import('sharp')).default
  const MAX_DIMENSION = 1200
  const QUALITY = 80

  try {
    let img = sharp(buffer)
    const metadata = await img.metadata()

    // SVG: no compression possible, return as-is
    if (mimeType === 'image/svg+xml') {
      return { buffer, ext: 'svg', mimeType: 'image/svg+xml' }
    }

    // GIF: keep as-is (animated GIFs lose animation on resize)
    if (mimeType === 'image/gif') {
      return { buffer, ext: 'gif', mimeType: 'image/gif' }
    }

    // Only resize if larger than max dimension
    const needsResize = (metadata.width && metadata.width > MAX_DIMENSION) || (metadata.height && metadata.height > MAX_DIMENSION)

    if (needsResize) {
      img = img.resize(MAX_DIMENSION, MAX_DIMENSION, { fit: 'inside', withoutEnlargement: true })
    }

    // Convert to WebP for better compression (unless it's already a small PNG/JPEG)
    if (mimeType !== 'image/webp') {
      const output = await img.webp({ quality: QUALITY }).toBuffer()
      return { buffer: output, ext: 'webp', mimeType: 'image/webp' }
    }

    const output = await img.webp({ quality: QUALITY }).toBuffer()
    return { buffer: output, ext: 'webp', mimeType: 'image/webp' }
  } catch (err) {
    console.warn('Image compression failed, saving original:', err)
    const ext = mimeType.split('/')[1] || 'jpg'
    return { buffer, ext, mimeType }
  }
}

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

export async function POST(request: NextRequest) {
  try {
    const payload = getUserFromRequest(request)
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (payload.role !== 'admin') return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type)
    const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type)

    if (!isImage && !isVideo) {
      return NextResponse.json({ error: 'Invalid file type. Allowed: jpg, png, gif, webp, svg, mp4, webm, mov.' }, { status: 400 })
    }

    const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE
    if (file.size > maxSize) {
      return NextResponse.json({ error: `File too large. Maximum size: ${isImage ? '10MB' : '50MB'}.` }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    let buffer = Buffer.from(bytes)

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', isImage ? 'images' : 'videos')
    await mkdir(uploadDir, { recursive: true })

    let finalExt = file.name.split('.').pop() || 'jpg'
    let finalMimeType = file.type
    let originalSize = file.size

    // Compress images automatically
    if (isImage) {
      const compressed = await compressImage(buffer, file.type)
      buffer = compressed.buffer
      finalExt = compressed.ext
      finalMimeType = compressed.mimeType
      console.log(`Image compressed: ${(originalSize / 1024).toFixed(1)}KB → ${(buffer.length / 1024).toFixed(1)}KB (${Math.round((1 - buffer.length / originalSize) * 100)}% reduction)`)
    }

    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${finalExt}`
    const filePath = path.join(uploadDir, uniqueName)

    await writeFile(filePath, buffer)
    const url = `/uploads/${isImage ? 'images' : 'videos'}/${uniqueName}`

    const mediaFile = await db.mediaFile.create({
      data: {
        filename: file.name, url, mimeType: finalMimeType, size: buffer.length,
        alt: formData.get('alt') as string || null, uploadedBy: payload.userId,
      },
    })

    const ip = getClientIp(request)
    await recordAudit(payload.userId, 'Admin', 'MEDIA_UPLOAD',
      `Uploaded ${isImage ? 'image' : 'video'}: ${file.name} (${(originalSize / 1024).toFixed(1)}KB)`, ip)

    return NextResponse.json({
      file: mediaFile,
      compressed: isImage ? { originalSize, compressedSize: buffer.length, saved: originalSize - buffer.length } : undefined,
    }, { status: 201 })
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

    try { await unlink(path.join(process.cwd(), 'public', existing.url)) } catch { /* */ }
    await db.mediaFile.delete({ where: { id: fileId } })

    const ip = getClientIp(request)
    await recordAudit(payload.userId, 'Admin', 'MEDIA_DELETE', `Deleted media: ${existing.filename}`, ip)

    return NextResponse.json({ message: 'File deleted successfully' })
  } catch (error) {
    console.error('Media DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}