import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

function getUserId(req: NextRequest): string | null {
  return req.headers.get('x-user-id')
}

export async function GET() {
  try {
    const types = await db.productType.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(types)
  } catch (error) {
    console.error('Error fetching product types:', error)
    return NextResponse.json({ error: 'Failed to fetch product types' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = getUserId(req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, description, tracksStock } = body

    const existing = await db.productType.findUnique({ where: { name } })
    if (existing) {
      return NextResponse.json({ error: 'Product type already exists' }, { status: 409 })
    }

    const type = await db.productType.create({
      data: {
        name,
        description: description || null,
        tracksStock: tracksStock !== false,
      },
    })

    return NextResponse.json(type, { status: 201 })
  } catch (error) {
    console.error('Error creating product type:', error)
    return NextResponse.json({ error: 'Failed to create product type' }, { status: 500 })
  }
}
