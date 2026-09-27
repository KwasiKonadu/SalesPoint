import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const VALID_METHODS = ['cash', 'mobile_money', 'card', 'bank_transfer']

function getUserId(req: NextRequest): string | null {
  return req.headers.get('x-user-id')
}

/** paymentStatus is always derived from amountPaid vs totalCost, never chosen directly. */
function derivePaymentStatus(amountPaid: number, totalCost: number): string {
  if (amountPaid <= 0) return 'unpaid'
  if (amountPaid >= totalCost - 0.01) return 'paid'
  return 'partially_paid'
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const supplierId = searchParams.get('supplierId')
    const paymentStatus = searchParams.get('paymentStatus')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')

    const where: Record<string, unknown> = {}

    if (supplierId) where.supplierId = supplierId
    if (paymentStatus) where.paymentStatus = paymentStatus
    if (startDate || endDate) {
      where.dateReceived = {} as Record<string, unknown>
      if (startDate) (where.dateReceived as Record<string, unknown>).gte = new Date(startDate)
      if (endDate) (where.dateReceived as Record<string, unknown>).lte = new Date(endDate)
    }

    const [data, total] = await Promise.all([
      db.restock.findMany({
        where,
        include: {
          supplier: true,
          createdBy: { select: { id: true, name: true, email: true } },
          items: { include: { product: true } },
        },
        orderBy: { dateReceived: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.restock.count({ where }),
    ])

    return NextResponse.json({ data, total, page, pageSize })
  } catch (error) {
    console.error('Error fetching restocks:', error)
    return NextResponse.json({ error: 'Failed to fetch restocks' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = getUserId(req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { supplierId, reference, batchNumber, expiryDate, notes, items, initialPayment } = body

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Restock items are required' }, { status: 400 })
    }

    // Calculate total cost
    let totalCost = 0
    for (const item of items) {
      totalCost += (item.quantity || 0) * (item.costPrice || 0)
    }

    // Optional payment made at the time of restock (e.g. paid the supplier on delivery).
    let initialAmount = 0
    let initialMethod: string | null = null
    if (initialPayment && Number(initialPayment.amount) > 0) {
      initialAmount = Math.round(Number(initialPayment.amount) * 100) / 100
      initialMethod = String(initialPayment.method || '')
      if (!VALID_METHODS.includes(initialMethod)) {
        return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 })
      }
      if (initialAmount - totalCost > 0.01) {
        return NextResponse.json(
          { error: `Payment exceeds the restock total of ${totalCost.toFixed(2)}` },
          { status: 400 },
        )
      }
    }
    const paymentStatus = derivePaymentStatus(initialAmount, totalCost)

    const result = await db.$transaction(async (tx) => {
      // Create restock
      const restock = await tx.restock.create({
        data: {
          supplierId: supplierId || null,
          reference: reference || null,
          batchNumber: batchNumber || null,
          expiryDate: expiryDate ? new Date(expiryDate) : null,
          notes: notes || null,
          paymentStatus,
          totalCost,
          amountPaid: initialAmount,
          createdById: userId,
          items: {
            create: items.map((item: Record<string, unknown>) => ({
              productId: item.productId as string,
              quantity: item.quantity as number,
              costPrice: item.costPrice as number,
              expiryDate: item.expiryDate ? new Date(item.expiryDate as string) : null,
            })),
          },
        },
        include: {
          supplier: true,
          items: { include: { product: true } },
        },
      })

      if (initialAmount > 0 && initialMethod) {
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
          data: {
            restockId: restock.id,
            receiptNumber,
            amount: initialAmount,
            method: initialMethod,
            recordedById: userId,
          },
        })
      }

      // Process each item: increase inventory, create movement
      for (const item of items) {
        const productId = item.productId as string
        const qty = item.quantity as number

        // Upsert inventory
        const inv = await tx.inventory.upsert({
          where: { productId },
          create: { productId, quantity: qty },
          update: { quantity: { increment: qty } },
        })

        // Reset the low-stock baseline to the new running total, so the
        // threshold tracks each top-up (e.g. 19 + 50 -> baseline 69).
        await tx.product.update({
          where: { id: productId },
          data: { targetStock: inv.quantity },
        })

        // Create movement
        await tx.inventoryMovement.create({
          data: {
            inventoryId: inv.id,
            type: 'restock',
            quantity: qty,
            note: `Restock #${restock.id}`,
            referenceId: restock.id,
            productId,
          },
        })
      }

      return restock
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error creating restock:', error)
    return NextResponse.json({ error: 'Failed to create restock' }, { status: 500 })
  }
}
