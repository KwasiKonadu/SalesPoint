import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { stockStatus } from '@/lib/stock'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const status = searchParams.get('status') || 'all'
    const search = searchParams.get('search')
    const categoryId = searchParams.get('categoryId')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')

    const productFilter: Record<string, unknown> = { isActive: true }
    if (search) {
      productFilter.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
      ]
    }
    if (categoryId) {
      productFilter.categoryId = categoryId
    }

    const [inventories, total] = await Promise.all([
      db.inventory.findMany({
        where: { product: productFilter },
        include: {
          product: { include: { category: true, unit: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.inventory.count({ where: { product: productFilter } }),
    ])

    let data = inventories.map((inv) => ({
      ...inv,
      stockStatus: stockStatus(
        inv.quantity,
        inv.product.targetStock,
        inv.product.lowStockPercent,
      ),
    }))

    if (status !== 'all') {
      data = data.filter((item) => item.stockStatus === status)
    }

    return NextResponse.json({ data, total, page, pageSize })
  } catch (error) {
    console.error('Error fetching inventory:', error)
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 })
  }
}
