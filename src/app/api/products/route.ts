import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

function getUserId(req: NextRequest): string | null {
  return req.headers.get('x-user-id')
}

function generateSKU(name: string): string {
  const base = (name || 'SKU')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .slice(0, 4)
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `${base || 'SKU'}-${rand}`
}

const productInclude = {
  category: true,
  productType: true,
  unit: true,
  inventory: true,
} as const

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const categoryId = searchParams.get('categoryId')
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')

    const where: Record<string, unknown> = {}

    if (categoryId) where.categoryId = categoryId
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { container: { contains: search } },
        { size: { contains: search } },
        { description: { contains: search } },
      ]
    }
    if (status === 'active') where.isActive = true
    if (status === 'inactive') where.isActive = false

    // Best sellers: the 8 products with the most units sold in the last 30 days.
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const [data, total, topSellers] = await Promise.all([
      db.product.findMany({
        where,
        include: productInclude,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.product.count({ where }),
      db.saleItem.groupBy({
        by: ['productId'],
        where: { sale: { createdAt: { gte: since } } },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 8,
      }),
    ])

    const bestSellerIds = new Set(
      topSellers
        .filter((t) => (t._sum.quantity ?? 0) > 0)
        .map((t) => t.productId),
    )

    return NextResponse.json({
      data: data.map((p) => ({ ...p, isBestSeller: bestSellerIds.has(p.id) })),
      total,
      page,
      pageSize,
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = getUserId(req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      name,
      sku: providedSku,
      container,
      size,
      description,
      image,
      categoryId,
      productTypeId,
      unitId,
      costPrice,
      sellingPrice,
      wholesalePrice,
      packSize,
      taxEnabled,
      taxRate,
      lowStockPercent,
      initialStock,
    } = body

    if (!name || !String(name).trim()) {
      return NextResponse.json({ error: 'Product name is required' }, { status: 400 })
    }

    const sku = (providedSku || '').trim() || generateSKU(name)

    const existing = await db.product.findUnique({ where: { sku } })
    if (existing) {
      return NextResponse.json({ error: 'SKU already exists' }, { status: 409 })
    }

    let tracksStock = true
    if (productTypeId) {
      const pType = await db.productType.findUnique({ where: { id: productTypeId } })
      if (pType) tracksStock = pType.tracksStock
    }

    // Low-stock baseline starts at the opening stock and then follows the
    // running total up on every restock.
    const openingStock = Number(initialStock) || 0

    const product = await db.product.create({
      data: {
        name: String(name).trim(),
        sku,
        container: container?.trim() || null,
        size: size?.trim() || null,
        description: description || null,
        image: image || null,
        categoryId: categoryId || null,
        productTypeId: productTypeId || null,
        unitId: unitId || null,
        costPrice: Number(costPrice) || 0,
        sellingPrice: Number(sellingPrice),
        wholesalePrice: wholesalePrice ? Number(wholesalePrice) : null,
        packSize: packSize ? Number(packSize) : null,
        taxEnabled: taxEnabled || false,
        taxRate: Number(taxRate) || 0,
        targetStock: tracksStock && openingStock > 0 ? openingStock : null,
        lowStockPercent:
          lowStockPercent === null || lowStockPercent === undefined
            ? 20
            : Number(lowStockPercent),
        inventory: tracksStock ? { create: { quantity: openingStock } } : undefined,
      },
      include: productInclude,
    })

    if (tracksStock && openingStock > 0 && product.inventory) {
      await db.inventoryMovement.create({
        data: {
          inventoryId: product.inventory.id,
          productId: product.id,
          type: 'initial_stock',
          quantity: openingStock,
          note: 'Initial stock on product creation',
        },
      })
    }

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}
