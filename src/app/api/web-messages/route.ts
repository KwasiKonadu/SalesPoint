import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Staff: messages from the website contact form, newest first.
export async function GET(req: NextRequest) {
  if (!req.headers.get('x-user-id')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const data = await db.webMessage.findMany({ orderBy: { createdAt: 'desc' }, take: 300 })
  return NextResponse.json({ data })
}
