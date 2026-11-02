import { NextResponse } from 'next/server'
import { loadCategories, loadProducts, loadPromises, loadSlots, loadStore, PUBLIC_CACHE } from '@/lib/public-catalog'

// Public, read-only. The whole website catalogue in one call — every product
// flagged "show on store", the categories that have at least one of them, and
// the homepage promotion slots that are live right now, and the delivery,
// returns and pickup promises the shop has switched on.
// The storefront loads this once and filters/sorts client-side.
export async function GET() {
  try {
    const [categories, products] = await Promise.all([loadCategories(), loadProducts()])
    const used = new Set(products.map((p) => p.categoryId))
    const [slots, promises, store] = await Promise.all([loadSlots(products), loadPromises(), loadStore()])
    return NextResponse.json(
      { categories: categories.filter((c) => used.has(c.id)), products, slots, promises, store },
      { headers: { 'Cache-Control': PUBLIC_CACHE } },
    )
  } catch (error) {
    console.error('Public catalog error:', error)
    return NextResponse.json({ error: 'Failed to load catalogue' }, { status: 500 })
  }
}
