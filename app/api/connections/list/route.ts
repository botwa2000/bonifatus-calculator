import { NextResponse } from 'next/server'
import { createServerSupabaseClient, getUser, getUserProfile } from '@/lib/supabase/client'

export async function GET() {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createServerSupabaseClient()

  // Determine role to know whether to return invites
  const profile = await getUserProfile()

  // Expire any pending invites that are past their expiration
  if (profile?.role === 'parent') {
    const nowIso = new Date().toISOString()
    const maxLifetimeMs = 16 * 60 * 1000 // expire anything older than 16 minutes even if expiry was longer
    const cutoffIso = new Date(Date.now() - maxLifetimeMs).toISOString()

    await supabase
      .from('parent_child_invites')
      .update({ status: 'expired' })
      .eq('parent_id', user.id)
      .eq('status', 'pending')
      .or(`expires_at.lt.${nowIso},created_at.lt.${cutoffIso}`)
  }

  const { data: relationships, error: relError } = await supabase
    .from('parent_child_relationships')
    .select(
      `
      id,
      parent_id,
      child_id,
      invitation_status,
      invited_at,
      responded_at,
      parent:parent_id (
        id,
        full_name,
        role
      ),
      child:child_id (
        id,
        full_name,
        role
      )
    `
    )
    .or(`parent_id.eq.${user.id},child_id.eq.${user.id}`)

  if (relError) {
    return NextResponse.json(
      { success: false, error: 'Failed to load connections', details: relError.message },
      { status: 500 }
    )
  }

  let invites: unknown[] = []
  if (profile?.role === 'parent') {
    const nowIso = new Date().toISOString()
    const cutoffIso = new Date(Date.now() - 16 * 60 * 1000).toISOString()
    const { data: inviteRows, error: inviteErr } = await supabase
      .from('parent_child_invites')
      .select('id, code, status, expires_at, created_at, child_id')
      .eq('parent_id', user.id)
      .eq('status', 'pending')
      .gt('expires_at', nowIso)
      .gt('created_at', cutoffIso)
      .order('expires_at', { ascending: false })

    if (inviteErr) {
      return NextResponse.json(
        { success: false, error: 'Failed to load invites', details: inviteErr.message },
        { status: 500 }
      )
    }
    invites = inviteRows || []
  }

  const asParent = (relationships || []).filter((r) => r.parent_id === user.id)
  const asChild = (relationships || []).filter((r) => r.child_id === user.id)

  return NextResponse.json(
    {
      success: true,
      asParent,
      asChild,
      invites,
    },
    { status: 200 }
  )
}
