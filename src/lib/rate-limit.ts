const requests = new Map<string, { count: number; resetTime: number }>()

/**
 * Simple in-memory rate limiter.
 * Returns `{ success: true }` if the request is allowed,
 * or `{ success: false, retryAfterMs: number }` if the limit is exceeded.
 */
export function rateLimit(
  ip: string,
  maxRequests: number = 60,
  windowMs: number = 60000,
): { success: boolean; retryAfterMs?: number } {
  const now = Date.now()
  const record = requests.get(ip)

  // No record or window expired — start fresh
  if (!record || now > record.resetTime) {
    requests.set(ip, { count: 1, resetTime: now + windowMs })
    return { success: true }
  }

  record.count++

  if (record.count > maxRequests) {
    return { success: false, retryAfterMs: record.resetTime - now }
  }

  return { success: true }
}

/**
 * Extract client IP from request headers (works behind proxies / CDNs).
 */
export function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

// Periodically prune stale entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now()
  for (const [key, record] of requests.entries()) {
    if (now > record.resetTime) {
      requests.delete(key)
    }
  }
}, 5 * 60 * 1000)
