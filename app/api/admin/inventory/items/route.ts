export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const items = await prisma.inventoryItem.findMany({
      select: { id: true, name: true, unit: true, quantity: true, lowStockThreshold: true },
      orderBy: { name: 'asc' }
    })
    return NextResponse.json({ ok: true, data: items })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, unit, quantity = 0, low_stock_threshold = null } = body ?? {}
    if (!name || !unit) return NextResponse.json({ ok: false, error: 'name and unit required' }, { status: 400 })

    const created = await prisma.inventoryItem.create({
      data: { name, unit, quantity, lowStockThreshold: low_stock_threshold }
    })
    return NextResponse.json({ ok: true, id: created.id })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 })
  }
}


