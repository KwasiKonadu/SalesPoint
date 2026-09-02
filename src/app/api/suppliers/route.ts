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
        { businessName: { contains: search } },
        { contactPerson: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } },
      ]
    }

    const [data, total] = await Promise.all([
      db.supplier.findMany({
        where,
        include: { _count: { select: { restocks: true } } },
        orderBy: { businessName: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.supplier.count({ where }),
    ])

    return NextResponse.json({ data, total, page, pageSize })
  } catch (error) {
    console.error('Error fetching suppliers:', error)
    return NextResponse.json({ error: 'Failed to fetch suppliers' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = getUserId(req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { businessName, contactPerson, phone, email, address, notes } = body

    if (!businessName) {
      return NextResponse.json({ error: 'Business name is required' }, { status: 400 })
    }

    const supplier = await db.supplier.create({
      data: {
        businessName,
        contactPerson: contactPerson || null,
        phone: phone || null,
        email: email || null,
        address: address || null,
        notes: notes || null,
      },
    })

    return NextResponse.json(supplier, { status: 201 })
  } catch (error) {
    console.error('Error creating supplier:', error)
    return NextResponse.json({ error: 'Failed to create supplier' }, { status: 500 })
  }
}
