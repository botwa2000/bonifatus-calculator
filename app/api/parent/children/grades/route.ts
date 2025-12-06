import { NextResponse } from 'next/server'
import { createServerSupabaseClient, getUserProfile } from '@/lib/supabase/client'

export async function GET() {
  const profile = await getUserProfile()
  if (!profile) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }
  if (profile.role !== 'parent') {
    return NextResponse.json(
      { success: false, error: 'Only parents can view this data' },
      { status: 403 }
    )
  }

  const supabase = await createServerSupabaseClient()

  const { data: relationships, error: relErr } = await supabase
    .from('parent_child_relationships')
    .select(
      `
      id,
      child:user_profiles!child_id (
        id,
        full_name,
        role,
        date_of_birth
      )
    `
    )
    .eq('parent_id', profile.id)
    .eq('invitation_status', 'accepted')

  if (relErr) {
    return NextResponse.json(
      { success: false, error: 'Failed to load children', details: relErr.message },
      { status: 500 }
    )
  }

  const childIds = (relationships || []).map((r) => r.child?.id).filter(Boolean) as string[]
  if (childIds.length === 0) {
    return NextResponse.json({ success: true, children: [] }, { status: 200 })
  }

  const { data: terms, error: termsErr } = await supabase
    .from('term_grades')
    .select(
      `
      id,
      child_id,
      school_year,
      term_type,
      term_name,
      class_level,
      grading_system_id,
      total_bonus_points,
      created_at,
      grading_systems (
        name,
        code,
        scale_type,
        min_value,
        max_value,
        best_is_highest
      ),
      subject_grades (
        id,
        subject_id,
        grade_value,
        grade_normalized_100,
        subject_weight,
        bonus_points,
        grade_quality_tier,
        subjects ( name )
      )
    `
    )
    .in('child_id', childIds)
    .order('created_at', { ascending: false })

  if (termsErr) {
    return NextResponse.json(
      { success: false, error: 'Failed to load grades', details: termsErr.message },
      { status: 500 }
    )
  }

  const termsByChild =
    terms?.reduce<Record<string, typeof terms>>((acc, term) => {
      const childId = term.child_id
      if (!acc[childId]) acc[childId] = []
      acc[childId].push(term)
      return acc
    }, {}) ?? {}

  const childrenWithGrades = (relationships || []).map((rel) => ({
    relationshipId: rel.id,
    child: rel.child,
    terms: termsByChild[rel.child?.id ?? ''] || [],
  }))

  return NextResponse.json({ success: true, children: childrenWithGrades }, { status: 200 })
}
