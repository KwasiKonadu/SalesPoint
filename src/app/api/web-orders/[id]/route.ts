import { NextRequest, NextResponse } from 'next/server'
import { OrderError, updateWebOrder } from '@/lib/web-orders'

// Staff: move an order along, cancel it, or mark it paid.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!req.headers.get('x-user-id')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const body = await req.json()
    return NextResponse.json(await updateWebOrder(id, { status: body.status, paymentStatus: body.paymentStatus, note: body.note, paymentMethod: body.paymentMethod, staffId: req.headers.get('x-user-id') ?? undefined }))
  } catch (e) {
    if (e instanceof OrderError) return NextResponse.json({ error: e.message }, { status: e.status })
    console.error('Web order update error:', e)
    return NextResponse.json({ error: 'Failed to update the order' }, { status: 500 })
  }
}
