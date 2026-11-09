import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { deleteImage } from '@/lib/storage'

function getUserId(req: NextRequest): string | null {
  return req.headers.get('x-user-id')
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

    const previousImage =
      body.image === undefined ? undefined : (await db.productCategory.findUnique({ where: { id }, select: { image: true } }))?.image

    const category = await db.productCategory.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        icon: body.icon,
        ...(body.image === undefined ? {} : { image: body.image || null }),
        isActive: body.isActive,
      },
    })

    if (previousImage && previousImage !== category.image) await deleteImage(previousImage)

    return NextResponse.json(category)
  } catch (error) {
    console.error('Error updating category:', error)
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
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
    const category = await db.productCategory.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
  }
}
