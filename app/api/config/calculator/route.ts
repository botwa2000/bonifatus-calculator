/**
 * Calculator Config API
 * Provides grading systems, bonus factor defaults, and a small subject list for the demo calculator.
 * Data is sourced from the database (no hard-coded grading systems or multipliers).
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    const { searchParams } = new URL(request.url)
    const subjectLimit = Math.min(Math.max(Number(searchParams.get('subjectLimit')) || 200, 1), 500)

    const [gradingSystems, factorDefaults, subjects, categories] = await Promise.all([
      supabase
        .from('grading_systems')
        .select(
          `
          id,
          code,
          name,
          description,
          country_code,
          scale_type,
          min_value,
          max_value,
          best_is_highest,
          passing_threshold,
          grade_definitions,
          display_order
        `
        )
        .eq('is_active', true)
        .order('display_order', { ascending: true }),
      supabase
        .from('bonus_factor_defaults')
        .select('factor_type, factor_key, factor_value, description')
        .eq('is_active', true),
      supabase
        .from('subjects')
        .select('id, name, description, category_id, is_core_subject')
        .eq('is_active', true)
        .eq('is_custom', false)
        .order('name', { ascending: true })
        .order('display_order', { ascending: true })
        .limit(subjectLimit),
      supabase
        .from('subject_categories')
        .select('id, name, description')
        .eq('is_active', true)
        .order('display_order', { ascending: true }),
    ])

    const errors = [
      gradingSystems.error,
      factorDefaults.error,
      subjects.error,
      categories.error,
    ].filter(Boolean)
    if (errors.length) {
      console.error('Calculator config fetch errors:', errors)
      return NextResponse.json(
        { success: false, error: 'Failed to load calculator configuration' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        gradingSystems: gradingSystems.data ?? [],
        bonusFactorDefaults: factorDefaults.data ?? [],
        subjects: subjects.data ?? [],
        categories: categories.data ?? [],
      },
      {
        status: 200,
        headers: {
          // Allow short-term caching to reduce load; adjust as needed
          'Cache-Control': 'public, max-age=60',
        },
      }
    )
  } catch (error) {
    console.error('Calculator config error:', error)
    return NextResponse.json(
      { success: false, error: 'Unexpected error loading calculator configuration' },
      { status: 500 }
    )
  }
}
