import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

function getUserId(req: NextRequest): string | null {
  return req.headers.get('x-user-id')
}

export async function POST(req: NextRequest) {
  try {
    const userId = getUserId(req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { productId, quantity, type, note } = body

    if (!productId || quantity === undefined || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const validTypes = ['damaged', 'expired', 'lost', 'adjustment']
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid adjustment type' }, { status: 400 })
    }

    // Get inventory
    const inventory = await db.inventory.findUnique({
      where: { productId },
    })

    if (!inventory) {
      return NextResponse.json({ error: 'Inventory not found for product' }, { status: 404 })
    }

    if (inventory.quantity < quantity) {
      return NextResponse.json(
        { error: 'Insufficient stock for this adjustment' },
        { status: 400 }
      )
    }

    // Deduct from inventory and create movement in transaction
    const result = await db.$transaction(async (tx) => {
      const updated = await tx.inventory.update({
        where: { productId },
        data: { quantity: { decrement: quantity } },
        include: { product: true },
      })

      await tx.inventoryMovement.create({
        data: {
          inventoryId: updated.id,
          type,
          quantity,
          note: note || null,
          productId,
        },
      })

      return updated
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error adjusting inventory:', error)
    return NextResponse.json({ error: 'Failed to adjust inventory' }, { status: 500 })
  }
}
