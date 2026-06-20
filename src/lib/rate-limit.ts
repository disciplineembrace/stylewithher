const requests = new Map<string, { count: number; resetTime: number }>()

export function rateLimit(ip: string, limit: number = 60, windowMs: number = 60000): { allowed: boolean; retryAfter?: number } {
  const now = Date.now()
  const record = requests.get(ip)
  if (!record || now > record.resetTime) {
    requests.set(ip, { count: 1, resetTime: now + windowMs })
    return { allowed: true }
  }
  record.count++
  if (record.count > limit) {
    return { allowed: false, retryAfter: Math.ceil((record.resetTime - now) / 1000) }
  }
  return { allowed: true }
}

export function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}