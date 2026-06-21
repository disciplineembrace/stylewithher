import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, newPassword } = body

    // Validate inputs
    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    if (!newPassword || typeof newPassword !== 'string') {
      return NextResponse.json({ error: 'New password is required' }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    if (newPassword.length > 128) {
      return NextResponse.json({ error: 'Password is too long' }, { status: 400 })
    }

    // Hash the provided token to compare with stored hash
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    // Find user with matching reset token hash
    const user = await db.user.findFirst({
      where: { resetToken: tokenHash },
    })

    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 })
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json({ error: 'Account is deactivated' }, { status: 403 })
    }

    // Check token expiry
    if (!user.resetTokenExp || user.resetTokenExp < new Date()) {
      // Clear expired token
      await db.user.update({
        where: { id: user.id },
        data: { resetToken: null, resetTokenExp: null },
      })
      return NextResponse.json({ error: 'Reset token has expired. Please request a new one.' }, { status: 400 })
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // Update password and clear reset token fields atomically (prevent token reuse)
    await db.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExp: null,
      },
    })

    return NextResponse.json(
      { message: 'Password has been reset successfully. You can now sign in with your new password.' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Reset password confirm error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}