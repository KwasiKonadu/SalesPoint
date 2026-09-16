import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hash } from 'bcryptjs'
import { requireAdmin } from '@/lib/api-auth'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const forbidden = requireAdmin(req)
  if (forbidden) return forbidden

  try {
    const { id } = await params
    const user = await db.user.findUnique({
      where: { id },
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

    if (!user) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching staff:', error)
    return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const forbidden = requireAdmin(req)
  if (forbidden) return forbidden

  try {
    const { id } = await params
    const body = await req.json()

    const data: Record<string, unknown> = {
      email: body.email,
      name: body.name,
      role: body.role,
      avatar: body.avatar,
      phone: body.phone,
      isActive: body.isActive,
    }

    if (body.password) {
      data.password = await hash(body.password, 10)
    }

    const user = await db.user.update({
      where: { id },
      data,
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

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error updating staff:', error)
    return NextResponse.json({ error: 'Failed to update staff' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const forbidden = requireAdmin(req)
  if (forbidden) return forbidden

  try {
    const { id } = await params
    const user = await db.user.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error deleting staff:', error)
    return NextResponse.json({ error: 'Failed to delete staff' }, { status: 500 })
  }
}
