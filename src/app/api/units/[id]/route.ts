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
    const unit = await db.unit.findUnique({ where: { id } })
    if (!unit) {
      return NextResponse.json({ error: 'Unit not found' }, { status: 404 })
    }
    return NextResponse.json(unit)
  } catch (error) {
    console.error('Error fetching unit:', error)
    return NextResponse.json({ error: 'Failed to fetch unit' }, { status: 500 })
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
    const { name, shortName } = body

    const unit = await db.unit.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(shortName !== undefined && { shortName }),
      },
    })

    return NextResponse.json(unit)
  } catch (error) {
    console.error('Error updating unit:', error)
    return NextResponse.json({ error: 'Failed to update unit' }, { status: 500 })
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
    const unit = await db.unit.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json(unit)
  } catch (error) {
    console.error('Error deleting unit:', error)
    return NextResponse.json({ error: 'Failed to delete unit' }, { status: 500 })
  }
}
