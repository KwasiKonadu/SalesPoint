import { NextRequest, NextResponse } from 'next/server'
import { loadCategories, loadProducts, PUBLIC_CACHE } from '@/lib/public-catalog'

const truthy = (v: string | null) => v === '1' || v === 'true'

// Public, read-only product list. Filters/sorts mirror the storefront's own
// catalogue query (category slug, q, sale, inStock, min/max in major units,
// sort, page, perPage) plus `featured` and `new`.
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const [all, categories] = await Promise.all([loadProducts(), loadCategories()])
    let items = all

    const categorySlug = sp.get('category')
    if (categorySlug) {
      const cat = categories.find((c) => c.slug === categorySlug)
      items = cat ? items.filter((p) => p.categoryId === cat.id) : []
    }
    const q = sp.get('q')?.trim().toLowerCase()
    if (q) items = items.filter((p) => `${p.name} ${p.description} ${p.sku}`.toLowerCase().includes(q))
    if (truthy(sp.get('sale'))) items = items.filter((p) => p.compareAtPrice !== null)
    if (truthy(sp.get('inStock'))) items = items.filter((p) => p.stock > 0)
    if (truthy(sp.get('featured'))) items = items.filter((p) => p.featured)
    if (truthy(sp.get('new'))) items = items.filter((p) => p.isNew)
    const min = sp.get('min')
    const max = sp.get('max')
    if (min) items = items.filter((p) => p.price >= Math.round(Number(min) * 100))
    if (max) items = items.filter((p) => p.price <= Math.round(Number(max) * 100))

    const sort = sp.get('sort') || 'relevance'
    items = [...items].sort((a, b) => {
      if (sort === 'newest') return b.createdAt - a.createdAt
      if (sort === 'price_asc') return a.price - b.price
      if (sort === 'price_desc') return b.price - a.price
      if (q && sort === 'relevance') {
        const rank = (n: string) => (n.toLowerCase().startsWith(q) ? 0 : 1)
        return rank(a.name) - rank(b.name) || b.popularity - a.popularity
      }
      return b.popularity - a.popularity
    })

    const per = Math.min(Math.max(parseInt(sp.get('perPage') || '9') || 9, 1), 60)
    const total = items.length
    const pages = Math.max(1, Math.ceil(total / per))
    const page = Math.min(Math.max(1, parseInt(sp.get('page') || '1') || 1), pages)

    return NextResponse.json(
      { items: items.slice((page - 1) * per, page * per), total, page, pages, per },
      { headers: { 'Cache-Control': PUBLIC_CACHE } },
    )
  } catch (error) {
    console.error('Public products error:', error)
    return NextResponse.json({ error: 'Failed to load products' }, { status: 500 })
  }
}
