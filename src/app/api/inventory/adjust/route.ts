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

    // Read the current quantity, validate, and decrement inside the same
    // transaction — otherwise two concurrent adjustments could each pass the
    // sufficiency check against the same starting quantity and both proceed,
    // taking stock negative.
    const result = await db.$transaction(async (tx) => {
      const inventory = await tx.inventory.findUnique({
        where: { productId },
      })

      if (!inventory) {
        throw new Error('Inventory not found for product')
      }

      if (inventory.quantity < quantity) {
        throw new Error('Insufficient stock for this adjustment')
      }

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
  } catch (error: unknown) {
    console.error('Error adjusting inventory:', error)
    const message = error instanceof Error ? error.message : 'Failed to adjust inventory'
    const status = message.includes('Insufficient') || message.includes('not found') ? 400 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
