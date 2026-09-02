import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const restock = await db.restock.findUnique({
      where: { id },
      include: {
        supplier: true,
        createdBy: { select: { id: true, name: true, email: true } },
        items: { include: { product: true } },
      },
    })

    if (!restock) {
      return NextResponse.json({ error: 'Restock not found' }, { status: 404 })
    }

    return NextResponse.json(restock)
  } catch (error) {
    console.error('Error fetching restock:', error)
    return NextResponse.json({ error: 'Failed to fetch restock' }, { status: 500 })
  }
}
