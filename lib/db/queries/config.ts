import { db } from '@/lib/db/client'
import { gradingSystems, subjects, subjectCategories } from '@/drizzle/schema/grades'
import { bonusFactorDefaults, userBonusFactors } from '@/drizzle/schema/bonuses'
import { parentChildRelationships } from '@/drizzle/schema/relationships'
import { scanConfig } from '@/drizzle/schema/scanConfig'
import { eq, and, isNull, or } from 'drizzle-orm'

export async function getCalculatorConfig(subjectLimit = 200) {
  const [gs, factors, subjectList, categories, termTypesRow] = await Promise.all([
    db
      .select()
      .from(gradingSystems)
      .where(eq(gradingSystems.isActive, true))
      .orderBy(gradingSystems.displayOrder),
    db
      .select({
        factorType: bonusFactorDefaults.factorType,
        factorKey: bonusFactorDefaults.factorKey,
        factorValue: bonusFactorDefaults.factorValue,
        description: bonusFactorDefaults.description,
      })
      .from(bonusFactorDefaults)
      .where(eq(bonusFactorDefaults.isActive, true)),
    db
      .select()
      .from(subjects)
      .where(and(eq(subjects.isActive, true), eq(subjects.isCustom, false)))
      .orderBy(subjects.displayOrder)
      .limit(subjectLimit),
    db
      .select()
      .from(subjectCategories)
      .where(eq(subjectCategories.isActive, true))
      .orderBy(subjectCategories.displayOrder),
    db.select().from(scanConfig).where(eq(scanConfig.key, 'term_types')),
  ])

  return {
    gradingSystems: gs,
    bonusFactorDefaults: factors,
    subjects: subjectList,
    categories,
    termTypes: termTypesRow[0]?.data ?? null,
  }
}

export async function getBonusFactors(userId: string, childId: string | null) {
  const [defaults, overrides] = await Promise.all([
    db.select().from(bonusFactorDefaults).where(eq(bonusFactorDefaults.isActive, true)),
    childId
      ? db
          .select()
          .from(userBonusFactors)
          .where(and(eq(userBonusFactors.userId, userId), eq(userBonusFactors.childId, childId)))
      : db
          .select()
          .from(userBonusFactors)
          .where(and(eq(userBonusFactors.userId, userId), isNull(userBonusFactors.childId))),
  ])

  return { defaults, overrides }
}

// Resolves the correct factor owner (parent account) and returns the effective bonus
// factors that should be applied when calculating a child's grade bonus.
//
// Priority chain (matches engine.ts factorValue):
//   child-specific parent override > parent general override > global defaults
//
// When actorId is the student submitting their own grade (targetChildId = null),
// the parent is looked up via parentChildRelationships so parent-configured
// multipliers are applied even though the student is the one submitting.
export async function getEffectiveBonusFactors(actorId: string, targetChildId: string | null) {
  const defaults = await db
    .select()
    .from(bonusFactorDefaults)
    .where(eq(bonusFactorDefaults.isActive, true))

  // Determine who owns the factors (always the parent, if a relationship exists)
  let ownerId = actorId
  const isStudentSelf = !targetChildId || targetChildId === actorId
  const useChildSpecific = isStudentSelf ? null : targetChildId

  if (isStudentSelf) {
    // Student submitting their own grade — resolve their parent
    const [rel] = await db
      .select({ parentId: parentChildRelationships.parentId })
      .from(parentChildRelationships)
      .where(
        and(
          eq(parentChildRelationships.childId, actorId),
          eq(parentChildRelationships.invitationStatus, 'accepted')
        )
      )
      .limit(1)
    if (rel) ownerId = rel.parentId
  }

  // Fetch all relevant overrides for the owner.
  // When a child-specific override exists it takes priority (engine handles this).
  const overrides = await db
    .select()
    .from(userBonusFactors)
    .where(
      useChildSpecific
        ? and(
            eq(userBonusFactors.userId, ownerId),
            or(eq(userBonusFactors.childId, useChildSpecific), isNull(userBonusFactors.childId))
          )
        : and(eq(userBonusFactors.userId, ownerId), isNull(userBonusFactors.childId))
    )

  return { defaults, overrides }
}
