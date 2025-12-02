import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient, getUser } from '@/lib/supabase/client'

const schema = z.object({
  termId: z.string().uuid(),
})

export async function POST(request: NextRequest) {
  const body = await request.json()
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Validation failed', details: parsed.error.issues },
      { status: 400 }
    )
  }

  const { termId } = parsed.data

  try {
    const supabase = await createServerSupabaseClient()
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { data: term, error: loadErr } = await supabase
      .from('term_grades')
      .select('id, child_id, is_deleted')
      .eq('id', termId)
      .eq('is_deleted', false)
      .single()

    if (loadErr || !term) {
      return NextResponse.json({ success: false, error: 'Term not found' }, { status: 404 })
    }

    if (term.child_id !== user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const { error: termErr } = await supabase
      .from('term_grades')
      .update({ is_deleted: true })
      .eq('id', termId)

    if (termErr) {
      return NextResponse.json({ success: false, error: 'Failed to delete term' }, { status: 500 })
    }

    await supabase.from('subject_grades').update({ is_deleted: true }).eq('term_grade_id', termId)

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Delete term error:', error)
    return NextResponse.json(
      { success: false, error: 'Unexpected error while deleting term' },
      { status: 500 }
    )
  }
}
