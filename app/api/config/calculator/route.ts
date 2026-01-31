import { NextRequest, NextResponse } from 'next/server'
import { getCalculatorConfig } from '@/lib/db/queries/config'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const subjectLimit = Math.min(Math.max(Number(searchParams.get('subjectLimit')) || 200, 1), 500)

    const config = await getCalculatorConfig(subjectLimit)

    return NextResponse.json(
      {
        success: true,
        ...config,
      },
      {
        status: 200,
        headers: {
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
