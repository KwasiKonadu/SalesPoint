import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Clean existing data in reverse dependency order
  console.log('  Cleaning existing data...')
  await prisma.inventoryMovement.deleteMany()
  await prisma.inventory.deleteMany()
  await prisma.returnItem.deleteMany()
  await prisma.return.deleteMany()
  await prisma.receipt.deleteMany()
  await prisma.salePayment.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.saleItem.deleteMany()
  await prisma.sale.deleteMany()
  await prisma.restockItem.deleteMany()
  await prisma.restock.deleteMany()
  await prisma.expense.deleteMany()
  await prisma.expenseCategory.deleteMany()
  await prisma.customer.deleteMany()
  await prisma.product.deleteMany()
  await prisma.supplier.deleteMany()
  await prisma.unit.deleteMany()
  await prisma.productType.deleteMany()
  await prisma.productCategory.deleteMany()
  await prisma.user.deleteMany()
  await prisma.businessSetting.deleteMany()

  // ==================== USERS ====================
  console.log('  Creating users...')
  const adminPassword = await hash('admin123', 12)
  const salesPassword = await hash('sales123', 12)

  const admin = await prisma.user.create({
    data: {
      email: 'admin@pos.com',
      password: adminPassword,
      name: 'Admin User',
      role: 'admin',
      phone: '+233 20 000 0001',
      isActive: true,
    },
  })
  console.log(`    ✅ Admin created: ${admin.email}`)

  const salesPerson = await prisma.user.create({
    data: {
      email: 'sales@pos.com',
      password: salesPassword,
      name: 'Kwame Asante',
      role: 'sales_person',
      phone: '+233 20 000 0002',
      isActive: true,
    },
  })
  console.log(`    ✅ Sales person created: ${salesPerson.email}`)

  // ==================== BUSINESS SETTINGS ====================
  console.log('  Creating business settings...')
  const businessSettings = [
    { key: 'business_name', value: 'QuickShop POS' },
    { key: 'business_address', value: '12 Oxford Street, Osu, Accra, Ghana' },
    { key: 'business_phone', value: '+233 30 277 8899' },
    { key: 'business_email', value: 'info@quickshoppos.gh' },
    { key: 'business_currency', value: 'GHS' },
    { key: 'business_logo', value: '' },
    { key: 'tax_enabled', value: 'true' },
    { key: 'tax_rate', value: '12.5' },
    { key: 'tax_id', value: 'TIN-0012345678' },
    { key: 'receipt_footer', value: 'Thank you for shopping with QuickShop POS! Visit us again.' },
    { key: 'receipt_show_logo', value: 'true' },
    { key: 'receipt_show_tax', value: 'true' },
    { key: 'receipt_show_customer', value: 'true' },
    { key: 'low_stock_alert', value: 'true' },
    { key: 'low_stock_threshold', value: '5' },
    { key: 'default_low_stock_percent', value: '20' },
  ]

  for (const setting of businessSettings) {
    await prisma.businessSetting.create({ data: setting })
  }
  console.log(`    ✅ ${businessSettings.length} business settings created`)

  // ==================== PRODUCT TYPES ====================
  console.log('  Creating product types...')
  const physicalType = await prisma.productType.create({
    data: {
      name: 'Physical Product',
      description: 'Tangible goods that can be stocked and sold',
      tracksStock: true,
      isActive: true,
    },
  })

  const serviceType = await prisma.productType.create({
    data: {
      name: 'Service',
      description: 'Services rendered that do not require inventory tracking',
      tracksStock: false,
      isActive: true,
    },
  })
  console.log(`    ✅ 2 product types created: ${physicalType.name}, ${serviceType.name}`)

  // ==================== PRODUCT CATEGORIES ====================
  console.log('  Creating product categories...')
  const categories = await Promise.all([
    prisma.productCategory.create({
      data: {
        name: 'Beverages',
        description: 'Drinks and beverages',
        icon: '🥤',
        isActive: true,
      },
    }),
    prisma.productCategory.create({
      data: {
        name: 'Snacks',
        description: 'Chips, biscuits, and other snacks',
        icon: '🍪',
        isActive: true,
      },
    }),
    prisma.productCategory.create({
      data: {
        name: 'Groceries',
        description: 'Everyday grocery items',
        icon: '🛒',
        isActive: true,
      },
    }),
    prisma.productCategory.create({
      data: {
        name: 'Personal Care',
        description: 'Toiletries and personal hygiene products',
        icon: '🧴',
        isActive: true,
      },
    }),
    prisma.productCategory.create({
      data: {
        name: 'Household',
        description: 'Cleaning and household supplies',
        icon: '🏠',
        isActive: true,
      },
    }),
  ])
  console.log(`    ✅ ${categories.length} product categories created`)

  // ==================== UNITS ====================
  console.log('  Creating units of measurement...')
  const units = await Promise.all([
    prisma.unit.create({ data: { name: 'Millilitre', shortName: 'ml', isActive: true } }),
    prisma.unit.create({ data: { name: 'Litre', shortName: 'L', isActive: true } }),
    prisma.unit.create({ data: { name: 'Gram', shortName: 'g', isActive: true } }),
    prisma.unit.create({ data: { name: 'Kilogram', shortName: 'kg', isActive: true } }),
    prisma.unit.create({ data: { name: 'Piece', shortName: 'pcs', isActive: true } }),
    prisma.unit.create({ data: { name: 'Pack', shortName: 'pk', isActive: true } }),
  ])
  console.log(`    ✅ ${units.length} units created`)

  // ==================== SUPPLIERS ====================
  console.log('  Creating suppliers...')
  const suppliers = await Promise.all([
    prisma.supplier.create({
      data: {
        businessName: 'Accra Wholesale Distributors',
        contactPerson: 'Mr. Osei Mensah',
        phone: '+233 24 500 1001',
        email: 'orders@accrawholesale.gh',
        address: 'Industrial Area, Accra',
        isActive: true,
      },
    }),
    prisma.supplier.create({
      data: {
        businessName: 'Kumasi Supply Chain Ltd',
        contactPerson: 'Ama Serwaa',
        phone: '+233 20 800 2002',
        email: 'info@kumasisc.gh',
        address: 'Kejetia Market, Kumasi',
        isActive: true,
      },
    }),
    prisma.supplier.create({
      data: {
        businessName: 'Tema Import Hub',
        contactPerson: 'Kofi Boateng',
        phone: '+233 27 300 3003',
        email: 'sales@temaimporthub.gh',
        address: 'Tema Harbour Road, Tema',
        isActive: true,
      },
    }),
  ])
  console.log(`    ✅ ${suppliers.length} suppliers created`)

  // ==================== PRODUCTS ====================
  console.log('  Creating products...')

  type ProductSeed = {
    name: string
    sku: string
    container?: string
    size?: string
    description: string | null
    categoryId: string | null
    productTypeId: string
    unitId: string
    costPrice: number
    sellingPrice: number
    wholesalePrice?: number
    packSize?: number
    taxEnabled: boolean
    taxRate: number
    stock: number
  }

  const ML = units[0].id
  const LITRE = units[1].id
  const KG = units[3].id
  const PIECE = units[4].id

  const productData: ProductSeed[] = [
    // A few similarly-named products so the restock picker's name grouping has
    // something to match on ("coca cola" -> the four below).
    { name: 'Coca-Cola', sku: 'BEV-COC-CAN-330', container: 'Can', size: '330ml', description: null, categoryId: categories[0].id, productTypeId: physicalType.id, unitId: ML, costPrice: 3.0, sellingPrice: 5.0, wholesalePrice: 4.0, packSize: 24, taxEnabled: true, taxRate: 12.5, stock: 120 },
    { name: 'Coca-Cola', sku: 'BEV-COC-CAN-500', container: 'Can', size: '500ml', description: null, categoryId: categories[0].id, productTypeId: physicalType.id, unitId: ML, costPrice: 4.0, sellingPrice: 6.5, wholesalePrice: 5.0, packSize: 12, taxEnabled: true, taxRate: 12.5, stock: 60 },
    { name: 'Coca-Cola', sku: 'BEV-COC-BTL-1500', container: 'Bottle', size: '1.5L', description: null, categoryId: categories[0].id, productTypeId: physicalType.id, unitId: LITRE, costPrice: 7.0, sellingPrice: 12.0, wholesalePrice: 9.0, packSize: 6, taxEnabled: true, taxRate: 12.5, stock: 40 },
    { name: 'Coca-Cola', sku: 'BEV-COC-GLS-330', container: 'Glass Bottle', size: '330ml', description: 'Returnable', categoryId: categories[0].id, productTypeId: physicalType.id, unitId: ML, costPrice: 2.5, sellingPrice: 4.5, wholesalePrice: 3.5, packSize: 24, taxEnabled: true, taxRate: 12.5, stock: 90 },

    { name: 'Voltic Water', sku: 'BEV-VOL-500', container: 'Bottle', size: '500ml', description: null, categoryId: categories[0].id, productTypeId: physicalType.id, unitId: ML, costPrice: 1.5, sellingPrice: 3.0, wholesalePrice: 2.0, packSize: 15, taxEnabled: false, taxRate: 0, stock: 200 },
    { name: 'Voltic Water', sku: 'BEV-VOL-1500', container: 'Bottle', size: '1.5L', description: null, categoryId: categories[0].id, productTypeId: physicalType.id, unitId: LITRE, costPrice: 3.0, sellingPrice: 5.5, wholesalePrice: 4.0, packSize: 6, taxEnabled: false, taxRate: 0, stock: 80 },

    { name: 'Sobolo Drink 1L', sku: 'BEV-SOB-001', description: 'Local hibiscus drink 1L', categoryId: categories[0].id, productTypeId: physicalType.id, unitId: LITRE, costPrice: 4.0, sellingPrice: 8.0, wholesalePrice: 6.0, taxEnabled: true, taxRate: 12.5, stock: 50 },
    { name: 'Chipsy Potato Chips', sku: 'SNK-CHP-001', description: 'Chipsy salted potato chips 75g', categoryId: categories[1].id, productTypeId: physicalType.id, unitId: PIECE, costPrice: 2.0, sellingPrice: 4.5, wholesalePrice: 3.0, packSize: 24, taxEnabled: false, taxRate: 0, stock: 80 },
    { name: 'Fan Milk Ice Cream', sku: 'SNK-ICM-001', description: 'Fan Milk FanYogo strawberry 180ml', categoryId: categories[1].id, productTypeId: physicalType.id, unitId: PIECE, costPrice: 2.5, sellingPrice: 5.0, wholesalePrice: 3.5, taxEnabled: false, taxRate: 0, stock: 60 },
    { name: 'Royal Rice', sku: 'GRC-RCE-5KG', container: 'Bag', size: '5kg', description: null, categoryId: categories[2].id, productTypeId: physicalType.id, unitId: KG, costPrice: 45.0, sellingPrice: 65.0, wholesalePrice: 55.0, taxEnabled: false, taxRate: 0, stock: 30 },
    { name: 'Royal Rice', sku: 'GRC-RCE-25KG', container: 'Bag', size: '25kg', description: null, categoryId: categories[2].id, productTypeId: physicalType.id, unitId: KG, costPrice: 210.0, sellingPrice: 290.0, wholesalePrice: 255.0, taxEnabled: false, taxRate: 0, stock: 12 },
    { name: 'Gino Tomato Paste', sku: 'GRC-TOM-001', description: 'Gino tomato paste 400g', categoryId: categories[2].id, productTypeId: physicalType.id, unitId: PIECE, costPrice: 3.5, sellingPrice: 6.0, wholesalePrice: 4.5, packSize: 24, taxEnabled: false, taxRate: 0, stock: 100 },
    { name: 'Ideal Milk Powder 500g', sku: 'GRC-MLK-001', description: 'Ideal full cream milk powder 500g', categoryId: categories[2].id, productTypeId: physicalType.id, unitId: PIECE, costPrice: 25.0, sellingPrice: 38.0, wholesalePrice: 30.0, packSize: 12, taxEnabled: false, taxRate: 0, stock: 25 },
    { name: 'Pepsodent Toothpaste', sku: 'PCD-TPA-001', description: 'Pepsodent Cavity Protection toothpaste 150g', categoryId: categories[3].id, productTypeId: physicalType.id, unitId: PIECE, costPrice: 5.0, sellingPrice: 9.0, wholesalePrice: 7.0, taxEnabled: false, taxRate: 0, stock: 40 },
    { name: 'Parazone Bleach 1L', sku: 'HSE-BLC-001', description: 'Parazone multi-surface bleach 1L', categoryId: categories[4].id, productTypeId: physicalType.id, unitId: LITRE, costPrice: 6.0, sellingPrice: 12.0, wholesalePrice: 9.0, taxEnabled: false, taxRate: 0, stock: 20 },
    { name: 'Key Soap 450g', sku: 'HSE-SOP-001', description: 'Key soap bar 450g', categoryId: categories[4].id, productTypeId: physicalType.id, unitId: PIECE, costPrice: 4.0, sellingPrice: 8.0, wholesalePrice: 6.0, packSize: 12, taxEnabled: false, taxRate: 0, stock: 50 },
    { name: 'Delivery Service', sku: 'SVC-DEL-001', description: 'Local delivery within 5km radius', categoryId: null, productTypeId: serviceType.id, unitId: PIECE, costPrice: 0, sellingPrice: 15.0, taxEnabled: true, taxRate: 12.5, stock: 0 },
  ]

  let productCount = 0
  for (const prod of productData) {
    const { stock, ...fields } = prod
    const product = await prisma.product.create({
      data: {
        ...fields,
        isActive: true,
        targetStock: stock > 0 ? stock : null,
        lowStockPercent: 20,
      },
    })
    productCount++

    if (prod.productTypeId === physicalType.id && stock > 0) {
      const inv = await prisma.inventory.create({
        data: { productId: product.id, quantity: stock },
      })
      await prisma.inventoryMovement.create({
        data: {
          inventoryId: inv.id,
          productId: product.id,
          type: 'initial_stock',
          quantity: stock,
          note: 'Opening stock (seed)',
        },
      })
    }
  }
  console.log(`    ✅ ${productCount} products created with inventory`)

  // ==================== CUSTOMERS ====================
  console.log('  Creating customers...')
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        name: 'Akosua Frimpong',
        phone: '+233 24 500 5001',
        email: 'akosua.f@email.com',
        address: 'East Legon, Accra',
        isActive: true,
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Emmanuel Agyeman',
        phone: '+233 20 600 6002',
        email: 'emmanuel.a@email.com',
        address: 'Madina, Accra',
        isActive: true,
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Walk-in Customer',
        phone: '',
        email: '',
        address: '',
        isActive: true,
      },
    }),
  ])
  console.log(`    ✅ ${customers.length} customers created`)

  // ==================== EXPENSE CATEGORIES ====================
  console.log('  Creating expense categories...')
  const expenseCategories = await Promise.all([
    prisma.expenseCategory.create({
      data: {
        name: 'Rent',
        description: 'Shop rent and lease payments',
        isActive: true,
      },
    }),
    prisma.expenseCategory.create({
      data: {
        name: 'Utilities',
        description: 'Electricity, water, and internet',
        isActive: true,
      },
    }),
    prisma.expenseCategory.create({
      data: {
        name: 'Transportation',
        description: 'Delivery and logistics costs',
        isActive: true,
      },
    }),
    prisma.expenseCategory.create({
      data: {
        name: 'Salary',
        description: 'Staff wages and salaries',
        isActive: true,
      },
    }),
  ])
  console.log(`    ✅ ${expenseCategories.length} expense categories created`)

  console.log('\n🎉 Seed completed successfully!')
  console.log('\n📋 Login credentials:')
  console.log('   Admin:     admin@pos.com / admin123')
  console.log('   Sales:     sales@pos.com / sales123')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
