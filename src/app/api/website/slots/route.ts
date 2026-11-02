import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { SLOT_TYPES } from '@/lib/website'

// The four homepage slots (at most one row per type). Admin only.
export async function GET(req: NextRequest) {
  if (req.headers.get('x-user-role') !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return NextResponse.json({ data: await db.promoSlot.findMany({ where: { type: { in: SLOT_TYPES.map((t) => t.value) } } }) })
}
