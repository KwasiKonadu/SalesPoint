import { NextResponse } from 'next/server'
import { loadCategories, loadProducts, PUBLIC_CACHE } from '@/lib/public-catalog'

// Public, read-only. Categories that have at least one product on the website,
// each with its product count.
export async function GET() {
  try {
    const [categories, products] = await Promise.all([loadCategories(), loadProducts()])
    const counts = new Map<string, number>()
    for (const p of products) counts.set(p.categoryId, (counts.get(p.categoryId) ?? 0) + 1)
    const data = categories
      .filter((c) => counts.has(c.id))
      .map((c) => ({ ...c, productCount: counts.get(c.id) ?? 0 }))
    return NextResponse.json({ data }, { headers: { 'Cache-Control': PUBLIC_CACHE } })
  } catch (error) {
    console.error('Public categories error:', error)
    return NextResponse.json({ error: 'Failed to load categories' }, { status: 500 })
  }
}
