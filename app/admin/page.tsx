'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Icons } from '@/components/admin/Icons'
import { ExecutiveCards } from '@/components/admin/ExecutiveCards'
import { FuelLogsTable } from '@/components/admin/FuelLogsTable'
import { AnalyticsTab } from '@/components/admin/AnalyticsTab'
import { MaintenanceTab } from '@/components/admin/MaintenanceTab'

const DEFAULT_VEHICLES = [
  { id: '1', plate_number: 'B 1234 ABC', model: 'Toyota Avanza', monthly_budget: 1500000, last_km: 45320, kir_expiry: '2026-10-15' },
  { id: '2', plate_number: 'B 5678 XYZ', model: 'Daihatsu Gran Max', monthly_budget: 2000000, last_km: 32000, kir_expiry: '2026-09-10' },
  { id: '3', plate_number: 'B 9012 DEF', model: 'Isuzu Traga', monthly_budget: 2500000, last_km: 18500, kir_expiry: '2026-12-01' },
]

const DEFAULT_LOGS = [
  {
    id: 1,
    plate_number: 'B 1234 ABC',
    vehicle_model: 'Toyota Avanza',
    driver_name: 'Ahmad Supardi',
    initial_km: 45250,
    final_km: 45750,
    distance_km: 500,
    liters: 15,
    unit_price: 10000,
    km_per_liter: 33.33,
    total_cost: 150000,
    fuel_type: 'Pertalite',
    fill_location: 'SPBU',
    date: '2026-08-31',
    status: 'VERIFIED',
  },
]

