#!/usr/bin/env node
/**
 * Memeriksa koneksi Postgres dan menyiapkan tabel dokumen FleetOps.
 * Jalankan: npm run db:check
 */
import { existsSync, readFileSync } from 'node:fs'
import { Pool } from 'pg'

function loadEnv(file) {
  if (!existsSync(file)) return
  const content = readFileSync(file, 'utf8')
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const separator = trimmed.indexOf('=')
    if (separator < 0) continue
    const key = trimmed.slice(0, separator).trim()
    let value = trimmed.slice(separator + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (!(key in process.env)) process.env[key] = value
  }
}

loadEnv('.env.local')
loadEnv('.env')

const url =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.SUPABASE_DB_URL ||
  ''

if (!url.trim()) {
  console.error('DATABASE_URL belum diset. Isi di .env.local atau environment variable.')
  process.exit(1)
}

function sslConfig(connectionString) {
  const mode = (process.env.PGSSLMODE || '').toLowerCase()
  if (mode === 'disable') return undefined
  if (mode === 'require' || mode === 'verify-ca' || mode === 'verify-full') {
    return { rejectUnauthorized: mode !== 'require' }
  }
  try {
    const host = new URL(connectionString).hostname.toLowerCase()
    if (host === 'localhost' || host === '127.0.0.1' || host === '::1' || host.endsWith('.local')) {
      return undefined
    }
  } catch {
    // Biarkan pg melaporkan URL yang tidak valid.
  }
  return { rejectUnauthorized: false }
}

const pool = new Pool({
  connectionString: url,
  ssl: sslConfig(url),
  max: 1,
  connectionTimeoutMillis: 10_000,
})

try {
  const version = await pool.query('select version()')
  console.log('Koneksi OK:', String(version.rows[0].version).split(',')[0])

  // Samakan dengan ensureSchema() di lib/server/db.ts. RLS + cabut hak anon/authenticated
  // penting karena database bisa dipakai bersama project Supabase lain.
  await pool.query(
    `create table if not exists fleetops_documents (
       scope text primary key,
       doc jsonb not null,
       updated_at timestamptz not null default now()
     );
     alter table fleetops_documents enable row level security;
     do $$
     begin
       if exists (select 1 from pg_roles where rolname = 'anon') then
         revoke all on table fleetops_documents from anon;
       end if;
       if exists (select 1 from pg_roles where rolname = 'authenticated') then
         revoke all on table fleetops_documents from authenticated;
       end if;
     end $$;`
  )

  const docs = await pool.query(
    `select scope, updated_at, pg_column_size(doc) as bytes
       from fleetops_documents
      order by scope`
  )

  console.log(`Tabel fleetops_documents siap. Jumlah dokumen: ${docs.rowCount}`)
  for (const row of docs.rows) {
    console.log(
      ` - ${row.scope} (${row.bytes} bytes, diperbarui ${new Date(row.updated_at).toISOString()})`
    )
  }
} catch (error) {
  console.error('Gagal terhubung atau menyiapkan database:', error instanceof Error ? error.message : error)
  process.exitCode = 1
} finally {
  await pool.end()
}
