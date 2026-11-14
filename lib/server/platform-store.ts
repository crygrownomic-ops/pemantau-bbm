import { promises as fs } from 'node:fs'
import { addDays, addMonths, planLimits, TRIAL_DAYS } from '@/lib/plans'
import { buildSeedDatabase } from '@/lib/seed'
import { hashPassword } from '@/lib/auth-session'
import type {
  FleetDatabase,
  Invoice,
  InvoiceStatus,
  PlatformAuditEntry,
  PlatformDatabase,
  PlanId,
  Tenant,
  TenantStatus,
  TenantUsage,
  TenantUser,
} from '@/lib/types'
import { createId, createTenantId } from './ids'
import { LEGACY_DB_FILE, isValidTenantId } from './paths'
import { readDatabase, writeTenantDatabase } from './store'
import {
  PLATFORM_SCOPE,
  mutateDocument,
  readDocument,
  removeDocument,
  tenantScope,
  writeDocument,
} from './storage'

const BOOTSTRAP_ID = isValidTenantId(process.env.FLEETOPS_TENANT_ID)
  ? (process.env.FLEETOPS_TENANT_ID as string)
  : 'demo'
const BOOTSTRAP_CODE = (process.env.FLEETOPS_TENANT_CODE || 'demo').toLowerCase()
const BOOTSTRAP_NAME = process.env.FLEETOPS_TENANT_NAME || 'PT Nusantara Logistik Prima'

function nowIso(): string {
  return new Date().toISOString()
}

function bootstrapUsers(): TenantUser[] {
  const users: TenantUser[] = []
  const adminUsername = process.env.ADMIN_USERNAME || 'admin'
  const adminName = process.env.ADMIN_NAME || 'Administrator FleetOps'
  users.push({
    id: createId('USR'),
    username: adminUsername,
    name: adminName,
    role: 'admin',
    password_hash: process.env.ADMIN_PASSWORD_HASH || hashPassword(process.env.ADMIN_PASSWORD || 'admin123'),
    status: 'ACTIVE',
    created_at: nowIso(),
  })

  const driverUsername = process.env.DRIVER_USERNAME || 'driver'
  const driverName = process.env.DRIVER_NAME || 'Ahmad Supardi'
  users.push({
    id: createId('USR'),
    username: driverUsername,
    name: driverName,
    role: 'driver',
    driver_name: driverName,
    password_hash: process.env.DRIVER_PASSWORD_HASH || hashPassword(process.env.DRIVER_PASSWORD || 'driver123'),
    status: 'ACTIVE',
    created_at: nowIso(),
  })

  if (process.env.OPERATOR_USERNAME && (process.env.OPERATOR_PASSWORD || process.env.OPERATOR_PASSWORD_HASH)) {
    users.push({
      id: createId('USR'),
      username: process.env.OPERATOR_USERNAME,
      name: process.env.OPERATOR_NAME || 'Fleet Operator',
      role: 'admin',
      password_hash:
        process.env.OPERATOR_PASSWORD_HASH || hashPassword(process.env.OPERATOR_PASSWORD as string),
      status: 'ACTIVE',
      created_at: nowIso(),
    })
  }

  return users
}

async function readLegacyDatabase(): Promise<FleetDatabase | null> {
  try {
    const raw = await fs.readFile(LEGACY_DB_FILE, 'utf8')
    const parsed = JSON.parse(raw.replace(/^\uFEFF/, '')) as FleetDatabase
    return parsed && Array.isArray(parsed.vehicles) ? parsed : null
  } catch {
    return null
  }
}

async function bootstrapPlatform(): Promise<PlatformDatabase> {
  const now = new Date()
  const tenant: Tenant = {
    id: BOOTSTRAP_ID,
    code: BOOTSTRAP_CODE,
    name: BOOTSTRAP_NAME,
    plan: 'enterprise',
    status: 'ACTIVE',
    created_at: now.toISOString(),
    active_until: addDays(now, 3650),
    bootstrap: true,
    limits: planLimits('enterprise'),
  }

  const existing = await readDocument<FleetDatabase>(tenantScope(tenant.id)).catch(() => null)

  if (!existing) {
    const legacy = await readLegacyDatabase()
    const seed = legacy || buildSeedDatabase({ companyName: BOOTSTRAP_NAME })
    if (!Array.isArray(seed.users) || seed.users.length === 0) {
      seed.users = bootstrapUsers()
    }
    await writeTenantDatabase(tenant.id, seed)
  }

  return {
    version: 1,
    updated_at: nowIso(),
    tenants: [tenant],
    invoices: [],
    auditTrail: [
      {
        id: createId('PLT'),
        at: nowIso(),
        actor: 'system',
        action: 'BOOTSTRAP',
        target: tenant.id,
        summary: `Tenant bawaan "${tenant.name}" dibuat dari data instalasi yang ada.`,
      },
    ],
  }
}

