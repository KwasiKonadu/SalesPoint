/**
 * Orders placed on the public website. Prices, stock, delivery fees and the free-delivery rule are all
 * worked out here, on the server, from SalesPoint's own data — never from what the browser says.
 */
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { effectivePrice } from '@/lib/pricing'
import { packOffer, loadPromises, minor } from '@/lib/public-catalog'
import { productLabel } from '@/lib/products'
import { nextReceiptNumber, nextTransactionNumber } from '@/lib/sale-numbers'

export const ORDER_STATUSES = [
  'pending_confirmation',
  'confirmed',
  'processing',
  'ready_for_pickup',
  'out_for_delivery',
  'completed',
  'cancelled',
] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]

// Bank transfer comes later; for now customers pay in the shop when they collect.
export const PAYMENT_METHODS = ['on_delivery'] as const

/** How the customer actually paid, recorded on the sale when the order is completed. */
export const SALE_PAYMENT_METHODS = ['cash', 'mobile_money', 'card'] as const

/** Statuses a customer may cancel from on their own. */
export const CUSTOMER_CANCELLABLE: OrderStatus[] = ['pending_confirmation', 'confirmed']

/** The next steps staff can take from each status. */
export function nextStatuses(status: string, fulfilment: string): OrderStatus[] {
  switch (status) {
    case 'pending_confirmation':
      return ['confirmed', 'cancelled']
    case 'confirmed':
      return ['processing', 'cancelled']
    case 'processing':
      return [fulfilment === 'pickup' ? 'ready_for_pickup' : 'out_for_delivery', 'cancelled']
    case 'ready_for_pickup':
    case 'out_for_delivery':
      return ['completed', 'cancelled']
    default:
      return []
  }
}

/** Most lines, and most of one item, a single order may hold. Real baskets are far smaller. */
export const MAX_LINES = 40
export const MAX_QTY_PER_LINE = 200
/** Orders one phone number may have waiting for confirmation at once, so nobody can tie up stock with fake orders. */
export const OPEN_ORDERS_PER_PHONE = 3

export class OrderError extends Error {
  constructor(message: string, public status = 400, public issues?: { name: string; reason: string }[]) {
    super(message)
  }
}

type HistoryEntry = { status: string; at: number; note: string }

const REF_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
const newRef = () => 'W-' + Array.from({ length: 6 }, () => REF_ALPHABET[Math.floor(Math.random() * REF_ALPHABET.length)]).join('')

const isEmail = (v: unknown) => typeof v === 'string' && /^\S+@\S+\.\S+$/.test(v.trim())
const digits = (v: unknown) => String(v ?? '').replace(/\D/g, '')
const isPhone = (v: unknown) => digits(v).length >= 9
/** Same number if the last nine digits match (ignores +233 / 0 prefixes). */
export const samePhone = (a: unknown, b: unknown) => digits(a).length >= 9 && digits(a).slice(-9) === digits(b).slice(-9)
const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

export interface OrderInput {
  /** Set by the route from the sign-in token, never from the request body. */
  accountId?: string | null
  idempotencyKey?: string
  items?: { productId?: string; variantId?: string | null; qty?: number }[]
  contact?: { name?: string; email?: string; phone?: string }
  fulfilment?: string
  areaId?: string
  address?: Record<string, unknown> | null
  instructions?: string
  paymentMethod?: string
}

const orderInclude = { items: true } as const
type OrderRow = Prisma.WebOrderGetPayload<{ include: typeof orderInclude }>

/** The shape the storefront already uses for an order; money in minor units, time in ms. */
export function toPublicOrder(o: OrderRow) {
  return {
    id: o.id,
    ref: o.ref,
    createdAt: o.createdAt.getTime(),
    status: o.status,
    paymentStatus: o.paymentStatus,
    paymentMethod: o.paymentMethod,
    fulfilment: o.fulfilment,
    areaId: o.areaId,
    contact: { name: o.customerName, email: o.customerEmail, phone: o.customerPhone },
    address: o.address ?? null,
    instructions: o.instructions ?? '',
    items: o.items.map((i) => ({
      productId: i.productId,
      name: i.name,
      sku: i.sku ?? '',
      variantLabel: i.variantLabel ?? undefined,
      unitPrice: minor(i.unitPrice),
      qty: i.qty,
      lineTotal: minor(i.lineTotal),
      image: i.image ?? '',
      units: i.units,
    })),
    subtotal: minor(o.subtotal),
    deliveryFee: minor(o.deliveryFee),
    total: minor(o.total),
    statusHistory: (o.history as HistoryEntry[]) ?? [],
  }
}

