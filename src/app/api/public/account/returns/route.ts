import { NextRequest, NextResponse } from 'next/server'
import { clientIp, requireAccount, throttle } from '@/lib/web-accounts'
import { respond } from '@/lib/web-account-http'
import { createReturn, toPublicReturn } from '@/lib/web-returns'

// A signed-in customer asks to return items from a completed order.
export const POST = (req: NextRequest) =>
  respond(async () => {
    const account = await requireAccount(req)
    throttle(`return:${clientIp(req)}`, 10, 60 * 60_000)
    const body = await req.json().catch(() => ({}))
    const created = await createReturn(account.id, body)
    return NextResponse.json(toPublicReturn(created, account.id), { status: 201 })
  })
