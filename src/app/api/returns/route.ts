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
      // Get the sale with items
      const sale = await tx.sale.findUnique({
        where: { id: saleId },
        include: { items: true, returns: true },
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

      // Calculate refund amount and prepare return items
      const saleItemMap = new Map(sale.items.map((si) => [si.id, si]))
      let refundAmount = 0

      const returnItemsData = items.map((item: Record<string, unknown>) => {
        const saleItem = saleItemMap.get(item.saleItemId as string)
        if (!saleItem) {
          throw new Error(`Sale item ${item.saleItemId} not found`)
        }

        const qty = item.quantity as number
        if (qty > saleItem.quantity) {
          throw new Error(`Return quantity exceeds sold quantity for ${saleItem.productName}`)
        }

        const itemRefund = saleItem.unitPrice * qty
        refundAmount += itemRefund

        return {
          productId: saleItem.productId,
          productName: saleItem.productName,
          quantity: qty,
          unitPrice: saleItem.unitPrice,
          refundAmount: itemRefund,
        }
      })

      // Create return
      const returnRecord = await tx.return.create({
        data: {
          returnNumber,
          saleId,
          customerId: sale.customerId,
          processedById,
          reason,
          refundAmount,
          status: 'completed',
          items: { create: returnItemsData },
        },
        include: {
          items: true,
          processedBy: { select: { id: true, name: true } },
          sale: { include: { customer: true } },
        },
      })

      // Restore inventory and create movements
      for (const item of items) {
        const saleItem = saleItemMap.get(item.saleItemId as string)!
        const qty = item.quantity as number

        const inv = await tx.inventory.findUnique({
          where: { productId: saleItem.productId },
        })

        if (inv) {
          await tx.inventory.update({
            where: { productId: saleItem.productId },
            data: { quantity: { increment: qty } },
          })

          await tx.inventoryMovement.create({
            data: {
              inventoryId: inv.id,
              type: 'return',
              quantity: qty,
              note: `Return ${returnNumber}`,
              referenceId: returnRecord.id,
              productId: saleItem.productId,
            },
          })
        }
      }

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
