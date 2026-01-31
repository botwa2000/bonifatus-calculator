import { db } from '@/lib/db/client'
import { users } from '@/drizzle/schema/auth'
import { userProfiles } from '@/drizzle/schema/users'
import { parentChildRelationships } from '@/drizzle/schema/relationships'
import { termGrades, gradingSystems } from '@/drizzle/schema/grades'
import { securityEvents } from '@/drizzle/schema/security'
import { eq, count, sum, avg, desc, gte, sql } from 'drizzle-orm'

export async function getAdminStats() {
  const [
    [userCounts],
    [termCount],
    [bonusSum],
    [relationshipCount],
    [weekRegistrations],
    [monthRegistrations],
    [pendingVerifications],
  ] = await Promise.all([
    db
      .select({
        total: count(),
        parents: count(sql`CASE WHEN ${userProfiles.role} = 'parent' THEN 1 END`),
        children: count(sql`CASE WHEN ${userProfiles.role} = 'child' THEN 1 END`),
        admins: count(sql`CASE WHEN ${userProfiles.role} = 'admin' THEN 1 END`),
      })
      .from(userProfiles),
    db.select({ count: count() }).from(termGrades),
    db.select({ total: sum(termGrades.totalBonusPoints) }).from(termGrades),
    db
      .select({ count: count() })
      .from(parentChildRelationships)
      .where(eq(parentChildRelationships.invitationStatus, 'accepted')),
    db
      .select({ count: count() })
      .from(userProfiles)
      .where(gte(userProfiles.createdAt, sql`NOW() - INTERVAL '7 days'`)),
    db
      .select({ count: count() })
      .from(userProfiles)
      .where(gte(userProfiles.createdAt, sql`NOW() - INTERVAL '30 days'`)),
    db
      .select({ count: count() })
      .from(users)
      .where(sql`${users.emailVerified} IS NULL`),
  ])

  return {
    totalUsers: userCounts?.total ?? 0,
    parents: userCounts?.parents ?? 0,
    children: userCounts?.children ?? 0,
    admins: userCounts?.admins ?? 0,
    totalTerms: termCount?.count ?? 0,
    totalBonusPoints: Number(bonusSum?.total ?? 0),
    activeRelationships: relationshipCount?.count ?? 0,
    registrationsThisWeek: weekRegistrations?.count ?? 0,
    registrationsThisMonth: monthRegistrations?.count ?? 0,
    pendingVerifications: pendingVerifications?.count ?? 0,
  }
}

export async function getAllUsers() {
  const result = await db
    .select({
      id: userProfiles.id,
      fullName: userProfiles.fullName,
      role: userProfiles.role,
      email: users.email,
      emailVerified: users.emailVerified,
      createdAt: userProfiles.createdAt,
      isActive: userProfiles.isActive,
      onboardingCompleted: userProfiles.onboardingCompleted,
    })
    .from(userProfiles)
    .innerJoin(users, eq(users.id, userProfiles.id))
    .orderBy(desc(userProfiles.createdAt))

  // Get term counts and connection counts per user
  const termCounts = await db
    .select({
      childId: termGrades.childId,
      count: count(),
    })
    .from(termGrades)
    .groupBy(termGrades.childId)

  const connectionCounts = await db
    .select({
      userId: sql<string>`user_id`,
      count: count(),
    })
    .from(
      sql`(
        SELECT parent_id AS user_id FROM parent_child_relationships WHERE invitation_status = 'accepted'
        UNION ALL
        SELECT child_id AS user_id FROM parent_child_relationships WHERE invitation_status = 'accepted'
      ) AS connections`
    )
    .groupBy(sql`user_id`)

  const termCountMap = new Map(termCounts.map((t) => [t.childId, t.count]))
  const connectionCountMap = new Map(connectionCounts.map((c) => [c.userId, c.count]))

  return result.map((user) => ({
    ...user,
    termsCount: termCountMap.get(user.id) ?? 0,
    connectionsCount: connectionCountMap.get(user.id) ?? 0,
  }))
}

export async function getRecentSecurityEvents(limit = 50) {
  return db
    .select({
      id: securityEvents.id,
      eventType: securityEvents.eventType,
      severity: securityEvents.severity,
      userId: securityEvents.userId,
      ipAddress: securityEvents.ipAddress,
      userAgent: securityEvents.userAgent,
      eventMetadata: securityEvents.eventMetadata,
      createdAt: securityEvents.createdAt,
    })
    .from(securityEvents)
    .orderBy(desc(securityEvents.createdAt))
    .limit(limit)
}

export async function getGradeStats() {
  const [avgBonus] = await db.select({ avg: avg(termGrades.totalBonusPoints) }).from(termGrades)

  const systemUsage = await db
    .select({
      systemId: termGrades.gradingSystemId,
      count: count(),
    })
    .from(termGrades)
    .groupBy(termGrades.gradingSystemId)
    .orderBy(desc(count()))
    .limit(1)

  let mostUsedSystem: string | null = null
  if (systemUsage.length > 0) {
    const [sys] = await db
      .select({ name: gradingSystems.name })
      .from(gradingSystems)
      .where(eq(gradingSystems.id, systemUsage[0].systemId))
      .limit(1)
    mostUsedSystem = sys ? JSON.stringify(sys.name) : null
  }

  const termsByYear = await db
    .select({
      schoolYear: termGrades.schoolYear,
      count: count(),
    })
    .from(termGrades)
    .groupBy(termGrades.schoolYear)
    .orderBy(desc(count()))

  return {
    avgBonusPoints: Number(avgBonus?.avg ?? 0),
    mostUsedGradingSystem: mostUsedSystem,
    termsBySchoolYear: termsByYear,
  }
}

export async function getRecentRegistrations(days = 30) {
  return db
    .select({
      id: userProfiles.id,
      fullName: userProfiles.fullName,
      role: userProfiles.role,
      createdAt: userProfiles.createdAt,
      email: users.email,
    })
    .from(userProfiles)
    .innerJoin(users, eq(users.id, userProfiles.id))
    .where(gte(userProfiles.createdAt, sql`NOW() - INTERVAL '${sql.raw(String(days))} days'`))
    .orderBy(desc(userProfiles.createdAt))
}
