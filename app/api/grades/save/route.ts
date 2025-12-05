/**
 * Save grades and calculated bonus points
 * - Auth required
 * - Server-side calculation (prevents client tampering)
 * - Persists term_grades and subject_grades
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient, getUser } from '@/lib/supabase/client'
import { calculateBonus } from '@/lib/calculator/engine'
import type { Database, TablesInsert } from '@/types/database'

const saveSchema = z.object({
  gradingSystemId: z.string().uuid(),
  classLevel: z.number().int().min(1).max(20),
  termType: z.enum(['midterm', 'final', 'semester', 'quarterly']),
  schoolYear: z.string().min(4).max(15),
  termName: z.string().max(50).optional(),
  childId: z.string().uuid().optional(), // for parents saving for a child
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
  const parsed = saveSchema.safeParse(body)

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

    // Load grading system
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

    // Load factors
    const childId = normalizedChildId
    const childOverrideQuery = childId
      ? supabase
          .from('user_bonus_factors')
          .select('*')
          .eq('user_id', user.id)
          .eq('child_id', childId)
      : supabase.from('user_bonus_factors').select('*').eq('user_id', user.id).is('child_id', null)

    const [{ data: defaults, error: defaultsErr }, { data: overrides, error: overridesErr }] =
      await Promise.all([
        supabase.from('bonus_factor_defaults').select('*').eq('is_active', true),
        childOverrideQuery,
      ])

    const isMissingTable = (err: unknown) =>
      !!err &&
      typeof err === 'object' &&
      'code' in err &&
      ((err as { code?: string }).code === 'PGRST205' ||
        /Could not find the table/i.test((err as { message?: string }).message || ''))

    if (defaultsErr && !isMissingTable(defaultsErr)) {
      console.error('[grades/save] load defaults error', defaultsErr)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to load bonus factors',
          details: defaultsErr.message,
        },
        { status: 500 }
      )
    }
    if (overridesErr && !isMissingTable(overridesErr)) {
      console.error('[grades/save] load user factors error', overridesErr)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to load user factors',
          details: overridesErr.message,
        },
        { status: 500 }
      )
    }

    // Calculate bonuses server-side
    const calc = calculateBonus({
      gradingSystem: gradingSystem as Database['public']['Tables']['grading_systems']['Row'],
      factors: {
        defaults: defaults || [],
        overrides: overrides || [],
      },
      classLevel: payload.classLevel,
      termType: payload.termType,
      subjects: payload.subjects.map((s) => ({
        subjectId: s.subjectId,
        subjectName: s.subjectName,
        grade: s.grade,
        weight: s.weight,
      })),
    })

    // Determine child id (self for student; provided for parent)
    const targetChildId = normalizedChildId ?? user.id

    // Insert term_grades
    const termPayload: TablesInsert<'term_grades'> = {
      child_id: targetChildId,
      school_year: payload.schoolYear,
      term_type: payload.termType as Database['public']['Enums']['term_type'],
      grading_system_id: payload.gradingSystemId,
      class_level: payload.classLevel,
      term_name: payload.termName ?? null,
      status: 'submitted',
      total_bonus_points: calc.total,
    }

    const { data: term, error: termErr } = await supabase
      .from('term_grades')
      .insert(termPayload)
      .select('id')
      .single()

    if (termErr || !term) {
      return NextResponse.json(
        { success: false, error: 'Failed to save term grades' },
        { status: 500 }
      )
    }

    // Insert subject_grades
    const subjectRows: TablesInsert<'subject_grades'>[] = calc.breakdown.map((item, idx) => ({
      term_grade_id: term.id,
      subject_id: payload.subjects[idx]?.subjectId,
      grade_value: payload.subjects[idx]?.grade,
      grade_numeric: item.normalized,
      grade_normalized_100: item.normalized,
      grade_quality_tier: item.tier as Database['public']['Enums']['grade_quality_tier'] | null,
      subject_weight: payload.subjects[idx]?.weight ?? item.weight ?? 1,
      bonus_points: item.bonus,
    }))

    const { error: subErr } = await supabase.from('subject_grades').insert(subjectRows)
    if (subErr) {
      return NextResponse.json(
        { success: false, error: 'Failed to save subject grades' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        termId: term.id,
        totalBonusPoints: calc.total,
        subjects: calc.breakdown,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Save grades error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Unexpected error while saving grades',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
