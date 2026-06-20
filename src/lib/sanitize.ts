export function sanitizeString(input: string): string {
  return input.replace(/<[^>]*>/g, '').trim()
}

export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized: Record<string, any> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') sanitized[key] = sanitizeString(value)
    else if (typeof value === 'object' && value !== null && !Array.isArray(value)) sanitized[key] = sanitizeObject(value)
    else sanitized[key] = value
  }
  return sanitized as T
}