import { db } from '@/lib/db/client'
import { termGrades, subjectGrades, gradingSystems, subjects } from '@/drizzle/schema/grades'
import { eq, inArray } from 'drizzle-orm'

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

  // Get subject details for subject grades
  const subjectIds = sGrades.map((sg) => sg.subjectId).filter(Boolean) as string[]
  const subjectList =
    subjectIds.length > 0
      ? await db.select().from(subjects).where(inArray(subjects.id, subjectIds))
      : []

  const subjectMap = Object.fromEntries(subjectList.map((s) => [s.id, s]))
  const gsMap = Object.fromEntries(gSystems.map((gs) => [gs.id, gs]))

  return terms.map((term) => ({
    ...term,
    grading_systems: gsMap[term.gradingSystemId] || null,
    subject_grades: sGrades
      .filter((sg) => sg.termGradeId === term.id)
      .map((sg) => ({
        ...sg,
        subjects: sg.subjectId ? subjectMap[sg.subjectId] || null : null,
      })),
  }))
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

  return terms.map((term) => ({
    ...term,
    grading_systems: gsMap[term.gradingSystemId] || null,
    subject_grades: sGrades
      .filter((sg) => sg.termGradeId === term.id)
      .map((sg) => ({
        ...sg,
        subjects: sg.subjectId ? subjectMap[sg.subjectId] || null : null,
      })),
  }))
}
