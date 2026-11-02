import { NextRequest, NextResponse } from 'next/server'
import { ReturnError, updateReturn } from '@/lib/web-returns'

// Staff: approve / reject / complete a return request, with an optional note the customer sees.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!req.headers.get('x-user-id')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params
    const body = await req.json().catch(() => ({}))
    return NextResponse.json(await updateReturn(id, body))
  } catch (e) {
    if (e instanceof ReturnError) return NextResponse.json({ error: e.message }, { status: e.status })
    console.error('Error updating return:', e)
    return NextResponse.json({ error: 'Failed to update the return' }, { status: 500 })
  }
}
