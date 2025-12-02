import { NextResponse } from 'next/server'
import { createServerSupabaseClient, getUser } from '@/lib/supabase/client'

export async function GET() {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase
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
        status,
        total_bonus_points,
        created_at,
        updated_at,
        grading_systems (
          name,
          code,
          scale_type
        ),
        subject_grades (
          id,
          subject_id,
          grade_value,
          grade_normalized_100,
          subject_weight,
          bonus_points,
          grade_quality_tier,
          subjects (
            name
          )
        )
      `
      )
      .eq('child_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to load grades', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, terms: data || [] }, { status: 200 })
  } catch (err) {
    console.error('List grades error:', err)
    return NextResponse.json(
      { success: false, error: 'Unexpected error while loading grades' },
      { status: 500 }
    )
  }
}