export async function createWebOrder(input: OrderInput) {
  const key = text(input.idempotencyKey, 80)
  if (!key) throw new OrderError('Missing order key.')
  const existing = await db.webOrder.findUnique({ where: { idempotencyKey: key }, include: orderInclude })
  if (existing) return existing // a retry or double-click returns the same order

  if ((input.items ?? []).length > MAX_LINES) throw new OrderError(`An order can have at most ${MAX_LINES} different items.`)
  if ((input.items ?? []).some((i) => (i.qty ?? 0) > MAX_QTY_PER_LINE)) throw new OrderError(`You can order at most ${MAX_QTY_PER_LINE} of one item online. Please contact the shop for larger orders.`)
  const wanted = (input.items ?? []).filter((i) => i.productId && Number.isInteger(i.qty) && (i.qty ?? 0) > 0)
  if (!wanted.length) throw new OrderError('Your cart is empty.')

  const contact = { name: text(input.contact?.name, 120), email: text(input.contact?.email, 160), phone: text(input.contact?.phone, 40) }
  if (!contact.name || !isEmail(contact.email) || !isPhone(contact.phone)) {
    throw new OrderError('Please complete your contact details before placing the order.')
  }
  if (!PAYMENT_METHODS.includes(input.paymentMethod as (typeof PAYMENT_METHODS)[number])) throw new OrderError('Please choose a payment method.')
  if (input.fulfilment !== 'delivery' && input.fulfilment !== 'pickup') throw new OrderError('Please choose delivery or pickup.')

  // Don't let one person park the shop's stock behind a pile of unconfirmed orders.
  const waiting = await db.webOrder.findMany({ where: { status: 'pending_confirmation', createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }, select: { customerPhone: true } })
  if (waiting.filter((w) => samePhone(w.customerPhone, contact.phone)).length >= OPEN_ORDERS_PER_PHONE) {
    throw new OrderError('You already have orders waiting for confirmation. Please wait for the shop to confirm them, or cancel one, before placing another.', 429)
  }

  const now = new Date()
  const products = await db.product.findMany({
    where: { id: { in: [...new Set(wanted.map((w) => w.productId!))] }, isActive: true, showOnWebsite: true },
    include: { inventory: true, productType: true },
  })
  const byId = new Map(products.map((p) => [p.id, p]))

  // Price every line from our own data and check stock across the whole order.
  const issues: { name: string; reason: string }[] = []
  const lines: { productId: string; name: string; sku: string; image: string | null; variantLabel: string | null; unitPrice: number; qty: number; units: number }[] = []
  const unitsByProduct = new Map<string, number>()
  for (const w of wanted) {
    const p = byId.get(w.productId!)
    if (!p) {
      issues.push({ name: 'An item', reason: 'No longer available — removed from your cart' })
      continue
    }
    const offer = w.variantId === 'pack' ? packOffer(p, now) : null
    if (w.variantId === 'pack' && !offer) {
      issues.push({ name: productLabel(p), reason: 'The pack is no longer offered — please choose the single item' })
      continue
    }
    const per = offer?.size ?? 1
    lines.push({
      productId: p.id,
      name: productLabel(p),
      sku: p.sku,
      image: p.image ?? p.images[0] ?? null,
      variantLabel: offer ? `Pack of ${offer.size}` : null,
      unitPrice: offer ? offer.total : effectivePrice(p, now, 'web'),
      qty: w.qty!,
      units: w.qty! * per,
    })
    unitsByProduct.set(p.id, (unitsByProduct.get(p.id) ?? 0) + w.qty! * per)
  }
  for (const [id, units] of unitsByProduct) {
    const p = byId.get(id)!
    if (p.productType?.tracksStock === false) continue
    const have = Math.max(p.inventory?.quantity ?? 0, 0)
    if (units > have) issues.push({ name: productLabel(p), reason: have > 0 ? `Only ${have} in stock — quantity reduced` : 'Out of stock — removed from your cart' })
  }
  if (issues.length) throw new OrderError('Some items need your attention — we updated your cart.', 409, issues)

  const subtotal = Math.round(lines.reduce((s, l) => s + l.unitPrice * l.qty, 0) * 100) / 100

  // Delivery or pickup, against what the shop has promised on the website.
  const promises = await loadPromises()
  let deliveryFee = 0
  let area: { id: string; name: string } | null = null
  let address: Record<string, unknown> | null = null
  if (input.fulfilment === 'pickup') {
    if (!promises.pickup.enabled) throw new OrderError('Pickup is not available right now.')
  } else {
    const a = promises.deliveryAreas.find((x) => x.id === input.areaId)
    if (!a || a.fee == null) throw new OrderError('We don’t deliver to the selected area yet. Please choose pickup or a listed area.')
    const ad = input.address
    if (!ad || !text(ad.name, 120) || !text(ad.line1, 200) || !text(ad.city, 100) || !isPhone(ad.phone)) {
      throw new OrderError('Please complete the delivery address details.')
    }
    area = { id: a.id, name: a.name }
    address = {
      label: text(ad.label, 40),
      name: text(ad.name, 120),
      phone: text(ad.phone, 40),
      line1: text(ad.line1, 200),
      line2: text(ad.line2, 200),
      city: text(ad.city, 100),
      postal: text(ad.postal, 20),
      areaId: a.id,
    }
    const free = promises.freeDeliveryThreshold != null && minor(subtotal) >= promises.freeDeliveryThreshold
    deliveryFee = free ? 0 : a.fee / 100
  }

  const ref = await (async () => {
    for (;;) {
      const r = newRef()
      if (!(await db.webOrder.findUnique({ where: { ref: r }, select: { id: true } }))) return r
    }
  })()
  const history: HistoryEntry[] = [{ status: 'pending_confirmation', at: now.getTime(), note: 'Order placed — awaiting confirmation from the store' }]

  try {
    return await db.$transaction(async (tx) => {
      // Take the stock; the guard makes two orders for the last item impossible.
      for (const [id, units] of unitsByProduct) {
        const p = byId.get(id)!
        if (p.productType?.tracksStock === false || !p.inventory) continue
        const taken = await tx.inventory.updateMany({ where: { productId: id, quantity: { gte: units } }, data: { quantity: { decrement: units } } })
        if (taken.count === 0) throw new OrderError('Some items just ran out of stock. Please review your cart.', 409, [{ name: productLabel(p), reason: 'Just sold out' }])
        await tx.inventoryMovement.create({ data: { inventoryId: p.inventory.id, productId: id, type: 'sale', quantity: units, note: `Website order ${ref}` } })
      }
      return tx.webOrder.create({
        data: {
          ref,
          idempotencyKey: key,
          accountId: input.accountId ?? null,
          paymentMethod: input.paymentMethod!,
          fulfilment: input.fulfilment!,
          areaId: area?.id ?? null,
          areaName: area?.name ?? null,
          customerName: contact.name,
          customerEmail: contact.email,
          customerPhone: contact.phone,
          address: address ? (address as Prisma.InputJsonValue) : Prisma.DbNull,
          instructions: text(input.instructions, 500) || null,
          subtotal,
          deliveryFee,
          total: Math.round((subtotal + deliveryFee) * 100) / 100,
          history: history as unknown as Prisma.InputJsonValue,
          items: { create: lines.map((l) => ({ ...l, lineTotal: Math.round(l.unitPrice * l.qty * 100) / 100 })) },
        },
        include: orderInclude,
      })
    })
  } catch (e) {
    // Two requests with the same key at once: the loser gets the winner's order.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      const again = await db.webOrder.findUnique({ where: { idempotencyKey: key }, include: orderInclude })
      if (again) return again
    }
    throw e
  }
}

