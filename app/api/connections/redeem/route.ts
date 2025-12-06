import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient, getUserProfile } from '@/lib/supabase/client'

const schema = z.object({
  code: z.string().regex(/^[0-9]{6}$/),
})

export async function POST(request: NextRequest) {
  const profile = await getUserProfile()
  if (!profile) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }
  if (profile.role !== 'child') {
    return NextResponse.json({ success: false, error: 'Only children can redeem' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Invalid code', details: parsed.error.issues },
      { status: 400 }
    )
  }

  const supabase = await createServerSupabaseClient()
  const { data: invite, error: inviteErr } = await supabase
    .from('parent_child_invites')
    .select('id, parent_id, status, expires_at')
    .eq('code', parsed.data.code)
    .eq('status', 'pending')
    .single()

  if (inviteErr || !invite) {
    return NextResponse.json(
      { success: false, error: 'Invite not found or already used' },
      { status: 404 }
    )
  }

  if (new Date(invite.expires_at).getTime() < Date.now()) {
    await supabase.from('parent_child_invites').update({ status: 'expired' }).eq('id', invite.id)
    return NextResponse.json(
      { success: false, error: 'Invite expired. Ask your parent to generate a new code.' },
      { status: 410 }
    )
  }

  // Check if link already exists
  const { data: existingLink } = await supabase
    .from('parent_child_relationships')
    .select('id, invitation_status')
    .eq('parent_id', invite.parent_id)
    .eq('child_id', profile.id)
    .maybeSingle()

  if (existingLink) {
    // Relationship already exists (pending/revoked/accepted) – promote to accepted
    const { error: updateRelErr } = await supabase
      .from('parent_child_relationships')
      .update({
        invitation_status: 'accepted',
        responded_at: new Date().toISOString(),
      })
      .eq('id', existingLink.id)

    if (updateRelErr) {
      return NextResponse.json(
        { success: false, error: 'Failed to update existing link', details: updateRelErr.message },
        { status: 500 }
      )
    }

    await supabase
      .from('parent_child_invites')
      .update({ status: 'accepted', child_id: profile.id, accepted_at: new Date().toISOString() })
      .eq('id', invite.id)

    return NextResponse.json({ success: true, relationshipId: existingLink.id })
  }

  const { data: relationship, error: relErr } = await supabase
    .from('parent_child_relationships')
    .insert({
      parent_id: invite.parent_id,
      child_id: profile.id,
      invited_by: invite.parent_id,
      invitation_status: 'accepted',
      responded_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (relErr || !relationship) {
    // Handle uniqueness constraint (already linked) gracefully
    if (relErr?.code === '23505') {
      const { data: link } = await supabase
        .from('parent_child_relationships')
        .select('id')
        .eq('parent_id', invite.parent_id)
        .eq('child_id', profile.id)
        .maybeSingle()

      if (link) {
        await supabase
          .from('parent_child_invites')
          .update({
            status: 'accepted',
            child_id: profile.id,
            accepted_at: new Date().toISOString(),
          })
          .eq('id', invite.id)
        return NextResponse.json({ success: true, relationshipId: link.id })
      }
    }
    return NextResponse.json(
      { success: false, error: 'Failed to link accounts', details: relErr?.message },
      { status: 500 }
    )
  }

  await supabase
    .from('parent_child_invites')
    .update({ status: 'accepted', child_id: profile.id, accepted_at: new Date().toISOString() })
    .eq('id', invite.id)

  return NextResponse.json({ success: true, relationshipId: relationship.id })
}
