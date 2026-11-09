import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { deleteImage } from '@/lib/storage'
import { SLOT_TYPES, validateSlot } from '@/lib/website'

const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null)
const date = (v: unknown) => (typeof v === 'string' && v ? new Date(v) : null)

// Create or update the slot of this type. A bare `{ isActive }` flips the
// on/off switch on an existing slot.
export async function PUT(req: NextRequest, { params }: { params: Promise<{ type: string }> }) {
  try {
    if (req.headers.get('x-user-role') !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const { type } = await params
    if (!SLOT_TYPES.some((t) => t.value === type)) {
      return NextResponse.json({ error: 'Unknown slot type' }, { status: 404 })
    }
    const b = await req.json()

    if (Object.keys(b).length === 1 && typeof b.isActive === 'boolean') {
      const existing = await db.promoSlot.findUnique({ where: { type } })
      if (!existing) return NextResponse.json({ error: 'Save the slot first' }, { status: 400 })
      return NextResponse.json(await db.promoSlot.update({ where: { type }, data: { isActive: b.isActive } }))
    }

    const error = validateSlot({ ...b, type })
    if (error) return NextResponse.json({ error }, { status: 400 })

    const data = {
      title: String(b.title).trim(),
      subtitle: str(b.subtitle),
      imageUrl: str(b.imageUrl),
      buttonLabel: str(b.buttonLabel),
      linkType: str(b.linkType),
      linkTarget: b.linkType === 'sale' ? null : str(b.linkTarget),
      productIds: Array.isArray(b.productIds) ? b.productIds.map(String) : [],
      startAt: date(b.startAt),
      endAt: date(b.endAt),
      isActive: b.isActive !== false,
    }
    const previous = await db.promoSlot.findUnique({ where: { type }, select: { imageUrl: true } })
    const slot = await db.promoSlot.upsert({ where: { type }, create: { type, ...data }, update: data })
    // The old poster is no longer used once it's replaced or removed.
    if (previous?.imageUrl && previous.imageUrl !== data.imageUrl) await deleteImage(previous.imageUrl)
    return NextResponse.json(slot)
  } catch (error) {
    console.error('Error saving slot:', error)
    return NextResponse.json({ error: 'Failed to save slot' }, { status: 500 })
  }
}
