import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, getUser } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createServerSupabaseClient()
    const { searchParams } = new URL(request.url)
    const childIdParam = searchParams.get('childId')
    const childId = childIdParam && childIdParam !== 'null' ? childIdParam : null

    const defaultsPromise = supabase.from('bonus_factor_defaults').select('*').eq('is_active', true)
    const overridesQuery = childId
      ? supabase
          .from('user_bonus_factors')
          .select('*')
          .eq('user_id', user.id)
          .eq('child_id', childId)
      : supabase.from('user_bonus_factors').select('*').eq('user_id', user.id).is('child_id', null)

    const [{ data: defaults, error: defaultsErr }, { data: overrides, error: overridesErr }] =
      await Promise.all([defaultsPromise, overridesQuery])

    const isMissingTable = (err: unknown) =>
      !!err &&
      typeof err === 'object' &&
      'code' in err &&
      ((err as { code?: string }).code === 'PGRST205' ||
        /Could not find the table/i.test((err as { message?: string }).message || ''))

    if (defaultsErr && !isMissingTable(defaultsErr)) {
      return NextResponse.json(
        { success: false, error: 'Failed to load defaults', details: defaultsErr.message },
        { status: 500 }
      )
    }
    if (overridesErr && !isMissingTable(overridesErr)) {
      return NextResponse.json(
        { success: false, error: 'Failed to load overrides', details: overridesErr.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, defaults: defaults || [], overrides: overrides || [] },
      { status: 200 }
    )
  } catch (error) {
    console.error('[grades/factors] unexpected error', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Unexpected error while loading factors',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
