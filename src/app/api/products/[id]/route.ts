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
    const product = await db.product.findUnique({
      where: { id },
      include: {
        category: true,
        productType: true,
        unit: true,
        inventory: { include: { movements: { orderBy: { createdAt: 'desc' } } } },
      },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 })
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

    const product = await db.product.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        image: body.image,
        categoryId: body.categoryId,
        productTypeId: body.productTypeId,
        unitId: body.unitId,
        costPrice: body.costPrice,
        sellingPrice: body.sellingPrice,
        wholesalePrice: body.wholesalePrice,
        taxEnabled: body.taxEnabled,
        taxRate: body.taxRate,
        minStockLevel: body.minStockLevel,
        isActive: body.isActive,
      },
      include: {
        category: true,
        productType: true,
        unit: true,
        inventory: true,
      },
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
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
    const product = await db.product.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}
