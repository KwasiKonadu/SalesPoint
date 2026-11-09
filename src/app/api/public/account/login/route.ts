import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { AccountError, clearThrottle, clientIp, hashPassword, issueToken, publicCustomer, throttle, verifyPassword } from '@/lib/web-accounts'
import { respond } from '@/lib/web-account-http'

export const POST = (req: NextRequest) =>
  respond(async () => {
    const b = (await req.json().catch(() => ({}))) as { email?: string; password?: string }
    const email = String(b.email ?? '').trim().toLowerCase()
    const key = `login:${email}:${clientIp(req)}`
    throttle(key, 5, 60_000)
    const account = await db.webAccount.findUnique({ where: { email } })
    // Do the same work whether or not the email exists, so timing doesn't reveal which emails have accounts.
    const ok = account ? await verifyPassword(String(b.password ?? ''), account.passwordHash) : (await hashPassword('x'), false)
    if (!account || !ok) throw new AccountError('Email or password is incorrect.', 401)
    clearThrottle(key)
    return NextResponse.json({ token: issueToken(account.id), customer: publicCustomer(account) })
  })
