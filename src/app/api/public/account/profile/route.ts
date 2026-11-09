import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { AccountError, isEmail, publicCustomer, requireAccount } from '@/lib/web-accounts'
import { respond } from '@/lib/web-account-http'

export const PUT = (req: NextRequest) =>
  respond(async () => {
    const account = await requireAccount(req)
    const b = (await req.json().catch(() => ({}))) as { name?: string; email?: string; phone?: string }
    const name = String(b.name ?? '').trim().slice(0, 120)
    const email = String(b.email ?? '').trim().toLowerCase()
    if (!name) throw new AccountError('Please enter your name.', 400, 'name')
    if (!isEmail(email)) throw new AccountError('Please enter a valid email address.', 400, 'email')
    const clash = await db.webAccount.findUnique({ where: { email } })
    if (clash && clash.id !== account.id) throw new AccountError('Another account already uses this email.', 409, 'email')
    const updated = await db.webAccount.update({ where: { id: account.id }, data: { name, email, phone: String(b.phone ?? '').trim().slice(0, 40) } })
    return NextResponse.json({ customer: publicCustomer(updated) })
  })
