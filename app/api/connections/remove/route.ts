import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient, getUser } from '@/lib/supabase/client'

const schema = z.object({
  relationshipId: z.string().uuid(),
})

export async function POST(request: NextRequest) {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Invalid payload', details: parsed.error.issues },
      { status: 400 }
    )
  }

  const supabase = await createServerSupabaseClient()
  const { data: rel, error: relErr } = await supabase
    .from('parent_child_relationships')
    .select('id, parent_id, child_id')
    .eq('id', parsed.data.relationshipId)
    .single()

  if (relErr || !rel) {
    return NextResponse.json(
      { success: false, error: 'Connection not found', details: relErr?.message },
      { status: 404 }
    )
  }

  if (rel.parent_id !== user.id && rel.child_id !== user.id) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  const { error: deleteErr } = await supabase
    .from('parent_child_relationships')
    .delete()
    .eq('id', rel.id)

  if (deleteErr) {
    return NextResponse.json(
      { success: false, error: 'Failed to remove connection', details: deleteErr.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true }, { status: 200 })
}
