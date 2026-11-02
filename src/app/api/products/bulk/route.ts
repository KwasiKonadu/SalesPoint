import { NextRequest, NextResponse } from 'next/server'
import { BULK_LIMIT, createBulk, prepareBulk } from '@/lib/bulk-products'
import type { RawProductRow } from '@/lib/csv'

// Bulk add products. With `dryRun` it only checks the rows; otherwise it checks
// and, if every row is valid, creates them all. Nothing is created if any row fails.
export async function POST(req: NextRequest) {
  try {
    if (!req.headers.get('x-user-id')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const body = await req.json()
    const rows = body.rows as RawProductRow[]
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'No rows to import' }, { status: 400 })
    }
    if (rows.length > BULK_LIMIT) {
      return NextResponse.json({ error: `Import up to ${BULK_LIMIT} products at a time` }, { status: 400 })
    }

    const { results, prepared } = await prepareBulk(rows)
    const valid = results.every((r) => r.errors.length === 0)

    if (!body.dryRun && valid) await createBulk(prepared)
    return NextResponse.json({ valid, created: !body.dryRun && valid ? prepared.length : 0, results })
  } catch (error) {
    console.error('Error in bulk product import:', error)
    return NextResponse.json({ error: 'Failed to import products' }, { status: 500 })
  }
}
