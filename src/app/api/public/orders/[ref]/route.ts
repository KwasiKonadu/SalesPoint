import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { AccountError, clientIp, throttle } from '@/lib/web-accounts'
import { samePhone, toPublicOrder } from '@/lib/web-orders'

// Public. An order's current state, for the customer who placed it: the reference plus the phone number on it.
export async function GET(req: NextRequest, { params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params
  try {
    throttle(`order-lookup:${clientIp(req)}`, 60, 60_000)
  } catch (e) {
    if (e instanceof AccountError) return NextResponse.json({ error: e.message }, { status: 429 })
    throw e
  }
  const order = await db.webOrder.findUnique({ where: { ref }, include: { items: true } })
  if (!order || !samePhone(order.customerPhone, req.nextUrl.searchParams.get('phone'))) {
    return NextResponse.json({ error: 'Order not found.' }, { status: 404 })
  }
  return NextResponse.json(toPublicOrder(order))
}
