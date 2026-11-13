'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Logo } from '@/components/ui/Logo'
import { Icon, type IconName } from '@/components/ui/Icon'
import { Modal } from '@/components/ui/Modal'
import { logout } from '@/lib/client-store'
import { formatCurrency, formatDate, initials } from '@/lib/format'
import type { Invoice, InvoiceStatus, Plan, PlanId, TenantStatus } from '@/lib/types'

interface TenantUsage {
  vehicles: number
  drivers: number
  users: number
  fuelLogs: number
}

interface TenantView {
  id: string
  code: string
  name: string
  plan: PlanId
  status: TenantStatus
  effectiveStatus: TenantStatus
  created_at: string
  trial_ends_at?: string
  active_until?: string
  contact_name?: string
  contact_email?: string
  contact_phone?: string
  notes?: string
  bootstrap?: boolean
  limits: { vehicles: number; drivers: number; users: number }
  usage: TenantUsage
}

interface PlatformAuditEntry {
  id: string
  at: string
  actor: string
  action: string
  target: string
  summary: string
}

interface PlatformData {
  tenants: TenantView[]
  invoices: Invoice[]
  auditTrail: PlatformAuditEntry[]
  plans: Plan[]
  stats: {
    total: number
    trial: number
    active: number
    suspended: number
    expired: number
    unpaid: number
    unpaidAmount: number
    paidAmount: number
    vehicles: number
  }
  platformUpdatedAt: string
}

const TABS: Array<{ key: string; label: string; icon: IconName }> = [
  { key: 'overview', label: 'Ringkasan', icon: 'dashboard' },
  { key: 'tenants', label: 'Tenant', icon: 'building' },
  { key: 'invoices', label: 'Invoice', icon: 'creditCard' },
  { key: 'plans', label: 'Paket', icon: 'package' },
  { key: 'audit', label: 'Audit', icon: 'shield' },
]

const STATUS_LABEL: Record<TenantStatus, string> = {
  TRIAL: 'Uji coba',
  ACTIVE: 'Aktif',
  SUSPENDED: 'Ditangguhkan',
  EXPIRED: 'Kedaluwarsa',
}

const STATUS_BADGE: Record<TenantStatus, string> = {
  TRIAL: 'badge-blue',
  ACTIVE: 'badge-green',
  SUSPENDED: 'badge-red',
  EXPIRED: 'badge-slate',
}

const INVOICE_LABEL: Record<InvoiceStatus, string> = {
  UNPAID: 'Belum dibayar',
  PAID: 'Lunas',
  VOID: 'Dibatalkan',
}

const INVOICE_BADGE: Record<InvoiceStatus, string> = {
  UNPAID: 'badge-amber',
  PAID: 'badge-green',
  VOID: 'badge-slate',
}

const PLAN_ORDER: PlanId[] = ['trial', 'starter', 'growth', 'enterprise']

function planName(plans: Plan[], id: PlanId): string {
  return plans.find((plan) => plan.id === id)?.name || id
}

function planPrice(plans: Plan[], id: PlanId): number {
  return plans.find((plan) => plan.id === id)?.price_monthly || 0
}

function periodEndDefault(start: string): string {
  const date = new Date(`${start}T00:00:00`)
  if (Number.isNaN(date.getTime())) return start
  const next = new Date(date.getFullYear(), date.getMonth() + 1, 0)
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`
}

function firstOfMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
}

async function requestJson<T = Record<string, unknown>>(
  url: string,
  method: string,
  body?: unknown
): Promise<T> {
  const response = await fetch(url, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: 'same-origin',
  })
  const payload = (await response.json().catch(() => null)) as
    | (T & { ok?: boolean; message?: string })
    | null
  if (!response.ok || !payload || payload.ok === false) {
    throw new Error(payload?.message || 'Permintaan gagal diproses.')
  }
  return payload
}

function UsageMeter({ label, used, limit }: { label: string; used: number; limit: number }) {
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0
  const tone = used >= limit ? 'bg-rose-500' : pct >= 80 ? 'bg-amber-400' : 'bg-emerald-500'
  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-[10px] font-semibold text-slate-500">
        <span>{label}</span>
        <span className={`font-mono ${used >= limit ? 'text-rose-600' : 'text-slate-600'}`}>
          {used}/{limit}
        </span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: TenantStatus }) {
  return <span className={`badge ${STATUS_BADGE[status]}`}>{STATUS_LABEL[status]}</span>
}

function InvoiceBadge({ status }: { status: InvoiceStatus }) {
  return <span className={`badge ${INVOICE_BADGE[status]}`}>{INVOICE_LABEL[status]}</span>
}

function StatCard({
  label,
  value,
  hint,
  icon,
  tone = 'navy',
}: {
  label: string
  value: string
  hint?: string
  icon: IconName
  tone?: 'navy' | 'gold' | 'emerald' | 'rose'
}) {
  const toneClass = {
    navy: 'bg-navy-50 text-navy-800',
    gold: 'bg-gold-50 text-gold-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    rose: 'bg-rose-50 text-rose-700',
  }[tone]

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="stat-label">{label}</p>
        <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${toneClass}`}>
          <Icon name={icon} className="h-3.5 w-3.5" />
        </span>
      </div>
      <p className="stat-value mt-2">{value}</p>
      {hint && <p className="mt-1 text-[10px] font-medium text-slate-500">{hint}</p>}
    </div>
  )
}

