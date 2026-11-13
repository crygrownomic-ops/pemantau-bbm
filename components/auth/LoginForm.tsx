'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Logo } from '@/components/ui/Logo'
import { Icon } from '@/components/ui/Icon'
import { login } from '@/lib/client-store'

type Role = 'admin' | 'driver'

const DEMO: Record<Role, { username: string; password: string; label: string }> = {
  admin: { username: 'admin', password: 'admin123', label: 'Administrator' },
  driver: { username: 'driver', password: 'driver123', label: 'Driver' },
}

export function LoginForm({ nextPath }: { nextPath?: string }) {
  const router = useRouter()
  const isDev = process.env.NODE_ENV !== 'production'

  const [role, setRole] = useState<Role>('admin')
  const [companyCode, setCompanyCode] = useState('')
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectRole = (nextRole: Role) => {
    setRole(nextRole)
    setError(null)
    setUsername(DEMO[nextRole].username)
    setPassword('')
  }

  const fillDemo = () => {
    setUsername(DEMO[role].username)
    setPassword(DEMO[role].password)
    setError(null)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (loading) return
    setLoading(true)
    setError(null)

    try {
      const result = await login(companyCode.trim(), username.trim(), password)
      const fallback = role === 'admin' ? '/admin' : '/driver'
      const target =
        nextPath && nextPath.startsWith('/') && !nextPath.startsWith('//')
          ? nextPath
          : result.redirect || fallback
      router.replace(target)
      router.refresh()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Login gagal. Coba lagi.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-navy-950 lg:grid lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <section className="relative hidden overflow-hidden border-r border-white/5 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.16]"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(255,255,255,.14) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.14) 1px, transparent 1px)',
            backgroundSize: '46px 46px',
            maskImage: 'radial-gradient(circle at 30% 20%, black, transparent 72%)',
          }}
        />
        <div className="pointer-events-none absolute -right-28 top-1/4 h-80 w-80 rounded-full bg-gold-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-navy-500/30 blur-3xl" />

        <div className="relative">
          <Logo dark />
        </div>

        <div className="relative max-w-md">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-gold-300">
            <span className="h-1.5 w-1.5 rounded-full bg-gold-400" />
            Internal Quality Control
          </p>
          <h1 className="text-3xl font-extrabold leading-[1.15] tracking-tight text-white">
            Satu kendali untuk konsumsi BBM, biaya jalan, dan kualitas armada.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-slate-400">
            FleetOps 360 memverifikasi setiap liter BBM terhadap odometer, baseline armada, dan bukti transaksi —
            sehingga keputusan operasional berdiri di atas data yang dapat diaudit.
          </p>

          <div className="mt-8 grid grid-cols-3 gap-3">
            {[
              { value: '100%', label: 'Audit trail' },
              { value: 'KM/L', label: 'Baseline uji' },
              { value: 'Real-time', label: 'Anomali' },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                <p className="font-mono text-sm font-bold text-gold-300">{item.value}</p>
                <p className="mt-0.5 text-[10px] font-semibold text-slate-400">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative text-[10px] font-medium text-slate-500">
          Akses terbatas untuk personel yang berwenang. Aktivitas login dan perubahan data dicatat.
        </div>
      </section>

      {/* Form panel */}
      <section className="flex min-h-screen flex-col bg-[#f3f5f9] px-5 py-8 sm:px-10">
        <div className="flex items-center justify-between lg:justify-end">
          <div className="lg:hidden">
            <Logo />
          </div>
          <Link href="/" className="text-[11px] font-bold text-slate-500 transition hover:text-navy-900">
            ← Kembali ke beranda
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center py-8">
          <div className="w-full max-w-[420px]">
            <div className="mb-7">
              <h2 className="text-2xl font-extrabold tracking-tight text-navy-950">Masuk ke workspace</h2>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                Gunakan kredensial perusahaan Anda. Sesi berakhir otomatis setelah 8 jam.
              </p>
            </div>

            <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl border border-slate-200 bg-white p-1">
              {(['admin', 'driver'] as Role[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => selectRole(item)}
                  className={`rounded-lg px-3 py-2 text-[11px] font-extrabold transition ${
                    role === item
                      ? 'bg-navy-900 text-white shadow-sm'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-navy-900'
                  }`}
                >
                  {item === 'admin' ? 'Administrator' : 'Portal Driver'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="card space-y-4 p-5">
              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="company_code" className="label">
                    Kode perusahaan
                  </label>
                  <span className="mb-1.5 text-[10px] font-semibold text-slate-400">Opsional</span>
                </div>
                <input
                  id="company_code"
                  name="company_code"
                  autoComplete="organization"
                  className="input font-mono"
                  placeholder="contoh: demo"
                  value={companyCode}
                  onChange={(event) => setCompanyCode(event.target.value.toLowerCase())}
                />
                <p className="mt-1.5 text-[10px] leading-relaxed text-slate-400">
                  Isi bila akun Anda terdaftar pada lebih dari satu perusahaan.
                </p>
              </div>

              <div>
                <label htmlFor="username" className="label">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  autoComplete="username"
                  className="input"
                  placeholder={role === 'admin' ? 'admin' : 'driver'}
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="label">
                    Password
                  </label>
                  <span className="mb-1.5 text-[10px] font-semibold text-slate-400">Wajib diisi</span>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    className="input pr-11"
                    placeholder="••••••••"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-[10px] font-bold text-slate-500 transition hover:bg-slate-100 hover:text-navy-900"
                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  >
                    {showPassword ? 'Sembunyi' : 'Lihat'}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-[11px] font-semibold text-rose-700">
                  <span className="mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-rose-600 text-[9px] font-black text-white">
                    !
                  </span>
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} className="btn btn-gold w-full py-3">
                {loading ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-navy-950/30 border-t-navy-950" />
                    Memverifikasi…
                  </>
                ) : (
                  <>
                    Masuk sebagai {DEMO[role].label}
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            {isDev && (
              <div className="mt-4 rounded-xl border border-dashed border-navy-200 bg-navy-50/70 p-3.5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-navy-700">
                      Mode pengembangan
                    </p>
                    <p className="mt-1 font-mono text-[11px] text-navy-800">
                      {DEMO[role].username} / {DEMO[role].password}
                    </p>
                    <p className="mt-0.5 font-mono text-[10px] text-navy-600">Kode perusahaan: demo</p>
                  </div>
                  <button type="button" onClick={fillDemo} className="btn btn-ghost px-3 py-2 text-[10px]">
                    Isi otomatis
                  </button>
                </div>
                <p className="mt-2 text-[10px] leading-relaxed text-navy-600">
                  Kredensial contoh hanya untuk lokal. Ganti melalui variabel lingkungan sebelum dipakai produksi.
                </p>
              </div>
            )}

            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] font-bold text-slate-500">
              <Link href="/register" className="inline-flex items-center gap-1.5 transition hover:text-navy-900">
                <Icon name="building" className="h-3.5 w-3.5" />
                Daftarkan perusahaan
              </Link>
              <span className="h-3 w-px bg-slate-300" />
              <Link href="/platform/login" className="inline-flex items-center gap-1.5 transition hover:text-navy-900">
                <Icon name="shield" className="h-3.5 w-3.5" />
                Konsol platform
              </Link>
            </div>

            <p className="mt-5 text-center text-[10px] leading-relaxed text-slate-400">
              Dengan masuk, Anda menyetujui kebijakan penggunaan internal perusahaan.
              <br />
              FleetOps 360 · Kendali BBM &amp; Operasional Armada
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