function normalizePlatform(platform: PlatformDatabase): PlatformDatabase {
  if (!Array.isArray(platform.tenants)) platform.tenants = []
  if (!Array.isArray(platform.invoices)) platform.invoices = []
  if (!Array.isArray(platform.auditTrail)) platform.auditTrail = []
  return platform
}

function replacePlatformContents(target: PlatformDatabase, source: PlatformDatabase): void {
  for (const key of Object.keys(target)) {
    delete (target as unknown as Record<string, unknown>)[key]
  }
  Object.assign(target, source)
}

async function writePlatformFile(database: PlatformDatabase): Promise<void> {
  database.updated_at = nowIso()
  await writeDocument(PLATFORM_SCOPE, database)
}

export async function readPlatform(): Promise<PlatformDatabase> {
  const stored = await readDocument<PlatformDatabase>(PLATFORM_SCOPE)
  if (stored && Array.isArray(stored.tenants)) return normalizePlatform(stored)

  if (!stored) {
    // Baris belum ada: buat registri awal secara atomik (aman untuk beberapa instance).
    return mutateDocument<PlatformDatabase, PlatformDatabase>(
      PLATFORM_SCOPE,
      bootstrapPlatform,
      (database) => normalizePlatform(database)
    )
  }

  const fresh = await bootstrapPlatform()
  await writePlatformFile(fresh)
  return fresh
}

export async function mutatePlatform<T>(
  mutator: (database: PlatformDatabase) => T | Promise<T>
): Promise<T> {
  return mutateDocument<PlatformDatabase, T>(PLATFORM_SCOPE, bootstrapPlatform, async (database) => {
    if (!Array.isArray(database.tenants)) {
      replacePlatformContents(database, await bootstrapPlatform())
    }
    normalizePlatform(database)
    const result = await mutator(database)
    database.updated_at = nowIso()
    return result
  })
}

export async function listTenants(): Promise<Tenant[]> {
  return (await readPlatform()).tenants
}

export async function getTenant(id: string | undefined | null): Promise<Tenant | null> {
  if (!id) return null
  const platform = await readPlatform()
  return platform.tenants.find((tenant) => tenant.id === id) || null
}

export async function getTenantByCode(code: string | undefined | null): Promise<Tenant | null> {
  const normalized = String(code || '').trim().toLowerCase()
  if (!normalized) return null
  const platform = await readPlatform()
  return platform.tenants.find((tenant) => tenant.code.toLowerCase() === normalized) || null
}

export function appendPlatformAudit(
  database: PlatformDatabase,
  actor: string,
  action: string,
  target: string,
  summary: string
): void {
  const entry: PlatformAuditEntry = {
    id: createId('PLT'),
    at: nowIso(),
    actor,
    action,
    target,
    summary,
  }
  database.auditTrail = [entry, ...(database.auditTrail || [])].slice(0, 500)
}

export interface CreateTenantInput {
  name: string
  code: string
  plan?: PlanId
  contactName?: string
  contactEmail?: string
  contactPhone?: string
  adminName: string
  adminUsername: string
  adminPassword: string
  status?: TenantStatus
  activeUntil?: string
  notes?: string
}

export async function createTenantRecord(input: CreateTenantInput): Promise<Tenant> {
  const name = input.name.trim().slice(0, 120)
  const code = input.code.trim().toLowerCase()
  const plan = input.plan || 'trial'
  const now = new Date()
  const id = createTenantId(name)
  const status: TenantStatus = input.status || 'TRIAL'

  const tenant: Tenant = {
    id,
    code,
    name,
    plan,
    status,
    created_at: now.toISOString(),
    trial_ends_at: status === 'TRIAL' ? addDays(now, TRIAL_DAYS) : undefined,
    active_until: status === 'ACTIVE' ? input.activeUntil || addMonths(now, 1) : input.activeUntil,
    contact_name: input.contactName?.trim().slice(0, 120),
    contact_email: input.contactEmail?.trim().slice(0, 160),
    contact_phone: input.contactPhone?.trim().slice(0, 40),
    notes: input.notes?.trim().slice(0, 500),
    limits: planLimits(plan),
  }

  const adminUser: TenantUser = {
    id: createId('USR'),
    username: input.adminUsername.trim().toLowerCase(),
    name: input.adminName.trim().slice(0, 120) || 'Administrator',
    role: 'admin',
    password_hash: hashPassword(input.adminPassword),
    status: 'ACTIVE',
    created_at: nowIso(),
  }

  const seed = buildSeedDatabase({
    companyName: name,
    companyShort: name.slice(0, 24),
    users: [adminUser],
  })

  // Tulis database tenant lebih dulu, di luar transaksi registri platform,
  // agar tidak memakai koneksi pool kedua saat transaksi sedang berjalan.
  await writeTenantDatabase(id, seed)

  try {
    return await mutatePlatform(async (platform) => {
      if (platform.tenants.some((item) => item.code.toLowerCase() === code)) {
        throw new Error('Kode perusahaan sudah digunakan. Pilih kode lain.')
      }
      if (platform.tenants.some((item) => item.name.toLowerCase() === name.toLowerCase())) {
        throw new Error('Nama perusahaan sudah terdaftar.')
      }
      if (platform.tenants.some((item) => item.id === id)) {
        throw new Error('ID tenant bentrok. Silakan coba lagi.')
      }

      platform.tenants.push(tenant)
      appendPlatformAudit(platform, 'platform', 'CREATE_TENANT', id, `Membuat tenant "${name}" (${code}).`)
      return tenant
    })
  } catch (error) {
    // Pendaftaran gagal: buang dokumen tenant agar tidak menjadi data yatim.
    await removeDocument(tenantScope(id)).catch(() => undefined)
    throw error
  }
}

