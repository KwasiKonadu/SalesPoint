import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { normalizeStoreDetails, STORE_DETAILS_KEY, validateStoreDetails } from '@/lib/website'

const isAdmin = (req: NextRequest) => req.headers.get('x-user-role') === 'admin'

// Website-only store details (footer copy, hours, socials, contact overrides),
// plus the Business info values they fall back to.
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const rows = await db.businessSetting.findMany({
    where: { key: { in: ['business_name', 'email', 'phone', 'address', STORE_DETAILS_KEY] } },
  })
  const by = Object.fromEntries(rows.map((r) => [r.key, r.value]))
  let parsed: unknown = null
  try { parsed = by[STORE_DETAILS_KEY] ? JSON.parse(by[STORE_DETAILS_KEY]) : null } catch { /* not set up */ }
  return NextResponse.json({
    details: normalizeStoreDetails(parsed),
    business: { name: by.business_name ?? '', email: by.email ?? '', phone: by.phone ?? '', address: by.address ?? '' },
  })
}

export async function PUT(req: NextRequest) {
  try {
    if (!isAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const details = normalizeStoreDetails(await req.json())
    const error = validateStoreDetails(details)
    if (error) return NextResponse.json({ error }, { status: 400 })
    const value = JSON.stringify(details)
    await db.businessSetting.upsert({ where: { key: STORE_DETAILS_KEY }, update: { value }, create: { key: STORE_DETAILS_KEY, value } })
    return NextResponse.json({ details })
  } catch (error) {
    console.error('Error saving store details:', error)
    return NextResponse.json({ error: 'Failed to save store details' }, { status: 500 })
  }
}
