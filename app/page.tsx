import Link from "next/link";

const capabilities = [
  {
    number: "01",
    title: "Kontrol BBM",
    description:
      "Catat pengisian, pantau efisiensi perjalanan, dan tinjau transaksi untuk membantu menemukan anomali.",
    accent: "from-amber-400/20 to-orange-500/5 text-amber-300",
  },
  {
    number: "02",
    title: "Perawatan armada",
    description:
      "Kelola riwayat servis, biaya perawatan, dan pengingat legalitas kendaraan dalam satu alur kerja.",
    accent: "from-violet-400/20 to-indigo-500/5 text-violet-300",
  },
  {
    number: "03",
    title: "Operasional driver",
    description:
      "Sediakan portal untuk laporan BBM, checklist pra-perjalanan, serta klaim tol dan parkir.",
    accent: "from-emerald-400/20 to-cyan-500/5 text-emerald-300",
  },
];

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden text-slate-100">
      <div aria-hidden="true" className="grid-pattern absolute inset-0 opacity-50" />
      <div
        aria-hidden="true"
        className="absolute -top-32 left-1/2 h-96 w-[44rem] -translate-x-1/2 rounded-full bg-amber-500/10 blur-3xl"
      />

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-5 pb-12 pt-6 sm:px-8 lg:px-10">
        <header className="card-surface flex items-center justify-between rounded-2xl px-4 py-3 sm:px-5">
          <Link href="/" aria-label="FleetOps 360 beranda" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-300 to-orange-500 text-lg font-black text-slate-950 shadow-lg shadow-amber-500/20">
              F
            </span>
            <span>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">FleetOps</span>
              <span className="block text-sm font-extrabold text-white">360</span>
            </span>
          </Link>

          <nav aria-label="Navigasi utama" className="hidden items-center gap-7 text-sm text-slate-300 md:flex">
            <a href="#fitur" className="transition hover:text-white">Fitur</a>
            <a href="#tentang" className="transition hover:text-white">Tentang platform</a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/driver"
              className="rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs font-bold text-slate-200 transition hover:border-slate-500 hover:text-white sm:px-4"
            >
              Portal Driver
            </Link>
            <Link
              href="/admin"
              className="rounded-xl bg-gradient-to-r from-amber-300 to-orange-500 px-3 py-2 text-xs font-extrabold text-slate-950 shadow-lg shadow-amber-500/20 transition hover:brightness-105 sm:px-4"
            >
              Masuk Admin
            </Link>
          </div>
        </header>

        <section className="grid flex-1 items-center gap-12 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
          <div className="space-y-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-200">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-amber-300" />
              Pemantauan operasional armada
            </div>

            <div className="space-y-5">
              <h1 className="max-w-3xl text-4xl font-black leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
                Kendalikan operasional armada. <span className="text-amber-300">Lebih jelas.</span>
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                Kelola pencatatan BBM, jadwal perawatan, klaim operasional, dan aktivitas driver
                melalui satu platform yang dirancang untuk kebutuhan tim armada.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin"
                className="rounded-2xl bg-gradient-to-r from-amber-300 to-orange-500 px-6 py-3 text-sm font-extrabold text-slate-950 shadow-xl shadow-amber-500/15 transition hover:-translate-y-0.5"
              >
                Buka Dashboard Admin <span aria-hidden="true">→</span>
              </Link>
              <Link
                href="/driver"
                className="rounded-2xl border border-slate-700 bg-slate-900/80 px-6 py-3 text-sm font-bold text-slate-100 transition hover:border-slate-500"
              >
                Buka Portal Driver
              </Link>
            </div>

            <p className="text-xs leading-5 text-slate-500">
              Satu tempat untuk mendukung pencatatan dan pemantauan operasional harian.
            </p>
          </div>

          <div id="tentang" className="card-surface rounded-[28px] p-4 sm:p-6">
            <div className="rounded-[22px] border border-slate-700/80 bg-slate-950/80 p-5 sm:p-6">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Fleet operations</p>
                  <h2 className="mt-2 text-xl font-extrabold text-white">Satu alur kerja terpadu</h2>
                </div>
                <span className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-[10px] font-semibold text-slate-300">
                  Admin & Driver
                </span>
              </div>

              <div className="space-y-3">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/75 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/10 text-lg text-amber-300" aria-hidden="true">⛽</span>
                      <div>
                        <p className="text-sm font-bold text-white">Catatan pengisian BBM</p>
                        <p className="mt-1 text-xs text-slate-400">Data transaksi dan bukti pengisian</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-300">Tercatat</span>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/75 p-4">
                    <span className="text-lg text-violet-300" aria-hidden="true">⚙</span>
                    <p className="mt-3 text-sm font-bold text-white">Perawatan</p>
                    <p className="mt-1 text-xs leading-5 text-slate-400">Riwayat servis dan biaya kendaraan.</p>
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/75 p-4">
                    <span className="text-lg text-emerald-300" aria-hidden="true">✓</span>
                    <p className="mt-3 text-sm font-bold text-white">Kesiapan driver</p>
                    <p className="mt-1 text-xs leading-5 text-slate-400">Checklist pra-perjalanan dan klaim biaya.</p>
                  </div>
                </div>
                <div className="rounded-2xl border border-indigo-400/15 bg-indigo-400/5 p-4 text-xs leading-5 text-slate-300">
                  Informasi dashboard mengikuti data yang tersedia di aplikasi. Pastikan data operasional dan konfigurasi sudah diperiksa sebelum digunakan sebagai dasar keputusan.
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="fitur" className="pb-8 pt-5">
          <div className="mb-7 max-w-2xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">Fitur utama</p>
            <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">Modul penting, tersusun dalam satu platform.</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {capabilities.map((item) => (
              <article key={item.number} className="card-surface rounded-2xl p-5 transition hover:-translate-y-1 hover:border-slate-500/50">
                <div className={`mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${item.accent} text-xs font-black`}>
                  {item.number}
                </div>
                <h3 className="text-base font-bold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <footer className="mt-10 flex flex-col gap-3 border-t border-slate-800/80 pt-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} FleetOps 360</span>
          <span>Pemantauan BBM dan operasional armada</span>
        </footer>
      </div>
    </main>
  );
}
