import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { AccountError, hashPassword, hashToken, isStrongPassword, PASSWORD_MSG } from '@/lib/web-accounts'
import { respond } from '@/lib/web-account-http'

export const POST = (req: NextRequest) =>
  respond(async () => {
    const { token, password } = (await req.json().catch(() => ({}))) as { token?: string; password?: string }
    const row = token ? await db.webResetToken.findUnique({ where: { tokenHash: hashToken(token) } }) : null
    if (!row || row.usedAt || row.expiresAt < new Date()) throw new AccountError('This reset link is invalid or has expired. Please request a new one.')
    if (!isStrongPassword(password)) throw new AccountError(PASSWORD_MSG, 400, 'password')
    await db.$transaction([
      db.webAccount.update({ where: { id: row.accountId }, data: { passwordHash: await hashPassword(password as string), tokensValidFrom: new Date() } }),
      db.webResetToken.update({ where: { id: row.id }, data: { usedAt: new Date() } }),
    ])
    return NextResponse.json({ ok: true })
  })
