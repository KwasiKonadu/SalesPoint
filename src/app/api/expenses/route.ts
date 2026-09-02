import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

function getUserId(req: NextRequest): string | null {
  return req.headers.get('x-user-id')
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const categoryId = searchParams.get('categoryId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')

    const where: Record<string, unknown> = {}

    if (categoryId) where.expenseCategoryId = categoryId
    if (startDate || endDate) {
      where.date = {} as Record<string, unknown>
      if (startDate) (where.date as Record<string, unknown>).gte = new Date(startDate)
      if (endDate) (where.date as Record<string, unknown>).lte = new Date(endDate)
    }

    const [data, total] = await Promise.all([
      db.expense.findMany({
        where,
        include: {
          category: true,
          createdBy: { select: { id: true, name: true, email: true } },
        },
        orderBy: { date: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.expense.count({ where }),
    ])

    return NextResponse.json({ data, total, page, pageSize })
  } catch (error) {
    console.error('Error fetching expenses:', error)
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = getUserId(req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { expenseCategoryId, amount, date, paymentMethod, description, attachment } = body

    if (!amount) {
      return NextResponse.json({ error: 'Amount is required' }, { status: 400 })
    }

    const expense = await db.expense.create({
      data: {
        expenseCategoryId: expenseCategoryId || null,
        amount,
        date: date ? new Date(date) : undefined,
        paymentMethod: paymentMethod || null,
        description: description || null,
        attachment: attachment || null,
        createdById: userId,
      },
      include: { category: true },
    })

    return NextResponse.json(expense, { status: 201 })
  } catch (error) {
    console.error('Error creating expense:', error)
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 })
  }
}
