/**
 * Strip HTML tags and trim whitespace from a string.
 */
export function sanitizeInput(str: string): string {
  return str.replace(/<[^>]*>/g, '').trim()
}

/**
 * Normalize an email: lowercase and trim.
 */
export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim()
}

/**
 * Recursively sanitize all string values in a plain object.
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') sanitized[key] = sanitizeInput(value)
    else if (typeof value === 'object' && value !== null && !Array.isArray(value))
      sanitized[key] = sanitizeObject(value as Record<string, unknown>)
    else sanitized[key] = value
  }
  return sanitized as T
}
