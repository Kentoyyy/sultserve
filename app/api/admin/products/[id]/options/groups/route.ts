export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { query } from '@/lib/pgClient'

type Params = { params: { id: string } }

export async function GET(_: Request, { params }: Params) {
  try {
    const { rows } = await query('select * from product_option_groups where product_id = $1 order by created_at asc', [params.id])
    return NextResponse.json({ ok: true, data: rows })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const body = await request.json()
    const { name, type = 'single', required = false, max_select = null } = body ?? {}
    if (!name) return NextResponse.json({ ok: false, error: 'name required' }, { status: 400 })
    const ins = await query(
      'insert into product_option_groups (product_id, name, type, required, max_select) values ($1,$2,$3,$4,$5) returning id',
      [params.id, name, type, required, max_select]
    )
    return NextResponse.json({ ok: true, id: ins.rows[0].id })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 })
  }
}

















