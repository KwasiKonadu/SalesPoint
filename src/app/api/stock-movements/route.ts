import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const type = searchParams.get('type')
    const productId = searchParams.get('productId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')

    const where: Record<string, unknown> = {}
    if (type) where.type = type
    if (productId) where.productId = productId
    if (startDate || endDate) {
      where.createdAt = {} as Record<string, unknown>
      if (startDate) (where.createdAt as Record<string, unknown>).gte = new Date(startDate)
      if (endDate) (where.createdAt as Record<string, unknown>).lte = new Date(endDate)
    }

    const [data, total] = await Promise.all([
      db.inventoryMovement.findMany({
        where,
        include: {
          product: { include: { category: true, unit: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.inventoryMovement.count({ where }),
    ])

    return NextResponse.json({ data, total, page, pageSize })
  } catch (error) {
    console.error('Error fetching stock movements:', error)
    return NextResponse.json({ error: 'Failed to fetch stock movements' }, { status: 500 })
  }
}
