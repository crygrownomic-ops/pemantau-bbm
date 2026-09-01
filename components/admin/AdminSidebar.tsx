'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Icons } from './Icons'

interface AdminSidebarProps {
  currentRoute: '/admin' | '/admin/settings'
  activeTab?: string
  setActiveTab?: (tab: 'dashboard' | 'analytics' | 'maintenance') => void
}

export function AdminSidebar({ currentRoute, activeTab, setActiveTab }: AdminSidebarProps) {
  const [isKelolaOpen, setIsKelolaOpen] = useState(true)

  const handleLogout = () => {
    if (confirm('Kunci kembali akses Admin FleetOps 360?')) {
      localStorage.removeItem('admin_authenticated')
      window.location.href = '/admin'
    }
  }

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 p-4 space-y-4 flex flex-col justify-between shrink-0 min-h-screen">
      <div className="space-y-4">
        <div className="flex items-center gap-2.5 font-extrabold text-white text-sm pb-3 border-b border-slate-800">
          <div className="w-8 h-8 bg-amber-500 text-slate-950 rounded-lg flex items-center justify-center font-bold">
            <Icons.Fuel className="w-4 h-4" />
          </div>
          <span>FLEETOPS 360</span>
        </div>

        <nav className="space-y-1 text-xs">
          <Link
            href="/admin"
            onClick={() => setActiveTab && setActiveTab('dashboard')}
            className={`w-full text-left p-2.5 rounded-xl font-bold transition flex items-center gap-2 ${
              currentRoute === '/admin' && activeTab === 'dashboard'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'hover:bg-slate-800 text-slate-400'
            }`}
          >
            <Icons.Dashboard /> Dashboard Utama
          </Link>

          <Link
            href="/admin"
            onClick={() => setActiveTab && setActiveTab('analytics')}
            className={`w-full text-left p-2.5 rounded-xl font-bold transition flex items-center gap-2 ${
              currentRoute === '/admin' && activeTab === 'analytics'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'hover:bg-slate-800 text-slate-400'
            }`}
          >
            <Icons.Analytics /> Analytics & Grafik
          </Link>

          <Link
            href="/admin"
            onClick={() => setActiveTab && setActiveTab('maintenance')}
            className={`w-full text-left p-2.5 rounded-xl font-bold transition flex items-center gap-2 ${
              currentRoute === '/admin' && activeTab === 'maintenance'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'hover:bg-slate-800 text-slate-400'
            }`}
          >
            <Icons.Wrench /> Servis & Maintenance
          </Link>

          <div className="pt-3">
            <button
              onClick={() => setIsKelolaOpen(!isKelolaOpen)}
              className="w-full flex items-center justify-between p-2 text-[10px] font-extrabold tracking-wider uppercase text-amber-400 hover:text-white"
            >
              <span className="flex items-center gap-1.5">
                <Icons.Settings className="w-3.5 h-3.5" /> Pusat Kelola Operasional
              </span>
              <span>{isKelolaOpen ? '▲' : '▼'}</span>
            </button>

            {isKelolaOpen && (
              <div className="mt-1 pl-3 space-y-1 border-l-2 border-slate-700 ml-2">
                <Link
                  href="/admin/settings?tab=drivers"
                  className={`block px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                    currentRoute === '/admin/settings' && activeTab === 'drivers'
                      ? 'text-amber-400 font-bold bg-slate-800'
                      : 'text-slate-300 hover:text-amber-400'
                  }`}
                >
                  • Master Driver
                </Link>
                <Link
                  href="/admin/settings?tab=vehicles"
                  className={`block px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                    currentRoute === '/admin/settings' && activeTab === 'vehicles'
                      ? 'text-amber-400 font-bold bg-slate-800'
                      : 'text-slate-300 hover:text-amber-400'
                  }`}
                >
                  • Master Armada
                </Link>
                <Link
                  href="/admin/settings?tab=prices"
                  className={`block px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                    currentRoute === '/admin/settings' && activeTab === 'prices'
                      ? 'text-amber-400 font-bold bg-slate-800'
                      : 'text-slate-300 hover:text-amber-400'
                  }`}
                >
                  • Tarif BBM
                </Link>
              </div>
            )}
          </div>
        </nav>
      </div>

      <div className="space-y-2 border-t border-slate-800 pt-3 text-center">
        <Link
          href="/driver"
          className="block w-full text-center bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs py-2 rounded-xl shadow-md transition"
        >
          Portal Driver ➔
        </Link>
        <button
          onClick={handleLogout}
          className="w-full text-center bg-slate-800 hover:bg-slate-700 text-slate-400 text-[11px] font-semibold py-1.5 rounded-xl transition"
        >
          Kunci Akses Admin
        </button>
        <span className="text-[10px] text-slate-500 font-medium block pt-1">
          Dev by Urai Ikhsan Fadhilah
        </span>
      </div>
    </aside>
  )
}