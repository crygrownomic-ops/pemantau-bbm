import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { PLANS, effectiveTenantStatus } from '@/lib/plans'
import { readPlatform, tenantUsage } from '@/lib/server/platform-store'
import type { Tenant } from '@/lib/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export interface PlatformTenantView extends Tenant {
  effectiveStatus: Tenant['status']
  usage: { vehicles: number; drivers: number; users: number; fuelLogs: number }
}

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'owner') {
    return NextResponse.json({ ok: false, message: 'Akses platform ditolak.' }, { status: 403 })
  }

  const platform = await readPlatform()

  const tenants: PlatformTenantView[] = await Promise.all(
    platform.tenants.map(async (tenant) => ({
      ...tenant,
      effectiveStatus: effectiveTenantStatus(tenant),
      usage: await tenantUsage(tenant.id),
    }))
  )

  const unpaid = platform.invoices.filter((invoice) => invoice.status === 'UNPAID')

  return NextResponse.json({
    ok: true,
    tenants,
    invoices: platform.invoices,
    auditTrail: platform.auditTrail.slice(0, 60),
    plans: Object.values(PLANS),
    stats: {
      total: tenants.length,
      trial: tenants.filter((tenant) => tenant.effectiveStatus === 'TRIAL').length,
      active: tenants.filter((tenant) => tenant.effectiveStatus === 'ACTIVE').length,
      suspended: tenants.filter((tenant) => tenant.effectiveStatus === 'SUSPENDED').length,
      expired: tenants.filter((tenant) => tenant.effectiveStatus === 'EXPIRED').length,
      unpaid: unpaid.length,
      unpaidAmount: unpaid.reduce((total, invoice) => total + invoice.amount, 0),
      paidAmount: platform.invoices
        .filter((invoice) => invoice.status === 'PAID')
        .reduce((total, invoice) => total + invoice.amount, 0),
      vehicles: tenants.reduce((total, tenant) => total + tenant.usage.vehicles, 0),
    },
    platformUpdatedAt: platform.updated_at,
  })
}
