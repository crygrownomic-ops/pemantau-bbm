import type { Plan, PlanId, PlanLimits, Tenant, TenantStatus } from './types'

export const PLAN_ORDER: PlanId[] = ['trial', 'starter', 'growth', 'enterprise']

export const PLANS: Record<PlanId, Plan> = {
  trial: {
    id: 'trial',
    name: 'Trial',
    tagline: 'Coba seluruh modul selama 14 hari.',
    price_monthly: 0,
    limits: { vehicles: 5, drivers: 5, users: 3 },
    features: [
      'Semua modul operasional',
      'Maksimal 5 armada',
      'Audit trail penuh',
      'Ekspor CSV & PDF',
    ],
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    tagline: 'Untuk satu depot dengan armada kecil.',
    price_monthly: 299_000,
    limits: { vehicles: 10, drivers: 10, users: 5 },
    features: [
      'Maksimal 10 armada',
      '5 akun pengguna',
      'Laporan bulanan & PDF',
      'Dukungan email',
    ],
  },
  growth: {
    id: 'growth',
    name: 'Growth',
    tagline: 'Untuk perusahaan logistik yang berkembang.',
    price_monthly: 699_000,
    limits: { vehicles: 40, drivers: 40, users: 20 },
    features: [
      'Maksimal 40 armada',
      '20 akun pengguna',
      'Scorecard & analytics lanjutan',
      'Prioritas dukungan',
    ],
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'Untuk multi-depot dan kebutuhan khusus.',
    price_monthly: 1_499_000,
    limits: { vehicles: 250, drivers: 250, users: 100 },
    features: [
      'Maksimal 250 armada',
      '100 akun pengguna',
      'Pendampingan implementasi',
      'SLA dan kustomisasi',
    ],
  },
}

export const TRIAL_DAYS = 14

export function planOf(plan: PlanId | string | undefined): Plan {
  return PLANS[(plan as PlanId) in PLANS ? (plan as PlanId) : 'trial']
}

export function planLimits(plan: PlanId | string | undefined): PlanLimits {
  return planOf(plan).limits
}

export function formatPlanPrice(plan: PlanId | string | undefined): string {
  const value = planOf(plan).price_monthly
  if (value <= 0) return 'Gratis'
  return `Rp ${value.toLocaleString('id-ID')} / bulan`
}

function endOfDay(value: string | undefined): number | null {
  if (!value) return null
  const date = new Date(`${value.slice(0, 10)}T23:59:59`)
  return Number.isNaN(date.getTime()) ? null : date.getTime()
}

/**
 * Status efektif tenant. Masa trial/aktif yang lewat otomatis menjadi EXPIRED
 * tanpa perlu proses latar belakang.
 */
export function effectiveTenantStatus(tenant: Tenant, now: number = Date.now()): TenantStatus {
  if (tenant.status === 'SUSPENDED') return 'SUSPENDED'
  if (tenant.status === 'EXPIRED') return 'EXPIRED'
  if (tenant.status === 'TRIAL') {
    const endsAt = endOfDay(tenant.trial_ends_at)
    return endsAt !== null && endsAt < now ? 'EXPIRED' : 'TRIAL'
  }
  const activeUntil = endOfDay(tenant.active_until)
  return activeUntil !== null && activeUntil < now ? 'EXPIRED' : 'ACTIVE'
}

export function daysLeft(tenant: Tenant, now: number = Date.now()): number | null {
  const endsAt =
    tenant.status === 'TRIAL' ? endOfDay(tenant.trial_ends_at) : endOfDay(tenant.active_until)
  if (endsAt === null) return null
  return Math.ceil((endsAt - now) / (24 * 60 * 60 * 1000))
}

function toDateString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function addDays(date: Date, days: number): string {
  const next = new Date(date.getTime())
  next.setDate(next.getDate() + days)
  return toDateString(next)
}

export function addMonths(date: Date, months: number): string {
  const next = new Date(date.getTime())
  next.setMonth(next.getMonth() + months)
  return toDateString(next)
}
