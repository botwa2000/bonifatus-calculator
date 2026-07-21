import { db } from '@/lib/db/client'
import { settlements } from '@/drizzle/schema/settlements'
import { quickGrades } from '@/drizzle/schema/quickGrades'
import { subjects, subjectGrades, termGrades } from '@/drizzle/schema/grades'
import { userProfiles } from '@/drizzle/schema/users'
import { eq, and, desc, inArray, ne } from 'drizzle-orm'

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
  packageType?: string
  packageLabel?: string
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
    packageType: data.packageType || null,
    packageLabel: data.packageLabel || null,
  })

  // Mark quick grades as settled — restrict to grades that belong to data.childId
  if (data.quickGradeIds && data.quickGradeIds.length > 0) {
    await db
      .update(quickGrades)
      .set({ settlementStatus: 'settled', settlementId, updatedAt: new Date() })
      .where(
        and(inArray(quickGrades.id, data.quickGradeIds), eq(quickGrades.childId, data.childId))
      )
  }

  // Mark subject grades (from saved terms) as settled — restrict to child's own term grades
  if (data.subjectGradeIds && data.subjectGradeIds.length > 0) {
    const validRows = await db
      .select({ id: subjectGrades.id })
      .from(subjectGrades)
      .innerJoin(termGrades, eq(subjectGrades.termGradeId, termGrades.id))
      .where(
        and(inArray(subjectGrades.id, data.subjectGradeIds), eq(termGrades.childId, data.childId))
      )
    if (validRows.length > 0) {
      const validIds = validRows.map((r) => r.id)
      await db
        .update(subjectGrades)
        .set({ settlementStatus: 'settled', settlementId, updatedAt: new Date() })
        .where(inArray(subjectGrades.id, validIds))
    }
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
      packageType: settlements.packageType,
      packageLabel: settlements.packageLabel,
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
      packageType: settlements.packageType,
      packageLabel: settlements.packageLabel,
      createdAt: settlements.createdAt,
    })
    .from(settlements)
    .where(eq(settlements.childId, childId))
    .orderBy(desc(settlements.createdAt))
    .limit(100)
}

export type SettlementPackageItem = {
  id: string
  subjectName: string | null
  gradeValue: string | null
  gradeQualityTier: string | null
  bonusPoints: number
  gradedAt: Date
  source: 'calculator' | 'notes'
}

export type SettlementPackage = {
  type: 'report_card' | 'grade_period'
  id: string
  label: string
  childId: string
  childName: string
  itemCount: number
  totalPoints: number
  periodStart?: string
  periodEnd?: string
  isOngoing?: boolean
  termId?: string
  schoolYear?: string
  termType?: string
  classLevel?: number
  items: SettlementPackageItem[]
}

/** Build a period label from year + month (or week/quarter depending on unit) */
function buildPeriodLabel(year: number, key: string, unit: string): string {
  if (unit === 'weekly') {
    // key is "YYYY-Www" ISO week e.g. "2025-W42"
    const [, w] = key.split('-W')
    return `Week ${w}, ${year}`
  }
  if (unit === 'monthly') {
    // key is "YYYY-MM"
    const [, mm] = key.split('-')
    const date = new Date(year, parseInt(mm, 10) - 1, 1)
    return date.toLocaleString('en', { month: 'long', year: 'numeric' })
  }
  // quarterly
  const quarter = parseInt(key.split('-Q')[1], 10)
  const months = ['Jan–Mar', 'Apr–Jun', 'Jul–Sep', 'Oct–Dec']
  return `Q${quarter} ${year} (${months[quarter - 1]})`
}

function getPeriodKey(date: Date, unit: string): { key: string; year: number } {
  const d = new Date(date)
  const year = d.getFullYear()
  if (unit === 'weekly') {
    // ISO week number
    const startOfYear = new Date(year, 0, 1)
    const diff = d.getTime() - startOfYear.getTime()
    const oneDay = 86400000
    const dayOfYear = Math.floor(diff / oneDay)
    const dayOfWeek = startOfYear.getDay() || 7
    const isoWeek = Math.ceil((dayOfYear + dayOfWeek) / 7)
    return { key: `${year}-W${String(isoWeek).padStart(2, '0')}`, year }
  }
  if (unit === 'monthly') {
    const month = String(d.getMonth() + 1).padStart(2, '0')
    return { key: `${year}-${month}`, year }
  }
  // quarterly
  const quarter = Math.floor(d.getMonth() / 3) + 1
  return { key: `${year}-Q${quarter}`, year }
}

