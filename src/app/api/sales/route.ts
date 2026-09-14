import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { productLabel } from '@/lib/products'

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

    // Credit is a tab against a named customer — never a walk-in sale.
    if (paymentMethod === 'credit' && !customerId) {
      return NextResponse.json(
        { error: 'Credit sales require a customer' },
        { status: 400 }
      )
    }

    // Guard against a stale client session pointing at a user/customer that no
    // longer exists (e.g. after a dev DB reset).
    const seller = await db.user.findUnique({ where: { id: soldById } })
    if (!seller) {
      return NextResponse.json(
        { error: 'Your session is out of date — log out and back in.' },
        { status: 400 }
      )
    }
    if (customerId) {
      const customer = await db.customer.findUnique({ where: { id: customerId } })
      if (!customer) {
        return NextResponse.json(
          { error: 'That customer no longer exists — reload the page.' },
          { status: 400 }
        )
      }
    }

    const result = await db.$transaction(async (tx) => {
      // Fetch all products with inventory and product type.
      const productIds = items.map((i: Record<string, unknown>) => i.productId as string)
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
        include: { inventory: true, productType: true },
      })

      const productMap = new Map(products.map((p) => [p.id, p]))

      // Total units needed per product (a product may arrive as separate
      // wholesale-pack and retail-single lines).
      const unitsByProduct = new Map<string, number>()
      for (const item of items) {
        const product = productMap.get(item.productId as string)
        if (!product) {
          throw new Error(
            'A product in the cart no longer exists — reload the POS page.',
          )
        }
        unitsByProduct.set(
          product.id,
          (unitsByProduct.get(product.id) ?? 0) + (item.quantity as number),
        )
      }

      // Validate stock for products that track stock
      for (const [productId, needed] of unitsByProduct) {
        const product = productMap.get(productId)!
        if (product.productType?.tracksStock !== false) {
          const currentStock = product.inventory?.quantity || 0
          if (currentStock < needed) {
            throw new Error(
              `Insufficient stock for ${product.name}. Available: ${currentStock}`,
            )
          }
        }
      }

      // Calculate subtotal. Each incoming line becomes its own sale item; a
      // line flagged `wholesale` is priced at the wholesale price, but only if
      // it's a genuine whole-pack quantity (otherwise it falls back to retail).
      let subtotal = 0
      const saleItemsData: {
        productId: string
        productName: string
        quantity: number
        unitPrice: number
        costPrice: number
        taxAmount: number
        subtotal: number
      }[] = []

      for (const item of items) {
        const product = productMap.get(item.productId as string)!
        const qty = item.quantity as number
        const size = product.packSize ?? 0
        const wholesaleOk =
          item.wholesale === true &&
          product.wholesalePrice != null &&
          size > 0 &&
          qty > 0 &&
          qty % size === 0
        const unitPrice = wholesaleOk
          ? product.wholesalePrice!
          : product.sellingPrice
        const rowTax = product.taxEnabled
          ? (unitPrice * qty * (product.taxRate || 0)) / 100
          : 0
        subtotal += unitPrice * qty
        saleItemsData.push({
          productId: product.id,
          productName: productLabel(product),
          quantity: qty,
          unitPrice,
          costPrice: product.costPrice,
          taxAmount: rowTax,
          subtotal: unitPrice * qty + rowTax,
        })
      }

      const disc = discountAmount || 0
      const tax = taxAmount || 0
      const totalAmount = subtotal - disc + tax
      // Only cash is settled at the till. Every other method (card, mobile
      // money, bank transfer, credit) is created "pending" and confirmed
      // afterwards — at the POS or later from the Sales History page.
      const settledNow = paymentMethod === 'cash'
      const received = settledNow ? amountReceived || totalAmount : 0
      const change = settledNow ? received - totalAmount : 0
      const paymentStatus = settledNow ? 'completed' : 'pending'

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
          paymentStatus,
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
              status: paymentStatus,
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

      // Deduct inventory once per product (across its pack + single lines).
      for (const [productId, qty] of unitsByProduct) {
        const product = productMap.get(productId)!
        if (product.productType?.tracksStock === false) continue

        if (product.inventory) {
          await tx.inventory.update({
            where: { productId },
            data: { quantity: { decrement: qty } },
          })

          await tx.inventoryMovement.create({
            data: {
              inventoryId: product.inventory.id,
              type: 'sale',
              quantity: qty,
              note: `Sale ${transactionNumber}`,
              referenceId: sale.id,
              productId,
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
