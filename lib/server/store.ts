import { promises as fs } from 'node:fs'
import path from 'node:path'
import { buildSeedDatabase } from '@/lib/seed'
import type { AuditEntry, CollectionName, FleetDatabase, SessionUser } from '@/lib/types'

const DATA_DIR = process.env.FLEETOPS_DATA_DIR || path.join(process.cwd(), 'data')
const DB_FILE = path.join(DATA_DIR, 'fleetops.json')

let writeLock: Promise<unknown> = Promise.resolve()

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

async function ensureDatabaseFile(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true })
  try {
    await fs.access(DB_FILE)
  } catch {
    await writeDatabaseFile(buildSeedDatabase())
  }
}

async function writeDatabaseFile(database: FleetDatabase): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true })
  const tempFile = `${DB_FILE}.${process.pid}.tmp`
  database.updated_at = new Date().toISOString()
  await fs.writeFile(tempFile, JSON.stringify(database, null, 2), 'utf8')
  await fs.rename(tempFile, DB_FILE)
}

export async function readDatabase(): Promise<FleetDatabase> {
  await ensureDatabaseFile()
  const raw = await fs.readFile(DB_FILE, 'utf8')
  const parsed = JSON.parse(raw) as FleetDatabase
  if (!parsed || !Array.isArray(parsed.vehicles)) {
    const seed = buildSeedDatabase()
    await writeDatabaseFile(seed)
    return seed
  }
  return parsed
}

export async function mutateDatabase<T>(mutator: (database: FleetDatabase) => T | Promise<T>): Promise<T> {
  const run = writeLock.then(async () => {
    const database = await readDatabase()
    const result = await mutator(database)
    await writeDatabaseFile(database)
    return result
  })
  writeLock = run.catch(() => undefined)
  return run
}

export async function resetDatabase(): Promise<FleetDatabase> {
  const seed = buildSeedDatabase()
  await writeDatabaseFile(seed)
  return seed
}

export function createId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
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

export function databaseForSession(database: FleetDatabase, session: SessionUser): FleetDatabase {
  if (session.role === 'admin') return database

  const driverName = session.driverName || session.name
  const own = <T extends { driver_name?: string }>(items: T[]): T[] =>
    items.filter((item) => (item.driver_name || '').toLowerCase() === driverName.toLowerCase())

  return {
    ...database,
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
