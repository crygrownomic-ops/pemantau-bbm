'use client'

import Link from 'next/link'
import { Icons } from '@/components/ui/Icons'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans text-slate-100">
      <div className="max-w-md w-full space-y-6 text-center">
        
        {/* BRAND LOGO HEADER */}
        <div className="space-y-3">
          <div className="w-16 h-16 bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 rounded-2xl flex items-center justify-center mx-auto shadow-xl">
            <Icons.Fuel className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-wider">FLEETOPS 360</h1>
            <p className="text-xs text-amber-400 font-semibold tracking-widest uppercase mt-0.5">
              Enterprise Fleet Management System
            </p>
          </div>
        </div>

        {/* NAVIGASI PORTAL */}
        <div className="grid grid-cols-1 gap-4 pt-2">
          
          {/* OPTION 1: DRIVER PORTAL */}
          <Link
            href="/driver"
            className="group bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:brightness-110 text-slate-950 p-5 rounded-2xl shadow-xl transition transform active:scale-95 flex items-center justify-between text-left"
          >
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase tracking-wider font-black text-slate-900/80 block">
                Khusus Pengemudi Lapangan
              </span>
              <h2 className="text-base font-extrabold text-slate-950">Portal Form Input Driver</h2>
              <p className="text-xs text-slate-800 font-medium">Input KM Odometer, BBM, & Upload Struk</p>
            </div>
            <div className="w-10 h-10 bg-slate-950/10 rounded-xl flex items-center justify-center text-slate-950 group-hover:translate-x-1 transition-transform">
              <Icons.Mobile className="w-5 h-5" />
            </div>
          </Link>

          {/* OPTION 2: ADMIN DASHBOARD */}
          <Link
            href="/admin"
            className="group bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 p-5 rounded-2xl shadow-xl transition transform active:scale-95 flex items-center justify-between text-left"
          >
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase tracking-wider font-bold text-amber-400 block">
                Khusus Tim Management / Admin
              </span>
              <h2 className="text-base font-extrabold text-white">Dashboard Monitoring Admin</h2>
              <p className="text-xs text-slate-400 font-medium">Audit BBM, Servis, Uji KIR, & Laporan PDF</p>
            </div>
            <div className="w-10 h-10 bg-slate-700/50 rounded-xl flex items-center justify-center text-amber-400 group-hover:translate-x-1 transition-transform">
              <Icons.Dashboard className="w-5 h-5" />
            </div>
          </Link>

        </div>

        <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500">
          Sistem Pengawasan Armada & Operasional Perusahaan
        </div>

      </div>
    </div>
  )
}