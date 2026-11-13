import Link from 'next/link'
import { getSession } from '@/lib/auth'
import { Logo } from '@/components/ui/Logo'
import { Icon, type IconName } from '@/components/ui/Icon'

export const dynamic = 'force-dynamic'

const FEATURES: Array<{ icon: IconName; title: string; description: string }> = [
  {
    icon: 'shield',
    title: 'Audit BBM anti-kebocoran',
    description:
      'Setiap transaksi dibandingkan dengan baseline KM/L armada, kelengkapan struk, dan lokasi pengisian. Anomali ditandai otomatis.',
  },
  {
    icon: 'chart',
    title: 'Total cost of ownership',
    description:
      'Gabungkan biaya BBM, servis, dan klaim jalan menjadi biaya per kilometer yang dapat dibandingkan antar armada.',
  },
  {
    icon: 'wrench',
    title: 'Servis & legalitas',
    description:
      'Pantau interval servis berbasis odometer serta masa berlaku KIR dan STNK sebelum jatuh tempo.',
  },
  {
    icon: 'receipt',
    title: 'Reimbursement terkontrol',
    description:
      'Driver mengirim klaim tol, parkir, dan retribusi dengan bukti nota. Admin memverifikasi dalam satu alur.',
  },
  {
    icon: 'award',
    title: 'Scorecard driver',
    description:
      'Skor efisiensi, kepatuhan inspeksi, dan integritas transaksi menjadi dasar evaluasi pengemudi.',
  },
  {
    icon: 'database',
    title: 'Data dapat diaudit',
    description:
      'Penyimpanan server dengan audit trail, cadangan JSON, dan kontrol akses berbasis peran admin serta driver.',
  },
]

const METRICS = [
  { value: '100%', label: 'Transaksi tercatat' },
  { value: 'KM/L', label: 'Baseline terukur' },
  { value: '8 jam', label: 'Sesi aman' },
  { value: 'CSV', label: 'Ekspor laporan' },
]

const WORKFLOW = [
  {
    step: '01',
    title: 'Driver melaporkan',
    description: 'Odometer, liter, jenis BBM, lokasi, dan foto struk dikirim dari portal driver.',
  },
  {
    step: '02',
    title: 'Sistem memverifikasi',
    description: 'Server menghitung jarak, KM/L, biaya, dan menandai eceran atau rasio di luar baseline.',
  },
  {
    step: '03',
    title: 'Admin memutuskan',
    description: 'Admin memverifikasi, menyetujui klaim, dan memakai skor kualitas untuk evaluasi armada.',
  },
]

const SECURITY = [
  'Login username dan password dengan hash scrypt.',
  'Cookie sesi HttpOnly, SameSite, dan tanda tangan HMAC-SHA256.',
  'Pembatasan percobaan login dan pemeriksaan same-origin.',
  'Peran admin dan driver dipisahkan pada server, bukan hanya tampilan.',
]

