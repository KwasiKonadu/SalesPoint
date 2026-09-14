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
    const customer = await db.customer.findUnique({
      where: { id },
      include: { _count: { select: { sales: true } } },
    })

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Get sales history
    const sales = await db.sale.findMany({
      where: { customerId: id },
      include: {
        soldBy: { select: { id: true, name: true } },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    const totalSpent = sales.reduce((sum, s) => sum + s.totalAmount, 0)

    // What the customer still owes us: the unpaid portion of every sale that
    // wasn't fully refunded. Credit sales record amountReceived = 0, so their
    // full total counts here until the balance is settled.
    const outstandingBalance = sales.reduce((sum, s) => {
      if (s.status === 'refunded') return sum
      return sum + Math.max(0, s.totalAmount - (s.amountReceived ?? 0))
    }, 0)

    return NextResponse.json({
      ...customer,
      _sum: { totalAmount: totalSpent },
      sales,
      salesHistory: sales,
      totalSpent,
      outstandingBalance,
    })
  } catch (error) {
    console.error('Error fetching customer:', error)
    return NextResponse.json({ error: 'Failed to fetch customer' }, { status: 500 })
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

    const customer = await db.customer.update({
      where: { id },
      data: {
        name: body.name,
        phone: body.phone,
        email: body.email,
        address: body.address,
        notes: body.notes,
        isActive: body.isActive,
      },
    })

    return NextResponse.json(customer)
  } catch (error) {
    console.error('Error updating customer:', error)
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 })
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
    const customer = await db.customer.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json(customer)
  } catch (error) {
    console.error('Error deleting customer:', error)
    return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 })
  }
}
