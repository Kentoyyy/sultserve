export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { query } from '@/lib/pgClient'

export async function GET() {
  try {
    const { rows } = await query<{ product_id: string; name: string; qty: string }>(
      'select product_id, name, qty from v_bestsellers limit 5'
    )
    return NextResponse.json({ ok: true, data: rows })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? 'error' }, { status: 500 })
  }
}




