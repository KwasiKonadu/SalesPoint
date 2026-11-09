import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/inventory/batches?filter=all|expired|soon&days=30
 * Batches that still have stock, earliest expiry first (undated last).
 */
export async function GET(req: NextRequest) {
  try {
    const filter = req.nextUrl.searchParams.get('filter') || 'all'
    const days = parseInt(req.nextUrl.searchParams.get('days') || '30')

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const soon = new Date(today)
    soon.setDate(soon.getDate() + days)

    const where: Record<string, unknown> = { remaining: { gt: 0 } }
    if (filter === 'expired') where.expiryDate = { lt: today }
    else if (filter === 'soon') where.expiryDate = { gte: today, lte: soon }
    else if (filter === 'dated') where.expiryDate = { not: null }

    const data = await db.stockBatch.findMany({
      where,
      include: { product: { select: { id: true, name: true, sku: true, container: true, size: true, costPrice: true } } },
      orderBy: [{ expiryDate: { sort: 'asc', nulls: 'last' } }, { createdAt: 'asc' }],
    })

    // Counts for the summary tiles (independent of the active filter).
    const [expired, expiringSoon] = await Promise.all([
      db.stockBatch.count({ where: { remaining: { gt: 0 }, expiryDate: { lt: today } } }),
      db.stockBatch.count({ where: { remaining: { gt: 0 }, expiryDate: { gte: today, lte: soon } } }),
    ])

    return NextResponse.json({ data, expired, expiringSoon })
  } catch (error) {
    console.error('Error fetching batches:', error)
    return NextResponse.json({ error: 'Failed to fetch batches' }, { status: 500 })
  }
}
