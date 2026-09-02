import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

function getDateRange(req: NextRequest): { startDate: Date; endDate: Date } {
  const searchParams = req.nextUrl.searchParams
  const startDateParam = searchParams.get('startDate')
  const endDateParam = searchParams.get('endDate')
  const period = searchParams.get('period') || 'this_month'

  const now = new Date()
  let startDate: Date
  let endDate: Date

  if (startDateParam && endDateParam) {
    startDate = new Date(startDateParam)
    endDate = new Date(endDateParam)
    endDate.setHours(23, 59, 59, 999)
  } else {
    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
        break
      case 'this_week': {
        const day = now.getDay()
        const diff = day === 0 ? 6 : day - 1 // Monday start
        startDate = new Date(now)
        startDate.setDate(now.getDate() - diff)
        startDate.setHours(0, 0, 0, 0)
        endDate = new Date(now)
        endDate.setHours(23, 59, 59, 999)
        break
      }
      case 'this_month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
        break
      case 'last_month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
        break
      case 'this_year':
        startDate = new Date(now.getFullYear(), 0, 1)
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999)
        break
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    }
  }

  return { startDate, endDate }
}

export async function GET(req: NextRequest) {
  try {
    const type = req.nextUrl.searchParams.get('type')
    if (!type) {
      return NextResponse.json({ error: 'Report type is required' }, { status: 400 })
    }

    const { startDate, endDate } = getDateRange(req)

    switch (type) {
      case 'sales_overview':
        return salesOverview(startDate, endDate)
      case 'sales_by_product':
        return salesByProduct(startDate, endDate)
      case 'sales_by_category':
        return salesByCategory(startDate, endDate)
      case 'sales_by_staff':
        return salesByStaff(startDate, endDate)
      case 'sales_by_customer':
        return salesByCustomer(startDate, endDate)
      case 'sales_by_payment':
        return salesByPayment(startDate, endDate)
      case 'inventory_status':
        return inventoryStatus()
      case 'low_stock':
        return lowStock()
      case 'stock_movements':
        return stockMovements(req, startDate, endDate)
      case 'top_customers':
        return topCustomers(startDate, endDate)
      case 'supplier_purchases':
        return supplierPurchases(startDate, endDate)
      case 'expenses_by_category':
        return expensesByCategory(startDate, endDate)
      case 'profit':
        return profitReport(startDate, endDate)
      default:
        return NextResponse.json({ error: 'Unknown report type' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}

async function salesOverview(startDate: Date, endDate: Date) {
  const sales = await db.sale.findMany({
    where: { status: 'completed', createdAt: { gte: startDate, lte: endDate } },
    select: { totalAmount: true, createdAt: true, id: true },
    orderBy: { createdAt: 'asc' },
  })

  // Group by date
  const dailyMap = new Map<string, number>()
  for (const sale of sales) {
    const dateStr = sale.createdAt.toISOString().slice(0, 10)
    dailyMap.set(dateStr, (dailyMap.get(dateStr) || 0) + sale.totalAmount)
  }

  const data = Array.from(dailyMap.entries()).map(([date, amount]) => ({ date, amount }))
  const totalRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0)
  const totalTransactions = sales.length

  return NextResponse.json({
    data,
    summary: { totalRevenue, totalTransactions, avgOrderValue: totalTransactions === 0 ? 0 : totalRevenue / totalTransactions },
    period: { startDate, endDate },
  })
}

async function salesByProduct(startDate: Date, endDate: Date) {
  const saleItems = await db.saleItem.findMany({
    where: {
      sale: { status: 'completed', createdAt: { gte: startDate, lte: endDate } },
    },
    include: { product: { include: { category: true } } },
  })

  const productMap = new Map<string, { productId: string; productName: string; category: string; quantitySold: number; revenue: number; cost: number }>()

  for (const item of saleItems) {
    const existing = productMap.get(item.productId)
    const catName = item.product?.category?.name || 'Uncategorized'
    if (existing) {
      existing.quantitySold += item.quantity
      existing.revenue += item.subtotal
      existing.cost += item.costPrice * item.quantity
    } else {
      productMap.set(item.productId, {
        productId: item.productId,
        productName: item.productName,
        category: catName,
        quantitySold: item.quantity,
        revenue: item.subtotal,
        cost: item.costPrice * item.quantity,
      })
    }
  }

  const data = Array.from(productMap.values()).sort((a, b) => b.revenue - a.revenue)
  return NextResponse.json({ data, period: { startDate, endDate } })
}

async function salesByCategory(startDate: Date, endDate: Date) {
  const saleItems = await db.saleItem.findMany({
    where: {
      sale: { status: 'completed', createdAt: { gte: startDate, lte: endDate } },
    },
    include: { product: { include: { category: true } } },
  })

  const categoryMap = new Map<string, { category: string; revenue: number; cost: number; quantity: number }>()

  for (const item of saleItems) {
    const catName = item.product?.category?.name || 'Uncategorized'
    const existing = categoryMap.get(catName)
    if (existing) {
      existing.revenue += item.subtotal
      existing.cost += item.costPrice * item.quantity
      existing.quantity += item.quantity
    } else {
      categoryMap.set(catName, {
        category: catName,
        revenue: item.subtotal,
        cost: item.costPrice * item.quantity,
        quantity: item.quantity,
      })
    }
  }

  const totalRevenue = saleItems.reduce((sum, i) => sum + i.subtotal, 0)
  const data = Array.from(categoryMap.values()).map((c) => ({
    ...c,
    profit: c.revenue - c.cost,
    percentage: totalRevenue === 0 ? 0 : (c.revenue / totalRevenue) * 100,
  }))

  return NextResponse.json({ data, period: { startDate, endDate } })
}

async function salesByStaff(startDate: Date, endDate: Date) {
  const sales = await db.sale.findMany({
    where: { status: 'completed', createdAt: { gte: startDate, lte: endDate } },
    include: { soldBy: { select: { id: true, name: true } } },
  })

  const staffMap = new Map<string, { staffId: string; staffName: string; totalSales: number; transactions: number }>()

  for (const sale of sales) {
    const existing = staffMap.get(sale.soldById)
    if (existing) {
      existing.totalSales += sale.totalAmount
      existing.transactions += 1
    } else {
      staffMap.set(sale.soldById, {
        staffId: sale.soldById,
        staffName: sale.soldBy.name,
        totalSales: sale.totalAmount,
        transactions: 1,
      })
    }
  }

  const data = Array.from(staffMap.values()).sort((a, b) => b.totalSales - a.totalSales)
  return NextResponse.json({ data, period: { startDate, endDate } })
}

async function salesByCustomer(startDate: Date, endDate: Date) {
  const sales = await db.sale.findMany({
    where: { status: 'completed', createdAt: { gte: startDate, lte: endDate } },
    include: { customer: true },
  })

  const customerMap = new Map<string, { customerId: string; customerName: string; totalSpent: number; transactions: number }>()

  for (const sale of sales) {
    const customerId = sale.customerId || 'walk-in'
    const customerName = sale.customer?.name || 'Walk-in Customer'
    const existing = customerMap.get(customerId)
    if (existing) {
      existing.totalSpent += sale.totalAmount
      existing.transactions += 1
    } else {
      customerMap.set(customerId, {
        customerId,
        customerName,
        totalSpent: sale.totalAmount,
        transactions: 1,
      })
    }
  }

  const data = Array.from(customerMap.values()).sort((a, b) => b.totalSpent - a.totalSpent)
  return NextResponse.json({ data, period: { startDate, endDate } })
}

async function salesByPayment(startDate: Date, endDate: Date) {
  const sales = await db.sale.findMany({
    where: { status: 'completed', createdAt: { gte: startDate, lte: endDate } },
    select: { paymentMethod: true, totalAmount: true },
  })

  const methodMap = new Map<string, { method: string; total: number; count: number }>()
  const totalRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0)

  for (const sale of sales) {
    const existing = methodMap.get(sale.paymentMethod)
    if (existing) {
      existing.total += sale.totalAmount
      existing.count += 1
    } else {
      methodMap.set(sale.paymentMethod, {
        method: sale.paymentMethod,
        total: sale.totalAmount,
        count: 1,
      })
    }
  }

  const data = Array.from(methodMap.values()).map((m) => ({
    ...m,
    percentage: totalRevenue === 0 ? 0 : (m.total / totalRevenue) * 100,
  }))

  return NextResponse.json({ data, period: { startDate, endDate } })
}

async function inventoryStatus() {
  const inventories = await db.inventory.findMany({
    include: {
      product: { include: { category: true, unit: true, productType: true } },
    },
  })

  const data = inventories.map((inv) => {
    const status =
      inv.quantity === 0
        ? 'out_of_stock'
        : inv.quantity <= inv.product.minStockLevel
          ? 'low_stock'
          : 'in_stock'
    return {
      inventoryId: inv.id,
      productId: inv.product.id,
      productName: inv.product.name,
      sku: inv.product.sku,
      category: inv.product.category?.name,
      unit: inv.product.unit?.name,
      quantity: inv.quantity,
      minStockLevel: inv.product.minStockLevel,
      costPrice: inv.product.costPrice,
      sellingPrice: inv.product.sellingPrice,
      stockValue: inv.quantity * inv.product.costPrice,
      retailValue: inv.quantity * inv.product.sellingPrice,
      status,
    }
  })

  const totalStockValue = data.reduce((sum, d) => sum + d.stockValue, 0)
  const totalRetailValue = data.reduce((sum, d) => sum + d.retailValue, 0)

  return NextResponse.json({
    data,
    summary: { totalStockValue, totalRetailValue, totalItems: data.length, lowStockCount: data.filter((d) => d.status === 'low_stock').length, outOfStockCount: data.filter((d) => d.status === 'out_of_stock').length },
  })
}

async function lowStock() {
  const inventories = await db.inventory.findMany({
    include: {
      product: { include: { category: true, unit: true, productType: true } },
    },
  })

  const data = inventories
    .filter(
      (inv) =>
        inv.product.isActive &&
        inv.product.productType?.tracksStock !== false &&
        inv.quantity <= inv.product.minStockLevel
    )
    .map((inv) => ({
      productId: inv.product.id,
      productName: inv.product.name,
      sku: inv.product.sku,
      category: inv.product.category?.name,
      quantity: inv.quantity,
      minStockLevel: inv.product.minStockLevel,
      deficit: inv.product.minStockLevel - inv.quantity,
      status: inv.quantity === 0 ? 'out_of_stock' : 'low_stock',
    }))

  return NextResponse.json({ data })
}

async function stockMovements(req: NextRequest, startDate: Date, endDate: Date) {
  const searchParams = req.nextUrl.searchParams
  const movementType = searchParams.get('type')
  const productId = searchParams.get('productId')

  const where: Record<string, unknown> = {
    createdAt: { gte: startDate, lte: endDate },
  }
  if (movementType) where.type = movementType
  if (productId) where.productId = productId

  const movements = await db.inventoryMovement.findMany({
    where,
    include: {
      product: { include: { category: true, unit: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const data = movements.map((m) => ({
    id: m.id,
    productId: m.productId,
    productName: m.product?.name,
    sku: m.product?.sku,
    category: m.product?.category?.name,
    type: m.type,
    quantity: m.type === 'sale' || m.type === 'damaged' || m.type === 'expired' || m.type === 'lost' || m.type === 'adjustment' ? -m.quantity : m.quantity,
    absoluteQuantity: m.quantity,
    note: m.note,
    referenceId: m.referenceId,
    createdAt: m.createdAt,
  }))

  return NextResponse.json({ data, period: { startDate, endDate } })
}

async function topCustomers(startDate: Date, endDate: Date) {
  const sales = await db.sale.findMany({
    where: { status: 'completed', createdAt: { gte: startDate, lte: endDate }, customerId: { not: null } },
    include: { customer: true },
  })

  const customerMap = new Map<string, { customerId: string; customerName: string; phone: string | null; email: string | null; totalSpent: number; transactions: number; lastPurchase: Date }>()

  for (const sale of sales) {
    if (!sale.customer) continue
    const existing = customerMap.get(sale.customerId!)
    if (existing) {
      existing.totalSpent += sale.totalAmount
      existing.transactions += 1
      if (sale.createdAt > existing.lastPurchase) existing.lastPurchase = sale.createdAt
    } else {
      customerMap.set(sale.customerId!, {
        customerId: sale.customerId!,
        customerName: sale.customer.name,
        phone: sale.customer.phone,
        email: sale.customer.email,
        totalSpent: sale.totalAmount,
        transactions: 1,
        lastPurchase: sale.createdAt,
      })
    }
  }

  const data = Array.from(customerMap.values()).sort((a, b) => b.totalSpent - a.totalSpent)
  return NextResponse.json({ data, period: { startDate, endDate } })
}

async function supplierPurchases(startDate: Date, endDate: Date) {
  const restocks = await db.restock.findMany({
    where: { dateReceived: { gte: startDate, lte: endDate } },
    include: { supplier: true, items: { include: { product: true } } },
    orderBy: { dateReceived: 'desc' },
  })

  const supplierMap = new Map<string, { supplierId: string; supplierName: string; totalPurchases: number; restockCount: number; outstandingBalance: number }>()

  for (const restock of restocks) {
    if (!restock.supplier) continue
    const existing = supplierMap.get(restock.supplierId!)
    if (existing) {
      existing.totalPurchases += restock.totalCost
      existing.restockCount += 1
      if (restock.paymentStatus !== 'paid') existing.outstandingBalance += restock.totalCost
    } else {
      supplierMap.set(restock.supplierId!, {
        supplierId: restock.supplierId!,
        supplierName: restock.supplier.businessName,
        totalPurchases: restock.totalCost,
        restockCount: 1,
        outstandingBalance: restock.paymentStatus !== 'paid' ? restock.totalCost : 0,
      })
    }
  }

  const data = Array.from(supplierMap.values()).sort((a, b) => b.totalPurchases - a.totalPurchases)
  return NextResponse.json({ data, period: { startDate, endDate } })
}

async function expensesByCategory(startDate: Date, endDate: Date) {
  const expenses = await db.expense.findMany({
    where: { date: { gte: startDate, lte: endDate } },
    include: { category: true },
  })

  const categoryMap = new Map<string, { category: string; total: number; count: number }>()
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)

  for (const expense of expenses) {
    const catName = expense.category?.name || 'Uncategorized'
    const existing = categoryMap.get(catName)
    if (existing) {
      existing.total += expense.amount
      existing.count += 1
    } else {
      categoryMap.set(catName, { category: catName, total: expense.amount, count: 1 })
    }
  }

  const data = Array.from(categoryMap.values()).map((c) => ({
    ...c,
    percentage: totalExpenses === 0 ? 0 : (c.total / totalExpenses) * 100,
  }))

  return NextResponse.json({
    data,
    summary: { totalExpenses },
    period: { startDate, endDate },
  })
}

async function profitReport(startDate: Date, endDate: Date) {
  // Revenue from sales
  const sales = await db.sale.findMany({
    where: { status: 'completed', createdAt: { gte: startDate, lte: endDate } },
    include: { items: true },
  })

  const totalRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0)
  const allItems = sales.flatMap((s) => s.items)
  const cogs = allItems.reduce((sum, item) => sum + item.costPrice * item.quantity, 0)

  // Expenses
  const expenses = await db.expense.findMany({
    where: { date: { gte: startDate, lte: endDate } },
  })
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)

  const grossProfit = totalRevenue - cogs
  const netProfit = grossProfit - totalExpenses
  const grossMargin = totalRevenue === 0 ? 0 : (grossProfit / totalRevenue) * 100
  const netMargin = totalRevenue === 0 ? 0 : (netProfit / totalRevenue) * 100

  return NextResponse.json({
    data: {
      revenue: totalRevenue,
      cogs,
      grossProfit,
      totalExpenses,
      netProfit,
      grossMargin: Math.round(grossMargin * 10) / 10,
      netMargin: Math.round(netMargin * 10) / 10,
      totalTransactions: sales.length,
      avgOrderValue: sales.length === 0 ? 0 : totalRevenue / sales.length,
    },
    period: { startDate, endDate },
  })
}
