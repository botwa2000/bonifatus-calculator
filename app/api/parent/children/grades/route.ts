import { NextResponse } from 'next/server'
import { requireAuthApi, getUserProfile } from '@/lib/auth/session'
import { getAcceptedChildren } from '@/lib/db/queries/relationships'
import { getChildrenGrades } from '@/lib/db/queries/grades'

export async function GET() {
  const user = await requireAuthApi()
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const profile = await getUserProfile()
  if (!profile || profile.role !== 'parent') {
    return NextResponse.json(
      { success: false, error: 'Only parents can view this data' },
      { status: 403 }
    )
  }

  try {
    const { relationships, profiles } = await getAcceptedChildren(profile.id)

    const childIds = profiles.map((p) => p.id)
    if (childIds.length === 0) {
      return NextResponse.json({ success: true, children: [] }, { status: 200 })
    }

    const terms = await getChildrenGrades(childIds)

    const profileMap = Object.fromEntries(profiles.map((p) => [p.id, p]))
    const termsByChild = terms.reduce<Record<string, typeof terms>>((acc, term) => {
      const cid = term.childId
      if (!acc[cid]) acc[cid] = []
      acc[cid].push(term)
      return acc
    }, {})

    const childrenWithGrades = relationships.map((rel) => ({
      relationshipId: rel.id,
      child: profileMap[rel.childId] || null,
      terms: termsByChild[rel.childId] || [],
    }))

    return NextResponse.json({ success: true, children: childrenWithGrades }, { status: 200 })
  } catch (error) {
    console.error('[parent/children/grades] unexpected error', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load children grades' },
      { status: 500 }
    )
  }
}