export interface UpdateTenantInput {
  id: string
  name?: string
  plan?: PlanId
  status?: TenantStatus
  activeUntil?: string
  trialEndsAt?: string
  contactName?: string
  contactEmail?: string
  contactPhone?: string
  notes?: string
  limits?: { vehicles?: number; drivers?: number; users?: number }
}

export async function updateTenantRecord(input: UpdateTenantInput): Promise<Tenant> {
  return mutatePlatform(async (platform) => {
    const tenant = platform.tenants.find((item) => item.id === input.id)
    if (!tenant) throw new Error('Tenant tidak ditemukan.')

    if (typeof input.name === 'string' && input.name.trim()) tenant.name = input.name.trim().slice(0, 120)
    if (input.plan) {
      tenant.plan = input.plan
      tenant.limits = planLimits(input.plan)
    }
    if (input.status) {
      tenant.status = input.status
      if (input.status === 'TRIAL' && !tenant.trial_ends_at) {
        tenant.trial_ends_at = addDays(new Date(), TRIAL_DAYS)
      }
      if (input.status === 'ACTIVE' && !tenant.active_until) {
        tenant.active_until = addMonths(new Date(), 1)
      }
    }
    if (input.activeUntil !== undefined) tenant.active_until = input.activeUntil || undefined
    if (input.trialEndsAt !== undefined) tenant.trial_ends_at = input.trialEndsAt || undefined
    if (input.contactName !== undefined) tenant.contact_name = input.contactName.trim().slice(0, 120)
    if (input.contactEmail !== undefined) tenant.contact_email = input.contactEmail.trim().slice(0, 160)
    if (input.contactPhone !== undefined) tenant.contact_phone = input.contactPhone.trim().slice(0, 40)
    if (input.notes !== undefined) tenant.notes = input.notes.trim().slice(0, 500)
    if (input.limits) {
      tenant.limits = {
        vehicles: Math.max(1, Number(input.limits.vehicles) || tenant.limits.vehicles),
        drivers: Math.max(1, Number(input.limits.drivers) || tenant.limits.drivers),
        users: Math.max(1, Number(input.limits.users) || tenant.limits.users),
      }
    }

    appendPlatformAudit(
      platform,
      'platform',
      'UPDATE_TENANT',
      tenant.id,
      `Memperbarui tenant "${tenant.name}".`
    )
    return tenant
  })
}

export async function deleteTenantRecord(id: string): Promise<void> {
  await mutatePlatform(async (platform) => {
    const tenant = platform.tenants.find((item) => item.id === id)
    if (!tenant) throw new Error('Tenant tidak ditemukan.')
    if (tenant.bootstrap) throw new Error('Tenant bawaan tidak dapat dihapus.')

    platform.tenants = platform.tenants.filter((item) => item.id !== id)
    platform.invoices = platform.invoices.filter((invoice) => invoice.tenant_id !== id)
    appendPlatformAudit(platform, 'platform', 'DELETE_TENANT', id, `Menghapus tenant "${tenant.name}".`)
  })

  await removeDocument(tenantScope(id)).catch((error) => {
    console.error(`Gagal menghapus dokumen tenant ${id}`, error)
  })
}

export async function tenantUsage(id: string): Promise<TenantUsage> {
  try {
    const database = await readDatabase(id)
    return {
      vehicles: database.vehicles.length,
      drivers: database.drivers.length,
      users: (database.users || []).length,
      fuelLogs: database.fuelLogs.length,
    }
  } catch {
    return { vehicles: 0, drivers: 0, users: 0, fuelLogs: 0 }
  }
}

