import { NextRequest, NextResponse } from 'next/server'
import { loadCategories, loadProducts, PUBLIC_CACHE } from '@/lib/public-catalog'

// Public, read-only single product by slug, with its category and up to four
// related products from the same category.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params
    const [all, categories] = await Promise.all([loadProducts(), loadCategories()])
    const product = all.find((p) => p.slug === slug)
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

    const related = all
      .filter((p) => p.categoryId === product.categoryId && p.id !== product.id)
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 4)

    return NextResponse.json(
      { ...product, category: categories.find((c) => c.id === product.categoryId) ?? null, related },
      { headers: { 'Cache-Control': PUBLIC_CACHE } },
    )
  } catch (error) {
    console.error('Public product error:', error)
    return NextResponse.json({ error: 'Failed to load product' }, { status: 500 })
  }
}
