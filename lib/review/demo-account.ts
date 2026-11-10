/**
 * Store-review demo family: one parent and one linked student with real data,
 * so App Review and Google Play's reviewers can sign in and reach every feature.
 *
 * The password lives only in the APPREVIEW_PASSWORD secret (Swarm:
 * prod_APPREVIEW_PASSWORD). Without it nothing here runs.
 *
 * ensureReviewAccounts() runs at server start and hourly (instrumentation.ts):
 * - both accounts present → only re-syncs the password and verification, the
 *   data reviewers changed stays as it is;
 * - either one missing (a reviewer tried in-app deletion, guideline 5.1.1(v)) →
 *   the whole family is rebuilt from scratch, so the next reviewer starts clean.
 * reset: true always rebuilds (POST /api/admin/review-account).
 *
 * Stats: both addresses are review accounts (lib/stats/classify.ts).
 */
import bcrypt from 'bcryptjs'
import { and, eq, inArray, sql } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { users } from '@/drizzle/schema/auth'
import { userProfiles } from '@/drizzle/schema/users'
import { gradingSystems, subjects, subjectGrades, termGrades } from '@/drizzle/schema/grades'
import { quickGrades } from '@/drizzle/schema/quickGrades'
import { parentChildRelationships } from '@/drizzle/schema/relationships'
import { bonusFactorDefaults, userBonusFactors } from '@/drizzle/schema/bonuses'
import { settlements } from '@/drizzle/schema/settlements'
import {
  calculateBonus,
  calculateSingleGradeBonus,
  type CalculatorInput,
} from '@/lib/calculator/engine'
import { forgetUser } from '@/lib/stats/usage'

import {
  REVIEW_DEMO_EMAILS,
  REVIEW_PARENT_EMAIL,
  REVIEW_STUDENT_EMAIL,
} from '@/lib/review/accounts'

export { REVIEW_DEMO_EMAILS }

const PARENT_NAME = 'Anna Becker'
const STUDENT_NAME = 'Lena Becker'
const GRADING_SYSTEM = 'DE_1_6'
/** Arbitrary constant for pg_advisory_xact_lock: one rebuild at a time across replicas. */
const LOCK_KEY = 4_211_620_501

/** The parent's reward rule for Lena: more for top grades than the defaults (2 / 1). */
const REWARD_RULE = [
  { factorType: 'grade_tier', factorKey: 'best', factorValue: 3 },
  { factorType: 'grade_tier', factorKey: 'second', factorValue: 2 },
]

/** Last school year's report card, already paid out. */
const REPORT_CARD = {
  schoolYear: '2025/26',
  termType: 'semester_2',
  classLevel: 6,
  termName: 'Year 6 report card',
  grades: [
    ['german', '2'],
    ['english', '1'],
    ['mathematics', '1'],
    ['biology', '2'],
    ['history', '3'],
    ['music', '1'],
    ['physical_education', '2'],
  ],
} as const

/** This term's tests, not yet paid out: [subject, grade, note, days ago]. */
const RECENT_TESTS = [
  ['mathematics', '2', 'Fractions test', 21],
  ['english', '1', 'Vocabulary quiz', 14],
  ['german', '3', 'Essay', 9],
  ['physics', '1', 'Lab report', 3],
] as const

export type EnsureResult =
  { status: 'disabled' } | { status: 'ok'; rebuilt: boolean; passwordSynced: number }

export async function ensureReviewAccounts(opts: { reset?: boolean } = {}): Promise<EnsureResult> {
  const password = process.env.APPREVIEW_PASSWORD
  if (!password) return { status: 'disabled' }

  const existing = await db
    .select({
      id: users.id,
      email: users.email,
      password: users.password,
      verified: users.emailVerified,
    })
    .from(users)
    .where(inArray(users.email, REVIEW_DEMO_EMAILS))

  if (!opts.reset && existing.length === REVIEW_DEMO_EMAILS.length) {
    let passwordSynced = 0
    for (const u of existing) {
      const ok = !!u.password && (await bcrypt.compare(password, u.password))
      if (ok && u.verified) continue
      await db
        .update(users)
        .set({
          password: ok ? u.password : await bcrypt.hash(password, 12),
          emailVerified: u.verified ?? new Date(),
          updatedAt: new Date(),
        })
        .where(eq(users.id, u.id))
      passwordSynced++
    }
    return { status: 'ok', rebuilt: false, passwordSynced }
  }

  const hash = await bcrypt.hash(password, 12)
  const removed = await rebuild(hash)
  // Usage rows of the old accounts would lose their 'review' class with them.
  for (const id of removed) {
    await forgetUser(id).catch((e) => console.error('[review] forget:', (e as Error).message))
  }
  return { status: 'ok', rebuilt: true, passwordSynced: 0 }
}

