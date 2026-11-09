import type { Prisma } from '@prisma/client'

/**
 * Stock batches: every restock line is a lot with its own expiry date.
 * `Inventory.quantity` stays the product total (= sum of its batches'
 * `remaining`); these helpers keep the batches in step with it. Sales draw
 * from the earliest expiry first (FEFO), non-expiring stock last.
 */

type Tx = Pick<Prisma.TransactionClient, 'stockBatch' | 'inventoryMovement'>

export type Allocation = { batchId: string; qty: number }

const startOfToday = () => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

/** Record a received lot. */
export async function addBatch(
  tx: Tx,
  b: { productId: string; quantity: number; expiryDate?: Date | null; restockItemId?: string | null; label?: string | null },
) {
  if (b.quantity <= 0) return null
  return tx.stockBatch.create({
    data: {
      productId: b.productId,
      restockItemId: b.restockItemId ?? null,
      label: b.label ?? null,
      expiryDate: b.expiryDate ?? null,
      received: b.quantity,
      remaining: b.quantity,
    },
  })
}

/**
 * Take `qty` units out of a product's batches, earliest expiry first (in-date
 * batches before already-expired ones). With `batchId`, takes only from that
 * batch and throws if it has too little. Any shortfall (stock that predates
 * batches) is ignored — `Inventory.quantity` remains the source of truth for
 * whether a sale may proceed. Returns where the units came from.
 */
export async function takeFromBatches(
  tx: Tx,
  productId: string,
  qty: number,
  opts: { batchId?: string } = {},
): Promise<Allocation[]> {
  if (qty <= 0) return []

  if (opts.batchId) {
    const done = await tx.stockBatch.updateMany({
      where: { id: opts.batchId, productId, remaining: { gte: qty } },
      data: { remaining: { decrement: qty } },
    })
    if (done.count === 0) throw new Error('Insufficient stock in that batch')
    return [{ batchId: opts.batchId, qty }]
  }

  const today = startOfToday()
  const batches = await tx.stockBatch.findMany({ where: { productId, remaining: { gt: 0 } } })
  const rank = (b: { expiryDate: Date | null }) => (b.expiryDate && b.expiryDate < today ? 1 : 0)
  batches.sort(
    (a, b) =>
      rank(a) - rank(b) ||
      (a.expiryDate?.getTime() ?? Infinity) - (b.expiryDate?.getTime() ?? Infinity) ||
      a.createdAt.getTime() - b.createdAt.getTime(),
  )

  const taken: Allocation[] = []
  let left = qty
  for (const b of batches) {
    if (left <= 0) break
    const take = Math.min(b.remaining, left)
    // Guarded so a concurrent sale can't push `remaining` below zero.
    const done = await tx.stockBatch.updateMany({
      where: { id: b.id, remaining: { gte: take } },
      data: { remaining: { decrement: take } },
    })
    if (done.count === 0) continue
    taken.push({ batchId: b.id, qty: take })
    left -= take
  }
  return taken
}

/**
 * Put `qty` units back (a return or cancelled order). If the original
 * deduction is identified by `movementWhere`, units go back to the batches
 * they came from; anything left over goes into an undated "Returned stock"
 * batch.
 */
export async function restoreToBatches(
  tx: Tx,
  productId: string,
  qty: number,
  movementWhere?: Prisma.InventoryMovementWhereInput,
) {
  let left = qty
  if (movementWhere) {
    const moves = await tx.inventoryMovement.findMany({ where: { ...movementWhere, productId, type: 'sale' } })
    const allocations = moves.flatMap((m) => (Array.isArray(m.batches) ? (m.batches as Allocation[]) : []))
    for (const a of allocations.reverse()) {
      if (left <= 0) break
      const batch = await tx.stockBatch.findUnique({ where: { id: a.batchId } })
      if (!batch) continue
      const give = Math.min(a.qty, batch.received - batch.remaining, left)
      if (give <= 0) continue
      await tx.stockBatch.update({ where: { id: batch.id }, data: { remaining: { increment: give } } })
      left -= give
    }
  }
  if (left > 0) await addBatch(tx, { productId, quantity: left, label: 'Returned stock' })
}