function getPeriodBounds(
  key: string,
  unit: string
): { start: string; end: string; isOngoing: boolean } {
  const now = new Date()
  if (unit === 'weekly') {
    const [yearStr, weekStr] = key.split('-W')
    const year = parseInt(yearStr, 10)
    const week = parseInt(weekStr, 10)
    const startOfYear = new Date(year, 0, 1)
    const dayOfWeek = startOfYear.getDay() || 7
    const startMs = startOfYear.getTime() + (week - 1) * 7 * 86400000 - (dayOfWeek - 1) * 86400000
    const start = new Date(startMs)
    const end = new Date(startMs + 6 * 86400000)
    const isOngoing = now >= start && now <= end
    return {
      start: start.toISOString().slice(0, 10),
      end: end.toISOString().slice(0, 10),
      isOngoing,
    }
  }
  if (unit === 'monthly') {
    const [yearStr, mm] = key.split('-')
    const year = parseInt(yearStr, 10)
    const month = parseInt(mm, 10)
    const start = new Date(year, month - 1, 1)
    const end = new Date(year, month, 0)
    const nowKey = getPeriodKey(now, 'monthly').key
    return {
      start: start.toISOString().slice(0, 10),
      end: end.toISOString().slice(0, 10),
      isOngoing: key === nowKey,
    }
  }
  // quarterly
  const [yearStr, qStr] = key.split('-Q')
  const year = parseInt(yearStr, 10)
  const q = parseInt(qStr, 10)
  const startMonth = (q - 1) * 3
  const start = new Date(year, startMonth, 1)
  const end = new Date(year, startMonth + 3, 0)
  const nowKey = getPeriodKey(now, 'quarterly').key
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
    isOngoing: key === nowKey,
  }
}

export async function getSettlementPackages(
  childIds: string[],
  childNameMap: Record<string, string>,
  periodUnit: string = 'monthly'
): Promise<SettlementPackage[]> {
  if (childIds.length === 0) return []

  const packages: SettlementPackage[] = []

  // ── Report Card packages: one per termGrade that has unsettled subjectGrades ──
  const unsettledSubjectRows = await db
    .select({
      id: subjectGrades.id,
      termGradeId: subjectGrades.termGradeId,
      gradeValue: subjectGrades.gradeValue,
      gradeQualityTier: subjectGrades.gradeQualityTier,
      bonusPoints: subjectGrades.bonusPoints,
      createdAt: subjectGrades.createdAt,
      subjectName: subjects.name,
      // term fields
      childId: termGrades.childId,
      schoolYear: termGrades.schoolYear,
      termType: termGrades.termType,
      termName: termGrades.termName,
      classLevel: termGrades.classLevel,
      termCreatedAt: termGrades.createdAt,
    })
    .from(subjectGrades)
    .innerJoin(termGrades, eq(subjectGrades.termGradeId, termGrades.id))
    .leftJoin(subjects, eq(subjectGrades.subjectId, subjects.id))
    .where(
      and(inArray(termGrades.childId, childIds), eq(subjectGrades.settlementStatus, 'unsettled'))
    )
    .orderBy(desc(termGrades.createdAt))

  // Group by termGradeId
  const termMap = new Map<string, typeof unsettledSubjectRows>()
  for (const row of unsettledSubjectRows) {
    const existing = termMap.get(row.termGradeId) ?? []
    existing.push(row)
    termMap.set(row.termGradeId, existing)
  }

  for (const [termId, rows] of termMap) {
    const first = rows[0]
    const childId = first.childId!
    const childName = childNameMap[childId] ?? 'Child'

    const termName = first.termName
    let label: string
    if (termName && termName.trim()) {
      label = termName
    } else {
      label = `${first.schoolYear} · ${first.termType}`
    }

    const items: SettlementPackageItem[] = rows.map((r) => {
      const nameRaw = r.subjectName as unknown
      let name: string | null = null
      if (typeof nameRaw === 'string') name = nameRaw
      else if (nameRaw && typeof nameRaw === 'object') {
        const nm = nameRaw as Record<string, unknown>
        name = (nm['en'] ?? nm['de'] ?? Object.values(nm)[0])?.toString() ?? null
      }
      return {
        id: r.id,
        subjectName: name,
        gradeValue: r.gradeValue,
        gradeQualityTier: r.gradeQualityTier,
        bonusPoints: (r.bonusPoints ?? 0) as number,
        gradedAt: r.createdAt ?? new Date(),
        source: 'calculator',
      }
    })

    const totalPoints = items.reduce((s, i) => s + i.bonusPoints, 0)

    packages.push({
      type: 'report_card',
      id: `rc_${termId}`,
      label,
      childId,
      childName,
      itemCount: items.length,
      totalPoints,
      termId,
      schoolYear: first.schoolYear,
      termType: first.termType,
      classLevel: first.classLevel,
      items,
    })
  }

  // ── Grade Period packages: unsettled quickGrades grouped by period ──
  const unsettledQuickRows = await db
    .select({
      id: quickGrades.id,
      childId: quickGrades.childId,
      gradeValue: quickGrades.gradeValue,
      gradeQualityTier: quickGrades.gradeQualityTier,
      bonusPoints: quickGrades.bonusPoints,
      gradedAt: quickGrades.gradedAt,
      subjectName: subjects.name,
    })
    .from(quickGrades)
    .leftJoin(subjects, eq(quickGrades.subjectId, subjects.id))
    .where(
      and(inArray(quickGrades.childId, childIds), eq(quickGrades.settlementStatus, 'unsettled'))
    )
    .orderBy(desc(quickGrades.gradedAt))

  // Group by childId + period key
  const periodMap = new Map<string, typeof unsettledQuickRows>()
  for (const row of unsettledQuickRows) {
    const gradedAt = row.gradedAt ?? new Date()
    const { key, year } = getPeriodKey(gradedAt, periodUnit)
    const mapKey = `${row.childId}::${key}::${year}`
    const existing = periodMap.get(mapKey) ?? []
    existing.push(row)
    periodMap.set(mapKey, existing)
  }

  for (const [mapKey, rows] of periodMap) {
    const [childId, key, yearStr] = mapKey.split('::')
    const year = parseInt(yearStr, 10)
    const childName = childNameMap[childId] ?? 'Child'
    const label = buildPeriodLabel(year, key, periodUnit)
    const bounds = getPeriodBounds(key, periodUnit)

    const items: SettlementPackageItem[] = rows.map((r) => {
      const nameRaw = r.subjectName as unknown
      let name: string | null = null
      if (typeof nameRaw === 'string') name = nameRaw
      else if (nameRaw && typeof nameRaw === 'object') {
        const nm = nameRaw as Record<string, unknown>
        name = (nm['en'] ?? nm['de'] ?? Object.values(nm)[0])?.toString() ?? null
      }
      return {
        id: r.id,
        subjectName: name,
        gradeValue: r.gradeValue,
        gradeQualityTier: r.gradeQualityTier,
        bonusPoints: (r.bonusPoints ?? 0) as number,
        gradedAt: r.gradedAt ?? new Date(),
        source: 'notes',
      }
    })

    const totalPoints = items.reduce((s, i) => s + i.bonusPoints, 0)

    packages.push({
      type: 'grade_period',
      id: `gp_${childId}_${key}`,
      label,
      childId,
      childName,
      itemCount: items.length,
      totalPoints,
      periodStart: bounds.start,
      periodEnd: bounds.end,
      isOngoing: bounds.isOngoing,
      items,
    })
  }

  // Sort: report cards first (by term created desc), then periods (by period end desc)
  packages.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'report_card' ? -1 : 1
    const dateA = a.periodEnd ?? a.items[0]?.gradedAt?.toISOString() ?? ''
    const dateB = b.periodEnd ?? b.items[0]?.gradedAt?.toISOString() ?? ''
    return dateB.localeCompare(dateA)
  })

  return packages
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
 * Return ONE summary entry per saved term for a child (not per subject).
 * Each entry is shaped like a ChildQuickGrade so the parent dashboard
 * can merge both note grades and calculator terms in one list without
 * flooding the list with individual subject lines from test reports.
 *
 * Settlement status is 'unsettled' if ANY subject in the term is unsettled.
 * bonusPoints is the term's total_bonus_points so the parent sees the full
 * value for the report, not a per-subject fragment.
 */
