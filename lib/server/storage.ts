import { promises as fs } from 'node:fs'
import { databaseUrl, ensureSchema, getPool, withClient } from './db'
import { PLATFORM_FILE, TENANTS_DIR, tenantDbFile } from './paths'

export const PLATFORM_SCOPE = 'platform'

export function tenantScope(tenantId: string): string {
  return `tenant:${tenantId}`
}

type Backend = 'postgres' | 'filesystem'

function backend(): Backend {
  if (databaseUrl()) return 'postgres'
  if (process.env.VERCEL) {
    throw new Error(
      'DATABASE_URL belum dikonfigurasi. Vercel tidak menyediakan penyimpanan file permanen; ' +
        'set DATABASE_URL ke database Postgres (Supabase/Neon) pada Environment Variables.'
    )
  }
  return 'filesystem'
}

export function storageBackend(): Backend {
  return backend()
}

/* ------------------------------------------------------------------ */
/* Filesystem (pengembangan lokal / VPS dengan disk persisten)        */
/* ------------------------------------------------------------------ */

const fsLocks = new Map<string, Promise<unknown>>()

function fileFor(scope: string): string {
  if (scope === PLATFORM_SCOPE) return PLATFORM_FILE
  if (scope.startsWith('tenant:')) return tenantDbFile(scope.slice('tenant:'.length))
  throw new Error(`Scope dokumen tidak dikenal: ${scope}`)
}

async function fsRead<T>(scope: string): Promise<T | null> {
  const file = fileFor(scope)
  await fs.mkdir(TENANTS_DIR, { recursive: true })

  let raw: string
  try {
    raw = await fs.readFile(/*turbopackIgnore: true*/ file, 'utf8')
  } catch {
    return null
  }

  try {
    return JSON.parse(raw.replace(/^\uFEFF/, '')) as T
  } catch {
    const backup = `${file}.corrupt-${Date.now()}.bak`
    await fs.copyFile(/*turbopackIgnore: true*/ file, backup).catch(() => undefined)
    console.error(`Dokumen ${scope} rusak. Cadangan disimpan di ${backup}`)
    return null
  }
}

async function fsWrite<T>(scope: string, doc: T): Promise<void> {
  const file = fileFor(scope)
  await fs.mkdir(TENANTS_DIR, { recursive: true })
  const temp = `${file}.${process.pid}.${Date.now()}.tmp`
  await fs.writeFile(temp, JSON.stringify(doc, null, 2), 'utf8')
  await fs.rename(temp, file)
}

function fsLock(scope: string): Promise<unknown> {
  return fsLocks.get(scope) || Promise.resolve()
}

async function fsMutate<T, R>(
  scope: string,
  initial: () => T | Promise<T>,
  mutator: (doc: T) => R | Promise<R>
): Promise<R> {
  const run = fsLock(scope).then(async () => {
    const stored = await fsRead<T>(scope)
    const doc = stored ?? (await initial())
    const result = await mutator(doc)
    await fsWrite(scope, doc)
    return result
  })
  fsLocks.set(scope, run.catch(() => undefined))
  return run
}

async function fsRemove(scope: string): Promise<void> {
  const file = fileFor(scope)
  await fs.rename(file, `${file}.deleted-${Date.now()}.bak`).catch(() => undefined)
}

/* ------------------------------------------------------------------ */
/* Postgres (Vercel / serverless / multi-instance)                    */
/* ------------------------------------------------------------------ */

async function pgRead<T>(scope: string): Promise<T | null> {
  await ensureSchema()
  const { rows } = await getPool().query<{ doc: T }>(
    'select doc from fleetops_documents where scope = $1',
    [scope]
  )
  return rows.length > 0 ? rows[0].doc : null
}

async function pgWrite<T>(scope: string, doc: T): Promise<void> {
  await ensureSchema()
  await getPool().query(
    `insert into fleetops_documents (scope, doc) values ($1, $2::jsonb)
     on conflict (scope) do update set doc = excluded.doc, updated_at = now()`,
    [scope, JSON.stringify(doc)]
  )
}

async function pgMutate<T, R>(
  scope: string,
  initial: () => T | Promise<T>,
  mutator: (doc: T) => R | Promise<R>
): Promise<R> {
  await ensureSchema()
  const pool = getPool()

  // Siapkan dokumen awal di luar transaksi. initial() dapat menulis dokumen lain
  // (mis. seed tenant), jadi tidak boleh berjalan saat transaksi memegang koneksi.
  const existing = await pool.query('select 1 from fleetops_documents where scope = $1', [scope])
  const prepared = existing.rowCount === 0 ? await initial() : null

  return withClient(async (client) => {
    await client.query('begin')
    try {
      let result = await client.query<{ doc: T }>(
        'select doc from fleetops_documents where scope = $1 for update',
        [scope]
      )

      if (result.rows.length === 0) {
        if (prepared === null) {
          throw new Error(`Dokumen ${scope} hilang saat transaksi dimulai.`)
        }
        await client.query(
          `insert into fleetops_documents (scope, doc) values ($1, $2::jsonb)
           on conflict (scope) do nothing`,
          [scope, JSON.stringify(prepared)]
        )
        result = await client.query<{ doc: T }>(
          'select doc from fleetops_documents where scope = $1 for update',
          [scope]
        )
      }

      const doc = result.rows[0].doc
      const value = await mutator(doc)
      await client.query(
        'update fleetops_documents set doc = $2::jsonb, updated_at = now() where scope = $1',
        [scope, JSON.stringify(doc)]
      )
      await client.query('commit')
      return value
    } catch (error) {
      await client.query('rollback').catch(() => undefined)
      throw error
    }
  })
}

async function pgRemove(scope: string): Promise<void> {
  await ensureSchema()
  await getPool().query('delete from fleetops_documents where scope = $1', [scope])
}

/* ------------------------------------------------------------------ */
/* API publik                                                          */
/* ------------------------------------------------------------------ */

export async function readDocument<T>(scope: string): Promise<T | null> {
  return backend() === 'postgres' ? pgRead<T>(scope) : fsRead<T>(scope)
}

export async function writeDocument<T>(scope: string, doc: T): Promise<void> {
  if (backend() === 'postgres') {
    await pgWrite(scope, doc)
    return
  }
  await fsWrite(scope, doc)
}

/**
 * Baca-ubah-tulis atomik. Pada Postgres memakai transaksi + row lock,
 * sehingga aman untuk beberapa instance serverless sekaligus.
 */
export async function mutateDocument<T, R>(
  scope: string,
  initial: () => T | Promise<T>,
  mutator: (doc: T) => R | Promise<R>
): Promise<R> {
  return backend() === 'postgres'
    ? pgMutate<T, R>(scope, initial, mutator)
    : fsMutate<T, R>(scope, initial, mutator)
}

export async function removeDocument(scope: string): Promise<void> {
  if (backend() === 'postgres') {
    await pgRemove(scope)
    return
  }
  await fsRemove(scope)
}