export function nextInvoiceNumber(platform: PlatformDatabase, date: Date = new Date()): string {
  const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`
  const sequence =
    platform.invoices.filter((invoice) => invoice.number.startsWith(`INV-${stamp}`)).length + 1
  return `INV-${stamp}-${String(sequence).padStart(4, '0')}`
}

export interface CreateInvoiceInput {
  tenantId: string
  plan?: PlanId
  periodStart?: string
  periodEnd?: string
  amount?: number
  dueInDays?: number
  note?: string
}

export async function createInvoiceRecord(input: CreateInvoiceInput): Promise<Invoice> {
  return mutatePlatform(async (platform) => {
    const tenant = platform.tenants.find((item) => item.id === input.tenantId)
    if (!tenant) throw new Error('Tenant tidak ditemukan.')

    const now = new Date()
    const plan = input.plan || tenant.plan
    const periodStart = input.periodStart || now.toISOString().slice(0, 10)
    const periodEnd =
      input.periodEnd || addMonths(new Date(`${periodStart}T00:00:00`), 1).slice(0, 10)

    const invoice: Invoice = {
      id: createId('INV'),
      tenant_id: tenant.id,
      number: nextInvoiceNumber(platform, now),
      plan,
      period_start: periodStart,
      period_end: periodEnd,
      amount: Math.max(0, Math.round(input.amount ?? planPrice(plan))),
      status: 'UNPAID',
      issued_at: now.toISOString(),
      due_at: addDays(now, input.dueInDays ?? 7),
      note: input.note?.trim().slice(0, 300),
    }

    platform.invoices.unshift(invoice)
    appendPlatformAudit(
      platform,
      'platform',
      'CREATE_INVOICE',
      invoice.id,
      `Membuat invoice ${invoice.number} untuk "${tenant.name}".`
    )
    return invoice
  })
}

function planPrice(plan: PlanId): number {
  const prices: Record<PlanId, number> = {
    trial: 0,
    starter: 299_000,
    growth: 699_000,
    enterprise: 1_499_000,
  }
  return prices[plan] || 0
}

export interface UpdateInvoiceInput {
  id: string
  status?: InvoiceStatus
  method?: string
  note?: string
  amount?: number
}

export async function updateInvoiceRecord(input: UpdateInvoiceInput): Promise<Invoice> {
  return mutatePlatform(async (platform) => {
    const invoice = platform.invoices.find((item) => item.id === input.id)
    if (!invoice) throw new Error('Invoice tidak ditemukan.')

    if (input.method !== undefined) invoice.method = input.method.trim().slice(0, 80)
    if (input.note !== undefined) invoice.note = input.note.trim().slice(0, 300)
    if (input.amount !== undefined) invoice.amount = Math.max(0, Math.round(Number(input.amount) || 0))

    if (input.status && input.status !== invoice.status) {
      invoice.status = input.status
      if (input.status === 'PAID') {
        invoice.paid_at = nowIso()
        const tenant = platform.tenants.find((item) => item.id === invoice.tenant_id)
        if (tenant) {
          const base = tenant.active_until ? new Date(`${tenant.active_until}T00:00:00`) : new Date()
          const from = base.getTime() > Date.now() ? base : new Date()
          tenant.active_until = addMonths(from, 1)
          tenant.status = 'ACTIVE'
          tenant.plan = invoice.plan
          tenant.limits = planLimits(invoice.plan)
          if (tenant.trial_ends_at) tenant.trial_ends_at = undefined
        }
      }
      if (input.status === 'VOID') invoice.paid_at = undefined
    }

    appendPlatformAudit(
      platform,
      'platform',
      'UPDATE_INVOICE',
      invoice.id,
      `Memperbarui invoice ${invoice.number} menjadi ${invoice.status}.`
    )
    return invoice
  })
}

export async function platformStats() {
  const platform = await readPlatform()
  const counts = { tenants: platform.tenants.length, trial: 0, active: 0, suspended: 0, expired: 0 }
  for (const tenant of platform.tenants) {
    if (tenant.status === 'TRIAL') counts.trial += 1
    else if (tenant.status === 'ACTIVE') counts.active += 1
    else if (tenant.status === 'SUSPENDED') counts.suspended += 1
    else counts.expired += 1
  }
  const unpaid = platform.invoices.filter((invoice) => invoice.status === 'UNPAID')
  return {
    ...counts,
    invoices: platform.invoices.length,
    unpaid: unpaid.length,
    unpaidAmount: unpaid.reduce((total, invoice) => total + invoice.amount, 0),
    paidAmount: platform.invoices
      .filter((invoice) => invoice.status === 'PAID')
      .reduce((total, invoice) => total + invoice.amount, 0),
  }
}
