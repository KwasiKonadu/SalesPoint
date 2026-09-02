import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const sale = await db.sale.findUnique({
      where: { id },
      include: {
        customer: true,
        soldBy: { select: { id: true, name: true, email: true } },
        items: { include: { product: true } },
        payment: true,
        receipt: true,
        returns: {
          include: {
            processedBy: { select: { id: true, name: true } },
            items: true,
          },
        },
      },
    })

    if (!sale) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 })
    }

    return NextResponse.json(sale)
  } catch (error) {
    console.error('Error fetching sale:', error)
    return NextResponse.json({ error: 'Failed to fetch sale' }, { status: 500 })
  }
}
