// @ts-expect-error — middleware is deprecated in Next.js 16+ (proxy pattern preferred).
// Kept for security headers until migration is complete.
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()',
  )
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  response.headers.set('X-DNS-Prefetch-Control', 'on')
  response.headers.delete('X-Powered-By')

  // Add Content-Security-Policy for XSS protection
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel-scripts.b-cdn.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https: http:",
    "frame-src 'self' https://www.instagram.com https://www.youtube.com",
    "connect-src 'self' https://ep-floral-bar-ao2qh123-pooler.c-2.ap-southeast-1.aws.neon.tech https://api.qrserver.com",
    "media-src 'self' blob: data:",
  ].join('; ')
  response.headers.set('Content-Security-Policy', csp)

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|uploads/).*)'],
}