import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient, getUserProfile } from '@/lib/supabase/client'

const schema = z.object({
  expiresInMinutes: z
    .number()
    .int()
    .min(1)
    .max(60 * 24 * 7)
    .optional(),
})

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request: NextRequest) {
  const profile = await getUserProfile()
  if (!profile) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }
  if (profile.role !== 'parent') {
    return NextResponse.json({ success: false, error: 'Only parents can invite' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Invalid payload', details: parsed.error.issues },
      { status: 400 }
    )
  }

  // Enforce 15-minute expiry for all invites (ignore longer client requests)
  const expiresInMinutes = Math.min(parsed.data.expiresInMinutes ?? 15, 15)
  const supabase = await createServerSupabaseClient()

  // best-effort uniqueness: retry up to 5 times
  let code = generateCode()
  for (let i = 0; i < 5; i += 1) {
    const { data: existing } = await supabase
      .from('parent_child_invites')
      .select('id')
      .eq('code', code)
      .eq('status', 'pending')
      .maybeSingle()
    if (!existing) break
    code = generateCode()
  }

  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from('parent_child_invites')
    .insert({
      parent_id: profile.id,
      code,
      status: 'pending',
      expires_at: expiresAt,
    })
    .select('id, code, expires_at, status')
    .single()

  if (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to create invite', details: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json(
    {
      success: true,
      invite: data,
    },
    { status: 200 }
  )
}
