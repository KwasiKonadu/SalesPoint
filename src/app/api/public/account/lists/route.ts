import { NextRequest, NextResponse } from 'next/server'
import { clientIp, requireAccount, throttle } from '@/lib/web-accounts'
import { respond } from '@/lib/web-account-http'
import { listsOf, saveLists } from '@/lib/web-lists'

// The signed-in customer's saved cart and wishlist.
export const GET = (req: NextRequest) =>
  respond(async () => NextResponse.json(listsOf(await requireAccount(req))))

// Replace the saved cart and/or wishlist (send whichever changed).
export const PUT = (req: NextRequest) =>
  respond(async () => {
    const account = await requireAccount(req)
    throttle(`lists:${clientIp(req)}`, 120, 60_000)
    const body = await req.json().catch(() => ({}))
    return NextResponse.json(await saveLists(account.id, body))
  })
