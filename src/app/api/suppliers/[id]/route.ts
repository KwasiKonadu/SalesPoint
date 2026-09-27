import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

function getUserId(req: NextRequest): string | null {
  return req.headers.get('x-user-id')
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supplier = await db.supplier.findUnique({
      where: { id },
      include: { _count: { select: { restocks: true } } },
    })

    if (!supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
    }

    // Get restock history and totals
    const restocks = await db.restock.findMany({
      where: { supplierId: id },
      orderBy: { dateReceived: 'desc' },
    })

    const totalPurchases = restocks.reduce((sum, r) => sum + r.totalCost, 0)
    const outstandingBalance = restocks.reduce(
      (sum, r) => sum + Math.max(0, r.totalCost - r.amountPaid),
      0,
    )

    return NextResponse.json({
      ...supplier,
      restockHistory: restocks,
      totalPurchases,
      outstandingBalance,
    })
  } catch (error) {
    console.error('Error fetching supplier:', error)
    return NextResponse.json({ error: 'Failed to fetch supplier' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserId(req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()

    const supplier = await db.supplier.update({
      where: { id },
      data: {
        businessName: body.businessName,
        contactPerson: body.contactPerson,
        phone: body.phone,
        email: body.email,
        address: body.address,
        notes: body.notes,
        isActive: body.isActive,
      },
    })

    return NextResponse.json(supplier)
  } catch (error) {
    console.error('Error updating supplier:', error)
    return NextResponse.json({ error: 'Failed to update supplier' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserId(req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const supplier = await db.supplier.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json(supplier)
  } catch (error) {
    console.error('Error deleting supplier:', error)
    return NextResponse.json({ error: 'Failed to delete supplier' }, { status: 500 })
  }
}
