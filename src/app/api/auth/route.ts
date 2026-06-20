import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { signToken, getUserFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const payload = getUserFromRequest(request)
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, name: true, email: true, role: true, phone: true, avatar: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Auth GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, name, email, password } = body

    if (action === 'signup') {
      if (!name || !email || !password) {
        return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 })
      }

      const existingUser = await db.user.findUnique({ where: { email: email.toLowerCase() } })
      if (existingUser) {
        return NextResponse.json({ error: 'Email already registered' }, { status: 400 })
      }

      const hashedPassword = await bcrypt.hash(password, 12)
      const userCount = await db.user.count()
      const user = await db.user.create({
        data: {
          name,
          email: email.toLowerCase(),
          password: hashedPassword,
          role: userCount === 0 ? 'admin' : 'customer',
          isVerified: userCount === 0,
        },
      })

      const token = signToken({ userId: user.id, email: user.email, role: user.role })
      return NextResponse.json({
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
      }, { status: 201 })
    }

    // Login
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { email: email.toLowerCase() } })
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    if (!user.isActive) {
      return NextResponse.json({ error: 'Account is deactivated' }, { status: 401 })
    }

    if (!user.password) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }
    let isPasswordValid = false
    try {
      isPasswordValid = await bcrypt.compare(password, user.password)
    } catch {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const token = signToken({ userId: user.id, email: user.email, role: user.role })
    return NextResponse.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone, avatar: user.avatar },
    })
  } catch (error) {
    console.error('Auth POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const payload = getUserFromRequest(request)
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, phone, oldPassword, newPassword } = body

    if (oldPassword && newPassword) {
      if (!oldPassword || !newPassword) {
        return NextResponse.json({ error: 'Old and new passwords are required' }, { status: 400 })
      }
      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 })
      }

      const user = await db.user.findUnique({ where: { id: payload.userId } })
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      let isOldPasswordValid = false
      try {
        isOldPasswordValid = await bcrypt.compare(oldPassword, user.password)
      } catch {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
      }
      if (!isOldPasswordValid) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, 12)
      await db.user.update({
        where: { id: payload.userId },
        data: { password: hashedNewPassword },
      })

      return NextResponse.json({ message: 'Password updated successfully' })
    }

    // Update profile
    const updateData: Record<string, string> = {}
    if (name) updateData.name = name
    if (phone !== undefined) updateData.phone = phone

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const user = await db.user.update({
      where: { id: payload.userId },
      data: updateData,
      select: { id: true, name: true, email: true, role: true, phone: true, avatar: true },
    })

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Auth PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
