import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

function getUserId(req: NextRequest): string | null {
  return req.headers.get('x-user-id')
}

async function generateTransactionNumber(tx: Parameters<Parameters<typeof db.$transaction>[0]>[0]): Promise<string> {
  const today = new Date()
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
  const prefix = `TXN-${dateStr}-`

  // Find the latest transaction number for today
  const lastSale = await tx.sale.findFirst({
    where: { transactionNumber: { startsWith: prefix } },
    orderBy: { transactionNumber: 'desc' },
    select: { transactionNumber: true },
  })

  let nextNum = 1
  if (lastSale) {
    const lastNumStr = lastSale.transactionNumber.slice(prefix.length)
    nextNum = parseInt(lastNumStr, 10) + 1
  }

  return `${prefix}${String(nextNum).padStart(4, '0')}`
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const customerId = searchParams.get('customerId')
    const paymentMethod = searchParams.get('paymentMethod')
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')

    const where: Record<string, unknown> = {}

    if (customerId) where.customerId = customerId
    if (paymentMethod) where.paymentMethod = paymentMethod
    if (status) where.status = status

    if (startDate || endDate) {
      where.createdAt = {} as Record<string, unknown>
      if (startDate) (where.createdAt as Record<string, unknown>).gte = new Date(startDate)
      if (endDate) (where.createdAt as Record<string, unknown>).lte = new Date(endDate)
    }

    if (search) {
      where.OR = [
        { transactionNumber: { contains: search } },
        { customer: { name: { contains: search } } },
      ]
    }

    const [data, total] = await Promise.all([
      db.sale.findMany({
        where,
        include: {
          customer: true,
          soldBy: { select: { id: true, name: true, email: true } },
          items: true,
          payment: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.sale.count({ where }),
    ])

    return NextResponse.json({ data, total, page, pageSize })
  } catch (error) {
    console.error('Error fetching sales:', error)
    return NextResponse.json({ error: 'Failed to fetch sales' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = getUserId(req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      customerId,
      soldById,
      items,
      discountAmount,
      taxAmount,
      paymentMethod,
      amountReceived,
    } = body

    if (!soldById || !items || items.length === 0 || !paymentMethod) {
      return NextResponse.json(
        { error: 'Missing required fields: soldById, items, paymentMethod' },
        { status: 400 }
      )
    }

    const result = await db.$transaction(async (tx) => {
      // Fetch all products with inventory and product type
      const productIds = items.map((i: Record<string, unknown>) => i.productId as string)
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
        include: { inventory: true, productType: true },
      })

      const productMap = new Map(products.map((p) => [p.id, p]))

      // Validate stock for products that track stock
      for (const item of items) {
        const product = productMap.get(item.productId as string)
        if (!product) {
          throw new Error(`Product ${item.productId} not found`)
        }
        if (product.productType?.tracksStock !== false) {
          const inv = product.inventory
          const currentStock = inv?.quantity || 0
          if (currentStock < (item.quantity as number)) {
            throw new Error(`Insufficient stock for ${product.name}. Available: ${currentStock}`)
          }
        }
      }

      // Calculate subtotal
      let subtotal = 0
      const saleItemsData = items.map((item: Record<string, unknown>) => {
        const product = productMap.get(item.productId as string)!
        const qty = item.quantity as number
        const unitPrice = product.sellingPrice
        const costPrice = product.costPrice
        const itemTax = product.taxEnabled
          ? (unitPrice * qty * (product.taxRate || 0)) / 100
          : 0
        const itemSubtotal = unitPrice * qty + itemTax

        subtotal += unitPrice * qty

        return {
          productId: product.id,
          productName: product.name,
          quantity: qty,
          unitPrice,
          costPrice,
          taxAmount: itemTax,
          subtotal: itemSubtotal,
        }
      })

      const disc = discountAmount || 0
      const tax = taxAmount || 0
      const totalAmount = subtotal - disc + tax
      const received = amountReceived || totalAmount
      const change = received - totalAmount

      // Generate transaction number
      const transactionNumber = await generateTransactionNumber(tx)

      // Generate receipt number
      const today = new Date()
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
      const receiptPrefix = `RCP-${dateStr}-`
      const lastReceipt = await tx.receipt.findFirst({
        where: { receiptNumber: { startsWith: receiptPrefix } },
        orderBy: { receiptNumber: 'desc' },
        select: { receiptNumber: true },
      })
      let nextReceiptNum = 1
      if (lastReceipt) {
        const lastNum = lastReceipt.receiptNumber.slice(receiptPrefix.length)
        nextReceiptNum = parseInt(lastNum, 10) + 1
      }
      const receiptNumber = `${receiptPrefix}${String(nextReceiptNum).padStart(4, '0')}`

      // Create sale with items, payment, and receipt
      const sale = await tx.sale.create({
        data: {
          transactionNumber,
          customerId: customerId || null,
          soldById,
          subtotal,
          discountAmount: disc,
          taxAmount: tax,
          totalAmount,
          paymentMethod,
          paymentStatus: 'completed',
          amountReceived: received,
          changeAmount: Math.max(change, 0),
          status: 'completed',
          items: { create: saleItemsData },
          payment: {
            create: {
              method: paymentMethod,
              amount: totalAmount,
              amountReceived: received,
              changeAmount: Math.max(change, 0),
              status: 'completed',
            },
          },
          receipt: {
            create: {
              receiptNumber,
            },
          },
        },
        include: {
          customer: true,
          soldBy: { select: { id: true, name: true, email: true } },
          items: true,
          payment: true,
          receipt: true,
        },
      })

      // Deduct inventory and create movements
      for (const item of items) {
        const product = productMap.get(item.productId as string)!
        if (product.productType?.tracksStock === false) continue

        const qty = item.quantity as number
        if (product.inventory) {
          await tx.inventory.update({
            where: { productId: product.id },
            data: { quantity: { decrement: qty } },
          })

          await tx.inventoryMovement.create({
            data: {
              inventoryId: product.inventory.id,
              type: 'sale',
              quantity: qty,
              note: `Sale ${transactionNumber}`,
              referenceId: sale.id,
              productId: product.id,
            },
          })
        }
      }

      return sale
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error: unknown) {
    console.error('Error creating sale:', error)
    const message = error instanceof Error ? error.message : 'Failed to create sale'
    const status = message.includes('Insufficient') || message.includes('not found') ? 400 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