/** Deletes whatever is left of the demo family and creates it again. Returns the removed ids. */
async function rebuild(hash: string): Promise<string[]> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(${LOCK_KEY})`)

    const [system] = await tx
      .select()
      .from(gradingSystems)
      .where(and(eq(gradingSystems.code, GRADING_SYSTEM), eq(gradingSystems.isActive, true)))
      .limit(1)
    if (!system) throw new Error(`grading system ${GRADING_SYSTEM} missing`)

    const codes = [
      ...REPORT_CARD.grades.map(([c]) => c),
      ...RECENT_TESTS.map(([c]) => c),
    ] as string[]
    const subjectRows = await tx
      .select({ id: subjects.id, code: subjects.code, isCore: subjects.isCoreSubject })
      .from(subjects)
      .where(inArray(subjects.code, codes))
    const subject = (code: string) => {
      const s = subjectRows.find((r) => r.code === code)
      if (!s) throw new Error(`subject ${code} missing`)
      return s
    }

    // Users cascade to profiles, grades, relationships, reward rules and settlements.
    const old = await tx
      .delete(users)
      .where(inArray(users.email, REVIEW_DEMO_EMAILS))
      .returning({ id: users.id })

    const now = new Date()
    const parentId = crypto.randomUUID()
    const studentId = crypto.randomUUID()
    await tx.insert(users).values([
      {
        id: parentId,
        email: REVIEW_PARENT_EMAIL,
        name: PARENT_NAME,
        password: hash,
        emailVerified: now,
      },
      {
        id: studentId,
        email: REVIEW_STUDENT_EMAIL,
        name: STUDENT_NAME,
        password: hash,
        emailVerified: now,
      },
    ])
    const profile = {
      preferredLanguage: 'en',
      timezone: 'Europe/Berlin',
      onboardingCompleted: true,
      termsAcceptedAt: now,
      privacyPolicyAcceptedAt: now,
    }
    await tx.insert(userProfiles).values([
      { ...profile, id: parentId, role: 'parent', fullName: PARENT_NAME },
      {
        ...profile,
        id: studentId,
        role: 'child',
        fullName: STUDENT_NAME,
        schoolName: 'Goethe-Gymnasium',
        schoolTown: 'Berlin',
        defaultGradingSystemId: system.id,
        defaultClassLevel: 7,
      },
    ])
    await tx.insert(parentChildRelationships).values({
      parentId,
      childId: studentId,
      relationshipType: 'parent',
      invitationStatus: 'accepted',
      invitedBy: parentId,
      respondedAt: now,
    })
    const rule = REWARD_RULE.map((f) => ({ ...f, userId: parentId, childId: studentId }))
    await tx.insert(userBonusFactors).values(rule)

    // Points come from the real engine with the parent's rule, as the app computes them.
    const defaults = await tx
      .select()
      .from(bonusFactorDefaults)
      .where(eq(bonusFactorDefaults.isActive, true))
    const factors: CalculatorInput['factors'] = {
      defaults,
      overrides: rule.map((f) => ({ ...f, id: '', createdAt: now, updatedAt: now })),
    }
    const gs = system as CalculatorInput['gradingSystem']

    const card = calculateBonus({
      gradingSystem: gs,
      factors,
      classLevel: REPORT_CARD.classLevel,
      termType: REPORT_CARD.termType,
      subjects: REPORT_CARD.grades.map(([code, grade]) => ({
        subjectId: subject(code).id,
        grade,
        isCoreSubject: subject(code).isCore ?? false,
      })),
    })
    const termId = crypto.randomUUID()
    const settlementId = crypto.randomUUID()
    const cardDate = new Date(now.getTime() - 120 * 86_400_000)
    await tx.insert(termGrades).values({
      id: termId,
      childId: studentId,
      schoolYear: REPORT_CARD.schoolYear,
      termType: REPORT_CARD.termType,
      gradingSystemId: system.id,
      classLevel: REPORT_CARD.classLevel,
      termName: REPORT_CARD.termName,
      status: 'submitted',
      totalBonusPoints: card.total,
      createdAt: cardDate,
      updatedAt: cardDate,
    })
    await tx.insert(settlements).values({
      id: settlementId,
      parentId,
      childId: studentId,
      amount: Math.max(card.total, 0),
      currency: 'EUR',
      method: 'cash',
      notes: 'Report card reward',
      createdAt: new Date(cardDate.getTime() + 2 * 86_400_000),
    })
    await tx.insert(subjectGrades).values(
      card.breakdown.map((b, i) => ({
        termGradeId: termId,
        subjectId: subject(REPORT_CARD.grades[i][0]).id,
        gradeValue: REPORT_CARD.grades[i][1],
        gradeNumeric: b.numericValue,
        gradeNormalized100: b.normalized,
        gradeQualityTier: b.tier,
        subjectWeight: 1,
        bonusPoints: b.bonus,
        settlementStatus: 'settled',
        settlementId,
        createdAt: cardDate,
        updatedAt: cardDate,
      }))
    )

    await tx.insert(quickGrades).values(
      RECENT_TESTS.map(([code, grade, note, daysAgo]) => {
        const r = calculateSingleGradeBonus({
          gradingSystem: gs,
          factors,
          classLevel: 7,
          subject: {
            subjectId: subject(code).id,
            grade,
            isCoreSubject: subject(code).isCore ?? false,
          },
        })
        const at = new Date(now.getTime() - daysAgo * 86_400_000)
        return {
          childId: studentId,
          subjectId: subject(code).id,
          gradingSystemId: system.id,
          classLevel: 7,
          gradeValue: grade,
          gradeNormalized100: r.normalized,
          gradeQualityTier: r.tier,
          bonusPoints: r.bonus,
          note,
          gradedAt: at,
          createdAt: at,
          updatedAt: at,
        }
      })
    )
    return old.map((o) => o.id)
  })
}
