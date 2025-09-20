export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { query } from '@/lib/pgClient'

type Params = { params: Promise<{ groupId: string }> }

export async function GET(_: Request, { params }: Params) {
  const { groupId } = await params
  try {
    const { rows } = await query('select * from product_options where group_id = $1 order by sort_order, name', [groupId])
    return NextResponse.json({ ok: true, data: rows })
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: Params) {
  const { groupId } = await params
  try {
    const body = await request.json()
    const { name, price_delta_cents = 0, sort_order = 0 } = body ?? {}
    if (!name) return NextResponse.json({ ok: false, error: 'name required' }, { status: 400 })
    const ins = await query(
      'insert into product_options (group_id, name, price_delta_cents, sort_order) values ($1,$2,$3,$4) returning id',
      [groupId, name, price_delta_cents, sort_order]
    )
    return NextResponse.json({ ok: true, id: (ins.rows[0] as { id: string }).id })
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 })
  }
}

















