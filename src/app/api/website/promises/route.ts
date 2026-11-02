import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { PROMISES_KEY } from '@/lib/public-catalog'
import { normalizePromises, validatePromises } from '@/lib/website'

const isAdmin = (req: NextRequest) => req.headers.get('x-user-role') === 'admin'

// Delivery / free-delivery / returns / pickup promises shown on the website.
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const row = await db.businessSetting.findUnique({ where: { key: PROMISES_KEY } })
  let parsed: unknown = null
  try { parsed = row ? JSON.parse(row.value) : null } catch { /* treated as not set up */ }
  return NextResponse.json({ configured: !!row, promises: normalizePromises(parsed) })
}

export async function PUT(req: NextRequest) {
  try {
    if (!isAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const promises = normalizePromises(await req.json())
    const error = validatePromises(promises)
    if (error) return NextResponse.json({ error }, { status: 400 })
    const value = JSON.stringify(promises)
    await db.businessSetting.upsert({ where: { key: PROMISES_KEY }, update: { value }, create: { key: PROMISES_KEY, value } })
    return NextResponse.json({ configured: true, promises })
  } catch (error) {
    console.error('Error saving promises:', error)
    return NextResponse.json({ error: 'Failed to save promises' }, { status: 500 })
  }
}