/** Move an order to a new status (or mark it paid). Cancelling puts the stock back. */
export async function updateWebOrder(
  id: string,
  change: { status?: string; paymentStatus?: string; note?: string; paymentMethod?: string; staffId?: string },
  allowed?: (current: OrderRow) => OrderStatus[],
) {
  return db.$transaction(async (tx) => {
    const o = await tx.webOrder.findUnique({ where: { id }, include: orderInclude })
    if (!o) throw new OrderError('Order not found.', 404)
    const history = [...((o.history as HistoryEntry[]) ?? [])]
    const data: Prisma.WebOrderUpdateInput = {}

    if (change.paymentStatus) {
      if (!['pending', 'paid'].includes(change.paymentStatus)) throw new OrderError('Unknown payment status.')
      data.paymentStatus = change.paymentStatus
      if (change.paymentStatus !== o.paymentStatus) history.push({ status: o.status, at: Date.now(), note: change.paymentStatus === 'paid' ? 'Payment received' : 'Payment marked as not received' })
    }

    if (change.status && change.status !== o.status) {
      const ok = (allowed ? allowed(o) : nextStatuses(o.status, o.fulfilment)) as string[]
      if (!ok.includes(change.status)) throw new OrderError(`This order can’t move from ${o.status.replace(/_/g, ' ')} to ${change.status.replace(/_/g, ' ')}.`)
      data.status = change.status
      history.push({ status: change.status, at: Date.now(), note: change.note?.trim() || (change.status === 'cancelled' ? 'Order cancelled' : `Order ${change.status.replace(/_/g, ' ')}`) })
      if (change.status === 'completed') {
        // Handed over and paid: count it as a sale, so reports, the dashboard and customer history include it.
        // Stock was already taken when the order was placed, so nothing more is deducted here.
        if (!change.staffId) throw new OrderError('Sign in to complete an order.', 401)
        const method = SALE_PAYMENT_METHODS.find((m) => m === change.paymentMethod) ?? 'cash'
        const sale = await recordSale(tx, o, change.staffId, method)
        data.saleId = sale.id
        data.paymentStatus = 'paid'
        if (o.paymentStatus !== 'paid') history.push({ status: 'completed', at: Date.now(), note: 'Payment received' })
      }
      if (change.status === 'cancelled') {
        for (const item of o.items) {
          const inv = await tx.inventory.findUnique({ where: { productId: item.productId }, include: { product: { include: { productType: true } } } })
          if (!inv || inv.product.productType?.tracksStock === false) continue
          await tx.inventory.update({ where: { productId: item.productId }, data: { quantity: { increment: item.units } } })
          await tx.inventoryMovement.create({ data: { inventoryId: inv.id, productId: item.productId, type: 'return', quantity: item.units, note: `Website order ${o.ref} cancelled`, referenceId: o.id } })
        }
      }
    }
    data.history = history as unknown as Prisma.InputJsonValue
    return tx.webOrder.update({ where: { id }, data, include: orderInclude })
  })
}

