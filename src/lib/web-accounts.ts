/**
 * Website customer accounts: passwords, sign-in tokens and the shapes the storefront receives.
 * Passwords are scrypt-hashed with a per-account salt; tokens are signed with WEBSITE_AUTH_SECRET.
 */
import { createHash, createHmac, randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import type { NextRequest } from 'next/server'
import type { WebAccount, WebAddress } from '@prisma/client'
import { db } from '@/lib/db'

export const TOKEN_DAYS = 30
const TOKEN_MS = TOKEN_DAYS * 24 * 60 * 60 * 1000

export class AccountError extends Error {
  constructor(message: string, public status = 400, public field?: string, public issues?: { field: string; message: string }[]) {
    super(message)
  }
}

// ---------- validation (mirrors the storefront's rules) ----------
export const isEmail = (v: unknown) => typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
export const isPhone = (v: unknown) => typeof v === 'string' && /^\+?[\d\s()-]{6,}$/.test(v)
export const isStrongPassword = (v: unknown) => typeof v === 'string' && v.length >= 8 && /[a-zA-Z]/.test(v) && /\d/.test(v)
export const PASSWORD_MSG = 'Password needs at least 8 characters, including a letter and a number.'

// ---------- passwords ----------
const scryptAsync = (pw: string, salt: Buffer) =>
  new Promise<Buffer>((resolve, reject) => scrypt(pw, salt, 64, (err, key) => (err ? reject(err) : resolve(key))))

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16)
  return `scrypt$${salt.toString('hex')}$${(await scryptAsync(password, salt)).toString('hex')}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [kind, saltHex, hashHex] = stored.split('$')
  if (kind !== 'scrypt' || !saltHex || !hashHex) return false
  const expected = Buffer.from(hashHex, 'hex')
  const actual = await scryptAsync(password, Buffer.from(saltHex, 'hex'))
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

// ---------- tokens ----------
const secret = () => {
  const s = process.env.WEBSITE_AUTH_SECRET
  if (!s || s.length < 16) throw new AccountError('Accounts are not set up on the server (WEBSITE_AUTH_SECRET is missing).', 500)
  return s
}
const b64 = (b: Buffer | string) => Buffer.from(b).toString('base64url')
const sign = (body: string) => createHmac('sha256', secret()).update(body).digest('base64url')

export function issueToken(accountId: string): string {
  const body = b64(JSON.stringify({ sub: accountId, iat: Date.now(), exp: Date.now() + TOKEN_MS }))
  return `${body}.${sign(body)}`
}

/** The account behind a bearer token, or null if it is missing, forged, expired or revoked. */
export async function accountFromRequest(req: NextRequest): Promise<WebAccount | null> {
  const header = req.headers.get('authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  const [body, sig] = token.split('.')
  if (!body || !sig) return null
  const expected = sign(body)
  if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null
  let payload: { sub?: string; iat?: number; exp?: number }
  try {
    payload = JSON.parse(Buffer.from(body, 'base64url').toString())
  } catch {
    return null
  }
  if (!payload.sub || !payload.iat || !payload.exp || payload.exp < Date.now()) return null
  const account = await db.webAccount.findUnique({ where: { id: payload.sub } })
  if (!account || payload.iat < account.tokensValidFrom.getTime()) return null
  return account
}

export async function requireAccount(req: NextRequest): Promise<WebAccount> {
  const a = await accountFromRequest(req)
  if (!a) throw new AccountError('Please sign in to continue.', 401)
  return a
}

export const hashToken = (t: string) => createHash('sha256').update(t).digest('hex')
export const newResetToken = () => randomBytes(32).toString('base64url')

// ---------- shapes the storefront receives ----------
export const publicCustomer = (a: WebAccount) => ({
  id: a.id,
  email: a.email,
  name: a.name,
  phone: a.phone,
  createdAt: a.createdAt.getTime(),
})

export const publicAddress = (a: WebAddress) => ({
  id: a.id,
  customerId: a.accountId,
  label: a.label,
  name: a.name,
  phone: a.phone,
  line1: a.line1,
  line2: a.line2,
  city: a.city,
  postal: a.postal,
  areaId: a.areaId,
  isDefault: a.isDefault,
})

// ---------- simple in-memory throttle (per process) ----------
const hits = new Map<string, number[]>()
/** Throws if `key` has been used `max` times in the last `windowMs`. */
export function throttle(key: string, max: number, windowMs: number) {
  const now = Date.now()
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs)
  if (recent.length >= max) throw new AccountError('Too many attempts. Please wait a minute and try again.', 429)
  recent.push(now)
  hits.set(key, recent)
}
export const clearThrottle = (key: string) => hits.delete(key)
export const clientIp = (req: NextRequest) => req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'local'
