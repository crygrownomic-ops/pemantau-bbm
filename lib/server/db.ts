import { Pool, type PoolClient } from 'pg'

type GlobalWithDb = typeof globalThis & {
  __fleetopsPool?: Pool
  __fleetopsSchemaReady?: Promise<void>
}

const globalDb = globalThis as GlobalWithDb

/**
 * URL database Postgres. Mendukung beberapa nama variabel yang biasa dipasang
 * otomatis oleh integrasi Vercel/Neon/Supabase.
 */
export function databaseUrl(): string | null {
  const url =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.SUPABASE_DB_URL ||
    ''
  return url.trim() || null
}

export function usesPostgres(): boolean {
  return Boolean(databaseUrl())
}

function sslConfig(url: string): { rejectUnauthorized: boolean } | undefined {
  const mode = (process.env.PGSSLMODE || '').toLowerCase()
  if (mode === 'disable') return undefined
  if (mode === 'require' || mode === 'verify-ca' || mode === 'verify-full') {
    return { rejectUnauthorized: mode !== 'require' }
  }

  try {
    const host = new URL(url).hostname.toLowerCase()
    if (host === 'localhost' || host === '127.0.0.1' || host === '::1' || host.endsWith('.local')) {
      return undefined
    }
  } catch {
    // URL tidak valid: biarkan pg yang melaporkan.
  }
  return { rejectUnauthorized: false }
}

export function getPool(): Pool {
  const url = databaseUrl()
  if (!url) {
    throw new Error('DATABASE_URL belum dikonfigurasi.')
  }
  if (globalDb.__fleetopsPool) return globalDb.__fleetopsPool

  const pool = new Pool({
    connectionString: url,
    ssl: sslConfig(url),
    max: Math.max(1, Number(process.env.PG_POOL_MAX) || 4),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    allowExitOnIdle: true,
  })
  pool.on('error', (error) => {
    console.error('Postgres pool error', error)
  })
  globalDb.__fleetopsPool = pool
  return pool
}

/** Tabel dokumen JSON: satu baris per platform/tenant. Dibuat otomatis saat pertama dipakai. */
export async function ensureSchema(): Promise<void> {
  if (!globalDb.__fleetopsSchemaReady) {
    globalDb.__fleetopsSchemaReady = getPool()
      .query(
        `create table if not exists fleetops_documents (
           scope text primary key,
           doc jsonb not null,
           updated_at timestamptz not null default now()
         )`
      )
      .then(() => undefined)
      .catch((error) => {
        globalDb.__fleetopsSchemaReady = undefined
        throw error
      })
  }
  await globalDb.__fleetopsSchemaReady
}

export async function withClient<T>(run: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect()
  try {
    return await run(client)
  } finally {
    client.release()
  }
}
