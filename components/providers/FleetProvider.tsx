'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  createItem,
  deleteItem,
  fetchFleet,
  patchItem,
  replaceCollection,
  resetDemoData,
  saveSettings,
} from '@/lib/client-store'
import type { AppSettings, CollectionName, FleetDatabase } from '@/lib/types'

type Tone = 'success' | 'error' | 'info'

interface ToastItem {
  id: number
  message: string
  tone: Tone
}

interface FleetContextValue {
  data: FleetDatabase | null
  loading: boolean
  refreshing: boolean
  error: string | null
  refresh: () => Promise<void>
  create: <T = Record<string, unknown>>(collection: CollectionName, payload: Record<string, unknown>) => Promise<T>
  update: <T = Record<string, unknown>>(
    collection: CollectionName,
    id: string | number,
    patch: Record<string, unknown>
  ) => Promise<T>
  remove: (collection: CollectionName, id: string | number) => Promise<void>
  replace: <T>(collection: CollectionName, items: T[]) => Promise<void>
  updateSettings: (patch: Partial<AppSettings>) => Promise<void>
  resetDemo: () => Promise<void>
  notify: (message: string, tone?: Tone) => void
}

const FleetContext = createContext<FleetContextValue | null>(null)

const COLLECTION_KEYS: CollectionName[] = [
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

export function FleetProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<FleetDatabase | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const toastId = useRef(0)

  const notify = useCallback((message: string, tone: Tone = 'success') => {
    const id = ++toastId.current
    setToasts((current) => [...current, { id, message, tone }])
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id))
    }, 4200)
  }, [])

  const load = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true)
    else setLoading(true)
    try {
      const fleet = await fetchFleet()
      setData(fleet)
      setError(null)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Gagal memuat data.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    fetchFleet()
      .then((fleet) => {
        if (!active) return
        setData(fleet)
        setError(null)
      })
      .catch((loadError: unknown) => {
        if (!active) return
        setError(loadError instanceof Error ? loadError.message : 'Gagal memuat data.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const refresh = useCallback(async () => {
    await load(true)
  }, [load])

  const create = useCallback(
    async <T,>(collection: CollectionName, payload: Record<string, unknown>) => {
      const item = await createItem<T>(collection, payload)
      setData((current) => {
        if (!current) return current
        const list = (current as unknown as Record<string, unknown[]>)[collection] || []
        return {
          ...current,
          [collection]: [item, ...list],
        } as FleetDatabase
      })
      notify('Data berhasil disimpan.')
      return item
    },
    [notify]
  )

  const update = useCallback(
    async <T,>(collection: CollectionName, id: string | number, patch: Record<string, unknown>) => {
      const item = await patchItem<T>(collection, id, patch)
      setData((current) => {
        if (!current) return current
        const list = (current as unknown as Record<string, unknown[]>)[collection] || []
        return {
          ...current,
          [collection]: list.map((entry) =>
            String((entry as { id?: unknown }).id) === String(id) ? item : entry
          ),
        } as FleetDatabase
      })
      notify('Perubahan berhasil disimpan.')
      return item
    },
    [notify]
  )

  const remove = useCallback(
    async (collection: CollectionName, id: string | number) => {
      await deleteItem(collection, id)
      setData((current) => {
        if (!current) return current
        const list = (current as unknown as Record<string, unknown[]>)[collection] || []
        return {
          ...current,
          [collection]: list.filter((entry) => String((entry as { id?: unknown }).id) !== String(id)),
        } as FleetDatabase
      })
      notify('Data berhasil dihapus.', 'info')
    },
    [notify]
  )

  const replace = useCallback(
    async <T,>(collection: CollectionName, items: T[]) => {
      await replaceCollection(collection, items)
      setData((current) => {
        if (!current) return current
        return { ...current, [collection]: items } as FleetDatabase
      })
      notify('Master data berhasil diperbarui.')
    },
    [notify]
  )

  const updateSettings = useCallback(
    async (patch: Partial<AppSettings>) => {
      const settings = await saveSettings(patch)
      setData((current) => (current ? { ...current, settings } : current))
      notify('Pengaturan sistem tersimpan.')
    },
    [notify]
  )

  const resetDemo = useCallback(async () => {
    const fleet = await resetDemoData()
    setData(fleet)
    notify('Database dikembalikan ke data contoh awal.', 'info')
  }, [notify])

  const value = useMemo<FleetContextValue>(
    () => ({
      data,
      loading,
      refreshing,
      error,
      refresh,
      create,
      update,
      remove,
      replace,
      updateSettings,
      resetDemo,
      notify,
    }),
    [data, loading, refreshing, error, refresh, create, update, remove, replace, updateSettings, resetDemo, notify]
  )

  return (
    <FleetContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-6">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`fade-up pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 text-xs font-semibold shadow-xl ${
              toast.tone === 'error'
                ? 'border-rose-200 bg-rose-50 text-rose-800'
                : toast.tone === 'info'
                  ? 'border-navy-200 bg-white text-navy-800'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-800'
            }`}
            role="status"
          >
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/70">
              {toast.tone === 'error' ? '!' : toast.tone === 'info' ? 'i' : '✓'}
            </span>
            <span className="leading-relaxed">{toast.message}</span>
          </div>
        ))}
      </div>
    </FleetContext.Provider>
  )
}

export function useFleet(): FleetContextValue {
  const context = useContext(FleetContext)
  if (!context) throw new Error('useFleet harus dipakai di dalam FleetProvider.')
  return context
}

export { COLLECTION_KEYS }