/** Turn a completed website order into a Sale (same shape the till makes). */
async function recordSale(tx: Prisma.TransactionClient, o: OrderRow, staffId: string, method: string) {
  const seller = await tx.user.findUnique({ where: { id: staffId }, select: { id: true } })
  if (!seller) throw new OrderError('Your session is out of date — log out and back in.', 400)

  // Link the buyer to a customer record (by phone) so their purchases show up in Customers.
  const customers = await tx.customer.findMany({ where: { phone: { not: null } }, select: { id: true, phone: true } })
  const existing = customers.find((c) => samePhone(c.phone, o.customerPhone))
  const customerId =
    existing?.id ??
    (await tx.customer.create({ data: { name: o.customerName, phone: o.customerPhone, email: o.customerEmail, notes: 'Created from a website order' } })).id

  const products = await tx.product.findMany({ where: { id: { in: o.items.map((i) => i.productId) } }, select: { id: true, costPrice: true } })
  const cost = new Map(products.map((p) => [p.id, p.costPrice]))
  const total = o.total
  const [transactionNumber, receiptNumber] = [await nextTransactionNumber(tx), await nextReceiptNumber(tx)]

  return tx.sale.create({
    data: {
      transactionNumber,
      customerId,
      soldById: seller.id,
      subtotal: o.subtotal,
      discountAmount: 0,
      taxAmount: 0,
      totalAmount: total,
      paymentMethod: method,
      paymentStatus: 'completed',
      amountReceived: total,
      changeAmount: 0,
      status: 'completed',
      notes: `Website order ${o.ref}${o.deliveryFee ? ` (includes delivery ${o.deliveryFee})` : ''}`,
      // Sale lines are in single units, like the till: a pack of 6 is 6 units at the per-unit pack price.
      items: {
        create: o.items.map((i) => ({
          productId: i.productId,
          productName: i.name,
          quantity: i.units,
          unitPrice: Math.round((i.lineTotal / i.units) * 100) / 100,
          costPrice: cost.get(i.productId) ?? 0,
          taxAmount: 0,
          subtotal: i.lineTotal,
        })),
      },
      payment: { create: { method, amount: total, amountReceived: total, changeAmount: 0, status: 'completed' } },
      receipt: { create: { receiptNumber } },
    },
  })
}
