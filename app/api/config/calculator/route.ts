import { NextRequest, NextResponse } from 'next/server'
import { getCalculatorConfig, getEffectiveBonusFactors } from '@/lib/db/queries/config'
import { requireAuthApi } from '@/lib/auth/session'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const subjectLimit = Math.min(Math.max(Number(searchParams.get('subjectLimit')) || 200, 1), 500)

    const config = await getCalculatorConfig(subjectLimit)

    // Embed per-user effective grade_tier factors so mobile local preview
    // reflects the parent's custom multipliers, not just global defaults.
    let bonusFactorOverrides: { factorType: string; factorKey: string; factorValue: number }[] = []
    const user = await requireAuthApi()
    if (user?.id) {
      const { overrides } = await getEffectiveBonusFactors(user.id, null)
      bonusFactorOverrides = overrides
        .filter((o) => o.factorType === 'grade_tier')
        .map((o) => ({
          factorType: o.factorType,
          factorKey: o.factorKey,
          factorValue: Number(o.factorValue),
        }))
    }

    return NextResponse.json(
      {
        success: true,
        ...config,
        bonusFactorOverrides,
      },
      {
        status: 200,
        headers: {
          // private: each user gets their own factors; shared CDN cache would serve wrong values
          'Cache-Control': 'private, max-age=30',
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
