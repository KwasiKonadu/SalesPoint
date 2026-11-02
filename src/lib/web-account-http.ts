import { NextResponse } from 'next/server'
import { AccountError, isPhone } from '@/lib/web-accounts'

/** Runs a route body and turns known errors into JSON responses (`{ error, field }`). */
export async function respond(fn: () => Promise<NextResponse>): Promise<NextResponse> {
  try {
    return await fn()
  } catch (e) {
    if (e instanceof AccountError) return NextResponse.json({ error: e.message, field: e.field ?? null, issues: e.issues ?? null }, { status: e.status })
    console.error('Account route error:', e)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}

const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

/** Validated address fields from a request body. */
export function addressData(raw: unknown) {
  const b = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const issues: { field: string; message: string }[] = []
  const d = {
    label: text(b.label, 40) || 'Address',
    name: text(b.name, 120),
    phone: text(b.phone, 40),
    line1: text(b.line1, 200),
    line2: text(b.line2, 200),
    city: text(b.city, 100),
    postal: text(b.postal, 20),
    areaId: text(b.areaId, 80),
    isDefault: b.isDefault === true,
  }
  if (!d.name) issues.push({ field: 'name', message: 'Required' })
  if (!d.line1) issues.push({ field: 'line1', message: 'Required' })
  if (!d.city) issues.push({ field: 'city', message: 'Required' })
  if (!isPhone(d.phone)) issues.push({ field: 'phone', message: 'Enter a valid phone number' })
  if (issues.length) throw new AccountError('Please check the highlighted fields.', 400, undefined, issues)
  return d
}