export function PlatformConsole({ ownerName }: { ownerName: string }) {
  const router = useRouter()
  const [data, setData] = useState<PlatformData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState('overview')
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null)
  const [tenantModal, setTenantModal] = useState<{ open: boolean; tenant: TenantView | null }>({
    open: false,
    tenant: null,
  })
  const [invoiceOpen, setInvoiceOpen] = useState(false)
  const [invoiceTarget, setInvoiceTarget] = useState<Invoice | null>(null)
  const [confirm, setConfirm] = useState<{
    title: string
    description: string
    confirmLabel: string
    tone: 'danger' | 'primary'
    action: () => Promise<void>
  } | null>(null)
  const [confirmBusy, setConfirmBusy] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const load = useCallback(async () => {
    setError(null)
    try {
      const payload = await requestJson<{ ok: true } & PlatformData>('/api/platform/data', 'GET')
      setData({
        tenants: payload.tenants,
        invoices: payload.invoices,
        auditTrail: payload.auditTrail,
        plans: payload.plans,
        stats: payload.stats,
        platformUpdatedAt: payload.platformUpdatedAt,
      })
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Gagal memuat data platform.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    requestJson<{ ok: true } & PlatformData>('/api/platform/data', 'GET')
      .then((payload) => {
        if (cancelled) return
        setData({
          tenants: payload.tenants,
          invoices: payload.invoices,
          auditTrail: payload.auditTrail,
          plans: payload.plans,
          stats: payload.stats,
          platformUpdatedAt: payload.platformUpdatedAt,
        })
        setError(null)
      })
      .catch((loadError: unknown) => {
        if (cancelled) return
        setError(loadError instanceof Error ? loadError.message : 'Gagal memuat data platform.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!feedback) return
    const timer = window.setTimeout(() => setFeedback(null), 4500)
    return () => window.clearTimeout(timer)
  }, [feedback])

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await logout()
    } catch {
      // Cookie tetap dibersihkan di sisi server bila memungkinkan.
    }
    router.replace('/platform/login')
    router.refresh()
  }

  const tenants = data?.tenants || []
  const invoices = data?.invoices || []
  const plans = data?.plans || []
  const auditTrail = data?.auditTrail || []

  const filteredTenants = tenants

  const activeTenants = tenants.filter((tenant) => tenant.effectiveStatus === 'ACTIVE')
  const trialTenants = tenants.filter((tenant) => tenant.effectiveStatus === 'TRIAL')
  const unpaidInvoices = invoices.filter((invoice) => invoice.status === 'UNPAID')
  const mrr = activeTenants.reduce((total, tenant) => total + planPrice(plans, tenant.plan), 0)

  const runMutation = async (action: () => Promise<unknown>, message: string) => {
    try {
      await action()
      setFeedback({ tone: 'success', message })
      await load()
    } catch (mutationError) {
      setFeedback({
        tone: 'error',
        message: mutationError instanceof Error ? mutationError.message : 'Aksi gagal diproses.',
      })
      throw mutationError
    }
  }

  const saveTenant = async (payload: Record<string, unknown>, id?: string) => {
    if (id) {
      await runMutation(
        () => requestJson('/api/platform/tenants', 'PATCH', { ...payload, id }),
        'Data tenant berhasil diperbarui.'
      )
    } else {
      await runMutation(
        () => requestJson('/api/platform/tenants', 'POST', payload),
        'Tenant baru berhasil dibuat.'
      )
    }
  }

  const setTenantStatus = (tenant: TenantView, status: TenantStatus) => {
    setConfirm({
      title:
        status === 'SUSPENDED'
          ? `Tangguhkan ${tenant.name}?`
          : `Aktifkan kembali ${tenant.name}?`,
      description:
        status === 'SUSPENDED'
          ? 'Seluruh pengguna perusahaan tidak dapat login sampai tenant diaktifkan kembali.'
          : 'Tenant akan kembali dapat diakses oleh seluruh penggunanya.',
      confirmLabel: status === 'SUSPENDED' ? 'Tangguhkan' : 'Aktifkan',
      tone: status === 'SUSPENDED' ? 'danger' : 'primary',
      action: async () => {
        await runMutation(
          () => requestJson('/api/platform/tenants', 'PATCH', { id: tenant.id, status }),
          status === 'SUSPENDED' ? 'Tenant ditangguhkan.' : 'Tenant diaktifkan kembali.'
        )
      },
    })
  }

  const deleteTenant = (tenant: TenantView) => {
    setConfirm({
      title: `Hapus ${tenant.name}?`,
      description:
        'Database tenant akan dipindahkan ke berkas cadangan dan seluruh invoice terkait dihapus dari daftar. Tindakan ini tidak dapat dibatalkan dari antarmuka.',
      confirmLabel: 'Hapus tenant',
      tone: 'danger',
      action: async () => {
        await runMutation(
          () => requestJson(`/api/platform/tenants?id=${encodeURIComponent(tenant.id)}`, 'DELETE'),
          'Tenant berhasil dihapus.'
        )
      },
    })
  }

  const createInvoice = async (payload: Record<string, unknown>) => {
    await runMutation(
      () => requestJson('/api/platform/invoices', 'POST', payload),
      'Invoice berhasil dibuat.'
    )
  }

  const updateInvoice = async (id: string, payload: Record<string, unknown>, message: string) => {
    await runMutation(
      () => requestJson('/api/platform/invoices', 'PATCH', { ...payload, id }),
      message
    )
  }

  const confirmAction = async () => {
    if (!confirm || confirmBusy) return
    setConfirmBusy(true)
    try {
      await confirm.action()
      setConfirm(null)
    } catch {
      // Pesan kegagalan sudah ditampilkan melalui feedback.
    } finally {
      setConfirmBusy(false)
    }
  }

  if (loading && !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy-950">
        <div className="flex items-center gap-3 text-xs font-bold text-slate-300">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-gold-400" />
          Memuat konsol platform…
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas px-5">
        <div className="card w-full max-w-md p-8 text-center">
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-rose-50 text-rose-600">
            <Icon name="alert" className="h-5 w-5" />
          </span>
          <p className="mt-3 text-sm font-extrabold text-slate-800">Konsol platform gagal dimuat</p>
          <p className="mt-1 text-xs text-slate-500">{error || 'Terjadi kesalahan yang tidak diketahui.'}</p>
          <button type="button" onClick={() => void load()} className="btn btn-primary mt-4">
            <Icon name="refresh" className="h-3.5 w-3.5" />
            Coba lagi
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-navy-950">
        <div className="mx-auto flex h-14 w-full max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Logo dark />
            <span className="hidden h-5 w-px bg-white/15 sm:block" />
            <div className="hidden min-w-0 sm:block">
              <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-gold-400">Platform Console</p>
              <p className="truncate text-[10px] font-medium text-slate-400">Tenant, paket, dan penagihan</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void load()}
              className="rounded-lg border border-white/10 bg-white/[0.04] p-2 text-slate-300 transition hover:bg-white/[0.08]"
              title="Muat ulang"
              aria-label="Muat ulang"
            >
              <Icon name="refresh" className="h-3.5 w-3.5" />
            </button>
            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gold-400 text-[9px] font-extrabold text-navy-950">
                {initials(ownerName)}
              </span>
              <div className="hidden leading-tight sm:block">
                <p className="max-w-[140px] truncate text-[10px] font-bold text-white">{ownerName}</p>
                <p className="text-[8px] font-extrabold uppercase tracking-wider text-gold-400">Platform owner</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-500/15 hover:text-rose-300 disabled:opacity-50"
              title="Keluar"
              aria-label="Keluar"
            >
              <Icon name="logout" className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1440px] px-4 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-1.5 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-gold-600">
              <span className="h-1.5 w-1.5 rounded-full bg-gold-400" />
              SaaS Control Plane
            </p>
            <h1 className="text-xl font-extrabold tracking-tight text-navy-950 sm:text-2xl">Konsol Platform</h1>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-500">
              Kelola perusahaan pengguna, paket langganan, invoice manual, dan jejak audit platform.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge badge-slate">
              Diperbarui {new Date(data.platformUpdatedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <button
              type="button"
              onClick={() => setTenantModal({ open: true, tenant: null })}
              className="btn btn-gold"
            >
              <Icon name="userPlus" className="h-3.5 w-3.5" />
              Tenant baru
            </button>
          </div>
        </div>

        {feedback && (
          <div
            className={`mt-4 flex items-start justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-[11px] font-semibold ${
              feedback.tone === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-rose-200 bg-rose-50 text-rose-700'
            }`}
          >
            <span className="flex items-start gap-2">
              <Icon name={feedback.tone === 'success' ? 'checkCircle' : 'alert'} className="mt-px h-3.5 w-3.5 shrink-0" />
              {feedback.message}
            </span>
            <button type="button" onClick={() => setFeedback(null)} aria-label="Tutup notifikasi">
              <Icon name="close" className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <div className="mt-5 flex gap-1.5 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1.5">
          {TABS.map((item) => {
            const active = tab === item.key
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setTab(item.key)}
                className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-extrabold transition ${
                  active ? 'bg-navy-900 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-navy-900'
                }`}
              >
                <Icon name={item.icon} className="h-3.5 w-3.5" />
                {item.label}
                {item.key === 'invoices' && unpaidInvoices.length > 0 && (
                  <span className={`rounded-full px-1.5 text-[9px] ${active ? 'bg-white/15 text-white' : 'bg-amber-100 text-amber-700'}`}>
                    {unpaidInvoices.length}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {tab === 'overview' && (
          <div className="mt-5 space-y-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Tenant aktif"
                value={String(activeTenants.length)}
                hint={`${tenants.length} perusahaan terdaftar`}
                icon="building"
                tone="emerald"
              />
              <StatCard
                label="Masa uji coba"
                value={String(trialTenants.length)}
                hint={`${data.stats.expired} kedaluwarsa · ${data.stats.suspended} ditangguhkan`}
                icon="clock"
                tone="gold"
              />
              <StatCard
                label="Invoice belum dibayar"
                value={formatCurrency(data.stats.unpaidAmount)}
                hint={`${unpaidInvoices.length} invoice menunggu pembayaran`}
                icon="creditCard"
                tone={unpaidInvoices.length > 0 ? 'rose' : 'navy'}
              />
              <StatCard
                label="Nilai langganan aktif"
                value={formatCurrency(mrr)}
                hint="Estimasi bulanan dari paket tenant aktif"
                icon="trendingUp"
                tone="navy"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.55fr_1fr]">
              <section className="card overflow-hidden">
                <div className="card-header">
                  <div>
                    <p className="card-title">Tenant terbaru</p>
                    <p className="card-subtitle">Pemakaian armada, driver, dan akun dibandingkan batas paket.</p>
                  </div>
                  <button type="button" onClick={() => setTab('tenants')} className="btn btn-ghost px-2.5 py-1.5">
                    Lihat semua
                    <Icon name="arrowRight" className="h-3 w-3" />
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="table-base min-w-[640px]">
                    <thead>
                      <tr>
                        <th>Perusahaan</th>
                        <th>Paket</th>
                        <th>Status</th>
                        <th className="min-w-[160px]">Pemakaian</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tenants.slice(0, 6).map((tenant) => (
                        <tr key={tenant.id}>
                          <td>
                            <p className="font-bold text-slate-900">{tenant.name}</p>
                            <p className="font-mono text-[10px] text-slate-400">
                              {tenant.code}
                              {tenant.bootstrap ? ' · bawaan' : ''}
                            </p>
                          </td>
                          <td>
                            <span className="badge badge-slate">{planName(plans, tenant.plan)}</span>
                          </td>
                          <td>
                            <StatusBadge status={tenant.effectiveStatus} />
                          </td>
                          <td>
                            <div className="space-y-1.5">
                              <UsageMeter label="Armada" used={tenant.usage.vehicles} limit={tenant.limits.vehicles} />
                              <UsageMeter label="Akun" used={tenant.usage.users} limit={tenant.limits.users} />
                            </div>
                          </td>
                        </tr>
                      ))}
                      {tenants.length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-10 text-center text-slate-400">
                            Belum ada tenant. Tambahkan perusahaan pertama Anda.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="card overflow-hidden">
                <div className="card-header">
                  <div>
                    <p className="card-title">Invoice perlu tindakan</p>
                    <p className="card-subtitle">Tandai lunas setelah transfer diterima.</p>
                  </div>
                  <span className={`badge ${unpaidInvoices.length > 0 ? 'badge-amber' : 'badge-green'}`}>
                    {unpaidInvoices.length}
                  </span>
                </div>
                <div className="divide-y divide-slate-100">
                  {unpaidInvoices.slice(0, 5).map((invoice) => {
                    const tenant = tenants.find((item) => item.id === invoice.tenant_id)
                    return (
                      <div key={invoice.id} className="flex items-start justify-between gap-3 px-4 py-3">
                        <div className="min-w-0">
                          <p className="font-mono text-[10px] font-bold text-navy-900">{invoice.number}</p>
                          <p className="truncate text-[11px] font-bold text-slate-700">{tenant?.name || invoice.tenant_id}</p>
                          <p className="text-[10px] text-slate-400">
                            Jatuh tempo {formatDate(invoice.due_at)} · {planName(plans, invoice.plan)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-[11px] font-bold text-slate-800">{formatCurrency(invoice.amount)}</p>
                          <button
                            type="button"
                            onClick={() => setInvoiceTarget(invoice)}
                            className="mt-1 text-[10px] font-extrabold text-emerald-700 hover:underline"
                          >
                            Tandai lunas
                          </button>
                        </div>
                      </div>
                    )
                  })}
                  {unpaidInvoices.length === 0 && (
                    <div className="px-4 py-10 text-center">
                      <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                        <Icon name="checkCircle" className="h-5 w-5" />
                      </span>
                      <p className="mt-2 text-xs font-bold text-slate-700">Semua invoice beres</p>
                      <p className="text-[10px] text-slate-400">Tidak ada tagihan yang menunggu pembayaran.</p>
                    </div>
                  )}
                </div>
              </section>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Total armada terkelola" value={String(data.stats.vehicles)} icon="truck" />
              <StatCard label="Tenant ditangguhkan" value={String(data.stats.suspended)} icon="power" tone={data.stats.suspended > 0 ? 'rose' : 'navy'} />
              <StatCard label="Tenant kedaluwarsa" value={String(data.stats.expired)} icon="xCircle" tone={data.stats.expired > 0 ? 'rose' : 'navy'} />
              <StatCard label="Pendapatan tercatat" value={formatCurrency(data.stats.paidAmount)} hint="Total invoice berstatus lunas" icon="creditCard" tone="emerald" />
            </div>
          </div>
        )}

        {tab === 'tenants' && (
          <TenantsTab
            tenants={filteredTenants}
            plans={plans}
            onCreate={() => setTenantModal({ open: true, tenant: null })}
            onEdit={(tenant) => setTenantModal({ open: true, tenant })}
            onSuspend={(tenant) => setTenantStatus(tenant, 'SUSPENDED')}
            onActivate={(tenant) => setTenantStatus(tenant, 'ACTIVE')}
            onDelete={deleteTenant}
          />
        )}

        {tab === 'invoices' && (
          <InvoicesTab
            invoices={invoices}
            tenants={tenants}
            plans={plans}
            onCreate={() => setInvoiceOpen(true)}
            onMarkPaid={(invoice) => setInvoiceTarget(invoice)}
            onVoid={(invoice) =>
              setConfirm({
                title: `Batalkan invoice ${invoice.number}?`,
                description: 'Invoice akan ditandai batal dan tidak dihitung sebagai tagihan aktif.',
                confirmLabel: 'Batalkan invoice',
                tone: 'danger',
                action: async () => {
                  await updateInvoice(invoice.id, { status: 'VOID' }, 'Invoice dibatalkan.')
                },
              })
            }
          />
        )}

        {tab === 'plans' && (
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {PLAN_ORDER.map((id) => {
              const plan = plans.find((item) => item.id === id)
              if (!plan) return null
              return (
                <section key={id} className={`card p-5 ${id === 'growth' ? 'border-gold-300 ring-1 ring-gold-200' : ''}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">{plan.name}</p>
                      <p className="mt-1 text-lg font-extrabold tracking-tight text-navy-950">
                        {plan.price_monthly > 0 ? formatCurrency(plan.price_monthly) : 'Gratis'}
                        {plan.price_monthly > 0 && <span className="text-[10px] font-semibold text-slate-400"> /bulan</span>}
                      </p>
                    </div>
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-50 text-navy-800">
                      <Icon name="package" className="h-4 w-4" />
                    </span>
                  </div>
                  <p className="mt-2 text-[11px] leading-relaxed text-slate-500">{plan.tagline}</p>

                  <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-2.5">
                    {[
                      { label: 'Armada', value: plan.limits.vehicles },
                      { label: 'Driver', value: plan.limits.drivers },
                      { label: 'Akun', value: plan.limits.users },
                    ].map((item) => (
                      <div key={item.label} className="text-center">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{item.label}</p>
                        <p className="font-mono text-sm font-bold text-navy-900">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  <ul className="mt-4 space-y-2">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-[11px] leading-relaxed text-slate-600">
                        <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                          <Icon name="check" className="h-2.5 w-2.5" />
                        </span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </section>
              )
            })}
          </div>
        )}

        {tab === 'audit' && (
          <section className="card mt-5 overflow-hidden">
            <div className="card-header">
              <div>
                <p className="card-title">Jejak audit platform</p>
                <p className="card-subtitle">Aktivitas pembuatan tenant, perubahan status, dan penagihan.</p>
              </div>
              <span className="badge badge-slate">{auditTrail.length} entri</span>
            </div>
            <div className="divide-y divide-slate-100">
              {auditTrail.map((entry) => (
                <div key={entry.id} className="flex items-start gap-3 px-4 py-3">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-navy-50 text-navy-700">
                    <Icon name="shield" className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-slate-800">{entry.summary}</p>
                    <p className="mt-0.5 text-[10px] text-slate-400">
                      {entry.actor} · {entry.action} · target {entry.target}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-[9px] text-slate-400">
                    {new Date(entry.at).toLocaleString('id-ID', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              ))}
              {auditTrail.length === 0 && (
                <p className="px-4 py-12 text-center text-xs text-slate-400">Belum ada aktivitas platform.</p>
              )}
            </div>
          </section>
        )}
      </main>

      {tenantModal.open && (
        <TenantModal
          tenant={tenantModal.tenant}
          plans={plans}
          onClose={() => setTenantModal({ open: false, tenant: null })}
          onSubmit={saveTenant}
        />
      )}

      {invoiceOpen && (
        <InvoiceModal
          tenants={tenants}
          plans={plans}
          onClose={() => setInvoiceOpen(false)}
          onSubmit={createInvoice}
        />
      )}

      {invoiceTarget && (
        <InvoiceStatusModal
          invoice={invoiceTarget}
          tenant={tenants.find((tenant) => tenant.id === invoiceTarget.tenant_id) || null}
          plans={plans}
          onClose={() => setInvoiceTarget(null)}
          onSubmit={async (id, payload) => {
            await updateInvoice(id, payload, 'Status invoice berhasil diperbarui.')
            setInvoiceTarget(null)
          }}
        />
      )}

      <Modal
        open={Boolean(confirm)}
        onClose={() => (confirmBusy ? undefined : setConfirm(null))}
        title={confirm?.title || ''}
        description={confirm?.description}
        size="sm"
        footer={
          <>
            <button type="button" onClick={() => setConfirm(null)} disabled={confirmBusy} className="btn btn-ghost">
              Batal
            </button>
            <button
              type="button"
              onClick={() => void confirmAction()}
              disabled={confirmBusy}
              className={`btn ${confirm?.tone === 'danger' ? 'btn-danger' : 'btn-primary'}`}
            >
              {confirmBusy ? 'Memproses…' : confirm?.confirmLabel || 'Lanjutkan'}
            </button>
          </>
        }
      >
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11px] font-semibold text-amber-800">
          <Icon name="alert" className="mt-px h-4 w-4 shrink-0" />
          Pastikan tindakan ini sudah sesuai kebijakan internal sebelum dilanjutkan.
        </div>
      </Modal>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Tenants                                                             */
/* ------------------------------------------------------------------ */

function TenantsTab({
  tenants,
  plans,
  onCreate,
  onEdit,
  onSuspend,
  onActivate,
  onDelete,
}: {
  tenants: TenantView[]
  plans: Plan[]
  onCreate: () => void
  onEdit: (tenant: TenantView) => void
  onSuspend: (tenant: TenantView) => void
  onActivate: (tenant: TenantView) => void
  onDelete: (tenant: TenantView) => void
}) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'ALL' | TenantStatus>('ALL')

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    return tenants.filter((tenant) => {
      const matchesStatus = status === 'ALL' || tenant.effectiveStatus === status
      const haystack = [tenant.name, tenant.code, tenant.contact_name, tenant.contact_email].join(' ').toLowerCase()
      return matchesStatus && (!term || haystack.includes(term))
    })
  }, [tenants, query, status])

  return (
    <div className="mt-5 space-y-4">
      <div className="card overflow-hidden">
        <div className="card-header flex-col gap-3 sm:flex-row sm:items-center">
          <div>
            <p className="card-title">Daftar perusahaan</p>
            <p className="card-subtitle">
              {filtered.length} dari {tenants.length} tenant ditampilkan.
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <div className="relative">
              <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari nama, kode, kontak…"
                className="input py-2 pl-9 sm:w-60"
              />
            </div>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as 'ALL' | TenantStatus)}
              className="input py-2 sm:w-40"
            >
              <option value="ALL">Semua status</option>
              <option value="TRIAL">Uji coba</option>
              <option value="ACTIVE">Aktif</option>
              <option value="SUSPENDED">Ditangguhkan</option>
              <option value="EXPIRED">Kedaluwarsa</option>
            </select>
            <button type="button" onClick={onCreate} className="btn btn-gold">
              <Icon name="plus" className="h-3.5 w-3.5" />
              Tenant baru
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="table-base min-w-[1050px]">
            <thead>
              <tr>
                <th>Perusahaan</th>
                <th>Paket</th>
                <th>Status</th>
                <th>Masa berlaku</th>
                <th className="min-w-[190px]">Pemakaian</th>
                <th className="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((tenant) => (
                <tr key={tenant.id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-navy-900 text-[10px] font-extrabold text-gold-300">
                        {initials(tenant.name)}
                      </span>
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 font-bold text-slate-900">
                          <span className="truncate">{tenant.name}</span>
                          {tenant.bootstrap && <span className="badge badge-slate">Bawaan</span>}
                        </p>
                        <p className="font-mono text-[10px] text-slate-400">{tenant.code}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-slate">{planName(plans, tenant.plan)}</span>
                    <p className="mt-1 text-[10px] text-slate-400">{formatCurrency(planPrice(plans, tenant.plan))}/bln</p>
                  </td>
                  <td>
                    <StatusBadge status={tenant.effectiveStatus} />
                  </td>
                  <td className="whitespace-nowrap">
                    {tenant.effectiveStatus === 'TRIAL' ? (
                      <p className="text-[11px] font-semibold text-slate-600">Trial s.d. {formatDate(tenant.trial_ends_at)}</p>
                    ) : (
                      <p className="text-[11px] font-semibold text-slate-600">Aktif s.d. {formatDate(tenant.active_until)}</p>
                    )}
                    <p className="text-[10px] text-slate-400">Dibuat {formatDate(tenant.created_at)}</p>
                  </td>
                  <td>
                    <div className="space-y-1.5">
                      <UsageMeter label="Armada" used={tenant.usage.vehicles} limit={tenant.limits.vehicles} />
                      <UsageMeter label="Driver" used={tenant.usage.drivers} limit={tenant.limits.drivers} />
                      <UsageMeter label="Akun" used={tenant.usage.users} limit={tenant.limits.users} />
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onEdit(tenant)}
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-navy-50 hover:text-navy-800"
                        title="Ubah tenant"
                        aria-label={`Ubah ${tenant.name}`}
                      >
                        <Icon name="edit" className="h-3.5 w-3.5" />
                      </button>
                      {tenant.effectiveStatus === 'SUSPENDED' || tenant.effectiveStatus === 'EXPIRED' ? (
                        <button
                          type="button"
                          onClick={() => onActivate(tenant)}
                          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-700"
                          title="Aktifkan tenant"
                          aria-label={`Aktifkan ${tenant.name}`}
                        >
                          <Icon name="power" className="h-3.5 w-3.5" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onSuspend(tenant)}
                          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-amber-50 hover:text-amber-700"
                          title="Tangguhkan tenant"
                          aria-label={`Tangguhkan ${tenant.name}`}
                        >
                          <Icon name="power" className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {!tenant.bootstrap && (
                        <button
                          type="button"
                          onClick={() => onDelete(tenant)}
                          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                          title="Hapus tenant"
                          aria-label={`Hapus ${tenant.name}`}
                        >
                          <Icon name="trash" className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Tidak ada tenant yang cocok dengan filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function TenantModal({
  tenant,
  plans,
  onClose,
  onSubmit,
}: {
  tenant: TenantView | null
  plans: Plan[]
  onClose: () => void
  onSubmit: (payload: Record<string, unknown>, id?: string) => Promise<void>
}) {
  const editing = Boolean(tenant)
  const [form, setForm] = useState(() =>
    tenant
      ? {
          name: tenant.name,
          code: tenant.code,
          plan: tenant.plan,
          status: tenant.status,
          activeUntil: tenant.active_until || '',
          trialEndsAt: tenant.trial_ends_at || '',
          adminName: '',
          adminUsername: '',
          adminPassword: '',
          contactName: tenant.contact_name || '',
          contactEmail: tenant.contact_email || '',
          contactPhone: tenant.contact_phone || '',
          notes: tenant.notes || '',
        }
      : {
          name: '',
          code: '',
          plan: 'trial' as PlanId,
          status: 'ACTIVE' as TenantStatus,
          activeUntil: '',
          trialEndsAt: '',
          adminName: '',
          adminUsername: '',
          adminPassword: '',
          contactName: '',
          contactEmail: '',
          contactPhone: '',
          notes: '',
        }
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const setField = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }))

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (saving) return
    setError(null)
    setSaving(true)
    try {
      if (editing && tenant) {
        await onSubmit(
          {
            name: form.name,
            plan: form.plan,
            status: form.status,
            activeUntil: form.activeUntil,
            trialEndsAt: form.trialEndsAt,
            contactName: form.contactName,
            contactEmail: form.contactEmail,
            contactPhone: form.contactPhone,
            notes: form.notes,
          },
          tenant.id
        )
      } else {
        await onSubmit({
          name: form.name,
          code: form.code,
          plan: form.plan,
          adminName: form.adminName,
          adminUsername: form.adminUsername,
          adminPassword: form.adminPassword,
          contactName: form.contactName,
          contactEmail: form.contactEmail,
          contactPhone: form.contactPhone,
          notes: form.notes,
        })
      }
      onClose()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Gagal menyimpan tenant.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={editing ? `Ubah ${tenant?.name}` : 'Tenant baru'}
      description={
        editing
          ? 'Perbarui paket, status, dan masa aktif perusahaan.'
          : 'Buat perusahaan baru beserta akun administrator pertamanya.'
      }
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <span className="label">Nama perusahaan</span>
            <input
              className="input"
              value={form.name}
              onChange={(event) => setField('name', event.target.value)}
              placeholder="PT Contoh Logistik"
              required
            />
          </div>
          <div>
            <span className="label">Kode perusahaan</span>
            <input
              className="input font-mono lowercase"
              value={form.code}
              onChange={(event) => setField('code', event.target.value.toLowerCase())}
              placeholder="contoh-logistik"
              disabled={editing}
              required
            />
            <p className="mt-1 text-[10px] text-slate-400">
              {editing ? 'Kode perusahaan tidak dapat diubah.' : 'Dipakai pengguna saat login.'}
            </p>
          </div>
          <div>
            <span className="label">Paket</span>
            <select className="input" value={form.plan} onChange={(event) => setField('plan', event.target.value)}>
              {PLAN_ORDER.map((id) => {
                const plan = plans.find((item) => item.id === id)
                return (
                  <option key={id} value={id}>
                    {plan?.name || id} {plan && plan.price_monthly > 0 ? `- ${formatCurrency(plan.price_monthly)}/bln` : ''}
                  </option>
                )
              })}
            </select>
          </div>
          <div>
            <span className="label">Status</span>
            <select className="input" value={form.status} onChange={(event) => setField('status', event.target.value)}>
              <option value="TRIAL">Uji coba</option>
              <option value="ACTIVE">Aktif</option>
              <option value="SUSPENDED">Ditangguhkan</option>
              <option value="EXPIRED">Kedaluwarsa</option>
            </select>
          </div>
          <div>
            <span className="label">Aktif sampai</span>
            <input
              type="date"
              className="input"
              value={form.activeUntil.slice(0, 10)}
              onChange={(event) => setField('activeUntil', event.target.value)}
            />
          </div>
          <div>
            <span className="label">Trial berakhir</span>
            <input
              type="date"
              className="input"
              value={form.trialEndsAt.slice(0, 10)}
              onChange={(event) => setField('trialEndsAt', event.target.value)}
            />
          </div>
        </div>

        {!editing && (
          <div className="space-y-3 border-t border-slate-100 pt-4">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400">Akun administrator</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <span className="label">Nama lengkap</span>
                <input
                  className="input"
                  value={form.adminName}
                  onChange={(event) => setField('adminName', event.target.value)}
                  placeholder="Nama administrator"
                  required
                />
              </div>
              <div>
                <span className="label">Username</span>
                <input
                  className="input font-mono lowercase"
                  value={form.adminUsername}
                  onChange={(event) => setField('adminUsername', event.target.value.toLowerCase())}
                  placeholder="admin.perusahaan"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <span className="label">Password awal</span>
                <input
                  type="text"
                  className="input font-mono"
                  value={form.adminPassword}
                  onChange={(event) => setField('adminPassword', event.target.value)}
                  placeholder="Minimal 8 karakter"
                  minLength={8}
                  required
                />
                <p className="mt-1 text-[10px] text-slate-400">
                  Sampaikan password ini melalui kanal aman; pengguna dapat menggantinya nanti.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
          <div>
            <span className="label">Nama kontak</span>
            <input
              className="input"
              value={form.contactName}
              onChange={(event) => setField('contactName', event.target.value)}
              placeholder="PIC perusahaan"
            />
          </div>
          <div>
            <span className="label">Email kontak</span>
            <input
              type="email"
              className="input"
              value={form.contactEmail}
              onChange={(event) => setField('contactEmail', event.target.value)}
              placeholder="pic@perusahaan.co.id"
            />
          </div>
          <div>
            <span className="label">Telepon kontak</span>
            <input
              className="input font-mono"
              value={form.contactPhone}
              onChange={(event) => setField('contactPhone', event.target.value)}
              placeholder="0812xxxxxxx"
            />
          </div>
          <div>
            <span className="label">Catatan internal</span>
            <input
              className="input"
              value={form.notes}
              onChange={(event) => setField('notes', event.target.value)}
              placeholder="Catatan untuk tim platform"
            />
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-[11px] font-semibold text-rose-700">
            <Icon name="alert" className="mt-px h-3.5 w-3.5 shrink-0" />
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
          <button type="button" onClick={onClose} className="btn btn-ghost">
            Batal
          </button>
          <button type="submit" disabled={saving} className="btn btn-primary">
            {saving ? 'Menyimpan…' : editing ? 'Simpan perubahan' : 'Buat tenant'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

/* ------------------------------------------------------------------ */
/* Invoices                                                            */
/* ------------------------------------------------------------------ */

function InvoicesTab({
  invoices,
  tenants,
  plans,
  onCreate,
  onMarkPaid,
  onVoid,
}: {
  invoices: Invoice[]
  tenants: TenantView[]
  plans: Plan[]
  onCreate: () => void
  onMarkPaid: (invoice: Invoice) => void
  onVoid: (invoice: Invoice) => void
}) {
  const [status, setStatus] = useState<'ALL' | InvoiceStatus>('ALL')
  const filtered = invoices.filter((invoice) => status === 'ALL' || invoice.status === status)

  const tenantName = (id: string) => tenants.find((tenant) => tenant.id === id)?.name || id

  return (
    <div className="mt-5 space-y-4">
      <div className="card overflow-hidden">
        <div className="card-header flex-col gap-3 sm:flex-row sm:items-center">
          <div>
            <p className="card-title">Invoice langganan</p>
            <p className="card-subtitle">Penagihan manual dengan transfer bank; tandai lunas setelah dana diterima.</p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as 'ALL' | InvoiceStatus)}
              className="input py-2 sm:w-40"
            >
              <option value="ALL">Semua status</option>
              <option value="UNPAID">Belum dibayar</option>
              <option value="PAID">Lunas</option>
              <option value="VOID">Dibatalkan</option>
            </select>
            <button type="button" onClick={onCreate} className="btn btn-gold">
              <Icon name="plus" className="h-3.5 w-3.5" />
              Buat invoice
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="table-base min-w-[980px]">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Tenant</th>
                <th>Paket</th>
                <th>Periode</th>
                <th className="text-right">Nominal</th>
                <th>Jatuh tempo</th>
                <th>Status</th>
                <th className="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((invoice) => (
                <tr key={invoice.id}>
                  <td>
                    <p className="font-mono text-[11px] font-extrabold text-navy-950">{invoice.number}</p>
                    <p className="text-[10px] text-slate-400">Dibuat {formatDate(invoice.issued_at.slice(0, 10))}</p>
                  </td>
                  <td className="font-bold text-slate-800">{tenantName(invoice.tenant_id)}</td>
                  <td>
                    <span className="badge badge-slate">{planName(plans, invoice.plan)}</span>
                  </td>
                  <td className="whitespace-nowrap text-[11px] text-slate-600">
                    {formatDate(invoice.period_start)} – {formatDate(invoice.period_end)}
                  </td>
                  <td className="whitespace-nowrap text-right font-mono font-bold text-slate-800">
                    {formatCurrency(invoice.amount)}
                  </td>
                  <td className="whitespace-nowrap text-[11px] text-slate-600">{formatDate(invoice.due_at)}</td>
                  <td>
                    <InvoiceBadge status={invoice.status} />
                    {invoice.status === 'PAID' && (
                      <p className="mt-1 text-[10px] text-slate-400">
                        {formatDate(invoice.paid_at?.slice(0, 10))}
                        {invoice.method ? ` · ${invoice.method}` : ''}
                      </p>
                    )}
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      {invoice.status === 'UNPAID' && (
                        <>
                          <button
                            type="button"
                            onClick={() => onMarkPaid(invoice)}
                            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-700"
                            title="Tandai lunas"
                            aria-label={`Tandai lunas ${invoice.number}`}
                          >
                            <Icon name="checkCircle" className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onVoid(invoice)}
                            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                            title="Batalkan invoice"
                            aria-label={`Batalkan ${invoice.number}`}
                          >
                            <Icon name="xCircle" className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                      {invoice.status !== 'UNPAID' && <span className="text-[10px] text-slate-400">-</span>}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Belum ada invoice pada filter ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function InvoiceModal({
  tenants,
  plans,
  onClose,
  onSubmit,
}: {
  tenants: TenantView[]
  plans: Plan[]
  onClose: () => void
  onSubmit: (payload: Record<string, unknown>) => Promise<void>
}) {
  const initialTenant = tenants.find((tenant) => !tenant.bootstrap) || tenants[0]
  const [tenantId, setTenantId] = useState(initialTenant?.id || '')
  const [plan, setPlan] = useState<PlanId>(initialTenant?.plan || 'starter')
  const [amount, setAmount] = useState(String(planPrice(plans, initialTenant?.plan || 'starter') || ''))
  const [periodStart, setPeriodStart] = useState(() => firstOfMonth())
  const [periodEnd, setPeriodEnd] = useState(() => periodEndDefault(firstOfMonth()))
  const [dueInDays, setDueInDays] = useState('7')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectTenant = (id: string) => {
    setTenantId(id)
    const tenant = tenants.find((item) => item.id === id)
    if (tenant) {
      setPlan(tenant.plan)
      setAmount(String(planPrice(plans, tenant.plan) || ''))
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (saving) return
    setError(null)
    setSaving(true)
    try {
      await onSubmit({
        tenantId,
        plan,
        amount: amount === '' ? undefined : Number(amount),
        periodStart,
        periodEnd,
        dueInDays: Number(dueInDays) || 7,
        note,
      })
      onClose()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Gagal membuat invoice.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Buat invoice langganan"
      description="Invoice manual untuk pembayaran via transfer bank. Menandai lunas akan memperpanjang masa aktif tenant satu bulan."
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <span className="label">Tenant</span>
            <select className="input" value={tenantId} onChange={(event) => selectTenant(event.target.value)} required>
              <option value="">Pilih perusahaan</option>
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name} ({tenant.code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <span className="label">Paket</span>
            <select
              className="input"
              value={plan}
              onChange={(event) => {
                const next = event.target.value as PlanId
                setPlan(next)
                setAmount(String(planPrice(plans, next) || ''))
              }}
            >
              {PLAN_ORDER.map((id) => {
                const item = plans.find((entry) => entry.id === id)
                return (
                  <option key={id} value={id}>
                    {item?.name || id}
                  </option>
                )
              })}
            </select>
          </div>
          <div>
            <span className="label">Nominal (Rp)</span>
            <input
              className="input font-mono"
              value={amount}
              onChange={(event) => setAmount(event.target.value.replace(/\D/g, ''))}
              placeholder={String(planPrice(plans, plan) || '')}
              inputMode="numeric"
            />
            <p className="mt-1 text-[10px] text-slate-400">Kosongkan untuk memakai harga paket.</p>
          </div>
          <div>
            <span className="label">Awal periode</span>
            <input
              type="date"
              className="input"
              value={periodStart}
              onChange={(event) => {
                setPeriodStart(event.target.value)
                setPeriodEnd(periodEndDefault(event.target.value))
              }}
              required
            />
          </div>
          <div>
            <span className="label">Akhir periode</span>
            <input
              type="date"
              className="input"
              value={periodEnd}
              onChange={(event) => setPeriodEnd(event.target.value)}
              required
            />
          </div>
          <div>
            <span className="label">Jatuh tempo (hari)</span>
            <input
              className="input font-mono"
              value={dueInDays}
              onChange={(event) => setDueInDays(event.target.value.replace(/\D/g, ''))}
              inputMode="numeric"
            />
          </div>
          <div>
            <span className="label">Catatan</span>
            <input
              className="input"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Mis. transfer BCA a.n. ..."
            />
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-[11px] font-semibold text-rose-700">
            <Icon name="alert" className="mt-px h-3.5 w-3.5 shrink-0" />
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
          <button type="button" onClick={onClose} className="btn btn-ghost">
            Batal
          </button>
          <button type="submit" disabled={saving || !tenantId} className="btn btn-primary">
            {saving ? 'Menyimpan…' : 'Buat invoice'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function InvoiceStatusModal({
  invoice,
  tenant,
  plans,
  onClose,
  onSubmit,
}: {
  invoice: Invoice
  tenant: TenantView | null
  plans: Plan[]
  onClose: () => void
  onSubmit: (id: string, payload: Record<string, unknown>) => Promise<void>
}) {
  const [method, setMethod] = useState(invoice.method || 'Transfer bank')
  const [note, setNote] = useState(invoice.note || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (saving) return
    setError(null)
    setSaving(true)
    try {
      await onSubmit(invoice.id, { status: 'PAID', method, note })
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Gagal memperbarui invoice.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Tandai lunas ${invoice.number}`}
      description="Konfirmasi pembayaran yang sudah diterima. Masa aktif tenant akan diperpanjang satu bulan."
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Rincian invoice</p>
            <p className="mt-1 text-xs font-bold text-slate-800">{tenant?.name || invoice.tenant_id}</p>
            <p className="text-[10px] text-slate-500">
              {planName(plans, invoice.plan)} · {formatCurrency(invoice.amount)} · jatuh tempo {formatDate(invoice.due_at)}
            </p>
          </div>

          <div>
            <span className="label">Metode pembayaran</span>
            <input
              className="input"
              value={method}
              onChange={(event) => setMethod(event.target.value)}
              placeholder="Transfer bank BCA"
              required
            />
          </div>
          <div>
            <span className="label">Catatan</span>
            <textarea
              className="input min-h-[70px] resize-y"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Nomor referensi transfer, tanggal, atau catatan lain"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-[11px] font-semibold text-rose-700">
              <Icon name="alert" className="mt-px h-3.5 w-3.5 shrink-0" />
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
            <button type="button" onClick={onClose} className="btn btn-ghost">
              Batal
            </button>
            <button type="submit" disabled={saving} className="btn btn-primary">
              {saving ? 'Memproses…' : 'Tandai lunas'}
            </button>
          </div>
        </form>
    </Modal>
  )
}

export default PlatformConsole
