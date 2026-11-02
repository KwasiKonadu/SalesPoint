import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { publicAddress, publicCustomer, requireAccount } from '@/lib/web-accounts'
import { respond } from '@/lib/web-account-http'
import { toPublicOrder } from '@/lib/web-orders'
import { toPublicReturn } from '@/lib/web-returns'
import { listsOf } from '@/lib/web-lists'

// The signed-in customer, their saved addresses, orders, returns, cart and wishlist — everything the website caches after sign-in.
export const GET = (req: NextRequest) =>
  respond(async () => {
    const account = await requireAccount(req)
    const [addresses, orders, returns] = await Promise.all([
      db.webAddress.findMany({ where: { accountId: account.id }, orderBy: { createdAt: 'asc' } }),
      db.webOrder.findMany({ where: { accountId: account.id }, include: { items: true }, orderBy: { createdAt: 'desc' }, take: 200 }),
      db.webReturn.findMany({ where: { accountId: account.id }, orderBy: { createdAt: 'desc' } }),
    ])
    return NextResponse.json({
      customer: publicCustomer(account),
      addresses: addresses.map(publicAddress),
      orders: orders.map((o) => ({ ...toPublicOrder(o), customerId: account.id })),
      returns: returns.map((r) => toPublicReturn(r, account.id)),
      lists: listsOf(account),
    })
  })
