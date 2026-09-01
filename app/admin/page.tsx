'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

// ==========================================
// 1. INLINE ICONS
// ==========================================
const Icons = {
  Fuel: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  Dashboard: ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  ),
  Analytics: ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
    </svg>
  ),
  Wrench: ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Truck: ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8h4l3 3v5a1 1 0 01-1 1h-1m-6 0a1 1 0 001-1v-4" />
    </svg>
  ),
  Price: ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Mobile: ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ),
}

// ==========================================
// 2. INLINE EXECUTIVE CARDS
// ==========================================
function ExecutiveCards({ totalCost, avgKmPerLiter, totalLiters, totalMaintenanceCost }: any) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white rounded-2xl shadow-lg space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">Total Biaya BBM</span>
            <Icons.Price className="w-5 h-5 text-indigo-200" />
          </div>
          <div className="text-2xl font-extrabold font-mono">Rp {totalCost.toLocaleString('id-ID')}</div>
        </div>
        <div className="p-5 bg-gradient-to-br from-emerald-600 to-teal-800 text-white rounded-2xl shadow-lg space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">Rata-Rata Efisiensi</span>
            <Icons.Fuel className="w-5 h-5 text-emerald-200" />
          </div>
          <div className="text-2xl font-extrabold font-mono">{avgKmPerLiter} <span className="text-xs font-sans">KM/L</span></div>
        </div>
        <div className="p-5 bg-gradient-to-br from-amber-500 to-orange-600 text-slate-950 rounded-2xl shadow-lg space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-extrabold uppercase tracking-wider">Total Konsumsi BBM</span>
            <Icons.Truck className="w-5 h-5" />
          </div>
          <div className="text-2xl font-extrabold font-mono">{totalLiters.toLocaleString('id-ID')} <span className="text-xs font-sans">Liter</span></div>
        </div>
        <div className="p-5 bg-gradient-to-br from-slate-800 to-slate-950 text-white rounded-2xl shadow-lg space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Biaya Maintenance & KIR</span>
            <Icons.Wrench className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-amber-400">Rp {totalMaintenanceCost.toLocaleString('id-ID')}</div>
        </div>
      </div>
    </div>
  )
}

