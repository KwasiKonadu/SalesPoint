import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Staff: mark a message handled (or put it back to new).
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!req.headers.get('x-user-id')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const body = await req.json().catch(() => ({}))
  if (body.status !== 'new' && body.status !== 'handled') return NextResponse.json({ error: 'Choose new or handled' }, { status: 400 })
  const exists = await db.webMessage.findUnique({ where: { id }, select: { id: true } })
  if (!exists) return NextResponse.json({ error: 'Message not found' }, { status: 404 })
  const updated = await db.webMessage.update({ where: { id }, data: { status: body.status, handledAt: body.status === 'handled' ? new Date() : null } })
  return NextResponse.json(updated)
}
