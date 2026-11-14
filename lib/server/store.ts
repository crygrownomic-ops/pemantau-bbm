import { buildSeedDatabase } from '@/lib/seed'
import { createId } from './ids'
import { mutateDocument, readDocument, tenantScope, writeDocument } from './storage'
import type { AuditEntry, CollectionName, FleetDatabase, SessionUser, TenantUser } from '@/lib/types'

export { createId }

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

function replaceContents<T extends object>(target: T, source: T): void {
  for (const key of Object.keys(target)) {
    delete (target as Record<string, unknown>)[key]
  }
  Object.assign(target, source)
}

export async function writeTenantDatabase(tenantId: string, database: FleetDatabase): Promise<void> {
  database.updated_at = new Date().toISOString()
  await writeDocument(tenantScope(tenantId), database)
}

export async function readDatabase(tenantId: string): Promise<FleetDatabase> {
  const stored = await readDocument<FleetDatabase>(tenantScope(tenantId))
  if (stored && Array.isArray(stored.vehicles)) {
    return normalizeDatabase(stored)
  }
  if (stored) {
    console.error(`Database tenant ${tenantId} tidak valid. Membuat ulang dari data contoh.`)
  }

  const seed = buildSeedDatabase()
  await writeTenantDatabase(tenantId, seed)
  return seed
}

export async function mutateDatabase<T>(
  tenantId: string,
  mutator: (database: FleetDatabase) => T | Promise<T>
): Promise<T> {
  return mutateDocument<FleetDatabase, T>(
    tenantScope(tenantId),
    () => buildSeedDatabase(),
    async (database) => {
      if (!Array.isArray(database.vehicles)) {
        replaceContents(database, buildSeedDatabase())
      }
      normalizeDatabase(database)
      const result = await mutator(database)
      database.updated_at = new Date().toISOString()
      return result
    }
  )
}

export async function resetDatabase(tenantId: string): Promise<FleetDatabase> {
  return mutateDatabase(tenantId, (database) => {
    const seed = buildSeedDatabase()
    // Akun pengguna dan identitas perusahaan tidak boleh hilang saat reset demo.
    seed.users = database.users
    seed.settings.company_name = database.settings.company_name || seed.settings.company_name
    seed.settings.company_short = database.settings.company_short || seed.settings.company_short
    seed.settings.session_hours = database.settings.session_hours ?? seed.settings.session_hours
    replaceContents(database, seed)
    return database
  })
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

/** Menghapus hash password sebelum data dikirim ke browser. */
export function publicUser(user: TenantUser): TenantUser {
  const clone = { ...user } as Partial<TenantUser>
  delete clone.password_hash
  return clone as TenantUser
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
