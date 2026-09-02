import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

function getStockStatus(quantity: number, minStockLevel: number): string {
  if (quantity === 0) return 'out_of_stock'
  if (quantity <= minStockLevel) return 'low_stock'
  return 'in_stock'
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const status = searchParams.get('status') || 'all'
    const search = searchParams.get('search')
    const categoryId = searchParams.get('categoryId')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')

    // Build product filter
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

    // Fetch inventory with products
    const [inventories, total] = await Promise.all([
      db.inventory.findMany({
        where: {
          product: productFilter,
        },
        include: {
          product: {
            include: {
              category: true,
              unit: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.inventory.count({
        where: {
          product: productFilter,
        },
      }),
    ])

    // Add computed stock status and filter in memory
    let data = inventories.map((inv) => {
      const stockStatus = getStockStatus(inv.quantity, inv.product.minStockLevel)
      return {
        ...inv,
        stockStatus,
      }
    })

    // Filter by status if not 'all'
    if (status !== 'all') {
      data = data.filter((item) => item.stockStatus === status)
    }

    return NextResponse.json({ data, total, page, pageSize })
  } catch (error) {
    console.error('Error fetching inventory:', error)
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 })
  }
}
