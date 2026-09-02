'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Icons } from '@/components/admin/Icons'

export function AdminSidebar() {
  const searchParams = useSearchParams()
  const activeTab = searchParams.get('tab') || 'dashboard'

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 min-h-screen p-4 flex flex-col justify-between shrink-0 font-sans">
      <div className="space-y-6">
        {/* LOGO BRAND */}
        <div className="flex items-center gap-3 px-2 pt-2">
          <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center text-slate-950 font-black text-base shadow-md">
            ⚡
          </div>
          <div>
            <h1 className="font-extrabold text-white text-sm tracking-wider uppercase">FLEETOPS 360</h1>
            <p className="text-[10px] text-slate-400">Enterprise Fleet Management</p>
          </div>
        </div>

        {/* MENU UTAMA DASHBOARD */}
        <div className="space-y-1">
          <span className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Menu Utama
          </span>

          <Link
            href="/admin?tab=dashboard"
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'dashboard'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <Icons.Dashboard className="w-4 h-4" /> Dashboard Utama
          </Link>

          <Link
            href="/admin?tab=analytics"
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'analytics'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <Icons.Analytics className="w-4 h-4" /> Analytics & Grafik
          </Link>

          <Link
            href="/admin?tab=maintenance"
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'maintenance'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <Icons.Maintenance className="w-4 h-4" /> Servis & Maintenance
          </Link>
        </div>

        {/* MASTER DATA */}
        <div className="space-y-1">
          <span className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Pusat Kelola Operasional
          </span>

          <Link
            href="/admin/settings?tab=drivers"
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'drivers'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <Icons.Users className="w-4 h-4" /> Master Driver
          </Link>

          <Link
            href="/admin/settings?tab=vehicles"
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'vehicles'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <Icons.Truck className="w-4 h-4" /> Master Armada
          </Link>

          <Link
            href="/admin/settings?tab=prices"
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'prices'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <Icons.Fuel className="w-4 h-4" /> Tarif BBM
          </Link>
        </div>
      </div>

      {/* FOOTER SIDEBAR */}
      <div className="pt-4 border-t border-slate-800 space-y-2">
        <Link
          href="/driver"
          className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition shadow-md"
        >
          Portal Driver ➔
        </Link>
        <button
          onClick={() => {
            localStorage.removeItem('admin_authenticated')
            window.location.reload()
          }}
          className="w-full bg-slate-800 hover:bg-rose-900/50 hover:text-rose-400 text-slate-400 font-bold text-xs py-2 px-3 rounded-xl transition text-center"
        >
          Kunci Akses Admin
        </button>
      </div>
    </aside>
  )
}