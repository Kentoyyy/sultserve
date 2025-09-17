export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { query } from '@/lib/pgClient'

export async function GET() {
  try {
    const envUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL || ''
    if (!envUrl) {
      return NextResponse.json({ ok: false, error: 'POSTGRES_URL (or DATABASE_URL) is not set' }, { status: 500 })
    }

    const safe = (() => {
      try {
        const u = new URL(envUrl)
        return { protocol: u.protocol, host: u.hostname, port: u.port, db: u.pathname.replace('/', '') }
      } catch {
        return { raw: true }
      }
    })()

    const { rows } = await query<{ now: string }>('select now() as now')
    return NextResponse.json({ ok: true, now: rows[0]?.now, target: safe })
  } catch (err: any) {
    return NextResponse.json({
      ok: false,
      error: err?.message ?? 'error',
      code: err?.code,
      detail: err?.detail,
      hint: err?.hint
    }, { status: 500 })
  }
}


