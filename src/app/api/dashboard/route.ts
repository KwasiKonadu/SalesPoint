import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const now = new Date()
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)

    // This month sales with items
    const thisMonthSales = await db.sale.findMany({
      where: {
        status: 'completed',
        createdAt: { gte: thisMonthStart },
      },
      include: { items: true },
    })

    // Last month sales with items
    const lastMonthSales = await db.sale.findMany({
      where: {
        status: 'completed',
        createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
      },
      include: { items: true },
    })

    const totalSales = thisMonthSales.reduce((sum, s) => sum + s.totalAmount, 0)
    const lastMonthTotalSales = lastMonthSales.reduce((sum, s) => sum + s.totalAmount, 0)
    const salesChange =
      lastMonthTotalSales === 0
        ? 100
        : ((totalSales - lastMonthTotalSales) / lastMonthTotalSales) * 100

    const totalTransactions = thisMonthSales.length
    const lastMonthTransactions = lastMonthSales.length
    const transactionsChange =
      lastMonthTransactions === 0
        ? 100
        : ((totalTransactions - lastMonthTransactions) / lastMonthTransactions) * 100

    // Profit calculation
    const thisMonthItems = thisMonthSales.flatMap((s) => s.items)
    const totalProfit = thisMonthItems.reduce(
      (sum, item) => sum + (item.unitPrice - item.costPrice) * item.quantity,
      0
    )

    const lastMonthItems = lastMonthSales.flatMap((s) => s.items)
    const lastMonthProfit = lastMonthItems.reduce(
      (sum, item) => sum + (item.unitPrice - item.costPrice) * item.quantity,
      0
    )
    const profitChange =
      lastMonthProfit === 0 ? 100 : ((totalProfit - lastMonthProfit) / lastMonthProfit) * 100

    const avgOrderValue = totalTransactions === 0 ? 0 : totalSales / totalTransactions
    const lastMonthAvg =
      lastMonthTransactions === 0 ? 0 : lastMonthTotalSales / lastMonthTransactions
    const avgOrderValueChange =
      lastMonthAvg === 0 ? 100 : ((avgOrderValue - lastMonthAvg) / lastMonthAvg) * 100

    // Total customers
    const totalCustomers = await db.customer.count({ where: { isActive: true } })
    const lastMonthCustomers = await db.customer.count({
      where: { isActive: true, createdAt: { lt: thisMonthStart } },
    })
    const newCustomers = totalCustomers - lastMonthCustomers
    const customersChange =
      lastMonthCustomers === 0 ? 100 : (newCustomers / lastMonthCustomers) * 100

    // Pre-fetch all products with categories for this month's items
    const thisMonthProductIds = [...new Set(thisMonthItems.map((i) => i.productId))]
    const products = await db.product.findMany({
      where: { id: { in: thisMonthProductIds } },
      include: { category: true },
    })
    const productMap = new Map(products.map((p) => [p.id, p]))

    // Sales by category
    const categoryMap = new Map<string, { category: string; amount: number }>()
    for (const item of thisMonthItems) {
      const product = productMap.get(item.productId)
      const catName = product?.category?.name || 'Uncategorized'
      const existing = categoryMap.get(catName)
      if (existing) {
        existing.amount += item.subtotal
      } else {
        categoryMap.set(catName, { category: catName, amount: item.subtotal })
      }
    }
    const salesByCategory = Array.from(categoryMap.values()).map((c) => ({
      category: c.category,
      amount: c.amount,
      percentage: totalSales === 0 ? 0 : (c.amount / totalSales) * 100,
    }))

    // Top products
    const productSalesMap = new Map<
      string,
      { productName: string; quantitySold: number; revenue: number; image: string | null }
    >()
    for (const item of thisMonthItems) {
      const existing = productSalesMap.get(item.productId)
      if (existing) {
        existing.quantitySold += item.quantity
        existing.revenue += item.subtotal
      } else {
        const product = productMap.get(item.productId)
        productSalesMap.set(item.productId, {
          productName: item.productName,
          quantitySold: item.quantity,
          revenue: item.subtotal,
          image: product?.image || null,
        })
      }
    }
    const topProducts = Array.from(productSalesMap.entries())
      .map(([id, data]) => ({ productId: id, ...data }))
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 5)

    // Low stock products - fetch all and filter
    const allInventory = await db.inventory.findMany({
      include: {
        product: { include: { category: true, unit: true, productType: true } },
      },
    })
    const lowStockProducts = allInventory.filter(
      (inv) =>
        inv.product.isActive &&
        inv.product.productType?.tracksStock !== false &&
        inv.quantity <= inv.product.minStockLevel
    )

    // Recent sales
    const recentSales = await db.sale.findMany({
      where: { status: 'completed' },
      include: {
        customer: true,
        soldBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })

    // Sales chart - last 30 days
    const thirtyDaysAgo = new Date(now)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)
    thirtyDaysAgo.setHours(0, 0, 0, 0)

    const recentAllSales = await db.sale.findMany({
      where: {
        status: 'completed',
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { totalAmount: true, createdAt: true },
    })

    const salesChart: { date: string; amount: number }[] = []
    for (let i = 0; i < 30; i++) {
      const d = new Date(thirtyDaysAgo)
      d.setDate(d.getDate() + i)
      const dateStr = d.toISOString().slice(0, 10)
      const dayTotal = recentAllSales
        .filter((s) => s.createdAt.toISOString().slice(0, 10) === dateStr)
        .reduce((sum, s) => sum + s.totalAmount, 0)
      salesChart.push({ date: dateStr, amount: dayTotal })
    }

    return NextResponse.json({
      totalSales,
      salesChange: Math.round(salesChange * 10) / 10,
      totalTransactions,
      transactionsChange: Math.round(transactionsChange * 10) / 10,
      totalProfit,
      profitChange: Math.round(profitChange * 10) / 10,
      avgOrderValue: Math.round(avgOrderValue * 100) / 100,
      avgOrderValueChange: Math.round(avgOrderValueChange * 10) / 10,
      totalCustomers,
      customersChange: Math.round(customersChange * 10) / 10,
      salesByCategory,
      topProducts,
      lowStockProducts,
      recentSales,
      salesChart,
    })
  } catch (error) {
    console.error('Error fetching dashboard:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
  }
}
