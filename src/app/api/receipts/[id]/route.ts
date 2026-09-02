import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const receipt = await db.receipt.findUnique({
      where: { id },
      include: {
        sale: {
          include: {
            customer: true,
            soldBy: { select: { id: true, name: true } },
            items: { include: { product: { include: { unit: true } } } },
            payment: true,
          },
        },
      },
    })

    if (!receipt) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 })
    }

    // Fetch business settings
    const settings = await db.businessSetting.findMany()
    const businessSettings: Record<string, string> = {}
    for (const s of settings) {
      businessSettings[s.key] = s.value
    }

    return NextResponse.json({
      ...receipt,
      sale: {
        ...receipt.sale,
        businessSettings,
      },
    })
  } catch (error) {
    console.error('Error fetching receipt:', error)
    return NextResponse.json({ error: 'Failed to fetch receipt' }, { status: 500 })
  }
}
