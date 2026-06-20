import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    const existing = await db.newsletterSubscriber.findFirst({ where: { email: email.toLowerCase() } })
    if (existing) {
      if (!existing.isActive) {
        await db.newsletterSubscriber.update({
          where: { id: existing.id },
          data: { isActive: true },
        })
        return NextResponse.json({ message: 'Re-subscribed to newsletter successfully' })
      }
      return NextResponse.json({ message: 'Already subscribed to newsletter' })
    }

    await db.newsletterSubscriber.create({
      data: { email: email.toLowerCase() },
    })

    return NextResponse.json({ message: 'Subscribed to newsletter successfully' }, { status: 201 })
  } catch (error) {
    console.error('Newsletter POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
