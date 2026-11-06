'use client'

import { useEffect, useState } from 'react'

const SHARED_DATA_KEYS = new Set([
  'fuel_logs',
  'vehicle_budgets',
  'service_history',
  'master_drivers',
  'master_fuel_prices',
  'pre_trip_inspections',
  'reimbursement_claims',
])

export function StorageSyncNotice() {
  const [changedKey, setChangedKey] = useState<string | null>(null)

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key && SHARED_DATA_KEYS.has(event.key)) setChangedKey(event.key)
      if (event.key === null) setChangedKey('clear')
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  if (!changedKey) return null

  return (
    <aside
      role="status"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-[100] flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white shadow-2xl"
    >
      <span className="text-sm leading-5">
        Data berubah di tab lain. Muat ulang untuk melihat versi terbaru.
      </span>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="shrink-0 rounded-xl bg-amber-400 px-3 py-2 text-xs font-extrabold text-slate-950 hover:bg-amber-300"
      >
        Muat ulang
      </button>
      <button
        type="button"
        aria-label="Tutup pemberitahuan"
        onClick={() => setChangedKey(null)}
        className="shrink-0 rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-800 hover:text-white"
      >
        ✕
      </button>
    </aside>
  )
}
