import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { AccountError, hashPassword, isStrongPassword, issueToken, requireAccount, verifyPassword } from '@/lib/web-accounts'
import { respond } from '@/lib/web-account-http'

// Changing the password signs every other device out and hands this one a fresh token.
export const PUT = (req: NextRequest) =>
  respond(async () => {
    const account = await requireAccount(req)
    const b = (await req.json().catch(() => ({}))) as { current?: string; next?: string }
    if (!(await verifyPassword(String(b.current ?? ''), account.passwordHash))) throw new AccountError('Your current password is incorrect.', 400, 'current')
    if (!isStrongPassword(b.next)) throw new AccountError('New password needs 8+ characters with a letter and a number.', 400, 'next')
    if (b.next === b.current) throw new AccountError('New password must differ from the current one.', 400, 'next')
    const now = new Date()
    await db.webAccount.update({ where: { id: account.id }, data: { passwordHash: await hashPassword(b.next as string), tokensValidFrom: now } })
    // A token issued in the same millisecond as tokensValidFrom must still be valid, so issue one just after.
    await new Promise((r) => setTimeout(r, 5))
    return NextResponse.json({ token: issueToken(account.id) })
  })
