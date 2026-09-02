import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

function getUserId(req: NextRequest): string | null {
  return req.headers.get('x-user-id')
}

export async function GET() {
  try {
    const units = await db.unit.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(units)
  } catch (error) {
    console.error('Error fetching units:', error)
    return NextResponse.json({ error: 'Failed to fetch units' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = getUserId(req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, shortName } = body

    const existing = await db.unit.findUnique({ where: { name } })
    if (existing) {
      return NextResponse.json({ error: 'Unit already exists' }, { status: 409 })
    }

    const unit = await db.unit.create({
      data: {
        name,
        shortName: shortName || null,
      },
    })

    return NextResponse.json(unit, { status: 201 })
  } catch (error) {
    console.error('Error creating unit:', error)
    return NextResponse.json({ error: 'Failed to create unit' }, { status: 500 })
  }
}
