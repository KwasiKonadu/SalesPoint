import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { AccountError, publicAddress, requireAccount } from '@/lib/web-accounts'
import { addressData, respond } from '@/lib/web-account-http'

type Ctx = { params: Promise<{ id: string }> }

// Update an address, or just make it the default with `{ "isDefault": true }`.
export const PUT = (req: NextRequest, { params }: Ctx) =>
  respond(async () => {
    const account = await requireAccount(req)
    const { id } = await params
    const existing = await db.webAddress.findFirst({ where: { id, accountId: account.id } })
    if (!existing) throw new AccountError('Address not found.', 404)
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
    const onlyDefault = Object.keys(body).length === 1 && body.isDefault === true
    const data = onlyDefault ? null : addressData(body)
    const updated = await db.$transaction(async (tx) => {
      if (body.isDefault === true) await tx.webAddress.updateMany({ where: { accountId: account.id }, data: { isDefault: false } })
      return tx.webAddress.update({ where: { id }, data: { ...(data ?? {}), ...(body.isDefault === true ? { isDefault: true } : {}) } })
    })
    return NextResponse.json(publicAddress(updated))
  })

export const DELETE = (req: NextRequest, { params }: Ctx) =>
  respond(async () => {
    const account = await requireAccount(req)
    const { id } = await params
    const existing = await db.webAddress.findFirst({ where: { id, accountId: account.id } })
    if (!existing) throw new AccountError('Address not found.', 404)
    await db.$transaction(async (tx) => {
      await tx.webAddress.delete({ where: { id } })
      if (existing.isDefault) {
        const next = await tx.webAddress.findFirst({ where: { accountId: account.id }, orderBy: { createdAt: 'asc' } })
        if (next) await tx.webAddress.update({ where: { id: next.id }, data: { isDefault: true } })
      }
    })
    return NextResponse.json({ ok: true })
  })
