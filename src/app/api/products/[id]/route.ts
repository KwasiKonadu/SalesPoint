import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

function getUserId(req: NextRequest): string | null {
  return req.headers.get('x-user-id')
}

const productInclude = {
  category: true,
  productType: true,
  unit: true,
  inventory: true,
} as const

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const product = await db.product.findUnique({
      where: { id },
      include: productInclude,
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

    const num = (v: unknown) =>
      v === undefined ? undefined : v === null || v === '' ? null : Number(v)

    const product = await db.product.update({
      where: { id },
      data: {
        ...(body.name === undefined ? {} : { name: String(body.name).trim() }),
        ...(body.container === undefined
          ? {}
          : { container: body.container?.trim() || null }),
        ...(body.size === undefined ? {} : { size: body.size?.trim() || null }),
        ...(body.description === undefined
          ? {}
          : { description: body.description || null }),
        ...(body.image === undefined ? {} : { image: body.image || null }),
        ...(body.categoryId === undefined
          ? {}
          : { categoryId: body.categoryId || null }),
        ...(body.productTypeId === undefined
          ? {}
          : { productTypeId: body.productTypeId || null }),
        ...(body.unitId === undefined ? {} : { unitId: body.unitId || null }),
        ...(body.costPrice === undefined ? {} : { costPrice: Number(body.costPrice) }),
        ...(body.sellingPrice === undefined
          ? {}
          : { sellingPrice: Number(body.sellingPrice) }),
        ...(body.wholesalePrice === undefined
          ? {}
          : { wholesalePrice: num(body.wholesalePrice) }),
        ...(body.packSize === undefined ? {} : { packSize: num(body.packSize) }),
        ...(body.taxEnabled === undefined ? {} : { taxEnabled: body.taxEnabled }),
        ...(body.taxRate === undefined ? {} : { taxRate: Number(body.taxRate) }),
        ...(body.lowStockPercent === undefined
          ? {}
          : { lowStockPercent: Number(body.lowStockPercent) }),
        ...(body.isActive === undefined ? {} : { isActive: body.isActive }),
      },
      include: productInclude,
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
