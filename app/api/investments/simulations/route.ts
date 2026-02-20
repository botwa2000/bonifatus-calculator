import { NextRequest, NextResponse } from 'next/server'
import { requireAuthApi, getUserProfile } from '@/lib/auth/session'
import { db } from '@/lib/db/client'
import { investmentSimulations } from '@/drizzle/schema/investments'
import { eq, desc } from 'drizzle-orm'

export async function GET() {
  try {
    const user = await requireAuthApi()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await getUserProfile()
    if (!profile) {
      return NextResponse.json({ success: false, error: 'No profile found' }, { status: 404 })
    }

    const simulations = await db
      .select()
      .from(investmentSimulations)
      .where(eq(investmentSimulations.parentId, profile.id))
      .orderBy(desc(investmentSimulations.createdAt))

    return NextResponse.json({ success: true, simulations })
  } catch (error) {
    console.error('[investments/simulations GET] error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load simulations' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuthApi()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await getUserProfile()
    if (!profile) {
      return NextResponse.json({ success: false, error: 'No profile found' }, { status: 404 })
    }

    const body = await request.json()
    const { childId, simulationType, config } = body

    if (!simulationType || typeof simulationType !== 'string') {
      return NextResponse.json(
        { success: false, error: 'simulationType is required' },
        { status: 400 }
      )
    }

    if (!config || typeof config !== 'object') {
      return NextResponse.json(
        { success: false, error: 'config must be a JSON object' },
        { status: 400 }
      )
    }

    const validTypes = ['savings', 'etf']
    if (!validTypes.includes(simulationType)) {
      return NextResponse.json(
        { success: false, error: `simulationType must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    const [simulation] = await db
      .insert(investmentSimulations)
      .values({
        parentId: profile.id,
        childId: childId || null,
        simulationType,
        config,
      })
      .returning()

    return NextResponse.json({ success: true, simulation }, { status: 201 })
  } catch (error) {
    console.error('[investments/simulations POST] error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to save simulation' },
      { status: 500 }
    )
  }
}
