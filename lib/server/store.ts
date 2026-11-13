import { promises as fs } from 'node:fs'
import { buildSeedDatabase } from '@/lib/seed'
import { createId } from './ids'
import { TENANTS_DIR, tenantDbFile } from './paths'
import type { AuditEntry, CollectionName, FleetDatabase, SessionUser, TenantUser } from '@/lib/types'

export { createId }

const locks = new Map<string, Promise<unknown>>()

export const COLLECTIONS: CollectionName[] = [
  'vehicles',
  'drivers',
  'fuelPrices',
  'fuelLogs',
  'serviceHistory',
  'inspections',
  'reimbursementClaims',
  'cashAdvances',
  'auditTrail',
]

export function isCollection(value: string): value is CollectionName {
  return (COLLECTIONS as string[]).includes(value)
}

function normalizeDatabase(database: FleetDatabase): FleetDatabase {
  if (!Array.isArray(database.users)) database.users = []
  if (!Array.isArray(database.vehicles)) database.vehicles = []
  return database
}

function lockFor(tenantId: string): Promise<unknown> {
  return locks.get(tenantId) || Promise.resolve()
}

export async function writeTenantDatabase(tenantId: string, database: FleetDatabase): Promise<void> {
  const file = tenantDbFile(tenantId)
  await fs.mkdir(TENANTS_DIR, { recursive: true })
  database.updated_at = new Date().toISOString()
  const tempFile = `${file}.${process.pid}.tmp`
  await fs.writeFile(tempFile, JSON.stringify(database, null, 2), 'utf8')
  await fs.rename(tempFile, file)
}

export async function readDatabase(tenantId: string): Promise<FleetDatabase> {
  const file = tenantDbFile(tenantId)
  await fs.mkdir(TENANTS_DIR, { recursive: true })

  let raw: string | null = null
  try {
    raw = await fs.readFile(file, 'utf8')
  } catch {
    raw = null
  }

  if (raw !== null) {
    try {
      const parsed = JSON.parse(raw.replace(/^\uFEFF/, '')) as FleetDatabase
      if (parsed && Array.isArray(parsed.vehicles)) {
        return normalizeDatabase(parsed)
      }
    } catch {
      // Ditangani di bawah: cadangkan lalu buat ulang.
    }

    const backupFile = `${file}.corrupt-${Date.now()}.bak`
    await fs.copyFile(file, backupFile).catch(() => undefined)
    console.error(`Database tenant tidak valid. Cadangan disimpan di ${backupFile}`)
  }

  const seed = buildSeedDatabase()
  await writeTenantDatabase(tenantId, seed)
  return seed
}

export async function mutateDatabase<T>(
  tenantId: string,
  mutator: (database: FleetDatabase) => T | Promise<T>
): Promise<T> {
  const run = lockFor(tenantId).then(async () => {
    const database = await readDatabase(tenantId)
    const result = await mutator(database)
    await writeTenantDatabase(tenantId, database)
    return result
  })
  locks.set(tenantId, run.catch(() => undefined))
  return run
}

export async function resetDatabase(tenantId: string): Promise<FleetDatabase> {
  const current = await readDatabase(tenantId).catch(() => null)
  const seed = buildSeedDatabase()
  if (current) {
    // Akun pengguna dan identitas perusahaan tidak boleh hilang saat reset demo.
    seed.users = current.users
    seed.settings.company_name = current.settings.company_name || seed.settings.company_name
    seed.settings.company_short = current.settings.company_short || seed.settings.company_short
    seed.settings.session_hours = current.settings.session_hours ?? seed.settings.session_hours
  }
  await writeTenantDatabase(tenantId, seed)
  return seed
}

export function appendAudit(
  database: FleetDatabase,
  session: SessionUser,
  action: string,
  collection: string,
  itemId: string | undefined,
  summary: string
): void {
  const entry: AuditEntry = {
    id: createId('AUD'),
    at: new Date().toISOString(),
    actor: session.name || session.username,
    role: session.role,
    action,
    collection,
    itemId,
    summary,
  }
  database.auditTrail = [entry, ...(database.auditTrail || [])].slice(0, 500)
}

/** Menyembunyikan hash password sebelum data dikirim ke browser. */
export function publicUser(user: TenantUser): TenantUser {
  return { ...user, password_hash: '' }
}

export function databaseForSession(database: FleetDatabase, session: SessionUser): FleetDatabase {
  const users = (database.users || []).map(publicUser)

  if (session.role === 'admin' || session.role === 'owner') {
    return { ...database, users }
  }

  const driverName = session.driverName || session.name
  const own = <T extends { driver_name?: string }>(items: T[]): T[] =>
    items.filter((item) => (item.driver_name || '').toLowerCase() === driverName.toLowerCase())

  return {
    ...database,
    users: [],
    drivers: database.drivers.map((driver) =>
      driver.name.toLowerCase() === driverName.toLowerCase()
        ? driver
        : { id: driver.id, name: driver.name, assigned_vehicle: driver.assigned_vehicle, status: driver.status }
    ),
    fuelLogs: own(database.fuelLogs),
    inspections: own(database.inspections),
    reimbursementClaims: own(database.reimbursementClaims),
    cashAdvances: own(database.cashAdvances),
    serviceHistory: [],
    auditTrail: [],
  }
}

export function isValidCollection(value: string): value is CollectionName {
  return isCollection(value)
}
