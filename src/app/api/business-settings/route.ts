import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

function getUserId(req: NextRequest): string | null {
  return req.headers.get('x-user-id')
}

export async function GET() {
  try {
    const settings = await db.businessSetting.findMany({
      orderBy: { key: 'asc' },
    })

    const settingsMap: Record<string, string> = {}
    for (const s of settings) {
      settingsMap[s.key] = s.value
    }
    return NextResponse.json(settingsMap)
  } catch (error) {
    console.error('Error fetching business settings:', error)
    return NextResponse.json({ error: 'Failed to fetch business settings' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const userId = getUserId(req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: Record<string, string> = await req.json()

    const operations = Object.entries(body).map(([key, value]) =>
      db.businessSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      })
    )

    await db.$transaction(operations as Prisma.PrismaPromise<any>[])

    // Return updated settings map
    const settings = await db.businessSetting.findMany({ orderBy: { key: 'asc' } })
    const settingsMap: Record<string, string> = {}
    for (const s of settings) {
      settingsMap[s.key] = s.value
    }
    return NextResponse.json(settingsMap)
  } catch (error) {
    console.error('Error updating business settings:', error)
    return NextResponse.json({ error: 'Failed to update business settings' }, { status: 500 })
  }
}
