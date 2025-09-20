import { NextResponse } from 'next/server'
import { query } from '@/lib/pgClient'

export async function GET() {
  try {
    const { rows } = await query<{ now: string }>('select now() as now')
    return NextResponse.json({ ok: true, now: rows[0]?.now })
  } catch (err: unknown) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 })
  }
}

















