import { db } from '@/lib/db/client'
import { settlements } from '@/drizzle/schema/settlements'
import { quickGrades } from '@/drizzle/schema/quickGrades'
import { subjects } from '@/drizzle/schema/grades'
import { userProfiles } from '@/drizzle/schema/users'
import { eq, and, desc, inArray } from 'drizzle-orm'

export async function createSettlement(data: {
  parentId: string
  childId: string
  amount: number
  currency: string
  method: string
  notes?: string
  splitConfig?: Record<string, number>
  quickGradeIds: string[]
}) {
  const settlementId = crypto.randomUUID()
  await db.insert(settlements).values({
    id: settlementId,
    parentId: data.parentId,
    childId: data.childId,
    amount: data.amount,
    currency: data.currency,
    method: data.method,
    notes: data.notes || null,
    splitConfig: data.splitConfig || null,
  })

  // Mark the quick grades as settled
  if (data.quickGradeIds.length > 0) {
    await db
      .update(quickGrades)
      .set({ settlementStatus: 'settled', settlementId, updatedAt: new Date() })
      .where(inArray(quickGrades.id, data.quickGradeIds))
  }

  return settlementId
}

export async function getSettlementsForParent(parentId: string) {
  return db
    .select({
      id: settlements.id,
      parentId: settlements.parentId,
      childId: settlements.childId,
      amount: settlements.amount,
      currency: settlements.currency,
      method: settlements.method,
      notes: settlements.notes,
      splitConfig: settlements.splitConfig,
      createdAt: settlements.createdAt,
      childName: userProfiles.fullName,
    })
    .from(settlements)
    .leftJoin(userProfiles, eq(settlements.childId, userProfiles.id))
    .where(eq(settlements.parentId, parentId))
    .orderBy(desc(settlements.createdAt))
    .limit(100)
}

export async function getSettlementsForChild(childId: string) {
  return db
    .select({
      id: settlements.id,
      parentId: settlements.parentId,
      childId: settlements.childId,
      amount: settlements.amount,
      currency: settlements.currency,
      method: settlements.method,
      notes: settlements.notes,
      createdAt: settlements.createdAt,
    })
    .from(settlements)
    .where(eq(settlements.childId, childId))
    .orderBy(desc(settlements.createdAt))
    .limit(100)
}

export async function getUnsettledQuickGrades(childId: string) {
  return db
    .select({
      id: quickGrades.id,
      subjectId: quickGrades.subjectId,
      gradeValue: quickGrades.gradeValue,
      bonusPoints: quickGrades.bonusPoints,
      note: quickGrades.note,
      gradedAt: quickGrades.gradedAt,
      createdAt: quickGrades.createdAt,
      settlementStatus: quickGrades.settlementStatus,
      subjectName: subjects.name,
    })
    .from(quickGrades)
    .leftJoin(subjects, eq(quickGrades.subjectId, subjects.id))
    .where(and(eq(quickGrades.childId, childId), eq(quickGrades.settlementStatus, 'unsettled')))
    .orderBy(desc(quickGrades.createdAt))
    .limit(200)
}

export async function getChildQuickGrades(childId: string) {
  return db
    .select({
      id: quickGrades.id,
      subjectId: quickGrades.subjectId,
      gradeValue: quickGrades.gradeValue,
      gradeNormalized100: quickGrades.gradeNormalized100,
      gradeQualityTier: quickGrades.gradeQualityTier,
      bonusPoints: quickGrades.bonusPoints,
      note: quickGrades.note,
      gradedAt: quickGrades.gradedAt,
      createdAt: quickGrades.createdAt,
      settlementStatus: quickGrades.settlementStatus,
      settlementId: quickGrades.settlementId,
      subjectName: subjects.name,
    })
    .from(quickGrades)
    .leftJoin(subjects, eq(quickGrades.subjectId, subjects.id))
    .where(eq(quickGrades.childId, childId))
    .orderBy(desc(quickGrades.createdAt))
    .limit(200)
}
