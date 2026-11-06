'use client'

import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* NAVBAR */}
      <nav className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-sm shadow-md shadow-amber-500/20">
              F360
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-wider uppercase text-white block leading-none">
                FleetOps 360
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Enterprise Fleet System</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <Link
              href="/driver"
              className="px-4 py-2 rounded-xl font-bold text-slate-300 hover:text-white hover:bg-slate-900 border border-slate-800 transition"
            >
              Portal Driver
            </Link>
            <Link
              href="/admin"
              className="px-4 py-2 rounded-xl font-extrabold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 transition"
            >
              Masuk Dashboard Admin →
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative pt-20 pb-16 px-6 max-w-5xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-mono text-amber-400">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
          Platform Fleet Management & Fuel Control System
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
          Pengendalian Operasional Armada & Biaya BBM Terintegrasi
        </h1>

        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Sistem manajemen armada korporat berbasis data murni untuk mengeliminasi kebocoran anggaran BBM, memantau kesehatan kendaraan, dan memvalidasi klaim jalan secara realtime.
        </p>

        <div className="flex flex-wrap justify-center items-center gap-4 pt-4">
          <Link
            href="/admin"
            className="px-6 py-3.5 rounded-2xl font-extrabold bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs shadow-lg shadow-amber-500/20 transition"
          >
            Buka Dashboard Management
          </Link>
          <Link
            href="/driver"
            className="px-6 py-3.5 rounded-2xl font-bold bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800 text-xs transition"
          >
            Akses Input Driver Mobile
          </Link>
        </div>
      </section>

      {/* 6 KAPABILITAS UTAMA */}
      <section className="max-w-7xl mx-auto px-6 py-12 border-t border-slate-900">
        <div className="text-center mb-10 space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-widest text-amber-500">Fitur System</h2>
          <p className="text-xl font-extrabold text-white"> Arsitektur Fitur FleetOps 360</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 space-y-3">
            <span className="text-amber-400 font-mono font-bold text-xs">01.</span>
            <h3 className="font-extrabold text-sm text-white">Smart Anti-Fraud BBM</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Algoritma audit otomatis untuk mendeteksi pengisian BBM eceran non-SPBU, ketidaksesuaian odometer, serta kejanggalan rasio KM/Liter.
            </p>
          </div>

          <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 space-y-3">
            <span className="text-amber-400 font-mono font-bold text-xs">02.</span>
            <h3 className="font-extrabold text-sm text-white">Executive TCO & Cost/KM</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Kalkulasi Total Cost of Ownership gabungan biaya murni BBM, perbaikan bengkel, dan klaim jalan per kilometer per armada.
            </p>
          </div>

          <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 space-y-3">
            <span className="text-amber-400 font-mono font-bold text-xs">03.</span>
            <h3 className="font-extrabold text-sm text-white">Preventive Maintenance & Legal</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Monitoring interval ganti oli berbasis kilometer odometer serta alert penanda tanggal jatuh tempo legalitas STNK dan KIR.
            </p>
          </div>

          <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 space-y-3">
            <span className="text-amber-400 font-mono font-bold text-xs">04.</span>
            <h3 className="font-extrabold text-sm text-white">Digital Reimbursement Approval</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Pengajuan uang jalan, e-toll, parkir, dan kasbon darurat oleh supir yang dilengkapi verifikasi nota transaksi digital.
            </p>
          </div>

          <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 space-y-3">
            <span className="text-amber-400 font-mono font-bold text-xs">05.</span>
            <h3 className="font-extrabold text-sm text-white">Driver Scorecard & Pre-Trip</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Evaluasi kinerja pengemudi berbasis keselamatan serta lembar checklist kelayakan fisik kendaraan sebelum beroperasi.
            </p>
          </div>

          <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 space-y-3">
            <span className="text-amber-400 font-mono font-bold text-xs">06.</span>
            <h3 className="font-extrabold text-sm text-white">Realtime Control & WA Alert</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Pusat notifikasi lonceng otomatis untuk approval klaim pending, anomali BBM, serta pengiriman pesan WhatsApp pengingat.
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-900 py-8 px-6 text-center text-xs text-slate-500 font-mono">
        <p>© FleetOps 360 Enterprise — All Rights Reserved.</p>
        <p className="mt-1 text-[11px] text-slate-600">Developed by URAI SOLUTIONS</p>
      </footer>
    </div>
  )
}