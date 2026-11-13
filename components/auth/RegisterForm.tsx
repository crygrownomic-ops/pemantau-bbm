'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Logo } from '@/components/ui/Logo'
import { Icon } from '@/components/ui/Icon'
import { PLANS } from '@/lib/plans'

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24)
}

async function postJson(url: string, body: unknown) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    credentials: 'same-origin',
  })
  const payload = (await response.json().catch(() => null)) as
    | { ok?: boolean; message?: string; redirect?: string }
    | null
  if (!response.ok || !payload || payload.ok === false) {
    throw new Error(payload?.message || 'Pendaftaran gagal.')
  }
  return payload
}

const INCLUDED = [
  'Modul BBM, servis, klaim, dan scorecard driver',
  'Audit trail dan kontrol akses admin/driver',
  'Laporan bulanan dengan ekspor CSV & PDF',
  'Aplikasi dapat dipasang (PWA) di perangkat',
]

export function RegisterForm() {
  const router = useRouter()
  const [companyName, setCompanyName] = useState('')
  const [companyCode, setCompanyCode] = useState('')
  const [codeTouched, setCodeTouched] = useState(false)
  const [adminName, setAdminName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const effectiveCode = codeTouched ? companyCode : slugify(companyName)
  const trialPlan = PLANS.trial

  const passwordHint = useMemo(() => {
    if (!password) return null
    if (password.length < 8) return { tone: 'bad' as const, text: 'Minimal 8 karakter.' }
    if (confirm && confirm !== password) return { tone: 'bad' as const, text: 'Konfirmasi belum sama.' }
    return { tone: 'ok' as const, text: 'Password siap digunakan.' }
  }, [password, confirm])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (loading) return
    setError(null)

    if (password.length < 8) {
      setError('Password minimal 8 karakter.')
      return
    }
    if (password !== confirm) {
      setError('Konfirmasi password tidak sama.')
      return
    }

    setLoading(true)
    try {
      const result = await postJson('/api/auth/register', {
        company_name: companyName,
        company_code: effectiveCode,
        admin_name: adminName,
        username,
        email,
        phone,
        password,
      })
      router.replace(result.redirect || '/admin')
      router.refresh()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Pendaftaran gagal.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-6">
          <Logo />
          <Link href="/login" className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 transition hover:text-navy-900">
            <Icon name="arrowRight" className="h-3.5 w-3.5 rotate-180" />
            Sudah punya akun
          </Link>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-10 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:py-14">
        <section>
          <p className="inline-flex items-center gap-2 rounded-full border border-navy-200 bg-white px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-navy-700">
            <span className="h-1.5 w-1.5 rounded-full bg-gold-400" />
            Mulai trial 14 hari
          </p>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-navy-950 sm:text-3xl">
            Daftarkan perusahaan Anda
          </h1>
          <p className="mt-2 max-w-lg text-xs leading-relaxed text-slate-500">
            Satu akun administrator dibuat untuk mengelola armada, driver, dan verifikasi transaksi. Tidak perlu kartu
            kredit dan tidak ada biaya tersembunyi selama masa trial.
          </p>

          <form onSubmit={handleSubmit} className="card mt-6 space-y-4 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="company_name" className="label">
                  Nama perusahaan
                </label>
                <input
                  id="company_name"
                  className="input"
                  placeholder="PT Contoh Logistik"
                  value={companyName}
                  onChange={(event) => setCompanyName(event.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="company_code" className="label">
                  Kode perusahaan
                </label>
                <input
                  id="company_code"
                  className="input font-mono lowercase"
                  placeholder="contoh-logistik"
                  value={effectiveCode}
                  onChange={(event) => {
                    setCodeTouched(true)
                    setCompanyCode(slugify(event.target.value))
                  }}
                  required
                />
                <p className="mt-1 text-[10px] text-slate-400">Dipakai saat login. Huruf kecil, angka, tanda hubung.</p>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400">Akun administrator</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="admin_name" className="label">
                  Nama lengkap
                </label>
                <input
                  id="admin_name"
                  className="input"
                  placeholder="Nama administrator"
                  value={adminName}
                  onChange={(event) => setAdminName(event.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="username" className="label">
                  Username
                </label>
                <input
                  id="username"
                  className="input font-mono lowercase"
                  autoComplete="username"
                  placeholder="admin.perusahaan"
                  value={username}
                  onChange={(event) => setUsername(event.target.value.toLowerCase())}
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="label">
                  Email <span className="font-medium normal-case text-slate-400">(opsional)</span>
                </label>
                <input
                  id="email"
                  type="email"
                  className="input"
                  autoComplete="email"
                  placeholder="admin@perusahaan.co.id"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
              <div>
                <label htmlFor="phone" className="label">
                  Telepon <span className="font-medium normal-case text-slate-400">(opsional)</span>
                </label>
                <input
                  id="phone"
                  className="input"
                  autoComplete="tel"
                  placeholder="0812xxxxxxx"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="password" className="label">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className="input pr-16"
                    autoComplete="new-password"
                    placeholder="Minimal 8 karakter"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-[10px] font-bold text-slate-500 transition hover:bg-slate-100"
                  >
                    {showPassword ? 'Sembunyi' : 'Lihat'}
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="confirm" className="label">
                  Konfirmasi password
                </label>
                <input
                  id="confirm"
                  type={showPassword ? 'text' : 'password'}
                  className="input"
                  autoComplete="new-password"
                  placeholder="Ulangi password"
                  value={confirm}
                  onChange={(event) => setConfirm(event.target.value)}
                  required
                />
              </div>
            </div>

            {passwordHint && (
              <p className={`text-[10px] font-semibold ${passwordHint.tone === 'ok' ? 'text-emerald-600' : 'text-rose-600'}`}>
                {passwordHint.text}
              </p>
            )}

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-[11px] font-semibold text-rose-700">
                <span className="mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-rose-600 text-[9px] font-black text-white">
                  !
                </span>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn btn-gold w-full justify-center py-3">
              {loading ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-navy-950/30 border-t-navy-950" />
                  Membuat workspace…
                </>
              ) : (
                <>
                  Buat akun &amp; mulai trial
                  <Icon name="arrowRight" className="h-4 w-4" />
                </>
              )}
            </button>

            <p className="text-center text-[10px] leading-relaxed text-slate-400">
              Dengan mendaftar, Anda menyetujui ketentuan penggunaan layanan.
            </p>
          </form>
        </section>

        <aside className="space-y-4 lg:pt-10">
          <div className="rounded-2xl border border-navy-200 bg-navy-950 p-6 text-white">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-gold-300">Paket trial</p>
            <p className="mt-2 text-2xl font-extrabold tracking-tight">Gratis 14 hari</p>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{trialPlan.tagline}</p>

            <dl className="mt-5 grid grid-cols-3 gap-2">
              {[
                { label: 'Armada', value: trialPlan.limits.vehicles },
                { label: 'Driver', value: trialPlan.limits.drivers },
                { label: 'Pengguna', value: trialPlan.limits.users },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-2">
                  <dt className="text-[9px] font-bold uppercase tracking-wider text-slate-500">{item.label}</dt>
                  <dd className="mt-0.5 font-mono text-sm font-bold text-gold-300">{item.value}</dd>
                </div>
              ))}
            </dl>

            <ul className="mt-5 space-y-2.5">
              {INCLUDED.map((item) => (
                <li key={item} className="flex items-start gap-2 text-[11px] leading-relaxed text-slate-300">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
                    <Icon name="check" className="h-2.5 w-2.5" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400">Setelah trial</p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">
              Data Anda tetap tersimpan. Pilih paket berbayar kapan saja; aktivasi dilakukan melalui invoice dan
              transfer bank, tanpa pengurangan otomatis.
            </p>
            <div className="mt-3 space-y-1.5">
              {(['starter', 'growth', 'enterprise'] as const).map((id) => (
                <div key={id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <span className="text-[11px] font-bold text-slate-700">{PLANS[id].name}</span>
                  <span className="font-mono text-[11px] font-bold text-navy-900">
                    Rp {PLANS[id].price_monthly.toLocaleString('id-ID')}/bln
                  </span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </main>
    </div>
  )
}
