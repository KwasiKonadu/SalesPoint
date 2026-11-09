/** Website return requests: a customer asks, the shop decides. Money and stock are handled by the shop. */
import type { WebReturn } from '@prisma/client'
import { db } from '@/lib/db'
import { loadPromises } from '@/lib/public-catalog'
import { AccountError } from '@/lib/web-accounts'

export const RETURN_STATUSES = ['requested', 'approved', 'rejected', 'completed'] as const
export type ReturnStatus = (typeof RETURN_STATUSES)[number]

/** Where a request may go next. */
export const RETURN_NEXT: Record<string, ReturnStatus[]> = {
  requested: ['approved', 'rejected'],
  approved: ['completed', 'rejected'],
  rejected: [],
  completed: [],
}

export const RETURN_REASONS = ['Arrived damaged', 'Not as described', 'Changed my mind', 'Wrong item received', 'Other']

type ReturnItem = { productId: string; name: string; qty: number }

export function toPublicReturn(r: WebReturn, customerId: string) {
  return {
    id: r.id,
    ref: r.orderRef,
    customerId,
    orderId: r.orderId,
    items: r.items as ReturnItem[],
    reason: r.reason,
    notes: r.notes,
    status: r.status,
    staffNote: r.staffNote,
    createdAt: r.createdAt.getTime(),
  }
}

/** Creates the request for one of this customer's completed orders. */
export async function createReturn(
  accountId: string,
  input: { ref: unknown; items: unknown; reason: unknown; notes: unknown },
): Promise<WebReturn> {
  const ref = typeof input.ref === 'string' ? input.ref : ''
  const order = await db.webOrder.findFirst({ where: { ref, accountId }, include: { items: true } })
  if (!order) throw new AccountError('Order not found.', 404)
  if (order.status !== 'completed') throw new AccountError('Returns can be requested on completed orders.')
  if (await db.webReturn.findUnique({ where: { orderId: order.id } })) throw new AccountError('A return request already exists for this order.', 409)

  // Time limit: the store's own "returns within N days" promise, counted from completion.
  const { returnDays } = await loadPromises()
  if (returnDays === null) throw new AccountError('This store is not taking return requests online. Please contact us.')
  const history = (order.history as { status: string; at: number }[]) ?? []
  const completedAt = [...history].reverse().find((h) => h.status === 'completed')?.at ?? order.updatedAt.getTime()
  if (Date.now() > completedAt + returnDays * 86_400_000) throw new AccountError(`Returns must be requested within ${returnDays} days of collecting your order.`)

  // Quantities per product can't exceed what was ordered.
  const ordered = new Map<string, { name: string; qty: number }>()
  for (const li of order.items) {
    const cur = ordered.get(li.productId)
    ordered.set(li.productId, { name: li.name, qty: (cur?.qty ?? 0) + li.qty })
  }
  const asked = Array.isArray(input.items) ? (input.items as { productId?: unknown; qty?: unknown }[]) : []
  const items: ReturnItem[] = []
  for (const a of asked) {
    const qty = Math.floor(Number(a.qty))
    if (!(qty > 0)) continue
    const line = typeof a.productId === 'string' ? ordered.get(a.productId) : undefined
    if (!line || qty > line.qty) throw new AccountError('Return quantities can’t exceed what you ordered.')
    if (items.some((i) => i.productId === a.productId)) throw new AccountError('Each item can only be listed once.')
    items.push({ productId: a.productId as string, name: line.name, qty })
  }
  if (!items.length) throw new AccountError('Select at least one item and quantity to return.')

  const reason = typeof input.reason === 'string' ? input.reason.trim().slice(0, 80) : ''
  if (!reason) throw new AccountError('Please choose a reason for the return.')
  const notes = typeof input.notes === 'string' ? input.notes.trim().slice(0, 500) : ''

  return db.webReturn.create({ data: { orderId: order.id, orderRef: order.ref, accountId, items, reason, notes } })
}

export class ReturnError extends Error {
  constructor(message: string, public status = 400) {
    super(message)
  }
}

/** Staff decision on a request. */
export async function updateReturn(id: string, input: { status?: unknown; staffNote?: unknown }): Promise<WebReturn> {
  const current = await db.webReturn.findUnique({ where: { id } })
  if (!current) throw new ReturnError('Return request not found.', 404)
  const data: { status?: string; staffNote?: string; decidedAt?: Date } = {}
  if (typeof input.staffNote === 'string') data.staffNote = input.staffNote.trim().slice(0, 500)
  if (input.status !== undefined && input.status !== current.status) {
    const next = String(input.status)
    if (!(RETURN_NEXT[current.status] ?? []).includes(next as ReturnStatus)) throw new ReturnError(`A ${current.status} request can’t be changed to ${next}.`)
    data.status = next
    data.decidedAt = new Date()
  }
  return db.webReturn.update({ where: { id }, data })
}
