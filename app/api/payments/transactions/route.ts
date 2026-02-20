import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db/client'
import { paymentTransactions } from '@/drizzle/schema/payments'
import { userProfiles } from '@/drizzle/schema/users'
import { requireAuthApi, getUserProfile } from '@/lib/auth/session'
import { eq, and, desc, or } from 'drizzle-orm'

const createSchema = z.object({
  childId: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().min(1).max(10),
  method: z.string().min(1).max(50),
  settlementId: z.string().optional(),
  notes: z.string().max(500).optional(),
})

const updateSchema = z.object({
  transactionId: z.string().min(1),
  status: z.enum(['pending', 'completed', 'failed', 'cancelled']),
})

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuthApi()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status')

    // Fetch transactions where the user is either the parent or the child
    const baseCondition = or(
      eq(paymentTransactions.parentId, user.id),
      eq(paymentTransactions.childId, user.id)
    )!

    const whereCondition =
      statusFilter && statusFilter !== 'all'
        ? and(baseCondition, eq(paymentTransactions.status, statusFilter))
        : baseCondition

    const transactions = await db
      .select({
        id: paymentTransactions.id,
        parentId: paymentTransactions.parentId,
        childId: paymentTransactions.childId,
        settlementId: paymentTransactions.settlementId,
        amount: paymentTransactions.amount,
        currency: paymentTransactions.currency,
        method: paymentTransactions.method,
        status: paymentTransactions.status,
        providerReference: paymentTransactions.providerReference,
        notes: paymentTransactions.notes,
        createdAt: paymentTransactions.createdAt,
        completedAt: paymentTransactions.completedAt,
        childName: userProfiles.fullName,
      })
      .from(paymentTransactions)
      .leftJoin(userProfiles, eq(paymentTransactions.childId, userProfiles.id))
      .where(whereCondition)
      .orderBy(desc(paymentTransactions.createdAt))

    return NextResponse.json({ success: true, transactions })
  } catch (error) {
    console.error('[payments/transactions] GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load transactions' },
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
    if (!profile || profile.role !== 'parent') {
      return NextResponse.json(
        { success: false, error: 'Only parents can create transactions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.issues },
        { status: 400 }
      )
    }

    const { childId, amount, currency, method, settlementId, notes } = parsed.data

    const [transaction] = await db
      .insert(paymentTransactions)
      .values({
        parentId: user.id,
        childId,
        amount,
        currency,
        method,
        settlementId: settlementId || null,
        notes: notes || null,
        status: 'pending',
      })
      .returning()

    return NextResponse.json({ success: true, transaction })
  } catch (error) {
    console.error('[payments/transactions] POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create transaction' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuthApi()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await getUserProfile()
    if (!profile || profile.role !== 'parent') {
      return NextResponse.json(
        { success: false, error: 'Only parents can update transaction status' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.issues },
        { status: 400 }
      )
    }

    const { transactionId, status } = parsed.data

    // Verify the parent owns this transaction
    const [existing] = await db
      .select()
      .from(paymentTransactions)
      .where(
        and(eq(paymentTransactions.id, transactionId), eq(paymentTransactions.parentId, user.id))
      )
      .limit(1)

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found or not owned by you' },
        { status: 404 }
      )
    }

    const updateData: { status: string; completedAt?: Date } = { status }
    if (status === 'completed') {
      updateData.completedAt = new Date()
    }

    const [updated] = await db
      .update(paymentTransactions)
      .set(updateData)
      .where(eq(paymentTransactions.id, transactionId))
      .returning()

    return NextResponse.json({ success: true, transaction: updated })
  } catch (error) {
    console.error('[payments/transactions] PATCH error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update transaction' },
      { status: 500 }
    )
  }
}
