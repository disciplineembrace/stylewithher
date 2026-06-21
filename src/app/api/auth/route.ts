import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { signToken, getUserFromRequest } from '@/lib/auth'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { sanitizeEmail, sanitizeInput } from '@/lib/sanitize'
import { recordAudit } from '@/lib/audit'

export async function GET(request: NextRequest) {
  try {
    const payload = getUserFromRequest(request)
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, name: true, email: true, role: true, phone: true, avatar: true, isVerified: true, isActive: true },
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
  // ── Rate limit: 10 requests per minute per IP ──
  const ip = getClientIp(request)
  const { success, retryAfterMs } = rateLimit(ip, 10, 60 * 1000)
  if (!success) {
    return NextResponse.json(
      { error: 'Too many attempts. Please try again later.' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil(retryAfterMs! / 1000)) },
      },
    )
  }

  try {
    const body = await request.json()
    const { action, name, email, password } = body

    // ── Signup (customers only — admin is created via seed) ──
    if (action === 'signup') {
      if (!name || !email || !password) {
        return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 })
      }
      if (password.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
      }
      if (password.length > 128) {
        return NextResponse.json({ error: 'Password is too long' }, { status: 400 })
      }

      const cleanEmail = sanitizeEmail(email)
      const cleanName = sanitizeInput(name)

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
      }

      const existingUser = await db.user.findUnique({ where: { email: cleanEmail } })
      if (existingUser) {
        return NextResponse.json({ error: 'Email already registered' }, { status: 400 })
      }

      const hashedPassword = await bcrypt.hash(password, 12)
      const user = await db.user.create({
        data: {
          name: cleanName,
          email: cleanEmail,
          password: hashedPassword,
          role: 'customer',
          isVerified: false,
        },
      })

      // Record audit log
      await recordAudit(user.id, user.name, 'SIGNUP', `New customer account created: ${cleanEmail}`, ip)

      const token = signToken({ userId: user.id, email: user.email, role: user.role })
      return NextResponse.json({
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
      }, { status: 201 })
    }

    // ── Login ──
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const cleanEmail = sanitizeEmail(email)

    const user = await db.user.findUnique({ where: { email: cleanEmail } })
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

    // Record login audit
    await recordAudit(user.id, user.name, 'LOGIN', `User logged in: ${cleanEmail}`, ip)

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
      if (newPassword.length > 128) {
        return NextResponse.json({ error: 'New password is too long' }, { status: 400 })
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

      // Audit password change
      const ip = getClientIp(request)
      await recordAudit(payload.userId, user.name, 'PASSWORD_CHANGE', 'User changed their password', ip)

      return NextResponse.json({ message: 'Password updated successfully' })
    }

    // Update profile
    const updateData: Record<string, string> = {}
    if (name) updateData.name = sanitizeInput(name)
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