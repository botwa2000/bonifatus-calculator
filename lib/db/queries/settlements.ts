import { db } from '@/lib/db/client'
import { settlements } from '@/drizzle/schema/settlements'
import { quickGrades } from '@/drizzle/schema/quickGrades'
import { subjects, subjectGrades, termGrades } from '@/drizzle/schema/grades'
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
  quickGradeIds?: string[]
  subjectGradeIds?: string[]
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

  // Mark quick grades as settled
  if (data.quickGradeIds && data.quickGradeIds.length > 0) {
    await db
      .update(quickGrades)
      .set({ settlementStatus: 'settled', settlementId, updatedAt: new Date() })
      .where(inArray(quickGrades.id, data.quickGradeIds))
  }

  // Mark subject grades (from saved terms) as settled
  if (data.subjectGradeIds && data.subjectGradeIds.length > 0) {
    await db
      .update(subjectGrades)
      .set({ settlementStatus: 'settled', settlementId, updatedAt: new Date() })
      .where(inArray(subjectGrades.id, data.subjectGradeIds))
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
  const rows = await db
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
  return rows.map((r) => ({ ...r, gradeSource: 'notes' as const }))
}

/**
 * Return all subject grades from saved term results for a child,
 * shaped identically to getChildQuickGrades() so the parent dashboard
 * can combine both sources in a single list.
 */
export async function getChildTermSubjectGradesForDashboard(childId: string) {
  const rows = await db
    .select({
      id: subjectGrades.id,
      subjectId: subjectGrades.subjectId,
      gradeValue: subjectGrades.gradeValue,
      gradeNormalized100: subjectGrades.gradeNormalized100,
      gradeQualityTier: subjectGrades.gradeQualityTier,
      bonusPoints: subjectGrades.bonusPoints,
      settlementStatus: subjectGrades.settlementStatus,
      createdAt: subjectGrades.createdAt,
      subjectName: subjects.name,
    })
    .from(subjectGrades)
    .innerJoin(termGrades, eq(subjectGrades.termGradeId, termGrades.id))
    .leftJoin(subjects, eq(subjectGrades.subjectId, subjects.id))
    .where(eq(termGrades.childId, childId))
    .orderBy(desc(subjectGrades.createdAt))
    .limit(200)

  return rows.map((r) => ({
    id: r.id,
    subjectId: r.subjectId ?? '',
    gradeValue: r.gradeValue ?? '',
    gradeNormalized100: r.gradeNormalized100,
    gradeQualityTier: r.gradeQualityTier ?? 'below',
    bonusPoints: r.bonusPoints ?? 0,
    note: null as string | null,
    // use createdAt as gradedAt (term grades have no separate graded date)
    gradedAt: r.createdAt,
    createdAt: r.createdAt,
    settlementStatus: r.settlementStatus ?? 'unsettled',
    settlementId: null as string | null,
    subjectName: r.subjectName ?? null,
    gradeSource: 'calculator' as const,
  }))
}

/** Get unsettled subject grades from saved terms for a child */
export async function getUnsettledSubjectGrades(childId: string) {
  return db
    .select({
      id: subjectGrades.id,
      subjectId: subjectGrades.subjectId,
      gradeValue: subjectGrades.gradeValue,
      gradeNormalized100: subjectGrades.gradeNormalized100,
      gradeQualityTier: subjectGrades.gradeQualityTier,
      bonusPoints: subjectGrades.bonusPoints,
      settlementStatus: subjectGrades.settlementStatus,
      createdAt: subjectGrades.createdAt,
      subjectName: subjects.name,
      schoolYear: termGrades.schoolYear,
      termType: termGrades.termType,
    })
    .from(subjectGrades)
    .innerJoin(termGrades, eq(subjectGrades.termGradeId, termGrades.id))
    .leftJoin(subjects, eq(subjectGrades.subjectId, subjects.id))
    .where(and(eq(termGrades.childId, childId), eq(subjectGrades.settlementStatus, 'unsettled')))
    .orderBy(desc(subjectGrades.createdAt))
    .limit(200)
}
