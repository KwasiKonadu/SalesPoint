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
    const type = await db.productType.findUnique({ where: { id } })
    if (!type) {
      return NextResponse.json({ error: 'Product type not found' }, { status: 404 })
    }
    return NextResponse.json(type)
  } catch (error) {
    console.error('Error fetching product type:', error)
    return NextResponse.json({ error: 'Failed to fetch product type' }, { status: 500 })
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
    const { name, description, tracksStock } = body

    const type = await db.productType.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(tracksStock !== undefined && { tracksStock }),
      },
    })

    return NextResponse.json(type)
  } catch (error) {
    console.error('Error updating product type:', error)
    return NextResponse.json({ error: 'Failed to update product type' }, { status: 500 })
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
    const type = await db.productType.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json(type)
  } catch (error) {
    console.error('Error deleting product type:', error)
    return NextResponse.json({ error: 'Failed to delete product type' }, { status: 500 })
  }
}
