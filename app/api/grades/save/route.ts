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
import type { Database } from '@/types/database'

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
    const [{ data: defaults, error: defaultsErr }, { data: overrides, error: overridesErr }] =
      await Promise.all([
        supabase.from('bonus_factor_defaults').select('*').eq('is_active', true),
        supabase
          .from('user_bonus_factors')
          .select('*')
          .eq('user_id', user.id)
          .in('child_id', [payload.childId ?? null]),
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

    // Calculate bonuses server-side
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

    // Determine child id (self for student; provided for parent)
    const childId = payload.childId ?? user.id

    // Insert term_grades
    const termPayload: Database['public']['Tables']['term_grades']['Insert'] = {
      child_id: childId,
      school_year: payload.schoolYear,
      term_type: payload.termType as Database['public']['Enums']['term_type'],
      grading_system_id: payload.gradingSystemId,
      class_level: payload.classLevel,
      term_name: payload.termName ?? null,
      status: 'submitted',
      total_bonus_points: calc.total,
    }

    const termResult = await supabase
      .from('term_grades')
      // Supabase type inference on insert is misaligned with our generated types; explicit cast is safe here
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert(termPayload as any)
      .select('id')
      .single()

    const { data: term, error: termErr } = termResult as {
      data: { id: string } | null
      error: unknown
    }

    if (termErr || !term) {
      return NextResponse.json(
        { success: false, error: 'Failed to save term grades' },
        { status: 500 }
      )
    }

    // Insert subject_grades
    const subjectRows = calc.breakdown.map((item, idx) => ({
      term_grade_id: term.id,
      subject_id: payload.subjects[idx]?.subjectId,
      grade_value: payload.subjects[idx]?.grade,
      grade_numeric: item.normalized,
      grade_normalized_100: item.normalized,
      grade_quality_tier: item.tier as Database['public']['Enums']['grade_quality_tier'] | null,
      subject_weight: item.weight,
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
      { success: false, error: 'Unexpected error while saving grades' },
      { status: 500 }
    )
  }
}
