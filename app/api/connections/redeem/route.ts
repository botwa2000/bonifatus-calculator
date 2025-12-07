import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getUserProfile } from '@/lib/supabase/client'
import { createServiceSupabaseClient } from '@/lib/supabase/service'

const schema = z.object({
  code: z.string().regex(/^[0-9]{6}$/),
})

export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).slice(2, 8)

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error(`[redeem:${requestId}] Service role key is not configured`)
    return NextResponse.json(
      { success: false, error: 'Server misconfiguration: service key missing', debug: requestId },
      { status: 500 }
    )
  }

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
    console.warn(`[redeem:${requestId}] Invalid code payload`, body)
    return NextResponse.json(
      { success: false, error: 'Invalid code', details: parsed.error.issues, debug: requestId },
      { status: 400 }
    )
  }

  try {
    console.info(`[redeem:${requestId}] Child ${profile.id} redeeming code ${parsed.data.code}`)
    // Use service role to avoid RLS blocking child lookups by code
    let supabase
    try {
      supabase = await createServiceSupabaseClient()
    } catch (err) {
      console.error(`[redeem:${requestId}] Failed to init service client`, err)
      return NextResponse.json(
        {
          success: false,
          error: 'Service unavailable. Please try again shortly.',
          details: err instanceof Error ? err.message : String(err),
          debug: requestId,
        },
        { status: 500 }
      )
    }

    const { data: invite, error: inviteErr } = await supabase
      .from('parent_child_invites')
      .select('id, parent_id, status, expires_at')
      .eq('code', parsed.data.code)
      .eq('status', 'pending')
      .single()

    if (inviteErr || !invite) {
      if (inviteErr?.code === '42P01') {
        console.error(
          `[redeem:${requestId}] parent_child_invites table missing. Run migrations.`,
          inviteErr
        )
        return NextResponse.json(
          {
            success: false,
            error: 'Service unavailable. Please try again shortly.',
            debug: requestId,
          },
          { status: 500 }
        )
      }
      console.warn(`[redeem:${requestId}] Invite not found or already used`, inviteErr)
      return NextResponse.json(
        {
          success: false,
          error: 'Invite not found or already used',
          details: inviteErr?.message,
          debug: requestId,
        },
        { status: 404 }
      )
    }

    console.info(
      `[redeem:${requestId}] Invite ${invite.id} status=${invite.status} expires=${invite.expires_at}`
    )

    if (new Date(invite.expires_at).getTime() < Date.now()) {
      await supabase.from('parent_child_invites').update({ status: 'expired' }).eq('id', invite.id)
      console.warn(`[redeem:${requestId}] Invite expired, marked expired`)
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
      console.info(`[redeem:${requestId}] Existing link ${existingLink.id}; promoting to accepted`)
      // Relationship already exists (pending/revoked/accepted) - promote to accepted
      const { error: updateRelErr } = await supabase
        .from('parent_child_relationships')
        .update({
          invitation_status: 'accepted',
          responded_at: new Date().toISOString(),
        })
        .eq('id', existingLink.id)

      if (updateRelErr) {
        console.error(`[redeem:${requestId}] Error updating existing link`, updateRelErr)
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to update existing link',
            details: updateRelErr.message,
            debug: requestId,
          },
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
          console.info(
            `[redeem:${requestId}] Unique constraint hit; using existing link ${link.id}`
          )
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
      console.error(`[redeem:${requestId}] Failed to link accounts`, relErr)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to link accounts',
          details: relErr?.message,
          debug: requestId,
        },
        { status: 500 }
      )
    }

    await supabase
      .from('parent_child_invites')
      .update({ status: 'accepted', child_id: profile.id, accepted_at: new Date().toISOString() })
      .eq('id', invite.id)
    console.info(`[redeem:${requestId}] Linked ${relationship.id} and marked invite accepted`)
    return NextResponse.json({ success: true, relationshipId: relationship.id })
  } catch (error) {
    console.error(`[redeem:${requestId}] Redeem error unexpected`, error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to redeem code',
        details: error instanceof Error ? error.message : 'Unknown error',
        debug: requestId,
      },
      { status: 500 }
    )
  }
}
