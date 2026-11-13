'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type ReactNode } from 'react'
import { Logo } from '@/components/ui/Logo'
import { Icon } from '@/components/ui/Icon'
import { useFleet } from '@/components/providers/FleetProvider'
import { logout } from '@/lib/client-store'
import { initials } from '@/lib/format'

export interface DriverShellUser {
  username: string
  name: string
  role: 'admin' | 'driver'
  driverName?: string
}

export function DriverShell({ user, children }: { user: DriverShellUser; children: ReactNode }) {
  const { data, refreshing, refresh } = useFleet()
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await logout()
    } catch {
      // Sesi tetap dibersihkan di sisi server bila memungkinkan.
    }
    router.replace('/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-40 border-b border-white/5 bg-navy-950">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Logo dark compact />
            <div className="min-w-0">
              <p className="truncate text-[12px] font-extrabold tracking-tight text-white">Portal Driver</p>
              <p className="truncate text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                {data?.settings.company_short || 'FleetOps'} · Laporan Operasional
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {user.role === 'admin' && (
              <Link
                href="/admin"
                className="hidden items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-2 text-[10px] font-bold text-slate-200 transition hover:bg-white/[0.08] sm:inline-flex"
              >
                <Icon name="dashboard" className="h-3.5 w-3.5 text-gold-400" />
                Dashboard Admin
              </Link>
            )}

            <button
              type="button"
              onClick={() => void refresh()}
              disabled={refreshing}
              className="rounded-lg border border-white/10 bg-white/[0.04] p-2 text-slate-300 transition hover:bg-white/[0.08] hover:text-white disabled:opacity-50"
              title="Muat ulang data"
              aria-label="Muat ulang data"
            >
              <Icon name="refresh" className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>

            <div className="flex items-center gap-2 rounded-lg bg-white/[0.05] py-1 pl-1 pr-1.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gold-400 text-[10px] font-extrabold text-navy-950">
                {initials(user.driverName || user.name)}
              </span>
              <div className="hidden leading-tight sm:block">
                <p className="max-w-[120px] truncate text-[10px] font-bold text-white">{user.driverName || user.name}</p>
                <p className="text-[8px] font-semibold uppercase tracking-wider text-slate-500">{user.role}</p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="rounded-md p-1.5 text-slate-400 transition hover:bg-rose-500/15 hover:text-rose-300 disabled:opacity-50"
                title="Keluar"
                aria-label="Keluar"
              >
                <Icon name="logout" className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
        {refreshing && <div className="h-0.5 w-full overflow-hidden bg-navy-900"><div className="h-full w-1/3 animate-pulse bg-gold-400" /></div>}
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-7">{children}</main>

      <footer className="mx-auto w-full max-w-6xl px-4 pb-8 text-center text-[10px] leading-relaxed text-slate-400 sm:px-6">
        {data?.settings.company_name || 'FleetOps 360'} · Setiap laporan diverifikasi terhadap odometer dan baseline armada.
      </footer>
    </div>
  )
}
