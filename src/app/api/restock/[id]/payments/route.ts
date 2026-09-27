import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const VALID_METHODS = ['cash', 'mobile_money', 'card', 'bank_transfer']

const restockInclude = {
  supplier: true,
  createdBy: { select: { id: true, name: true, email: true } },
  items: { include: { product: true } },
  payments: {
    include: { recordedBy: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' as const },
  },
}

/** Record a payment against a restock (settling the balance owed to a supplier). */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = req.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const amount = Math.round(Number(body.amount) * 100) / 100
    const method = String(body.method || '')
    const note = body.note ? String(body.note).trim() || null : null

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Enter a valid payment amount' }, { status: 400 })
    }
    if (!VALID_METHODS.includes(method)) {
      return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 })
    }

    const result = await db.$transaction(async (tx) => {
      // A fast, friendly pre-check — not the source of truth. The guarded
      // UPDATE below is what actually enforces the balance atomically.
      const existing = await tx.restock.findUnique({ where: { id } })
      if (!existing) throw new Error('Restock not found')
      const naiveBalance = Math.round((existing.totalCost - existing.amountPaid) * 100) / 100
      if (naiveBalance <= 0) throw new Error('This restock is already fully paid')
      if (amount - naiveBalance > 0.01) {
        throw new Error(`Payment exceeds the outstanding balance of ${naiveBalance.toFixed(2)}`)
      }

      // Re-checks the same invariant against whatever the row's current
      // values are at the moment this statement runs, so a concurrent
      // payment can't be raced past it.
      const affected = await tx.$executeRaw`
        UPDATE "Restock"
        SET "amountPaid" = "amountPaid" + ${amount},
            "paymentStatus" = CASE
              WHEN "amountPaid" + ${amount} >= "totalCost" - 0.01 THEN 'paid'
              ELSE 'partially_paid'
            END
        WHERE "id" = ${id}
          AND ("amountPaid" + ${amount}) <= "totalCost" + 0.01
      `
      if (affected === 0) {
        throw new Error(
          'This payment could not be applied — the restock balance changed. Reload and try again.',
        )
      }

      // Payment-receipt number: RPAY-YYYYMMDD-NNNN, sequential per day.
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      const receiptPrefix = `RPAY-${dateStr}-`
      const lastReceipt = await tx.restockPayment.findFirst({
        where: { receiptNumber: { startsWith: receiptPrefix } },
        orderBy: { receiptNumber: 'desc' },
        select: { receiptNumber: true },
      })
      const nextNum = lastReceipt
        ? parseInt(lastReceipt.receiptNumber.slice(receiptPrefix.length), 10) + 1
        : 1
      const receiptNumber = `${receiptPrefix}${String(nextNum).padStart(4, '0')}`

      await tx.restockPayment.create({
        data: { restockId: id, receiptNumber, amount, method, note, recordedById: userId },
      })

      return tx.restock.findUnique({ where: { id }, include: restockInclude })
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error: unknown) {
    console.error('Error recording restock payment:', error)
    const message = error instanceof Error ? error.message : 'Failed to record payment'
    const status = /not found|already|exceeds|valid|invalid|could not be applied/i.test(message)
      ? 400
      : 500
    return NextResponse.json({ error: message }, { status })
  }
}
