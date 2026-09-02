import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

function getUserId(req: NextRequest): string | null {
  return req.headers.get('x-user-id')
}

export async function GET(req: NextRequest) {
  try {
    const all = req.nextUrl.searchParams.get('all')
    const where = all === 'true' ? {} : { isActive: true }

    const categories = await db.productCategory.findMany({
      where,
      include: { _count: { select: { products: true } } },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = getUserId(req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, description, icon } = body

    const existing = await db.productCategory.findUnique({ where: { name } })
    if (existing) {
      return NextResponse.json({ error: 'Category already exists' }, { status: 409 })
    }

    const category = await db.productCategory.create({
      data: {
        name,
        description: description || null,
        icon: icon || null,
      },
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
}