export default async function LandingPage() {
  const session = await getSession()
  const isAdmin = session?.role === 'admin'

  const primaryHref = session ? (isAdmin ? '/admin' : '/driver') : '/login'
  const primaryLabel = session ? (isAdmin ? 'Buka Dashboard' : 'Buka Portal Driver') : 'Masuk ke Workspace'
  const secondaryHref = session ? (isAdmin ? '/driver' : '/login') : '#fitur'
  const secondaryLabel = session ? (isAdmin ? 'Portal Driver' : 'Ganti akun') : 'Lihat kemampuan'

  return (
    <div className="min-h-screen overflow-x-hidden bg-navy-950 text-slate-100">
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-navy-950/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-5 sm:px-6">
          <Logo dark />
          <div className="hidden items-center gap-7 text-[11px] font-bold text-slate-400 md:flex">
            <a href="#fitur" className="transition hover:text-white">Kemampuan</a>
            <a href="#alur" className="transition hover:text-white">Alur kerja</a>
            <a href="#keamanan" className="transition hover:text-white">Keamanan</a>
          </div>
          <div className="flex items-center gap-2">
            {session ? (
              <span className="hidden items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-[10px] font-bold text-slate-300 sm:flex">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                {session.name}
              </span>
            ) : null}
            <Link
              href={primaryHref}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gold-400 px-3.5 py-2 text-[11px] font-extrabold text-navy-950 transition hover:bg-gold-300"
            >
              {primaryLabel}
              <Icon name="arrowRight" className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.13]"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(255,255,255,.16) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.16) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            maskImage: 'radial-gradient(circle at 35% 15%, black, transparent 70%)',
          }}
        />
        <div className="pointer-events-none absolute -right-32 top-10 h-96 w-96 rounded-full bg-gold-400/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 bottom-0 h-80 w-80 rounded-full bg-navy-500/25 blur-3xl" />

        <div className="relative mx-auto grid w-full max-w-6xl gap-12 px-5 pb-16 pt-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pb-24 lg:pt-20">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-gold-300">
              <span className="h-1.5 w-1.5 rounded-full bg-gold-400" />
              Internal Fuel &amp; Fleet Control
            </p>
            <h1 className="mt-5 text-3xl font-extrabold leading-[1.12] tracking-tight text-white sm:text-4xl lg:text-[2.9rem]">
              Kendalikan kualitas BBM dan biaya armada dengan data yang dapat diaudit.
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-slate-400">
              FleetOps 360 memverifikasi setiap liter bahan bakar terhadap odometer, baseline kendaraan, dan bukti
              transaksi. Keputusan operasional berdiri di atas angka yang jelas, bukan perkiraan.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href={primaryHref}
                className="inline-flex items-center gap-2 rounded-xl bg-gold-400 px-5 py-3 text-xs font-extrabold text-navy-950 shadow-[0_14px_30px_-16px_rgba(217,171,45,0.9)] transition hover:bg-gold-300"
              >
                {primaryLabel}
                <Icon name="arrowRight" className="h-4 w-4" />
              </Link>
              <Link
                href={secondaryHref}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-xs font-bold text-slate-200 transition hover:bg-white/[0.08]"
              >
                {secondaryLabel}
              </Link>
            </div>

            <div className="mt-9 grid max-w-lg grid-cols-2 gap-3 sm:grid-cols-4">
              {METRICS.map((metric) => (
                <div key={metric.label} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                  <p className="font-mono text-sm font-bold text-gold-300">{metric.value}</p>
                  <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                    {metric.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.02] p-2 shadow-2xl">
              <div className="rounded-xl bg-[#f3f5f9] p-4 text-slate-800 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-slate-400">
                      Dashboard kualitas
                    </p>
                    <p className="mt-0.5 text-sm font-extrabold tracking-tight text-navy-950">Ringkasan bulan ini</p>
                  </div>
                  <span className="badge badge-green">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Data terverifikasi
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-[auto_1fr] items-center gap-4 rounded-xl border border-slate-200 bg-white p-4">
                  <div
                    className="relative flex h-24 w-24 items-center justify-center rounded-full"
                    style={{
                      background: 'conic-gradient(#d9ab2d 0deg 313deg, #e8eef6 313deg 360deg)',
                    }}
                  >
                    <div className="flex h-[74px] w-[74px] flex-col items-center justify-center rounded-full bg-white">
                      <span className="font-mono text-xl font-bold tracking-tight text-navy-950">87</span>
                      <span className="text-[8px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
                        Skor
                      </span>
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-slate-400">
                      Efisiensi armada
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">
                      Konsumsi rata-rata berada di atas baseline. Dua transaksi perlu konfirmasi struk.
                    </p>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      <span className="badge badge-green">12,8 km/L</span>
                      <span className="badge badge-amber">2 anomali</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2">
                  {[
                    { label: 'Transaksi', value: '42' },
                    { label: 'Total BBM', value: 'Rp 8,4 jt' },
                    { label: 'Klaim', value: '6' },
                  ].map((item) => (
                    <div key={item.label} className="rounded-lg border border-slate-200 bg-white px-2.5 py-2">
                      <p className="text-[8px] font-extrabold uppercase tracking-[0.08em] text-slate-400">{item.label}</p>
                      <p className="mt-0.5 font-mono text-[11px] font-bold text-navy-950">{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[9px] font-extrabold uppercase tracking-[0.1em] text-slate-400">
                      Pusat perhatian
                    </p>
                    <Icon name="bell" className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center gap-2 rounded-lg bg-rose-50 px-2.5 py-2">
                      <Icon name="alert" className="h-3.5 w-3.5 shrink-0 text-rose-600" />
                      <p className="truncate text-[10px] font-semibold text-rose-700">
                        Rasio KM/L 28% di bawah baseline
                      </p>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-2.5 py-2">
                      <Icon name="receipt" className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                      <p className="truncate text-[10px] font-semibold text-amber-700">
                        3 klaim menunggu verifikasi
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="pointer-events-none absolute -bottom-5 -left-4 hidden rounded-xl border border-white/10 bg-navy-900/90 px-3.5 py-2.5 shadow-xl backdrop-blur sm:block">
              <p className="text-[8px] font-extrabold uppercase tracking-[0.12em] text-slate-500">Audit trail</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-[10px] font-bold text-slate-200">
                <Icon name="shield" className="h-3 w-3 text-emerald-400" />
                Setiap perubahan tercatat
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="fitur" className="border-t border-white/5 bg-[#081522]">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-6">
          <div className="max-w-2xl">
            <p className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-gold-400">
              <span className="h-1.5 w-1.5 rounded-full bg-gold-400" />
              Kemampuan utama
            </p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Satu sistem untuk operasional, biaya, dan kepatuhan.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Modul yang saling terhubung, sehingga laporan driver langsung menjadi dasar verifikasi admin dan evaluasi
              kualitas armada.
            </p>
          </div>

          <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 transition hover:border-gold-400/30 hover:bg-white/[0.05]"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-gold-300 transition group-hover:border-gold-400/30 group-hover:text-gold-400">
                  <Icon name={feature.icon} className="h-4.5 w-4.5" />
                </span>
                <h3 className="mt-4 text-sm font-extrabold text-white">{feature.title}</h3>
                <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="alur" className="border-t border-white/5">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div>
              <p className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-gold-400">
                <span className="h-1.5 w-1.5 rounded-full bg-gold-400" />
                Alur kerja
              </p>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                Dari laporan driver menjadi keputusan yang terukur.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">
                Tidak ada pencatatan ganda. Data yang dikirim driver langsung dihitung server dan tersedia untuk admin
                pada saat yang sama.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <Link href={primaryHref} className="btn btn-gold">
                  {primaryLabel}
                  <Icon name="arrowRight" className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href={secondaryHref}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-bold text-slate-200 transition hover:bg-white/[0.08]"
                >
                  {secondaryLabel}
                </Link>
              </div>
            </div>

            <div className="space-y-3">
              {WORKFLOW.map((item) => (
                <div
                  key={item.step}
                  className="flex gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 transition hover:bg-white/[0.05]"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold-400 font-mono text-[11px] font-extrabold text-navy-950">
                    {item.step}
                  </span>
                  <div>
                    <p className="text-sm font-extrabold text-white">{item.title}</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="keamanan" className="border-t border-white/5 bg-[#081522]">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-gold-400">
                <span className="h-1.5 w-1.5 rounded-full bg-gold-400" />
                Keamanan &amp; tata kelola
              </p>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                Akses terbatas, perubahan tercatat.
              </h2>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-slate-400">
                Aplikasi internal ini membedakan peran admin dan driver di sisi server. Kredensial, sesi, dan data
                operasional tidak bergantung pada penyimpanan browser.
              </p>
            </div>
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
              <ul className="space-y-3">
                {SECURITY.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-[11px] leading-relaxed text-slate-300">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
                      <Icon name="check" className="h-2.5 w-2.5" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/5">
        <div className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-6">
          <div className="relative overflow-hidden rounded-2xl border border-gold-400/20 bg-gradient-to-r from-gold-400/[0.12] via-white/[0.04] to-transparent p-6 sm:p-8">
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gold-400/10 blur-2xl" />
            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">
                  Siap mulai dari data yang benar?
                </h2>
                <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-slate-400">
                  Masuk dengan akun perusahaan. Admin mengelola verifikasi dan master data, driver mengirim laporan
                  harian dari portal yang sama.
                </p>
              </div>
              <Link
                href={primaryHref}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gold-400 px-5 py-3 text-xs font-extrabold text-navy-950 transition hover:bg-gold-300"
              >
                {primaryLabel}
                <Icon name="arrowRight" className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/5">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-5 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            <Logo dark compact />
            <p className="text-[10px] leading-relaxed text-slate-500">
              FleetOps 360 · Sistem internal kendali BBM dan operasional armada.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[10px] font-semibold text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <Icon name="shield" className="h-3 w-3" />
              Akses internal
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Icon name="database" className="h-3 w-3" />
              Data perusahaan
            </span>
            <span>&copy; {new Date().getFullYear()} FleetOps 360</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
