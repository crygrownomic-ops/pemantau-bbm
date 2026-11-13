'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useMemo, useState, type ReactNode } from 'react'
import { Logo } from '@/components/ui/Logo'
import { Icon, type IconName } from '@/components/ui/Icon'
import { useFleet } from '@/components/providers/FleetProvider'
import { logout } from '@/lib/client-store'
import { initials } from '@/lib/format'
import { isAnomalous } from '@/lib/fuel'

export interface ShellUser {
  username: string
  name: string
  role: 'admin' | 'driver'
}

const MAIN_NAV: Array<{ key: string; label: string; href: string; icon: IconName }> = [
  { key: 'dashboard', label: 'Dashboard', href: '/admin?tab=dashboard', icon: 'dashboard' },
  { key: 'reimbursement', label: 'Uang Jalan & Klaim', href: '/admin?tab=reimbursement', icon: 'receipt' },
  { key: 'scorecard', label: 'Scorecard Driver', href: '/admin?tab=scorecard', icon: 'award' },
  { key: 'analytics', label: 'Analytics & TCO', href: '/admin?tab=analytics', icon: 'chart' },
  { key: 'maintenance', label: 'Servis & Legalitas', href: '/admin?tab=maintenance', icon: 'wrench' },
]

const MASTER_NAV: Array<{ key: string; label: string; href: string; icon: IconName }> = [
  { key: 'drivers', label: 'Master Driver', href: '/admin/settings?tab=drivers', icon: 'users' },
  { key: 'vehicles', label: 'Master Armada', href: '/admin/settings?tab=vehicles', icon: 'truck' },
  { key: 'prices', label: 'Tarif BBM', href: '/admin/settings?tab=prices', icon: 'fuel' },
  { key: 'system', label: 'Sistem & Audit', href: '/admin/settings?tab=system', icon: 'settings' },
]

const TITLES: Record<string, string> = {
  dashboard: 'Dashboard Kualitas BBM',
  reimbursement: 'Uang Jalan & Reimbursement',
  scorecard: 'Scorecard Driver',
  analytics: 'Analytics & Total Cost',
  maintenance: 'Servis & Legalitas',
  drivers: 'Master Driver',
  vehicles: 'Master Armada',
  prices: 'Tarif BBM',
  system: 'Sistem & Audit',
}

