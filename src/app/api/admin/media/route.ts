import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { writeFile, mkdir, unlink } from 'fs/promises'
import path from 'path'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

function adminGuard(request: NextRequest) {
  const payload = getUserFromRequest(request)
  if (!payload || payload.role !== 'admin') {
    return null
  }
  return payload
}

export async function GET(request: NextRequest) {
  try {
    const payload = adminGuard(request)
    if (!payload) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const files = await db.mediaFile.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, email: true } } },
    })

    return NextResponse.json({ files })
  } catch (error) {
    console.error('Media GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = adminGuard(request)
    if (!payload) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only jpg, png, gif, and webp images are allowed.' },
        { status: 400 },
      )
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large. Maximum size is 5MB.' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadDir, { recursive: true })

    const ext = file.name.split('.').pop()
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
    const filePath = path.join(uploadDir, uniqueName)

    await writeFile(filePath, buffer)
    const url = `/uploads/${uniqueName}`

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

    return NextResponse.json({ file: mediaFile }, { status: 201 })
  } catch (error) {
    console.error('Media POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const payload = adminGuard(request)
    if (!payload) {
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
    return NextResponse.json({ message: 'File deleted successfully' })
  } catch (error) {
    console.error('Media DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
