'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { Icons } from './Icons'

export function AdminSidebar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab')

  const handleLogout = () => {
    if (confirm('Kunci kembali akses Admin FleetOps 360?')) {
      localStorage.removeItem('admin_authenticated')
      window.location.href = '/admin'
    }
  }

  // Deteksi status menu aktif berdasarkan URL
  const isDashboardActive = pathname === '/admin' && (!currentTab || currentTab === 'dashboard')
  const isAnalyticsActive = pathname === '/admin' && currentTab === 'analytics'
  const isMaintenanceActive = pathname === '/admin' && currentTab === 'maintenance'

  const isDriversActive = pathname === '/admin/settings' && (!currentTab || currentTab === 'drivers')
  const isVehiclesActive = pathname === '/admin/settings' && currentTab === 'vehicles'
  const isPricesActive = pathname === '/admin/settings' && currentTab === 'prices'

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
            href="/admin?tab=dashboard"
            className={`w-full text-left p-2.5 rounded-xl font-bold transition flex items-center gap-2 ${
              isDashboardActive ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-800 text-slate-400'
            }`}
          >
            <Icons.Dashboard /> Dashboard Utama
          </Link>

          <Link
            href="/admin?tab=analytics"
            className={`w-full text-left p-2.5 rounded-xl font-bold transition flex items-center gap-2 ${
              isAnalyticsActive ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-800 text-slate-400'
            }`}
          >
            <Icons.Analytics /> Analytics & Grafik
          </Link>

          <Link
            href="/admin?tab=maintenance"
            className={`w-full text-left p-2.5 rounded-xl font-bold transition flex items-center gap-2 ${
              isMaintenanceActive ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-800 text-slate-400'
            }`}
          >
            <Icons.Wrench /> Servis & Maintenance
          </Link>

          <div className="pt-3 space-y-1">
            <div className="px-2 text-[10px] font-extrabold tracking-wider uppercase text-amber-400 flex items-center gap-1.5 mb-1">
              <Icons.Settings className="w-3.5 h-3.5" /> Pusat Kelola Operasional
            </div>

            <div className="pl-3 space-y-1 border-l-2 border-slate-700 ml-2">
              <Link
                href="/admin/settings?tab=drivers"
                className={`block px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                  isDriversActive ? 'text-amber-400 font-bold bg-slate-800' : 'text-slate-300 hover:text-amber-400'
                }`}
              >
                • Master Driver
              </Link>
              <Link
                href="/admin/settings?tab=vehicles"
                className={`block px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                  isVehiclesActive ? 'text-amber-400 font-bold bg-slate-800' : 'text-slate-300 hover:text-amber-400'
                }`}
              >
                • Master Armada
              </Link>
              <Link
                href="/admin/settings?tab=prices"
                className={`block px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                  isPricesActive ? 'text-amber-400 font-bold bg-slate-800' : 'text-slate-300 hover:text-amber-400'
                }`}
              >
                • Tarif BBM
              </Link>
            </div>
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