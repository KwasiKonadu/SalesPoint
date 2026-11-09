import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { publicAddress, requireAccount } from '@/lib/web-accounts'
import { addressData, respond } from '@/lib/web-account-http'

export const POST = (req: NextRequest) =>
  respond(async () => {
    const account = await requireAccount(req)
    const data = addressData(await req.json().catch(() => ({})))
    const count = await db.webAddress.count({ where: { accountId: account.id } })
    const makeDefault = count === 0 || data.isDefault
    const created = await db.$transaction(async (tx) => {
      if (makeDefault) await tx.webAddress.updateMany({ where: { accountId: account.id }, data: { isDefault: false } })
      return tx.webAddress.create({ data: { ...data, accountId: account.id, isDefault: makeDefault } })
    })
    return NextResponse.json(publicAddress(created), { status: 201 })
  })
