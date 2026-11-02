import { NextRequest, NextResponse } from 'next/server'
import { accountFromRequest, AccountError, clientIp, throttle } from '@/lib/web-accounts'
import { createWebOrder, OrderError, toPublicOrder, type OrderInput } from '@/lib/web-orders'

// Public. Places a website order; everything that matters is re-checked here.
export async function POST(req: NextRequest) {
  try {
    // Anti-spam: a few orders an hour from one address, and nothing absurdly large.
    const ip = clientIp(req)
    throttle(`order-min:${ip}`, 3, 60_000)
    throttle(`order-hour:${ip}`, 12, 60 * 60_000)
    const raw = await req.text()
    if (raw.length > 50_000) return NextResponse.json({ error: 'That order is too large.' }, { status: 413 })
    const account = await accountFromRequest(req)
    const order = await createWebOrder({ ...(JSON.parse(raw) as OrderInput), accountId: account?.id ?? null })
    return NextResponse.json({ ...toPublicOrder(order), customerId: account?.id ?? null }, { status: 201 })
  } catch (e) {
    if (e instanceof AccountError) return NextResponse.json({ error: e.message, issues: null }, { status: e.status })
    if (e instanceof SyntaxError) return NextResponse.json({ error: 'Invalid order.', issues: null }, { status: 400 })
    if (e instanceof OrderError) return NextResponse.json({ error: e.message, issues: e.issues ?? null }, { status: e.status })
    console.error('Public order error:', e)
    return NextResponse.json({ error: 'We couldn’t place your order. Please try again.' }, { status: 500 })
  }
}
