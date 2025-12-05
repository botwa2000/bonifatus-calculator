import { NextResponse } from 'next/server'
import { createServerSupabaseClient, getUser } from '@/lib/supabase/client'

export async function GET() {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createServerSupabaseClient()

    const { data, error, status } = await supabase
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
          subjects (
            name
          )
        )
      `
      )
      .eq('child_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      // If the table isn't present (e.g., migrations not applied yet), avoid crashing the UI
      if (error.code === 'PGRST205' || /Could not find the table/i.test(error.message || '')) {
        console.error('[grades/list] table missing', {
          status,
          code: error.code,
          message: error.message,
          userId: user.id,
        })
        return NextResponse.json(
          {
            success: true,
            terms: [],
            warning: 'Grades table not found; returning empty list.',
          },
          { status: 200 }
        )
      }

      // Surface auth-related errors as 401 so the client can refresh the session
      const isAuthError =
        status === 401 ||
        status === 403 ||
        error.code === 'PGRST301' ||
        error.code === '42501' ||
        /JWT|auth|permission|policy|logged in/i.test(error.message || '')
      if (isAuthError) {
        console.error('[grades/list] auth error', {
          status,
          code: error.code,
          message: error.message,
          userId: user.id,
        })
        return NextResponse.json(
          {
            success: false,
            error: 'Unauthorized or expired session',
            details: `${error.code ?? ''} ${error.message}`.trim(),
          },
          { status: 401 }
        )
      }
      console.error('[grades/list] error', {
        status,
        code: error.code,
        message: error.message,
        userId: user.id,
      })
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to load grades',
          details: `${error.code ?? ''} ${error.message}`.trim() || 'unknown_error',
          status,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, terms: data || [] }, { status: 200 })
  } catch (err) {
    console.error('[grades/list] unexpected error', err)
    return NextResponse.json(
      {
        success: false,
        error: 'Unexpected error while loading grades',
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    )
  }
}
