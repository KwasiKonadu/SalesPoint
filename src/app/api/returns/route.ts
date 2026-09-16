import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

function getUserId(req: NextRequest): string | null {
  return req.headers.get('x-user-id')
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')

    const [data, total] = await Promise.all([
      db.return.findMany({
        include: {
          sale: {
            include: {
              customer: true,
              soldBy: { select: { id: true, name: true } },
            },
          },
          processedBy: { select: { id: true, name: true } },
          items: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.return.count(),
    ])

    return NextResponse.json({ data, total, page, pageSize })
  } catch (error) {
    console.error('Error fetching returns:', error)
    return NextResponse.json({ error: 'Failed to fetch returns' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = getUserId(req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { saleId, processedById, reason, items } = body

    if (!saleId || !processedById || !reason || !items || items.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const result = await db.$transaction(async (tx) => {
      // Get the sale with items, and every quantity already returned per
      // line item (across any earlier, separate return transactions).
      const sale = await tx.sale.findUnique({
        where: { id: saleId },
        include: {
          items: { include: { returnItems: true } },
          returns: true,
        },
      })

      if (!sale) {
        throw new Error('Sale not found')
      }

      // Generate return number
      const today = new Date()
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
      const prefix = `RET-${dateStr}-`
      const lastReturn = await tx.return.findFirst({
        where: { returnNumber: { startsWith: prefix } },
        orderBy: { returnNumber: 'desc' },
        select: { returnNumber: true },
      })
      let nextNum = 1
      if (lastReturn) {
        const lastNumStr = lastReturn.returnNumber.slice(prefix.length)
        nextNum = parseInt(lastNumStr, 10) + 1
      }
      const returnNumber = `${prefix}${String(nextNum).padStart(4, '0')}`

      // Calculate refund amount and prepare return items. This is a fast,
      // friendly pre-check — not the source of truth. The guarded insert
      // below re-checks the same invariant as part of the write itself, so a
      // concurrent return on the same sale item can't be raced past it.
      const saleItemMap = new Map(sale.items.map((si) => [si.id, si]))
      let refundAmount = 0

      const preparedItems = (items as Record<string, unknown>[]).map((item) => {
        const saleItem = saleItemMap.get(item.saleItemId as string)
        if (!saleItem) {
          throw new Error(`Sale item ${item.saleItemId} not found`)
        }

        const qty = item.quantity as number
        if (!Number.isFinite(qty) || qty <= 0) {
          throw new Error(`Invalid return quantity for ${saleItem.productName}`)
        }
        const alreadyReturned = saleItem.returnItems.reduce((sum, ri) => sum + ri.quantity, 0)
        const remaining = saleItem.quantity - alreadyReturned
        if (qty > remaining) {
          throw new Error(
            `Return quantity exceeds remaining returnable quantity for ${saleItem.productName} (${remaining} left)`,
          )
        }

        const itemRefund = saleItem.unitPrice * qty
        refundAmount += itemRefund

        return {
          saleItemId: saleItem.id,
          productId: saleItem.productId,
          productName: saleItem.productName,
          quantity: qty,
          unitPrice: saleItem.unitPrice,
          refundAmount: itemRefund,
        }
      })

      // Create the return header first (its id is the FK target for the
      // guarded item inserts below).
      const returnHeader = await tx.return.create({
        data: {
          returnNumber,
          saleId,
          customerId: sale.customerId,
          processedById,
          reason,
          refundAmount,
          status: 'completed',
        },
      })

      // Guarded insert per item: the remaining-quantity check is evaluated by
      // SQLite as part of this single INSERT statement, against whichever
      // ReturnItem/SaleItem rows exist at the moment it actually runs under
      // the write lock — not against a value read earlier in JS. A row count
      // of 0 means the check failed (either a concurrent return already used
      // up the remaining quantity, or the sale item vanished).
      for (const p of preparedItems) {
        const inserted = await tx.$executeRaw`
          INSERT INTO "ReturnItem" ("id", "returnId", "saleItemId", "productId", "productName", "quantity", "unitPrice", "refundAmount")
          SELECT ${crypto.randomUUID()}, ${returnHeader.id}, ${p.saleItemId}, ${p.productId}, ${p.productName}, ${p.quantity}, ${p.unitPrice}, ${p.refundAmount}
          WHERE (
            SELECT COALESCE(SUM("quantity"), 0) FROM "ReturnItem" WHERE "saleItemId" = ${p.saleItemId}
          ) + ${p.quantity} <= (
            SELECT "quantity" FROM "SaleItem" WHERE "id" = ${p.saleItemId}
          )
        `
        if (inserted === 0) {
          throw new Error(
            `Return quantity exceeds remaining returnable quantity for ${p.productName} — reload and try again.`,
          )
        }

        // Restore inventory and log the movement for this item.
        const inv = await tx.inventory.findUnique({ where: { productId: p.productId } })
        if (inv) {
          await tx.inventory.update({
            where: { productId: p.productId },
            data: { quantity: { increment: p.quantity } },
          })

          await tx.inventoryMovement.create({
            data: {
              inventoryId: inv.id,
              type: 'return',
              quantity: p.quantity,
              note: `Return ${returnNumber}`,
              referenceId: returnHeader.id,
              productId: p.productId,
            },
          })
        }
      }

      const returnRecord = await tx.return.findUniqueOrThrow({
        where: { id: returnHeader.id },
        include: {
          items: true,
          processedBy: { select: { id: true, name: true } },
          sale: { include: { customer: true } },
        },
      })

      // Update sale status
      const totalReturned = sale.returns.reduce((sum, r) => sum + r.refundAmount, 0) + refundAmount
      let newStatus = 'partial_refund'
      if (totalReturned >= sale.totalAmount) {
        newStatus = 'refunded'
      }

      await tx.sale.update({
        where: { id: saleId },
        data: { status: newStatus },
      })

      return returnRecord
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error: unknown) {
    console.error('Error creating return:', error)
    const message = error instanceof Error ? error.message : 'Failed to create return'
    const status = message.includes('not found') || message.includes('exceeds') ? 400 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
