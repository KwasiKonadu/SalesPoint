/**
 * Bulk product import: validates every row against the database, then creates
 * all of them in one go (all or nothing) so a failed import never leaves a mess.
 */
import { randomUUID } from 'node:crypto'
import { db } from '@/lib/db'
import { slugify } from '@/lib/website'
import type { RawProductRow } from '@/lib/csv'

export const BULK_LIMIT = 1000

export interface RowResult {
  /** 1-based spreadsheet row number, counting the header as row 1. */
  row: number
  name: string
  errors: string[]
}

interface Prepared {
  id: string
  data: {
    name: string; sku: string; slug: string; container: string | null; size: string | null
    description: string | null; image: string | null; categoryId: string | null
    productTypeId: string | null; unitId: string | null; costPrice: number
    sellingPrice: number; wholesalePrice: number | null; packSize: number | null
    targetStock: number | null; showOnWebsite: boolean
  }
  stock: number
  tracksStock: boolean
}

const num = (v: string | undefined) => {
  if (v === undefined || v.trim() === '') return null
  const n = Number(v.replace(/[^0-9.\-]/g, ''))
  return Number.isFinite(n) && /\d/.test(v) ? n : NaN
}
const yes = (v: string | undefined) => /^(y|yes|true|1|x)$/i.test((v ?? '').trim())

function generateSku(name: string, taken: Set<string>): string {
  const base = (name || 'SKU').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4) || 'SKU'
  for (;;) {
    const sku = `${base}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
    if (!taken.has(sku)) return sku
  }
}

export async function prepareBulk(rows: RawProductRow[]) {
  const [categories, types, units, products] = await Promise.all([
    db.productCategory.findMany({ select: { id: true, name: true } }),
    db.productType.findMany({ select: { id: true, name: true, tracksStock: true } }),
    db.unit.findMany({ select: { id: true, name: true, shortName: true } }),
    db.product.findMany({ select: { sku: true, slug: true } }),
  ])
  const byName = <T extends { name: string }>(list: T[], v: string) => list.find((x) => x.name.toLowerCase() === v.trim().toLowerCase())
  const skus = new Set(products.map((p) => p.sku.toLowerCase()))
  const slugs = new Set(products.map((p) => p.slug).filter((s): s is string => !!s))

  const results: RowResult[] = []
  const prepared: Prepared[] = []

  rows.forEach((r, i) => {
    const errors: string[] = []
    const name = (r.name ?? '').trim()
    if (!name) errors.push('Name is required')

    const selling = num(r.sellingPrice)
    if (selling === null || Number.isNaN(selling) || selling <= 0) errors.push('Selling price must be a number above 0')
    const cost = num(r.costPrice) ?? 0
    if (Number.isNaN(cost) || cost < 0) errors.push('Cost price must be 0 or more')
    const wholesale = num(r.wholesalePrice)
    if (Number.isNaN(wholesale) || (wholesale !== null && wholesale < 0)) errors.push('Wholesale price must be 0 or more')
    const pack = num(r.packSize)
    if (Number.isNaN(pack) || (pack !== null && (!Number.isInteger(pack) || pack < 0))) errors.push('Pack size must be a whole number')
    const stock = num(r.initialStock) ?? 0
    if (Number.isNaN(stock) || stock < 0 || !Number.isInteger(stock)) errors.push('Initial stock must be a whole number')

    const cat = r.category?.trim() ? byName(categories, r.category) : undefined
    if (r.category?.trim() && !cat) errors.push(`Category "${r.category}" doesn't exist`)
    const type = r.type?.trim() ? byName(types, r.type) : undefined
    if (r.type?.trim() && !type) errors.push(`Type "${r.type}" doesn't exist`)
    const unitKey = r.unit?.trim().toLowerCase()
    const unit = unitKey ? units.find((u) => u.name.toLowerCase() === unitKey || (u.shortName ?? '').toLowerCase() === unitKey) : undefined
    if (unitKey && !unit) errors.push(`Unit "${r.unit}" doesn't exist`)

    let sku = (r.sku ?? '').trim()
    if (sku) {
      if (skus.has(sku.toLowerCase())) errors.push(`SKU "${sku}" is already used`)
      else skus.add(sku.toLowerCase())
    } else if (name) {
      sku = generateSku(name, skus)
      skus.add(sku.toLowerCase())
    }

    results.push({ row: i + 2, name, errors })
    if (errors.length) return

    let slug = slugify(name, r.container, r.size)
    const base = slug
    for (let n = 2; slugs.has(slug); n++) slug = `${base}-${n}`
    slugs.add(slug)

    const tracksStock = type?.tracksStock ?? true
    prepared.push({
      id: randomUUID(),
      stock,
      tracksStock,
      data: {
        name, sku, slug,
        container: r.container?.trim() || null,
        size: r.size?.trim() || null,
        description: r.description?.trim() || null,
        image: r.image?.trim() || null,
        categoryId: cat?.id ?? null,
        productTypeId: type?.id ?? null,
        unitId: unit?.id ?? null,
        costPrice: cost,
        sellingPrice: selling as number,
        wholesalePrice: wholesale,
        packSize: pack || null,
        targetStock: tracksStock && stock > 0 ? stock : null,
        showOnWebsite: yes(r.showOnWebsite),
      },
    })
  })

  return { results, prepared }
}

/** Creates the prepared products, their stock records and opening-stock movements together. */
export async function createBulk(prepared: Prepared[]) {
  await db.$transaction(
    async (tx) => {
      await tx.product.createMany({ data: prepared.map((p) => ({ id: p.id, ...p.data })) })
      const stocked = prepared.filter((p) => p.tracksStock).map((p) => ({ ...p, inventoryId: randomUUID() }))
      await tx.inventory.createMany({ data: stocked.map((p) => ({ id: p.inventoryId, productId: p.id, quantity: p.stock })) })
      await tx.inventoryMovement.createMany({
        data: stocked
          .filter((p) => p.stock > 0)
          .map((p) => ({ inventoryId: p.inventoryId, productId: p.id, type: 'initial_stock', quantity: p.stock, note: 'Initial stock from bulk import' })),
      })
    },
    { timeout: 60_000, maxWait: 10_000 },
  )
}
