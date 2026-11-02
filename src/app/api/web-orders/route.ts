import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ORDER_STATUSES } from '@/lib/web-orders'

// Staff: website orders, newest first, optionally one status.
export async function GET(req: NextRequest) {
  if (!req.headers.get('x-user-id')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const status = req.nextUrl.searchParams.get('status')
  const orders = await db.webOrder.findMany({
    where: status && (ORDER_STATUSES as readonly string[]).includes(status) ? { status } : {},
    include: { items: true },
    orderBy: { createdAt: 'desc' },
    take: 300,
  })
  return NextResponse.json({ data: orders })
}
