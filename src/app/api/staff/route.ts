import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hash } from 'bcryptjs'
import { requireAdmin } from '@/lib/api-auth'

// Any authenticated user can list staff (e.g. the "Sales Person" filter on
// the sales history page) — only creating/editing/deleting is admin-only.
export async function GET() {
  try {
    const staff = await db.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(staff)
  } catch (error) {
    console.error('Error fetching staff:', error)
    return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const forbidden = requireAdmin(req)
  if (forbidden) return forbidden

  try {
    const body = await req.json()
    const { email, password, name, role, avatar, phone } = body

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      )
    }

    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 })
    }

    const hashedPassword = await hash(password, 10)

    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role || 'sales_person',
        avatar: avatar || null,
        phone: phone || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error('Error creating staff:', error)
    return NextResponse.json({ error: 'Failed to create staff' }, { status: 500 })
  }
}
