import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { db } from '@/lib/db'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { sanitizeEmail } from '@/lib/sanitize'

export async function POST(request: NextRequest) {
  // ── Rate limit: 3 requests per hour per IP ──
  const ip = getClientIp(request)
  const { success } = rateLimit(ip, 3, 60 * 60 * 1000)
  if (!success) {
    // Return generic message to avoid leaking rate-limit info
    return NextResponse.json(
      { message: 'If an account with this email exists, a reset link has been sent.' },
      { status: 200 },
    )
  }

  try {
    const body = await request.json()
    const { email } = body

    if (!email || typeof email !== 'string') {
      // Still return generic message to prevent enumeration
      return NextResponse.json(
        { message: 'If an account with this email exists, a reset link has been sent.' },
        { status: 200 },
      )
    }

    const cleanEmail = sanitizeEmail(email)

    const user = await db.user.findUnique({
      where: { email: cleanEmail },
    })

    if (user && user.isActive) {
      // Generate secure 32-byte hex token
      const token = crypto.randomBytes(32).toString('hex')

      // Hash the token before storing (SHA-256)
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

      // Set expiry to 1 hour from now
      const oneHour = 60 * 60 * 1000
      const resetTokenExp = new Date(Date.now() + oneHour)

      await db.user.update({
        where: { id: user.id },
        data: {
          resetToken: tokenHash,
          resetTokenExp,
        },
      })

      // Log the reset link for testing (replace with real email service later)
      const resetLink = `http://localhost:3000/reset?token=${token}`
      console.log(`PASSWORD_RESET_LINK: ${resetLink}`)
    }

    // Always return the same generic message to prevent email enumeration
    return NextResponse.json(
      { message: 'If an account with this email exists, a reset link has been sent.' },
      { status: 200 },
    )
  } catch (error) {
    console.error('Reset password request error:', error)
    // Still return generic message even on error
    return NextResponse.json(
      { message: 'If an account with this email exists, a reset link has been sent.' },
      { status: 200 },
    )
  }
}
