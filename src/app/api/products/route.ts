import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

function getUserId(req: NextRequest): string | null {
  return req.headers.get('x-user-id')
}

function generateSKU(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let sku = 'SKU-'
  for (let i = 0; i < 8; i++) {
    sku += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return sku
}

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
        { description: { contains: search } },
      ]
    }
    if (status === 'active') where.isActive = true
    if (status === 'inactive') where.isActive = false

    const [data, total] = await Promise.all([
      db.product.findMany({
        where,
        include: {
          category: true,
          productType: true,
          unit: true,
          inventory: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.product.count({ where }),
    ])

    return NextResponse.json({ data, total, page, pageSize })
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
      description,
      image,
      categoryId,
      productTypeId,
      unitId,
      costPrice,
      sellingPrice,
      wholesalePrice,
      taxEnabled,
      taxRate,
      minStockLevel,
      initialStock,
    } = body

    const sku = providedSku || generateSKU()

    // Check SKU uniqueness
    const existing = await db.product.findUnique({ where: { sku } })
    if (existing) {
      return NextResponse.json({ error: 'SKU already exists' }, { status: 409 })
    }

    // Check if product type tracks stock
    let tracksStock = true
    if (productTypeId) {
      const pType = await db.productType.findUnique({ where: { id: productTypeId } })
      if (pType) tracksStock = pType.tracksStock
    }

    const product = await db.product.create({
      data: {
        name,
        sku,
        description: description || null,
        image: image || null,
        categoryId: categoryId || null,
        productTypeId: productTypeId || null,
        unitId: unitId || null,
        costPrice: costPrice || 0,
        sellingPrice,
        wholesalePrice: wholesalePrice || null,
        taxEnabled: taxEnabled || false,
        taxRate: taxRate || 0,
        minStockLevel: minStockLevel || 5,
        inventory: tracksStock
          ? {
              create: {
                quantity: initialStock || 0,
                movements: initialStock
                  ? {
                      create: {
                        type: 'initial_stock',
                        quantity: initialStock,
                        note: 'Initial stock on product creation',
                      },
                    }
                  : undefined,
              },
            }
          : undefined,
      },
      include: {
        category: true,
        productType: true,
        unit: true,
        inventory: true,
      },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}
