import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'
import { deleteImage } from '@/lib/storage'
import { slugify, uniqueSlug } from '@/lib/slug'

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

    // Remember the current picture so a replaced or removed one can be deleted from storage.
    const previousImage =
      body.image === undefined ? undefined : (await db.product.findUnique({ where: { id }, select: { image: true } }))?.image

    const previousGallery =
      body.images === undefined ? undefined : (await db.product.findUnique({ where: { id }, select: { images: true } }))?.images

    const slug =
      body.slug === undefined || !String(body.slug).trim()
        ? undefined
        : await uniqueSlug(slugify(String(body.slug)), id)

    const product = await db.product.update({
      where: { id },
      data: {
        ...(slug ? { slug } : {}),
        ...(body.showOnWebsite === undefined ? {} : { showOnWebsite: !!body.showOnWebsite }),
        ...(body.featured === undefined ? {} : { featured: !!body.featured }),
        ...(body.perishable === undefined ? {} : { perishable: !!body.perishable }),
        ...(body.images === undefined
          ? {}
          : { images: Array.isArray(body.images) ? body.images.filter(Boolean) : [] }),
        ...(body.details === undefined
          ? {}
          : { details: Array.isArray(body.details) ? body.details : Prisma.DbNull }),
        ...(body.variantGroup === undefined
          ? {}
          : { variantGroup: body.variantGroup?.trim() || null }),
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

    // A picture still used as the main image or in the gallery is kept.
    const stillUsed = new Set([product.image, ...product.images])
    if (previousImage && !stillUsed.has(previousImage)) await deleteImage(previousImage)
    for (const url of previousGallery ?? []) if (!stillUsed.has(url)) await deleteImage(url)

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
