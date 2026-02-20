import { db } from '@/lib/db/client'
import { termGrades, subjectGrades, gradingSystems, subjects } from '@/drizzle/schema/grades'
import { eq, inArray } from 'drizzle-orm'

// Map Drizzle camelCase result to snake_case for API consumers
function mapGradingSystem(gs: typeof gradingSystems.$inferSelect) {
  return {
    id: gs.id,
    code: gs.code,
    name: gs.name,
    description: gs.description,
    country_code: gs.countryCode,
    scale_type: gs.scaleType,
    best_is_highest: gs.bestIsHighest,
    min_value: gs.minValue,
    max_value: gs.maxValue,
    passing_threshold: gs.passingThreshold,
    grade_definitions: gs.gradeDefinitions,
    display_order: gs.displayOrder,
    is_active: gs.isActive,
  }
}

function mapSubjectGrade(
  sg: typeof subjectGrades.$inferSelect,
  subjectMap: Record<string, typeof subjects.$inferSelect>
) {
  return {
    id: sg.id,
    term_grade_id: sg.termGradeId,
    subject_id: sg.subjectId,
    grade_value: sg.gradeValue,
    grade_numeric: sg.gradeNumeric,
    grade_normalized_100: sg.gradeNormalized100,
    grade_quality_tier: sg.gradeQualityTier,
    subject_weight: sg.subjectWeight,
    bonus_points: sg.bonusPoints,
    subjects:
      sg.subjectId && subjectMap[sg.subjectId]
        ? { id: subjectMap[sg.subjectId].id, name: subjectMap[sg.subjectId].name }
        : null,
  }
}

function mapTerm(
  term: typeof termGrades.$inferSelect,
  gsMap: Record<string, typeof gradingSystems.$inferSelect>,
  allSubjectGrades: (typeof subjectGrades.$inferSelect)[],
  subjectMap: Record<string, typeof subjects.$inferSelect>
) {
  const gs = gsMap[term.gradingSystemId]
  return {
    id: term.id,
    child_id: term.childId,
    school_year: term.schoolYear,
    term_type: term.termType,
    term_name: term.termName,
    class_level: term.classLevel,
    grading_system_id: term.gradingSystemId,
    total_bonus_points: term.totalBonusPoints,
    status: term.status,
    created_at: term.createdAt,
    updated_at: term.updatedAt,
    grading_systems: gs ? mapGradingSystem(gs) : null,
    subject_grades: allSubjectGrades
      .filter((sg) => sg.termGradeId === term.id)
      .map((sg) => mapSubjectGrade(sg, subjectMap)),
  }
}

export async function getUserGrades(childId: string) {
  const terms = await db
    .select()
    .from(termGrades)
    .where(eq(termGrades.childId, childId))
    .orderBy(termGrades.createdAt)

  if (terms.length === 0) return []

  const termIds = terms.map((t) => t.id)
  const gsIds = [...new Set(terms.map((t) => t.gradingSystemId))]

  const [sGrades, gSystems] = await Promise.all([
    db.select().from(subjectGrades).where(inArray(subjectGrades.termGradeId, termIds)),
    db.select().from(gradingSystems).where(inArray(gradingSystems.id, gsIds)),
  ])

  const subjectIds = sGrades.map((sg) => sg.subjectId).filter(Boolean) as string[]
  const subjectList =
    subjectIds.length > 0
      ? await db.select().from(subjects).where(inArray(subjects.id, subjectIds))
      : []

  const subjectMap = Object.fromEntries(subjectList.map((s) => [s.id, s]))
  const gsMap = Object.fromEntries(gSystems.map((gs) => [gs.id, gs]))

  return terms.map((term) => mapTerm(term, gsMap, sGrades, subjectMap))
}

export async function getTermGrade(termId: string) {
  const [term] = await db.select().from(termGrades).where(eq(termGrades.id, termId)).limit(1)
  return term ?? null
}

export async function deleteTermGrade(termId: string) {
  await db.delete(subjectGrades).where(eq(subjectGrades.termGradeId, termId))
  await db.delete(termGrades).where(eq(termGrades.id, termId))
}

export async function getChildrenGrades(childIds: string[]) {
  if (childIds.length === 0) return []

  const terms = await db
    .select()
    .from(termGrades)
    .where(inArray(termGrades.childId, childIds))
    .orderBy(termGrades.createdAt)

  if (terms.length === 0) return []

  const termIds = terms.map((t) => t.id)
  const gsIds = [...new Set(terms.map((t) => t.gradingSystemId))]

  const [sGrades, gSystems] = await Promise.all([
    db.select().from(subjectGrades).where(inArray(subjectGrades.termGradeId, termIds)),
    db.select().from(gradingSystems).where(inArray(gradingSystems.id, gsIds)),
  ])

  const subjectIds = sGrades.map((sg) => sg.subjectId).filter(Boolean) as string[]
  const subjectList =
    subjectIds.length > 0
      ? await db.select().from(subjects).where(inArray(subjects.id, subjectIds))
      : []

  const subjectMap = Object.fromEntries(subjectList.map((s) => [s.id, s]))
  const gsMap = Object.fromEntries(gSystems.map((gs) => [gs.id, gs]))

  return terms.map((term) => mapTerm(term, gsMap, sGrades, subjectMap))
}
