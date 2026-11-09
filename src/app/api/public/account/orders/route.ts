import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAccount } from '@/lib/web-accounts'
import { respond } from '@/lib/web-account-http'
import { toPublicOrder } from '@/lib/web-orders'
import { toPublicReturn } from '@/lib/web-returns'

// The signed-in customer's orders (and their return requests), newest first. The website polls this to keep statuses fresh.
export const GET = (req: NextRequest) =>
  respond(async () => {
    const account = await requireAccount(req)
    const orders = await db.webOrder.findMany({ where: { accountId: account.id }, include: { items: true }, orderBy: { createdAt: 'desc' }, take: 200 })
    const returns = await db.webReturn.findMany({ where: { accountId: account.id }, orderBy: { createdAt: 'desc' } })
    return NextResponse.json({
      orders: orders.map((o) => ({ ...toPublicOrder(o), customerId: account.id })),
      returns: returns.map((r) => toPublicReturn(r, account.id)),
    })
  })
