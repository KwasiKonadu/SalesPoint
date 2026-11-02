import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { AccountError, hashPassword, isEmail, isStrongPassword, issueToken, PASSWORD_MSG, publicCustomer, throttle, clientIp } from '@/lib/web-accounts'
import { respond } from '@/lib/web-account-http'

export const POST = (req: NextRequest) =>
  respond(async () => {
    throttle(`register:${clientIp(req)}`, 10, 60 * 60_000)
    const b = (await req.json().catch(() => ({}))) as { name?: string; email?: string; password?: string; phone?: string }
    const name = String(b.name ?? '').trim().slice(0, 120)
    const email = String(b.email ?? '').trim().toLowerCase()
    if (!name) throw new AccountError('Please enter your name.', 400, 'name')
    if (!isEmail(email)) throw new AccountError('Please enter a valid email address.', 400, 'email')
    if (!isStrongPassword(b.password)) throw new AccountError(PASSWORD_MSG, 400, 'password')
    if (await db.webAccount.findUnique({ where: { email } })) throw new AccountError('An account with this email already exists.', 409, 'email')
    const account = await db.webAccount.create({
      data: { email, name, phone: String(b.phone ?? '').trim().slice(0, 40), passwordHash: await hashPassword(b.password as string) },
    })
    return NextResponse.json({ token: issueToken(account.id), customer: publicCustomer(account) }, { status: 201 })
  })