export async function getChildTermSummariesForDashboard(childId: string) {
  // Fetch all terms with their subject grades to determine settlement status
  const rows = await db
    .select({
      termId: termGrades.id,
      schoolYear: termGrades.schoolYear,
      termType: termGrades.termType,
      termName: termGrades.termName,
      totalBonusPoints: termGrades.totalBonusPoints,
      createdAt: termGrades.createdAt,
      subjectSettlementStatus: subjectGrades.settlementStatus,
    })
    .from(termGrades)
    .leftJoin(subjectGrades, eq(subjectGrades.termGradeId, termGrades.id))
    .where(eq(termGrades.childId, childId))
    .orderBy(desc(termGrades.createdAt))

  // Group by term and aggregate settlement status
  const termMap = new Map<
    string,
    {
      termId: string
      schoolYear: string
      termType: string
      termName: string | null
      totalBonusPoints: number
      createdAt: Date | null
      hasUnsettled: boolean
    }
  >()

  for (const row of rows) {
    if (!termMap.has(row.termId)) {
      termMap.set(row.termId, {
        termId: row.termId,
        schoolYear: row.schoolYear,
        termType: row.termType,
        termName: row.termName,
        totalBonusPoints: Number(row.totalBonusPoints ?? 0),
        createdAt: row.createdAt,
        hasUnsettled: false,
      })
    }
    if (row.subjectSettlementStatus === 'unsettled') {
      termMap.get(row.termId)!.hasUnsettled = true
    }
  }

  return Array.from(termMap.values()).map((t) => ({
    id: t.termId,
    subjectId: '',
    gradeValue: '',
    gradeNormalized100: null as number | null,
    gradeQualityTier: 'below' as string,
    bonusPoints: t.totalBonusPoints,
    note: null as string | null,
    gradedAt: t.createdAt,
    createdAt: t.createdAt,
    settlementStatus: t.hasUnsettled ? 'unsettled' : 'settled',
    settlementId: null as string | null,
    subjectName: t.termName || `${t.schoolYear} ${t.termType}`,
    gradeSource: 'calculator' as const,
  }))
}

/**
 * @deprecated Use getChildTermSummariesForDashboard instead.
 * Returns individual subject grades from saved terms — too granular for the Kids tab.
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
