import path from 'node:path'

export const DATA_DIR = process.env.FLEETOPS_DATA_DIR || path.join(process.cwd(), 'data')
export const TENANTS_DIR = path.join(DATA_DIR, 'tenants')
export const PLATFORM_FILE = path.join(DATA_DIR, 'platform.json')
export const LEGACY_DB_FILE = path.join(DATA_DIR, 'fleetops.json')

const TENANT_ID_PATTERN = /^[a-z0-9][a-z0-9-]{1,40}$/

export function isValidTenantId(value: string | undefined | null): value is string {
  return typeof value === 'string' && TENANT_ID_PATTERN.test(value)
}

export function assertTenantId(value: string | undefined | null): string {
  if (!isValidTenantId(value)) {
    throw new Error('ID tenant tidak valid.')
  }
  return value
}

export function tenantDbFile(tenantId: string): string {
  return path.join(TENANTS_DIR, `${assertTenantId(tenantId)}.json`)
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}
