import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { AccountError, clientIp, throttle } from '@/lib/web-accounts'
import { CUSTOMER_CANCELLABLE, OrderError, samePhone, toPublicOrder, updateWebOrder } from '@/lib/web-orders'

// Public. A customer cancels their own order while it is still pending or confirmed.
export async function POST(req: NextRequest, { params }: { params: Promise<{ ref: string }> }) {
  try {
    throttle(`order-cancel:${clientIp(req)}`, 20, 60_000)
    const { ref } = await params
    const { phone } = (await req.json().catch(() => ({}))) as { phone?: string }
    const order = await db.webOrder.findUnique({ where: { ref } })
    if (!order || !samePhone(order.customerPhone, phone)) return NextResponse.json({ error: 'Order not found.' }, { status: 404 })
    if (!CUSTOMER_CANCELLABLE.some((s) => s === order.status)) {
      return NextResponse.json({ error: `This order has already moved past the cancellation window (it is ${order.status.replace(/_/g, ' ')}). Contact us if you still need changes.` }, { status: 409 })
    }
    const updated = await updateWebOrder(order.id, { status: 'cancelled', note: 'Cancelled at customer request' }, () => ['cancelled'])
    return NextResponse.json(toPublicOrder(updated))
  } catch (e) {
    if (e instanceof AccountError) return NextResponse.json({ error: e.message }, { status: e.status })
    if (e instanceof OrderError) return NextResponse.json({ error: e.message }, { status: e.status })
    console.error('Public cancel error:', e)
    return NextResponse.json({ error: 'Failed to cancel the order.' }, { status: 500 })
  }
}
