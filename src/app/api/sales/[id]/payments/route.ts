import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const VALID_METHODS = ['cash', 'mobile_money', 'card', 'bank_transfer']

const saleInclude = {
  customer: true,
  soldBy: { select: { id: true, name: true, email: true } },
  items: { include: { product: true } },
  payment: true,
  payments: {
    include: { recordedBy: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' as const },
  },
  receipt: true,
  returns: {
    include: {
      processedBy: { select: { id: true, name: true } },
      items: true,
    },
  },
}

/** Record a payment against a sale (settling the balance on a credit sale). */
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
      // A fast, friendly pre-check — not the source of truth. SQLite doesn't
      // take a write lock until the first write statement in a transaction,
      // so two concurrent payments on the same sale could both read this
      // same "before" state and both pass this check. The guarded UPDATE
      // below is what actually enforces the balance atomically.
      const existing = await tx.sale.findUnique({ where: { id } })
      if (!existing) throw new Error('Sale not found')
      if (existing.status === 'refunded') throw new Error('This sale has been reversed')
      const naiveBalance = Math.round((existing.totalAmount - (existing.amountReceived ?? 0)) * 100) / 100
      if (naiveBalance <= 0) throw new Error('This sale is already fully paid')
      if (amount - naiveBalance > 0.01) {
        throw new Error(`Payment exceeds the outstanding balance of ${naiveBalance.toFixed(2)}`)
      }

      // Re-checks the same invariant as part of the write itself, against
      // whatever the row's current values are at the moment this statement
      // actually runs — so a concurrent payment can't be raced past it.
      const affected = await tx.$executeRaw`
        UPDATE "Sale"
        SET "amountReceived" = COALESCE("amountReceived", 0) + ${amount},
            "paymentStatus" = CASE
              WHEN COALESCE("amountReceived", 0) + ${amount} >= "totalAmount" - 0.01 THEN 'completed'
              ELSE 'partial'
            END
        WHERE "id" = ${id}
          AND "status" != 'refunded'
          AND (COALESCE("amountReceived", 0) + ${amount}) <= "totalAmount" + 0.01
      `
      if (affected === 0) {
        throw new Error(
          'This payment could not be applied — the sale balance changed. Reload and try again.',
        )
      }

      const sale = await tx.sale.findUniqueOrThrow({ where: { id } })

      // Payment-receipt number: PAY-YYYYMMDD-NNNN, sequential per day.
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      const receiptPrefix = `PAY-${dateStr}-`
      const lastReceipt = await tx.salePayment.findFirst({
        where: { receiptNumber: { startsWith: receiptPrefix } },
        orderBy: { receiptNumber: 'desc' },
        select: { receiptNumber: true },
      })
      const nextNum = lastReceipt
        ? parseInt(lastReceipt.receiptNumber.slice(receiptPrefix.length), 10) + 1
        : 1
      const receiptNumber = `${receiptPrefix}${String(nextNum).padStart(4, '0')}`

      await tx.salePayment.create({
        data: { saleId: id, receiptNumber, amount, method, note, recordedById: userId },
      })

      // Keep the one-row payment summary in step with the balance actually
      // written above (not recomputed — avoids drifting from it).
      await tx.payment.updateMany({
        where: { saleId: id },
        data: { amountReceived: sale.amountReceived, status: sale.paymentStatus },
      })

      return tx.sale.findUnique({ where: { id }, include: saleInclude })
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error: unknown) {
    console.error('Error recording payment:', error)
    const message =
      error instanceof Error ? error.message : 'Failed to record payment'
    const status = /not found|already|exceeds|reversed|valid|invalid|could not be applied/i.test(message)
      ? 400
      : 500
    return NextResponse.json({ error: message }, { status })
  }
}
