import type { db } from '@/lib/db'

type Tx = Parameters<Parameters<typeof db.$transaction>[0]>[0]

const today = () => new Date().toISOString().slice(0, 10).replace(/-/g, '')

/** Next TXN-YYYYMMDD-0001 style number for today. */
export async function nextTransactionNumber(tx: Tx): Promise<string> {
  const prefix = `TXN-${today()}-`
  const last = await tx.sale.findFirst({
    where: { transactionNumber: { startsWith: prefix } },
    orderBy: { transactionNumber: 'desc' },
    select: { transactionNumber: true },
  })
  const next = last ? parseInt(last.transactionNumber.slice(prefix.length), 10) + 1 : 1
  return `${prefix}${String(next).padStart(4, '0')}`
}

/** Next RCP-YYYYMMDD-0001 style number for today. */
export async function nextReceiptNumber(tx: Tx): Promise<string> {
  const prefix = `RCP-${today()}-`
  const last = await tx.receipt.findFirst({
    where: { receiptNumber: { startsWith: prefix } },
    orderBy: { receiptNumber: 'desc' },
    select: { receiptNumber: true },
  })
  const next = last ? parseInt(last.receiptNumber.slice(prefix.length), 10) + 1 : 1
  return `${prefix}${String(next).padStart(4, '0')}`
}
