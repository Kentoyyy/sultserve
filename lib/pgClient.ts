import 'server-only'
import { Pool } from 'pg'

let pool: Pool | null = null

export function getPgPool(): Pool {
  if (pool) return pool

  const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('Missing POSTGRES_URL (or DATABASE_URL) for local PostgreSQL connection')
  }

  pool = new Pool({ connectionString })
  return pool
}

export async function query<T = unknown>(text: string, params?: unknown[]): Promise<{ rows: T[] }>{
  const client = getPgPool()
  return client.query(text, params as unknown[])
}


