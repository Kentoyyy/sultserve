export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { readFile } from 'node:fs/promises'
import { getPgPool, query } from '@/lib/pgClient'

export async function POST() {
  try {
    // Ensure required extensions (for gen_random_uuid)
    await query('create extension if not exists pgcrypto;')
    await query('create extension if not exists "uuid-ossp";')

    const sql = await readFile(process.cwd() + '/supabase/schema.sql', 'utf8')
    const pool = getPgPool()
    const client = await pool.connect()
    try {
      await client.query('begin')
      await client.query('set search_path to public')
      await client.query(sql)
      await client.query('commit')
    } catch (e) {
      await client.query('rollback')
      throw e
    } finally {
      client.release()
    }

    const countRes = await query(
      `select count(*)::int as tables_count from information_schema.tables where table_schema='public'`
    )

    return NextResponse.json({ ok: true, tables: (countRes.rows[0] as { tables_count: number })?.tables_count ?? 0 })
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 })
  }
}


