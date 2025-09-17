export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { query } from '@/lib/pgClient'

export async function GET() {
  try {
    const { rows } = await query<{ day: string; total_cents: string; orders_count: string }>(
      'select day, total_cents, orders_count from v_sales_daily order by day desc limit 7'
    )
    return NextResponse.json({ ok: true, data: rows })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? 'error' }, { status: 500 })
  }
}




