export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { query } from '@/lib/pgClient'

export async function GET() {
  try {
    const { rows } = await query<{ id: string; name: string; quantity: string; low_stock_threshold: string }>(
      'select id, name, quantity, low_stock_threshold from inventory_items where low_stock_threshold is not null and quantity <= low_stock_threshold order by quantity asc limit 5'
    )
    return NextResponse.json({ ok: true, data: rows })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? 'error' }, { status: 500 })
  }
}