export function AdminShell({ user, children }: { user: ShellUser; children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data, refreshing, refresh, notify } = useFleet()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const isSettings = pathname.startsWith('/admin/settings')
  const tab = searchParams.get('tab') || (isSettings ? 'drivers' : 'dashboard')
  const title = TITLES[tab] || 'Dashboard'

  const alerts = useMemo(() => {
    if (!data) return { pendingClaims: 0, anomalies: 0, legal: 0, total: 0, items: [] as Array<{ label: string; detail: string; tone: 'red' | 'amber' }> }
    const vehicleMap = new Map(data.vehicles.map((vehicle) => [vehicle.plate_number, vehicle]))
    const pendingClaims = data.reimbursementClaims.filter((claim) => claim.status === 'PENDING').length
    const anomalies = data.fuelLogs.filter((log) => isAnomalous(log, vehicleMap.get(log.plate_number))).length
    const today = new Date()
    const legal = data.vehicles.filter((vehicle) => {
      const expiry = new Date(`${vehicle.kir_expiry}T00:00:00`).getTime()
      if (Number.isNaN(expiry)) return false
      return expiry - today.getTime() < 45 * 24 * 60 * 60 * 1000
    }).length
    const items: Array<{ label: string; detail: string; tone: 'red' | 'amber' }> = []
    if (pendingClaims > 0) items.push({ label: `${pendingClaims} klaim menunggu verifikasi`, detail: 'Buka modul Uang Jalan & Klaim', tone: 'amber' })
    if (anomalies > 0) items.push({ label: `${anomalies} transaksi BBM perlu audit`, detail: 'Periksa rasio KM/L dan bukti struk', tone: 'red' })
    if (legal > 0) items.push({ label: `${legal} armada mendekati jatuh tempo`, detail: 'KIR / STNK perlu diperpanjang', tone: 'amber' })
    return { pendingClaims, anomalies, legal, total: pendingClaims + anomalies + legal, items }
  }, [data])

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await logout()
    } catch {
      // Sesi tetap dihapus di sisi server bila memungkinkan.
    }
    router.replace('/login')
    router.refresh()
  }

  const navLink = (item: { key: string; label: string; href: string; icon: IconName }) => {
    const active = tab === item.key
    return (
      <Link
        key={item.key}
        href={item.href}
        onClick={() => setMobileOpen(false)}
        className={`nav-item ${active ? 'nav-item-active' : ''}`}
      >
        <Icon name={item.icon} className="h-4 w-4 shrink-0" />
        <span className="truncate">{item.label}</span>
      </Link>
    )
  }

  const sidebar = (
    <div className="flex h-full flex-col bg-navy-950 px-3.5 py-4">
      <div className="flex items-center justify-between px-1.5 pb-5">
        <Logo dark />
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
          aria-label="Tutup menu"
        >
          <Icon name="close" className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-4 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
        <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-slate-500">Perusahaan</p>
        <p className="mt-1 truncate text-[11px] font-bold text-slate-200">
          {data?.settings.company_name || 'Memuat data…'}
        </p>
      </div>

      <nav className="scroll-thin flex-1 space-y-5 overflow-y-auto pr-0.5">
        <div className="space-y-1">
          <p className="px-3 pb-1 text-[9px] font-extrabold uppercase tracking-[0.16em] text-slate-500">Operasional</p>
          {MAIN_NAV.map(navLink)}
        </div>
        <div className="space-y-1">
          <p className="px-3 pb-1 text-[9px] font-extrabold uppercase tracking-[0.16em] text-slate-500">Master &amp; Sistem</p>
          {MASTER_NAV.map(navLink)}
        </div>
      </nav>

      <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
        <Link
          href="/driver"
          className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-[11px] font-bold text-slate-200 transition hover:bg-white/[0.08]"
        >
          <span className="flex items-center gap-2">
            <Icon name="external" className="h-3.5 w-3.5 text-gold-400" />
            Portal Driver
          </span>
          <Icon name="arrowRight" className="h-3.5 w-3.5 text-slate-500" />
        </Link>

        <div className="flex items-center gap-2.5 rounded-xl bg-white/[0.05] p-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold-400 text-[11px] font-extrabold text-navy-950">
            {initials(user.name || user.username)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-bold text-white">{user.name}</p>
            <p className="truncate text-[9px] font-semibold uppercase tracking-wider text-slate-500">{user.role}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-500/15 hover:text-rose-300 disabled:opacity-50"
            title="Keluar"
            aria-label="Keluar"
          >
            <Icon name="logout" className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-canvas">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] lg:block">{sidebar}</aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Tutup menu"
            className="absolute inset-0 bg-navy-950/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative h-full w-[272px] max-w-[85vw] shadow-2xl">{sidebar}</div>
        </div>
      )}

      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur-md">
          <div className="flex h-14 items-center justify-between gap-3 px-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-2.5">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 lg:hidden"
                aria-label="Buka menu"
              >
                <Icon name="menu" className="h-4 w-4" />
              </button>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-extrabold tracking-tight text-navy-950">{title}</p>
                <p className="hidden text-[10px] font-medium text-slate-400 sm:block">
                  {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => void refresh()}
                disabled={refreshing}
                className="btn btn-ghost px-2.5 py-2"
                title="Muat ulang data"
              >
                <Icon name="refresh" className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Muat ulang</span>
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setNotifOpen((current) => !current)}
                  className="relative rounded-xl border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-50"
                  aria-label="Notifikasi"
                >
                  <Icon name="bell" className="h-4 w-4" />
                  {alerts.total > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[9px] font-extrabold text-white">
                      {alerts.total}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <>
                    <button
                      type="button"
                      aria-label="Tutup notifikasi"
                      className="fixed inset-0 z-10 cursor-default"
                      onClick={() => setNotifOpen(false)}
                    />
                    <div className="fade-up absolute right-0 top-11 z-20 w-[300px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
                      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                        <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700">Pusat Perhatian</p>
                        <span className="badge badge-slate">{alerts.total}</span>
                      </div>
                      <div className="max-h-72 overflow-y-auto p-2">
                        {alerts.items.length === 0 ? (
                          <p className="px-3 py-6 text-center text-[11px] text-slate-400">Tidak ada peringatan aktif.</p>
                        ) : (
                          alerts.items.map((item) => (
                            <Link
                              key={item.label}
                              href={item.tone === 'red' ? '/admin?tab=dashboard' : item.label.includes('klaim') ? '/admin?tab=reimbursement' : '/admin?tab=maintenance'}
                              onClick={() => setNotifOpen(false)}
                              className="flex items-start gap-2.5 rounded-lg px-2.5 py-2.5 transition hover:bg-slate-50"
                            >
                              <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${item.tone === 'red' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                                <Icon name="alert" className="h-3 w-3" />
                              </span>
                              <span>
                                <span className="block text-[11px] font-bold text-slate-800">{item.label}</span>
                                <span className="block text-[10px] text-slate-500">{item.detail}</span>
                              </span>
                            </Link>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <span className="mx-1 hidden h-6 w-px bg-slate-200 sm:block" />
              <div className="hidden items-center gap-2 sm:flex">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-navy-900 text-[10px] font-extrabold text-gold-300">
                  {initials(user.name || user.username)}
                </span>
                <div className="leading-tight">
                  <p className="max-w-[120px] truncate text-[10px] font-bold text-slate-800">{user.name}</p>
                  <button
                    type="button"
                    onClick={() => notify('Gunakan tombol keluar di sidebar untuk mengakhiri sesi.', 'info')}
                    className="text-[9px] font-semibold uppercase tracking-wider text-slate-400"
                  >
                    {user.role}
                  </button>
                </div>
              </div>
            </div>
          </div>
          {refreshing && <div className="h-0.5 w-full overflow-hidden bg-navy-100"><div className="h-full w-1/3 animate-pulse bg-gold-400" /></div>}
        </header>

        <main className="mx-auto w-full max-w-[1500px] px-4 py-5 sm:px-6 sm:py-6">{children}</main>
      </div>
    </div>
  )
}
