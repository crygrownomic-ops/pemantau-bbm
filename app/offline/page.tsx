import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'
import { Icon } from '@/components/ui/Icon'

export const metadata = {
  title: 'Offline',
  description: 'Aplikasi sedang offline.',
}

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-navy-950 px-6 text-center">
      <div className="w-full max-w-md">
        <div className="flex justify-center">
          <Logo dark />
        </div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-7">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gold-400/15 text-gold-300">
            <Icon name="cloudOff" className="h-6 w-6" />
          </span>
          <h1 className="mt-4 text-lg font-extrabold tracking-tight text-white">Anda sedang offline</h1>
          <p className="mt-2 text-xs leading-relaxed text-slate-400">
            Koneksi ke server terputus. Data operasional tidak dapat dimuat atau disimpan sampai jaringan kembali
            tersedia. Halaman yang sudah dibuka tetap aman.
          </p>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link href="/" className="btn btn-gold justify-center">
              <Icon name="refresh" className="h-3.5 w-3.5" />
              Coba muat ulang
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-bold text-slate-200 transition hover:bg-white/[0.08]"
            >
              Halaman masuk
            </Link>
          </div>
        </div>

        <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">
          FleetOps 360 &middot; Mode offline
        </p>
      </div>
    </main>
  )
}
