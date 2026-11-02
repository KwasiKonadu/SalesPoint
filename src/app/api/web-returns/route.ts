import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Staff: return requests from the website, newest first, with the order and customer each belongs to.
export async function GET(req: NextRequest) {
  if (!req.headers.get('x-user-id')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const returns = await db.webReturn.findMany({ orderBy: { createdAt: 'desc' }, take: 300 })
  const orders = await db.webOrder.findMany({
    where: { id: { in: returns.map((r) => r.orderId) } },
    select: { id: true, customerName: true, customerPhone: true, customerEmail: true, total: true, saleId: true },
  })
  const byId = new Map(orders.map((o) => [o.id, o]))
  return NextResponse.json({
    data: returns.map((r) => ({ ...r, order: byId.get(r.orderId) ?? null })),
  })
}