// ==========================================
// 3. INLINE FUEL LOGS TABLE
// ==========================================
function FuelLogsTable({ filteredLogs, safeVehicles, selectedVehicle, setSelectedVehicle, handleDeleteLog }: any) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="p-4 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
        <h2 className="text-xs font-extrabold text-slate-900 tracking-wider uppercase">Rincian Transaksi Pengisian BBM</h2>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select className="text-xs border rounded-xl p-2 bg-white" value={selectedVehicle} onChange={(e) => setSelectedVehicle(e.target.value)}>
            <option value="ALL">Semua Armada</option>
            {safeVehicles.map((v: any) => (
              <option key={v.plate_number} value={v.plate_number}>{v.plate_number} - {v.model}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="overflow-x-auto max-h-[250px] overflow-y-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-900 text-white font-bold sticky top-0 z-10">
            <tr>
              <th className="p-3">Tanggal</th>
              <th className="p-3">Kendaraan</th>
              <th className="p-3">Pengemudi</th>
              <th className="p-3">Jenis BBM</th>
              <th className="p-3">Odometer</th>
              <th className="p-3">Volume</th>
              <th className="p-3 text-right">Total Biaya</th>
              <th className="p-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredLogs.map((log: any) => (
              <tr key={log.id} className="hover:bg-slate-50">
                <td className="p-3 font-mono">{log.date}</td>
                <td className="p-3 font-bold text-slate-900">{log.plate_number}</td>
                <td className="p-3">{log.driver_name}</td>
                <td className="p-3">{log.fuel_type}</td>
                <td className="p-3 font-mono">{log.initial_km} → {log.final_km} KM</td>
                <td className="p-3 font-mono">{log.liters} L</td>
                <td className="p-3 text-right font-mono font-bold text-slate-900">Rp {(Number(log.total_cost) || 0).toLocaleString('id-ID')}</td>
                <td className="p-3 text-center">
                  <button onClick={() => handleDeleteLog(log.id)} className="text-rose-600 hover:underline font-bold text-[11px]">Hapus</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ==========================================
// 4. INLINE ANALYTICS TAB
// ==========================================
function AnalyticsTab({ vehicleStats }: any) {
  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
        <h2 className="text-sm font-bold text-slate-900">Analisis Kinerja & Efisiensi BBM</h2>
        <p className="text-xs text-slate-500">Statistik rasio efisiensi KM/L per armada</p>
      </div>
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        {vehicleStats.map((v: any) => (
          <div key={v.plate_number} className="space-y-1">
            <div className="flex justify-between text-xs font-semibold">
              <span>{v.plate_number} ({v.model})</span>
              <span className="font-bold text-emerald-700">{v.efficiency} KM/L</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ==========================================
// 5. INLINE MAINTENANCE TAB
// ==========================================
function MaintenanceTabContent({ vehicleStats, serviceHistory, totalMaintenanceCost, onAddServiceRecord }: any) {
  const [selectedVehicle, setSelectedVehicle] = useState<any | null>(null)
  const [serviceTypeInput, setServiceTypeInput] = useState('Ganti Oli & Filter Mesin')
  const [partsReplacedInput, setPartsReplacedInput] = useState('')
  const [serviceCostInput, setServiceCostInput] = useState('')
  const [workshopInput, setWorkshopInput] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedVehicle) return
    onAddServiceRecord({
      plate_number: selectedVehicle.plate_number,
      service_type: serviceTypeInput,
      parts_replaced: partsReplacedInput.trim() || '-',
      cost: Number(serviceCostInput) || 0,
      workshop: workshopInput || 'Bengkel',
      km_done: selectedVehicle.last_km,
      date: new Date().toISOString().split('T')[0],
    })
    setSelectedVehicle(null)
    setPartsReplacedInput('')
    setServiceCostInput('')
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Modul Perawatan & Sparepart</h2>
          <p className="text-xs text-slate-500">Jadwal servis, Uji KIR, dan perbaikan armada</p>
        </div>
        <div className="text-xs font-bold text-indigo-900 bg-indigo-50 p-3 rounded-xl">
          Total: Rp {totalMaintenanceCost.toLocaleString('id-ID')}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {vehicleStats.map((v: any) => (
          <div key={v.plate_number} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="font-bold text-sm text-slate-900">{v.plate_number} - {v.model}</div>
            <div className="text-xs text-slate-500">KM: {v.last_km.toLocaleString('id-ID')}</div>
            <button onClick={() => setSelectedVehicle(v)} className="w-full bg-slate-900 text-white font-bold text-xs py-2 rounded-xl">
              Catat Servis / Sparepart
            </button>
          </div>
        ))}
      </div>
      {selectedVehicle && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-900">Input Servis {selectedVehicle.plate_number}</h3>
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <input type="text" placeholder="Sparepart diganti" className="w-full border p-2 rounded-xl" value={partsReplacedInput} onChange={(e) => setPartsReplacedInput(e.target.value)} required />
              <input type="text" placeholder="Bengkel" className="w-full border p-2 rounded-xl" value={workshopInput} onChange={(e) => setWorkshopInput(e.target.value)} required />
              <input type="number" placeholder="Biaya (Rp)" className="w-full border p-2 rounded-xl" value={serviceCostInput} onChange={(e) => setServiceCostInput(e.target.value)} required />
              <div className="flex gap-2">
                <button type="button" onClick={() => setSelectedVehicle(null)} className="w-1/2 bg-slate-100 p-2 rounded-xl">Batal</button>
                <button type="submit" className="w-1/2 bg-slate-900 text-white p-2 rounded-xl">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ==========================================
// 6. MAIN ADMIN DASHBOARD
// ==========================================
const DEFAULT_VEHICLES = [
  { id: '1', plate_number: 'B 1234 ABC', model: 'Toyota Avanza', monthly_budget: 1500000, last_km: 45320, kir_expiry: '2026-10-15' },
  { id: '2', plate_number: 'B 5678 XYZ', model: 'Daihatsu Gran Max', monthly_budget: 2000000, last_km: 32000, kir_expiry: '2026-09-10' },
  { id: '3', plate_number: 'B 9012 DEF', model: 'Isuzu Traga', monthly_budget: 2500000, last_km: 18500, kir_expiry: '2026-12-01' },
]

const DEFAULT_LOGS = [
  { id: 1, plate_number: 'B 1234 ABC', vehicle_model: 'Toyota Avanza', driver_name: 'Ahmad Supardi', initial_km: 45250, final_km: 45750, distance_km: 500, liters: 15, unit_price: 10000, km_per_liter: 33.33, total_cost: 150000, fuel_type: 'Pertalite', date: '2026-08-31', status: 'PENDING' },
]

const DEFAULT_SERVICE_HISTORY = [
  { id: 1, plate_number: 'B 1234 ABC', service_type: 'Ganti Oli', parts_replaced: 'Oli Shell', cost: 450000, workshop: 'Bengkel A', km_done: 40000, date: '2026-06-15' },
]

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [vehicles] = useState(DEFAULT_VEHICLES)
  const [logs, setLogs] = useState<any[]>(DEFAULT_LOGS)
  const [serviceHistory, setServiceHistory] = useState<any[]>(DEFAULT_SERVICE_HISTORY)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analytics' | 'maintenance'>('dashboard')

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('admin_authenticated') === 'true') {
      setIsAuthenticated(true)
    }
  }, [])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (pinInput === '1234') {
      setIsAuthenticated(true)
      localStorage.setItem('admin_authenticated', 'true')
    } else {
      alert('PIN Salah! Gunakan: 1234')
    }
  }

  const handleDeleteLog = (id: number) => {
    setLogs(logs.filter((l) => l.id !== id))
  }

  const handleAddServiceRecord = (record: any) => {
    setServiceHistory([{ ...record, id: Date.now() }, ...serviceHistory])
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 text-slate-100 font-sans">
        <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm w-full text-slate-900 text-center space-y-4">
          <h1 className="text-lg font-bold">Akses Admin FleetOps 360</h1>
          <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="password"
              maxLength={4}
              placeholder="PIN (1234)"
              className="w-full text-center text-xl py-2 border rounded-xl font-mono font-bold"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
            />
            <button type="submit" className="w-full bg-slate-900 text-white font-bold py-2 rounded-xl text-xs">
              Masuk
            </button>
          </form>
          <Link href="/driver" className="text-xs text-amber-600 font-bold block">
            ← Ke Portal Driver
          </Link>
        </div>
      </div>
    )
  }

  const totalCost = logs.reduce((acc, l) => acc + (Number(l.total_cost) || 0), 0)
  const totalLiters = logs.reduce((acc, l) => acc + (Number(l.liters) || 0), 0)
  const totalKm = logs.reduce((acc, l) => acc + (Number(l.distance_km) || 0), 0)
  const avgKmPerLiter = totalLiters > 0 ? (totalKm / totalLiters).toFixed(2) : '0'
  const totalMaintenanceCost = serviceHistory.reduce((acc, s) => acc + (Number(s.cost) || 0), 0)

  const vehicleStats = vehicles.map((v) => {
    const vLogs = logs.filter((l) => l.plate_number === v.plate_number)
    const km = vLogs.reduce((acc, l) => acc + (Number(l.distance_km) || 0), 0)
    const liters = vLogs.reduce((acc, l) => acc + (Number(l.liters) || 0), 0)
    const efficiency = liters > 0 ? Number((km / liters).toFixed(1)) : 0
    return { ...v, efficiency }
  })

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans text-slate-800">
      <aside className="w-64 bg-slate-900 text-slate-300 p-4 space-y-4">
        <div className="font-extrabold text-white text-sm">FLEETOPS 360</div>
        <nav className="space-y-1 text-xs">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full text-left p-2 rounded-xl ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white font-bold' : ''}`}>Dashboard</button>
          <button onClick={() => setActiveTab('analytics')} className={`w-full text-left p-2 rounded-xl ${activeTab === 'analytics' ? 'bg-indigo-600 text-white font-bold' : ''}`}>Analytics</button>
          <button onClick={() => setActiveTab('maintenance')} className={`w-full text-left p-2 rounded-xl ${activeTab === 'maintenance' ? 'bg-indigo-600 text-white font-bold' : ''}`}>Servis & Maintenance</button>
        </nav>
        <Link href="/driver" className="block text-xs text-amber-400 font-bold pt-4">Portal Driver ➔</Link>
      </aside>

      <main className="flex-1 p-6 space-y-6">
        {activeTab === 'dashboard' && (
          <>
            <ExecutiveCards totalCost={totalCost} avgKmPerLiter={avgKmPerLiter} totalLiters={totalLiters} totalMaintenanceCost={totalMaintenanceCost} vehicleStats={vehicleStats} />
            <FuelLogsTable filteredLogs={logs} safeVehicles={vehicles} selectedVehicle="ALL" setSelectedVehicle={() => {}} handleDeleteLog={handleDeleteLog} />
          </>
        )}
        {activeTab === 'analytics' && <AnalyticsTab vehicleStats={vehicleStats} totalCost={totalCost} />}
        {activeTab === 'maintenance' && <MaintenanceTabContent vehicleStats={vehicleStats} serviceHistory={serviceHistory} totalMaintenanceCost={totalMaintenanceCost} onAddServiceRecord={handleAddServiceRecord} />}
      </main>
    </div>
  )
}