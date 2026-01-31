import { db } from '@/lib/db/client'
import { gradingSystems, subjects, subjectCategories } from '@/drizzle/schema/grades'
import { bonusFactorDefaults, userBonusFactors } from '@/drizzle/schema/bonuses'
import { eq, and, isNull } from 'drizzle-orm'

export async function getCalculatorConfig(subjectLimit = 200) {
  const [gs, factors, subjectList, categories] = await Promise.all([
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
  ])

  return {
    gradingSystems: gs,
    bonusFactorDefaults: factors,
    subjects: subjectList,
    categories,
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