const DEFAULT_SERVICE_HISTORY = [
  {
    id: 1,
    plate_number: 'B 1234 ABC',
    service_type: 'Ganti Oli & Filter Mesin',
    parts_replaced: 'Oli Shell Helix 4L',
    cost: 450000,
    workshop: 'Auto2000',
    km_done: 40000,
    date: '2026-06-15',
  },
]

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [usernameInput, setUsernameInput] = useState('')
  const [passwordInput, setPasswordInput] = useState('')
  const [authError, setAuthError] = useState(false)

  const [vehicles] = useState(DEFAULT_VEHICLES)
  const [logs, setLogs] = useState<any[]>(DEFAULT_LOGS)
  const [serviceHistory, setServiceHistory] = useState<any[]>(DEFAULT_SERVICE_HISTORY)

  const [activeTab, setActiveTab] = useState<'dashboard' | 'analytics' | 'maintenance'>('dashboard')
  const [isKelolaOpen, setIsKelolaOpen] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState('ALL')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [previewReceipt, setPreviewReceipt] = useState<any | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('admin_authenticated') === 'true') {
      setIsAuthenticated(true)
    }
  }, [])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (usernameInput.trim().toLowerCase() === 'admin' && passwordInput === 'admin123') {
      setIsAuthenticated(true)
      localStorage.setItem('admin_authenticated', 'true')
      setAuthError(false)
    } else {
      setAuthError(true)
    }
  }

  const handleLogout = () => {
    if (confirm('Kunci kembali akses Admin FleetOps 360?')) {
      localStorage.removeItem('admin_authenticated')
      setIsAuthenticated(false)
    }
  }

  const handleUpdateStatus = (id: number, newStatus: 'VERIFIED' | 'FLAGGED') => {
    const updatedLogs = logs.map((l) => (l.id === id ? { ...l, status: newStatus } : l))
    setLogs(updatedLogs)
    if (previewReceipt && previewReceipt.id === id) setPreviewReceipt({ ...previewReceipt, status: newStatus })
  }

  const handleDeleteLog = (id: number) => {
    if (confirm('Hapus data pengisian ini dari log?')) {
      setLogs(logs.filter((l) => l.id !== id))
    }
  }

  const handleAddServiceRecord = (record: any) => {
    setServiceHistory([{ ...record, id: Date.now() }, ...serviceHistory])
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 text-slate-100 font-sans">
        <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm w-full text-slate-900 space-y-5 border border-slate-100">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-amber-500 text-slate-950 rounded-2xl flex items-center justify-center mx-auto text-xl font-bold shadow-md">
              <Icons.Lock className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Otorisasi Akses Manajemen</h1>
              <p className="text-xs text-slate-500">FleetOps 360 Enterprise Control Center</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Username Admin</label>
              <input
                type="text"
                placeholder="Masukkan username"
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-xs font-medium bg-slate-50 outline-none focus:ring-2 focus:ring-amber-500"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-xs font-medium bg-slate-50 outline-none focus:ring-2 focus:ring-amber-500"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                required
              />
            </div>

            {authError && (
              <p className="text-[11px] text-rose-600 font-semibold text-center bg-rose-50 p-2 rounded-lg border border-rose-200">
                ⚠️ Username atau Password tidak valid!
              </p>
            )}

            <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl text-xs shadow-md transition">
              Masuk Dashboard Admin
            </button>
          </form>

          <div className="text-center space-y-2 pt-2 border-t border-slate-100">
            <Link href="/driver" className="text-xs text-amber-600 hover:text-amber-700 font-bold block">
              ← Kembali ke Portal Driver
            </Link>
            <span className="text-[10px] text-slate-400 font-medium block">
              Dev by Urai Ikhsan Fadhilah
            </span>
          </div>
        </div>
      </div>
    )
  }

  const filteredLogs = logs.filter((log) => {
    const matchVehicle = selectedVehicle === 'ALL' || log.plate_number === selectedVehicle
    const matchStart = !startDate || log.date >= startDate
    const matchEnd = !endDate || log.date <= endDate
    return matchVehicle && matchStart && matchEnd
  })

  const totalCost = filteredLogs.reduce((acc, l) => acc + (Number(l.total_cost) || 0), 0)
  const totalLiters = filteredLogs.reduce((acc, l) => acc + (Number(l.liters) || 0), 0)
  const totalKm = filteredLogs.reduce((acc, l) => acc + (Number(l.distance_km) || 0), 0)
  const avgKmPerLiter = totalLiters > 0 ? (totalKm / totalLiters).toFixed(2) : '0'
  const totalMaintenanceCost = serviceHistory.reduce((acc, s) => acc + (Number(s.cost) || 0), 0)

  const vehicleStats = vehicles.map((v) => {
    const vLogs = logs.filter((l) => l.plate_number === v.plate_number)
    const spentCost = vLogs.reduce((acc, l) => acc + (Number(l.total_cost) || 0), 0)
    const vServices = serviceHistory.filter((s) => s.plate_number === v.plate_number)
    const spentMaintenance = vServices.reduce((acc, s) => acc + (Number(s.cost) || 0), 0)
    const totalOperationalCost = spentCost + spentMaintenance

    const km = vLogs.reduce((acc, l) => acc + (Number(l.distance_km) || 0), 0)
    const liters = vLogs.reduce((acc, l) => acc + (Number(l.liters) || 0), 0)
    const efficiency = liters > 0 ? Number((km / liters).toFixed(1)) : 0
    const budget = Number(v.monthly_budget) || 1
    const usagePercent = Math.min(Math.round((spentCost / budget) * 100), 100)
    const isOverBudget = spentCost > budget

    return { ...v, spentCost, spentMaintenance, totalOperationalCost, efficiency, usagePercent, isOverBudget }
  })

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans text-slate-800">
      <aside className="w-64 bg-slate-900 text-slate-300 p-4 space-y-4 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center gap-2.5 font-extrabold text-white text-sm pb-3 border-b border-slate-800">
            <div className="w-8 h-8 bg-amber-500 text-slate-950 rounded-lg flex items-center justify-center font-bold">
              <Icons.Fuel className="w-4 h-4" />
            </div>
            <span>FLEETOPS 360</span>
          </div>

          <nav className="space-y-1 text-xs">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full text-left p-2.5 rounded-xl font-bold transition flex items-center gap-2 ${
                activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-800 text-slate-400'
              }`}
            >
              <Icons.Dashboard /> Dashboard Utama
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`w-full text-left p-2.5 rounded-xl font-bold transition flex items-center gap-2 ${
                activeTab === 'analytics' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-800 text-slate-400'
              }`}
            >
              <Icons.Analytics /> Analytics & Grafik
            </button>

            <button
              onClick={() => setActiveTab('maintenance')}
              className={`w-full text-left p-2.5 rounded-xl font-bold transition flex items-center gap-2 ${
                activeTab === 'maintenance' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-800 text-slate-400'
              }`}
            >
              <Icons.Wrench /> Servis & Maintenance
            </button>

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
                  <Link href="/settings?tab=drivers" className="block px-3 py-1.5 text-xs text-slate-300 hover:text-amber-400 font-medium">
                    • Master Driver
                  </Link>
                  <Link href="/settings?tab=vehicles" className="block px-3 py-1.5 text-xs text-slate-300 hover:text-amber-400 font-medium">
                    • Master Armada
                  </Link>
                  <Link href="/settings?tab=prices" className="block px-3 py-1.5 text-xs text-slate-300 hover:text-amber-400 font-medium">
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

      <main className="flex-1 p-6 space-y-6 overflow-y-auto">
        {activeTab === 'dashboard' && (
          <>
            <ExecutiveCards
              totalCost={totalCost}
              avgKmPerLiter={avgKmPerLiter}
              totalLiters={totalLiters}
              totalMaintenanceCost={totalMaintenanceCost}
              vehicleStats={vehicleStats}
            />

            <FuelLogsTable
              filteredLogs={filteredLogs}
              safeVehicles={vehicles}
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
              selectedVehicle={selectedVehicle}
              setSelectedVehicle={setSelectedVehicle}
              setPreviewReceipt={setPreviewReceipt}
              handleDeleteLog={handleDeleteLog}
            />
          </>
        )}

        {activeTab === 'analytics' && <AnalyticsTab vehicleStats={vehicleStats} totalCost={totalCost} />}

        {activeTab === 'maintenance' && (
          <MaintenanceTab
            vehicleStats={vehicleStats}
            serviceHistory={serviceHistory}
            totalMaintenanceCost={totalMaintenanceCost}
            onAddServiceRecord={handleAddServiceRecord}
          />
        )}
      </main>

      {previewReceipt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-5 space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-xs font-bold text-slate-900">Detail Audit Struk BBM</h3>
              <button onClick={() => setPreviewReceipt(null)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <div className="max-h-[40vh] overflow-y-auto rounded-xl border bg-slate-50 p-2 flex items-center justify-center">
              {previewReceipt.receipt_image ? (
                <img src={previewReceipt.receipt_image} alt="Struk BBM" className="max-w-full h-auto rounded-lg" />
              ) : (
                <span className="text-xs text-slate-400 italic">Tidak ada foto struk yang diunggah driver.</span>
              )}
            </div>

            <div className="space-y-1 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100 font-mono">
              <div>Pengemudi: <strong>{previewReceipt.driver_name || '-'}</strong></div>
              <div>Kendaraan: <strong>{previewReceipt.plate_number}</strong></div>
              <div>Biaya: <strong>Rp {(Number(previewReceipt.total_cost) || 0).toLocaleString('id-ID')}</strong></div>
              <div>Lokasi: <strong>{previewReceipt.fill_location}</strong></div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleUpdateStatus(previewReceipt.id, 'VERIFIED')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 rounded-xl shadow-md transition"
              >
                ✓ Setujui
              </button>
              <button
                onClick={() => handleUpdateStatus(previewReceipt.id, 'FLAGGED')}
                className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold py-2.5 rounded-xl shadow-md transition"
              >
                ⚠️ Tandai Anomali
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}