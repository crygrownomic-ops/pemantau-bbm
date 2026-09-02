'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

export function AdminSidebar() {
  const searchParams = useSearchParams()
  const activeTab = searchParams.get('tab') || 'dashboard'

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 min-h-screen p-4 flex flex-col justify-between shrink-0 font-sans">
      <div className="space-y-6">
        <div className="flex items-center gap-3 px-2 pt-2">
          <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center text-slate-950 font-black text-base shadow-md">
            ⚡
          </div>
          <div>
            <h1 className="font-extrabold text-white text-sm tracking-wider uppercase">FLEETOPS 360</h1>
            <p className="text-[10px] text-slate-400">Enterprise Fleet Management</p>
          </div>
        </div>

        <div className="space-y-1">
          <span className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Menu Utama
          </span>

          <Link
            href="/admin?tab=dashboard"
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'dashboard' ? 'bg-amber-500 text-slate-950 shadow-md' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
            Dashboard Utama
          </Link>

          <Link
            href="/admin?tab=scorecard"
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'scorecard' ? 'bg-amber-500 text-slate-950 shadow-md' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>
            Driver Scorecard & Reward
          </Link>

          <Link
            href="/admin?tab=analytics"
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'analytics' ? 'bg-amber-500 text-slate-950 shadow-md' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
            Analytics & Grafik
          </Link>

          <Link
            href="/admin?tab=maintenance"
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'maintenance' ? 'bg-amber-500 text-slate-950 shadow-md' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            Servis & Maintenance
          </Link>
        </div>

        <div className="space-y-1">
          <span className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Pusat Kelola Operasional
          </span>

          <Link
            href="/admin/settings?tab=drivers"
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'drivers' ? 'bg-amber-500 text-slate-950 shadow-md' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
            Master Driver
          </Link>

          <Link
            href="/admin/settings?tab=vehicles"
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'vehicles' ? 'bg-amber-500 text-slate-950 shadow-md' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
            Master Armada
          </Link>

          <Link
            href="/admin/settings?tab=prices"
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'prices' ? 'bg-amber-500 text-slate-950 shadow-md' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            Tarif BBM
          </Link>
        </div>
      </div>

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