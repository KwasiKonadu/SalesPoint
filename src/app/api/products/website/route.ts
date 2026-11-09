import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const LIMIT = 1000

// Put many products on (or take them off) the website, or feature them, in one call.
// Featuring a product also shows it; hiding a product also un-features it.
export async function PUT(req: NextRequest) {
  try {
    if (!req.headers.get('x-user-id')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { ids, showOnWebsite, featured } = await req.json()
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Choose at least one product' }, { status: 400 })
    }
    if (ids.length > LIMIT) {
      return NextResponse.json({ error: `Update up to ${LIMIT} products at a time` }, { status: 400 })
    }
    if (typeof showOnWebsite !== 'boolean' && typeof featured !== 'boolean') {
      return NextResponse.json({ error: 'Nothing to change' }, { status: 400 })
    }

    const data: { showOnWebsite?: boolean; featured?: boolean } = {}
    if (typeof showOnWebsite === 'boolean') data.showOnWebsite = showOnWebsite
    if (typeof featured === 'boolean') data.featured = featured
    if (data.featured === true) data.showOnWebsite = true
    if (data.showOnWebsite === false) data.featured = false

    // Archived products never go on the website; taking them off is always fine.
    const where = {
      id: { in: ids.map(String) },
      ...(data.showOnWebsite === true ? { isActive: true } : {}),
    }
    const { count } = await db.product.updateMany({ where, data })
    return NextResponse.json({ updated: count, skipped: ids.length - count })
  } catch (error) {
    console.error('Error updating website products:', error)
    return NextResponse.json({ error: 'Failed to update products' }, { status: 500 })
  }
}
