import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

function getUserId(req: NextRequest): string | null {
  return req.headers.get('x-user-id')
}

export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.searchParams.get('search')
    const page = parseInt(req.nextUrl.searchParams.get('page') || '1')
    const pageSize = parseInt(req.nextUrl.searchParams.get('pageSize') || '20')

    const where: Record<string, unknown> = { isActive: true }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } },
      ]
    }

    const [data, total] = await Promise.all([
      db.customer.findMany({
        where,
        include: { _count: { select: { sales: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.customer.count({ where }),
    ])

    return NextResponse.json({ data, total, page, pageSize })
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = getUserId(req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, phone, email, address, notes } = body

    if (!name) {
      return NextResponse.json({ error: 'Customer name is required' }, { status: 400 })
    }

    const customer = await db.customer.create({
      data: {
        name,
        phone: phone || null,
        email: email || null,
        address: address || null,
        notes: notes || null,
      },
    })

    return NextResponse.json(customer, { status: 201 })
  } catch (error) {
    console.error('Error creating customer:', error)
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 })
  }
}
