import { db } from '@/lib/db'

export async function recordAudit(userId: string, userName: string, action: string, details?: string, ipAddress?: string) {
  try {
    await db.auditLog.create({
      data: { userId, userName, action, details: details?.substring(0, 500), ipAddress }
    })
  } catch { /* silent - don't block main flow */ }
}