import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateDiscount } from '@/lib/pricing'

// Set or clear the scheduled discount on a product. The base sellingPrice is
// never touched — the discount only applies between its start and end dates.
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!req.headers.get('x-user-id')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { id } = await params
    const product = await db.product.findUnique({ where: { id } })
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const body = await req.json()

    // `{ clear: true }` removes the discount.
    if (body.clear) {
      const cleared = await db.product.update({
        where: { id },
        data: { discountType: null, discountValue: null, discountStart: null, discountEnd: null, discountChannel: 'both' },
      })
      return NextResponse.json(cleared)
    }

    const input = {
      type: String(body.type ?? ''),
      value: Number(body.value),
      start: String(body.start ?? ''),
      end: String(body.end ?? ''),
      channel: String(body.channel ?? 'both'),
    }
    const error = validateDiscount(input, product.sellingPrice)
    if (error) return NextResponse.json({ error }, { status: 400 })

    const updated = await db.product.update({
      where: { id },
      data: {
        discountType: input.type,
        discountValue: input.value,
        discountStart: new Date(input.start),
        discountEnd: new Date(input.end),
        discountChannel: input.channel,
      },
    })
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error saving discount:', error)
    return NextResponse.json({ error: 'Failed to save discount' }, { status: 500 })
  }
}
