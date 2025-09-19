export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { query } from '@/lib/pgClient'

type Params = { params: { groupId: string } }

export async function GET(_: Request, { params }: Params) {
  try {
    const { rows } = await query('select * from product_options where group_id = $1 order by sort_order, name', [params.groupId])
    return NextResponse.json({ ok: true, data: rows })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const body = await request.json()
    const { name, price_delta_cents = 0, sort_order = 0 } = body ?? {}
    if (!name) return NextResponse.json({ ok: false, error: 'name required' }, { status: 400 })
    const ins = await query(
      'insert into product_options (group_id, name, price_delta_cents, sort_order) values ($1,$2,$3,$4) returning id',
      [params.groupId, name, price_delta_cents, sort_order]
    )
    return NextResponse.json({ ok: true, id: ins.rows[0].id })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 })
  }
}

















