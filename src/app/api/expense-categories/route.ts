import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

function getUserId(req: NextRequest): string | null {
  return req.headers.get('x-user-id')
}

export async function GET() {
  try {
    const categories = await db.expenseCategory.findMany({
      where: { isActive: true },
      include: { _count: { select: { expenses: true } } },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching expense categories:', error)
    return NextResponse.json({ error: 'Failed to fetch expense categories' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = getUserId(req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, description } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const existing = await db.expenseCategory.findUnique({ where: { name } })
    if (existing) {
      return NextResponse.json({ error: 'Expense category already exists' }, { status: 409 })
    }

    const category = await db.expenseCategory.create({
      data: {
        name,
        description: description || null,
      },
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('Error creating expense category:', error)
    return NextResponse.json({ error: 'Failed to create expense category' }, { status: 500 })
  }
}
