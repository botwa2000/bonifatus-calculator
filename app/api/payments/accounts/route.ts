import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db/client'
import { paymentAccounts } from '@/drizzle/schema/payments'
import { requireAuthApi } from '@/lib/auth/session'
import { eq, and, desc } from 'drizzle-orm'

const createSchema = z.object({
  accountType: z.string().min(1).max(50),
  accountDetails: z.record(z.string(), z.unknown()),
  label: z.string().max(100).optional(),
  isDefault: z.boolean().optional(),
})

const deleteSchema = z.object({
  accountId: z.string().min(1),
})

export async function GET() {
  try {
    const user = await requireAuthApi()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const accounts = await db
      .select()
      .from(paymentAccounts)
      .where(eq(paymentAccounts.userId, user.id))
      .orderBy(desc(paymentAccounts.createdAt))

    return NextResponse.json({ success: true, accounts })
  } catch (error) {
    console.error('[payments/accounts] GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load payment accounts' },
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

    const body = await request.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.issues },
        { status: 400 }
      )
    }

    const { accountType, accountDetails, label, isDefault } = parsed.data

    await db.transaction(async (tx) => {
      // If this account should be the default, unset default on all other accounts first
      if (isDefault) {
        const existing = await tx
          .select({ id: paymentAccounts.id })
          .from(paymentAccounts)
          .where(and(eq(paymentAccounts.userId, user.id), eq(paymentAccounts.isDefault, true)))

        for (const acc of existing) {
          await tx
            .update(paymentAccounts)
            .set({ isDefault: false })
            .where(eq(paymentAccounts.id, acc.id))
        }
      }

      await tx.insert(paymentAccounts).values({
        userId: user.id,
        accountType,
        accountDetails,
        label: label || null,
        isDefault: isDefault ?? false,
      })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[payments/accounts] POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create payment account' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuthApi()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = deleteSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.issues },
        { status: 400 }
      )
    }

    const { accountId } = parsed.data

    // Verify ownership before deleting
    const [account] = await db
      .select()
      .from(paymentAccounts)
      .where(and(eq(paymentAccounts.id, accountId), eq(paymentAccounts.userId, user.id)))
      .limit(1)

    if (!account) {
      return NextResponse.json(
        { success: false, error: 'Account not found or not owned by you' },
        { status: 404 }
      )
    }

    await db.delete(paymentAccounts).where(eq(paymentAccounts.id, accountId))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[payments/accounts] DELETE error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete payment account' },
      { status: 500 }
    )
  }
}
