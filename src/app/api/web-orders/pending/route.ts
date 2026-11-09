import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Staff: everything from the website waiting for the shop — new orders, return requests, unread
// messages. Light enough to poll; the app turns it into the sidebar badge and the new-item alert.
export async function GET(req: NextRequest) {
  if (!req.headers.get('x-user-id')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const [orders, returns, messages] = await Promise.all([
    db.webOrder.findMany({
      where: { status: 'pending_confirmation' },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { id: true, ref: true, customerName: true, total: true, fulfilment: true },
    }),
    db.webReturn.findMany({ where: { status: 'requested' }, orderBy: { createdAt: 'desc' }, take: 20, select: { id: true, orderRef: true, reason: true } }),
    db.webMessage.findMany({ where: { status: 'new' }, orderBy: { createdAt: 'desc' }, take: 20, select: { id: true, name: true, subject: true } }),
  ])
  const [orderCount, returnCount, messageCount] = await Promise.all([
    db.webOrder.count({ where: { status: 'pending_confirmation' } }),
    db.webReturn.count({ where: { status: 'requested' } }),
    db.webMessage.count({ where: { status: 'new' } }),
  ])
  return NextResponse.json({
    counts: { orders: orderCount, returns: returnCount, messages: messageCount },
    orders,
    returns,
    messages,
  })
}
