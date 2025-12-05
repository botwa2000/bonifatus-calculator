import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { calculateBonus } from '@/lib/calculator/engine'
import { createServerSupabaseClient, getUser } from '@/lib/supabase/client'
import type { Database, TablesInsert } from '@/types/database'

const updateSchema = z.object({
  termId: z.string().uuid(),
  gradingSystemId: z.string().uuid(),
  classLevel: z.number().int().min(1).max(20),
  termType: z.enum(['midterm', 'final', 'semester', 'quarterly']),
  schoolYear: z.string().min(4).max(15),
  termName: z.string().max(50).optional(),
  childId: z.string().uuid().optional(),
  subjects: z
    .array(
      z.object({
        subjectId: z.string().uuid(),
        subjectName: z.string().min(1).max(120).optional(),
        grade: z.string().min(1),
        weight: z.number().min(0.1).max(10).default(1),
      })
    )
    .min(1),
})

export async function POST(request: NextRequest) {
  const body = await request.json()
  const parsed = updateSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Validation failed', details: parsed.error.issues },
      { status: 400 }
    )
  }

  const payload = parsed.data
  const normalizedChildId = payload.childId && payload.childId !== 'null' ? payload.childId : null

  try {
    const supabase = await createServerSupabaseClient()
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { data: existingTerm, error: termLoadErr } = await supabase
      .from('term_grades')
      .select('id, child_id')
      .eq('id', payload.termId)
      .single()

    if (termLoadErr || !existingTerm) {
      return NextResponse.json({ success: false, error: 'Term not found' }, { status: 404 })
    }

    if (existingTerm.child_id !== (normalizedChildId ?? user.id)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const { data: gradingSystem, error: gsError } = await supabase
      .from('grading_systems')
      .select('*')
      .eq('id', payload.gradingSystemId)
      .eq('is_active', true)
      .single()

    if (gsError || !gradingSystem) {
      return NextResponse.json(
        { success: false, error: 'Grading system not found' },
        { status: 404 }
      )
    }

    const childIdForOverrides = normalizedChildId
    const childOverrideQuery = childIdForOverrides
      ? supabase
          .from('user_bonus_factors')
          .select('*')
          .eq('user_id', user.id)
          .eq('child_id', childIdForOverrides)
      : supabase.from('user_bonus_factors').select('*').eq('user_id', user.id).is('child_id', null)

    const [{ data: defaults, error: defaultsErr }, { data: overrides, error: overridesErr }] =
      await Promise.all([
        supabase.from('bonus_factor_defaults').select('*').eq('is_active', true),
        childOverrideQuery,
      ])

    if (defaultsErr) {
      return NextResponse.json(
        { success: false, error: 'Failed to load bonus factors' },
        { status: 500 }
      )
    }
    if (overridesErr) {
      return NextResponse.json(
        { success: false, error: 'Failed to load user factors' },
        { status: 500 }
      )
    }

    const calc = calculateBonus({
      gradingSystem: gradingSystem as Database['public']['Tables']['grading_systems']['Row'],
      factors: { defaults: defaults || [], overrides: overrides || [] },
      classLevel: payload.classLevel,
      termType: payload.termType,
      subjects: payload.subjects.map((s) => ({
        subjectId: s.subjectId,
        subjectName: s.subjectName,
        grade: s.grade,
        weight: s.weight,
      })),
    })

    const childId = normalizedChildId ?? user.id

    const termPayload: TablesInsert<'term_grades'> = {
      child_id: childId,
      school_year: payload.schoolYear,
      term_type: payload.termType as Database['public']['Enums']['term_type'],
      grading_system_id: payload.gradingSystemId,
      class_level: payload.classLevel,
      term_name: payload.termName ?? null,
      status: 'submitted',
      total_bonus_points: calc.total,
    }

    const { error: updateTermErr } = await supabase
      .from('term_grades')
      .update(termPayload)
      .eq('id', payload.termId)

    if (updateTermErr) {
      return NextResponse.json(
        { success: false, error: 'Failed to update term grades' },
        { status: 500 }
      )
    }

    await supabase.from('subject_grades').delete().eq('term_grade_id', payload.termId)

    const subjectRows: TablesInsert<'subject_grades'>[] = calc.breakdown.map((item, idx) => ({
      term_grade_id: payload.termId,
      subject_id: payload.subjects[idx]?.subjectId,
      grade_value: payload.subjects[idx]?.grade,
      grade_numeric: item.normalized,
      grade_normalized_100: item.normalized,
      grade_quality_tier: item.tier as Database['public']['Enums']['grade_quality_tier'] | null,
      subject_weight: item.weight,
      bonus_points: item.bonus,
    }))

    const { error: insertErr } = await supabase.from('subject_grades').insert(subjectRows)
    if (insertErr) {
      return NextResponse.json(
        { success: false, error: 'Failed to save subject grades' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        termId: payload.termId,
        totalBonusPoints: calc.total,
        subjects: calc.breakdown,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Update grades error:', error)
    return NextResponse.json(
      { success: false, error: 'Unexpected error while updating grades' },
      { status: 500 }
    )
  }
}
