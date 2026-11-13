'use client'

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { Icon } from '@/components/ui/Icon'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

const DISMISS_KEY = 'fleetops:pwa-install-dismissed'

function subscribeOnline(callback: () => void) {
  window.addEventListener('online', callback)
  window.addEventListener('offline', callback)
  return () => {
    window.removeEventListener('online', callback)
    window.removeEventListener('offline', callback)
  }
}

function readOnline() {
  return navigator.onLine
}

function subscribeStandalone() {
  return () => undefined
}

function readStandalone() {
  if (typeof window === 'undefined') return false
  const standaloneMedia = window.matchMedia('(display-mode: standalone)').matches
  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  return standaloneMedia || iosStandalone
}

export function PwaProvider() {
  const online = useSyncExternalStore(subscribeOnline, readOnline, () => true)
  const standalone = useSyncExternalStore(subscribeStandalone, readStandalone, () => false)

  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true
    return window.localStorage.getItem(DISMISS_KEY) === '1'
  })
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null)
  const [reloading, setReloading] = useState(false)

  useEffect(() => {
    const onBeforeInstall = (event: Event) => {
      event.preventDefault()
      setInstallEvent(event as BeforeInstallPromptEvent)
    }
    const onInstalled = () => {
      setInstallEvent(null)
      setDismissed(true)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (!('serviceWorker' in navigator)) return

    let cancelled = false

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
        if (cancelled) return
        if (registration.waiting) setWaitingWorker(registration.waiting)
        registration.addEventListener('updatefound', () => {
          const installing = registration.installing
          if (!installing) return
          installing.addEventListener('statechange', () => {
            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
              setWaitingWorker(installing)
            }
          })
        })
      } catch {
        // Service worker opsional: aplikasi tetap berjalan tanpa mode offline.
      }
    }

    void register()
    return () => {
      cancelled = true
    }
  }, [])

  const applyUpdate = useCallback(() => {
    if (!waitingWorker) return
    setReloading(true)
    waitingWorker.postMessage({ type: 'SKIP_WAITING' })
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload()
    })
  }, [waitingWorker])

  const install = useCallback(async () => {
    if (!installEvent) return
    await installEvent.prompt()
    const choice = await installEvent.userChoice
    if (choice.outcome === 'accepted') {
      setDismissed(true)
    }
    setInstallEvent(null)
  }, [installEvent])

  const dismissInstall = useCallback(() => {
    setDismissed(true)
    try {
      window.localStorage.setItem(DISMISS_KEY, '1')
    } catch {
      // Penyimpanan lokal dapat diblokir; abaikan.
    }
  }, [])

  const showInstall = Boolean(installEvent) && !dismissed && !standalone

  return (
    <>
      {!online && (
        <div className="fixed inset-x-0 top-0 z-[120] flex items-center justify-center gap-2 bg-amber-400 px-4 py-1.5 text-[11px] font-extrabold text-navy-950 shadow-sm">
          <Icon name="wifi" className="h-3.5 w-3.5" />
          Mode offline — data baru tidak dapat disimpan sampai koneksi kembali.
        </div>
      )}

      {showInstall && (
        <div className="fade-up fixed bottom-4 left-4 z-[110] w-[min(340px,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold-400 text-navy-950">
              <Icon name="download" className="h-4.5 w-4.5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-extrabold text-navy-950">Pasang FleetOps 360</p>
              <p className="mt-1 text-[10px] leading-relaxed text-slate-500">
                Akses lebih cepat dari layar utama, layar penuh, dan tetap bisa dibuka saat koneksi terputus.
              </p>
            </div>
            <button
              type="button"
              onClick={dismissInstall}
              className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              aria-label="Tutup"
            >
              <Icon name="close" className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => void install()} className="btn btn-gold flex-1 justify-center py-2">
              <Icon name="download" className="h-3.5 w-3.5" />
              Pasang aplikasi
            </button>
            <button type="button" onClick={dismissInstall} className="btn btn-ghost px-3 py-2">
              Nanti
            </button>
          </div>
        </div>
      )}

      {waitingWorker && (
        <div className="fade-up fixed bottom-4 right-4 z-[110] w-[min(320px,calc(100vw-2rem))] rounded-2xl border border-navy-200 bg-navy-950 p-4 text-white shadow-2xl">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-gold-300">
              <Icon name="spark" className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-extrabold">Versi baru tersedia</p>
              <p className="mt-1 text-[10px] leading-relaxed text-slate-400">
                Muat ulang untuk memakai pembaruan terbaru aplikasi.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={applyUpdate}
            disabled={reloading}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gold-400 px-3 py-2 text-[11px] font-extrabold text-navy-950 transition hover:bg-gold-300 disabled:opacity-60"
          >
            <Icon name="refresh" className={`h-3.5 w-3.5 ${reloading ? 'animate-spin' : ''}`} />
            {reloading ? 'Memuat ulang…' : 'Muat ulang sekarang'}
          </button>
        </div>
      )}
    </>
  )
}
