import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { clientIp, hashToken, newResetToken, throttle } from '@/lib/web-accounts'
import { respond } from '@/lib/web-account-http'

// Starts a password reset. No email is sent yet (no mail provider is configured), so in development the link
// comes back in the response and is logged; in production it is never returned, so nobody can take over an account.
export const POST = (req: NextRequest) =>
  respond(async () => {
    throttle(`forgot:${clientIp(req)}`, 5, 60 * 60_000)
    const { email } = (await req.json().catch(() => ({}))) as { email?: string }
    const account = await db.webAccount.findUnique({ where: { email: String(email ?? '').trim().toLowerCase() } })
    let devLink: string | null = null
    if (account) {
      const token = newResetToken()
      await db.webResetToken.create({ data: { accountId: account.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 60 * 60_000) } })
      if (process.env.NODE_ENV !== 'production') {
        devLink = `/reset?token=${token}`
        console.log(`[accounts] password reset link for ${account.email}: ${devLink}`)
      }
    }
    return NextResponse.json({ sent: true, devLink })
  })
