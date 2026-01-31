import { db } from '@/lib/db/client'
import { securityEvents } from '@/drizzle/schema/security'

export async function logSecurityEvent(params: {
  eventType:
    | 'login_success'
    | 'login_failure'
    | 'password_reset'
    | 'email_change'
    | 'suspicious_activity'
    | 'account_lockout'
    | 'rate_limit_exceeded'
    | 'unauthorized_access_attempt'
  severity?: 'info' | 'warning' | 'critical'
  userId?: string | null
  ipAddress: string
  userAgent?: string | null
  metadata?: Record<string, unknown>
}) {
  await db.insert(securityEvents).values({
    eventType: params.eventType,
    severity: params.severity ?? 'info',
    userId: params.userId ?? null,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent ?? null,
    eventMetadata: params.metadata ?? {},
  })
}
