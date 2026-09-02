import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

function getUserId(req: NextRequest): string | null {
  return req.headers.get('x-user-id')
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
    const { supplierId, reference, batchNumber, expiryDate, notes, paymentStatus, items } = body

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Restock items are required' }, { status: 400 })
    }

    // Calculate total cost
    let totalCost = 0
    for (const item of items) {
      totalCost += (item.quantity || 0) * (item.costPrice || 0)
    }

    const result = await db.$transaction(async (tx) => {
      // Create restock
      const restock = await tx.restock.create({
        data: {
          supplierId: supplierId || null,
          reference: reference || null,
          batchNumber: batchNumber || null,
          expiryDate: expiryDate ? new Date(expiryDate) : null,
          notes: notes || null,
          paymentStatus: paymentStatus || 'unpaid',
          totalCost,
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
