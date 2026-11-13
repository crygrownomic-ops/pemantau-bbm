'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Logo } from '@/components/ui/Logo'
import { Icon } from '@/components/ui/Icon'
import { loginPlatform } from '@/lib/client-store'

export function PlatformLoginForm() {
  const router = useRouter()
  const [username, setUsername] = useState('owner')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (loading) return
    setLoading(true)
    setError(null)
    try {
      const result = await loginPlatform(username.trim(), password)
      router.replace(result.redirect || '/platform')
      router.refresh()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Login platform gagal.')
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-950 px-5 py-10">
      <div className="pointer-events-none fixed -left-24 top-1/4 h-80 w-80 rounded-full bg-gold-400/10 blur-3xl" />
      <div className="pointer-events-none fixed -right-24 bottom-0 h-80 w-80 rounded-full bg-navy-500/25 blur-3xl" />

      <div className="relative w-full max-w-[400px]">
        <div className="flex justify-center">
          <Logo dark />
        </div>

        <div className="mt-7 rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-gold-400/25 bg-gold-400/10 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.14em] text-gold-300">
            <Icon name="shield" className="h-3 w-3" />
            Platform Console
          </span>
          <h1 className="mt-3 text-xl font-extrabold tracking-tight text-white">Akses administrator platform</h1>
          <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">
            Kelola tenant, paket langganan, dan invoice. Akun ini terpisah dari akun perusahaan.
          </p>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label htmlFor="platform-username" className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
                Username
              </label>
              <input
                id="platform-username"
                className="w-full rounded-xl border border-white/10 bg-navy-950/60 px-3.5 py-2.5 text-xs font-semibold text-white outline-none transition placeholder:text-slate-600 focus:border-gold-400/50"
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="platform-password" className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
                Password
              </label>
              <div className="relative">
                <input
                  id="platform-password"
                  type={showPassword ? 'text' : 'password'}
                  className="w-full rounded-xl border border-white/10 bg-navy-950/60 px-3.5 py-2.5 pr-16 text-xs font-semibold text-white outline-none transition placeholder:text-slate-600 focus:border-gold-400/50"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-[10px] font-bold text-slate-400 transition hover:bg-white/10 hover:text-white"
                >
                  {showPassword ? 'Sembunyi' : 'Lihat'}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-2.5 text-[11px] font-semibold text-rose-300">
                <span className="mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-rose-600 text-[9px] font-black text-white">
                  !
                </span>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold-400 px-4 py-3 text-xs font-extrabold text-navy-950 transition hover:bg-gold-300 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-navy-950/30 border-t-navy-950" />
                  Memverifikasi…
                </>
              ) : (
                <>
                  Masuk ke konsol
                  <Icon name="arrowRight" className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-5 flex items-center justify-center gap-4 text-[10px] font-bold text-slate-500">
          <Link href="/login" className="transition hover:text-white">
            Login perusahaan
          </Link>
          <span className="h-3 w-px bg-white/15" />
          <Link href="/" className="transition hover:text-white">
            Beranda
          </Link>
        </div>
      </div>
    </div>
  )
}
