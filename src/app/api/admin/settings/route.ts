import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

// GET all settings
export async function GET(request: NextRequest) {
  try {
    const payload = getUserFromRequest(request)
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (payload.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const contents = await db.siteContent.findMany()
    const settings: Record<string, string> = {}
    for (const c of contents) {
      settings[c.key] = c.value
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Settings GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT update settings (bulk)
export async function PUT(request: NextRequest) {
  try {
    const payload = getUserFromRequest(request)
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (payload.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { settings } = body

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: 'Settings object is required' }, { status: 400 })
    }

    // Allowed setting keys (whitelist for security)
    const ALLOWED_KEYS = [
      'site_name', 'site_tagline', 'site_description',
      'contact_email', 'contact_phone', 'contact_address',
      'social_instagram', 'social_facebook', 'social_twitter', 'social_youtube', 'social_pinterest',
      'shipping_policy', 'return_policy', 'privacy_policy', 'terms_of_service',
      'upi_id', 'currency', 'currency_symbol',
      'seo_title', 'seo_description', 'seo_keywords',
      'google_analytics_id', 'facebook_pixel_id',
    ]

    const results = []
    for (const [key, value] of Object.entries(settings)) {
      if (ALLOWED_KEYS.includes(key) && typeof value === 'string') {
        const result = await db.siteContent.upsert({
          where: { key },
          update: { value },
          create: { key, value, type: 'text' },
        })
        results.push(result)
      }
    }

    return NextResponse.json({ message: `${results.length} settings updated`, settings: results.length })
  } catch (error) {
    console.error('Settings PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}