import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { accountFromRequest, AccountError, clientIp, isEmail, isPhone, throttle } from '@/lib/web-accounts'
import { respond } from '@/lib/web-account-http'

const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
const SUBJECTS = ['General enquiry', 'Order question', 'Delivery & pickup', 'Returns', 'Wholesale']

// The website's contact form. Lands in SalesPoint under Web orders → Messages.
export const POST = (req: NextRequest) =>
  respond(async () => {
    const ip = clientIp(req)
    throttle(`contact-min:${ip}`, 3, 60_000)
    throttle(`contact-hour:${ip}`, 10, 60 * 60_000)
    const raw = await req.text()
    if (raw.length > 10_000) throw new AccountError('That message is too long.', 413)
    let b: Record<string, unknown>
    try {
      b = JSON.parse(raw)
    } catch {
      throw new AccountError('Invalid request.')
    }
    // Hidden field only bots fill in: pretend it worked.
    if (text(b.company, 100)) return NextResponse.json({ ok: true })

    const name = text(b.name, 120)
    const email = text(b.email, 200)
    const phone = text(b.phone, 40)
    const message = text(b.message, 2000)
    if (!name) throw new AccountError('Please enter your name.', 400, 'name')
    if (!isEmail(email)) throw new AccountError('Please enter a valid email address.', 400, 'email')
    if (phone && !isPhone(phone)) throw new AccountError('Please enter a valid phone number.', 400, 'phone')
    if (message.length < 10) throw new AccountError('Please write a message of at least 10 characters.', 400, 'message')
    const subject = SUBJECTS.includes(text(b.subject, 60)) ? text(b.subject, 60) : 'General enquiry'

    const account = await accountFromRequest(req)
    await db.webMessage.create({ data: { name, email, phone, subject, message, accountId: account?.id ?? null } })
    return NextResponse.json({ ok: true }, { status: 201 })
  })
