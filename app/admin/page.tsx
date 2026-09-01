'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

// ==========================================
// 1. Ikon Vektor Terpusat (Inline)
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
  DocumentCheck: ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
}

// ==========================================
// 2. Kartu Ringkasan Eksekutif (Inline)
// ==========================================
function ExecutiveCards({ totalCost, avgKmPerLiter, totalLiters, totalMaintenanceCost, vehicleStats }: any) {
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

      <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
        <h2 className="text-xs font-extrabold text-slate-900 tracking-wider uppercase">Realisasi Operasional Per Armada</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {vehicleStats.map((v: any) => (
            <div key={v.plate_number} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between font-bold text-xs">
                <span>{v.plate_number} ({v.model})</span>
                <span className={v.isOverBudget ? 'text-rose-600' : 'text-emerald-600'}>{v.isOverBudget ? 'Exceeded' : 'Normal'}</span>
              </div>
              <div className="text-xs font-mono flex justify-between">
                <span>Total Operasional:</span>
                <strong>Rp {(v.totalOperationalCost || 0).toLocaleString('id-ID')}</strong>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ==========================================
// 3. Tabel Log BBM (Inline)
// ==========================================
function FuelLogsTable({ filteredLogs, safeVehicles, selectedVehicle, setSelectedVehicle, handleDeleteLog }: any) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center">
        <h2 className="text-xs font-extrabold text-slate-900 tracking-wider uppercase">Rincian Transaksi Pengisian BBM</h2>
        <select className="text-xs border rounded-xl p-2 bg-white" value={selectedVehicle} onChange={(e) => setSelectedVehicle(e.target.value)}>
          <option value="ALL">Semua Armada</option>
          {safeVehicles.map((v: any) => (
            <option key={v.plate_number} value={v.plate_number}>{v.plate_number} - {v.model}</option>
          ))}
        </select>
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
// 4. Tab Analisis & Grafik (Inline)
// ==========================================
function AnalyticsTab({ vehicleStats }: any) {
  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
        <h2 className="text-sm font-bold text-slate-900">Analisis Kinerja & Efisiensi BBM</h2>
        <p className="text-xs text-slate-500">Visualisasi statistik efisiensi konsumsi BBM armada</p>
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
// 5. Tab Servis, Sparepart & KIR (Inline)
// ==========================================
function MaintenanceTab({ vehicleStats, serviceHistory, totalMaintenanceCost, onAddServiceRecord }: any) {
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
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Icons.Wrench className="w-5 h-5 text-indigo-600" /> Modul Servis, Sparepart & Legalitas KIR
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Monitoring perbaikan berkala dan tenggat KIR</p>
        </div>
        <div className="text-xs font-bold text-indigo-900 bg-indigo-50 p-3 rounded-xl font-mono">
          Total: Rp {totalMaintenanceCost.toLocaleString('id-ID')}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {vehicleStats.map((v: any) => (
          <div key={v.plate_number} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="font-bold text-sm text-slate-900">{v.plate_number} - {v.model}</div>
            <div className="text-xs text-slate-500">KM Odometer: {v.last_km.toLocaleString('id-ID')} KM</div>
            <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg font-mono">Exp KIR: {v.kir_expiry || '-'}</div>
            <button onClick={() => setSelectedVehicle(v)} className="w-full bg-slate-900 text-white font-bold text-xs py-2 rounded-xl shadow-md">
              Catat Servis / Sparepart
            </button>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100">
          <h3 className="text-xs font-extrabold text-slate-900 uppercase">Riwayat Maintenance & Sparepart</h3>
        </div>
        <div className="overflow-x-auto max-h-[200px] overflow-y-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-900 text-white font-bold sticky top-0 z-10">
              <tr>
                <th className="p-3">Tanggal</th>
                <th className="p-3">Kendaraan</th>
                <th className="p-3">Jenis Pengerjaan</th>
                <th className="p-3">Sparepart Diganti</th>
                <th className="p-3">Bengkel</th>
                <th className="p-3 text-right">Biaya (Rp)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {serviceHistory.map((s: any) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="p-3 font-mono">{s.date}</td>
                  <td className="p-3 font-bold text-slate-900">{s.plate_number}</td>
                  <td className="p-3 font-medium">{s.service_type}</td>
                  <td className="p-3 font-medium text-indigo-900 bg-indigo-50/50">{s.parts_replaced || '-'}</td>
                  <td className="p-3">{s.workshop}</td>
                  <td className="p-3 text-right font-mono font-bold text-slate-900">Rp {(Number(s.cost) || 0).toLocaleString('id-ID')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedVehicle && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-3 shadow-xl">
            <h3 className="text-xs font-bold text-slate-900">Catat Servis {selectedVehicle.plate_number}</h3>
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Kategori Pengerjaan</label>
                <select className="w-full border p-2 rounded-xl bg-slate-50" value={serviceTypeInput} onChange={(e) => setServiceTypeInput(e.target.value)}>
                  <option value="Ganti Oli & Filter Mesin">🛢️ Ganti Oli & Filter Mesin</option>
                  <option value="Servis Berkala Mesin">🔧 Servis Berkala Mesin</option>
                  <option value="Pengujian Uji KIR Berkala">📜 Pengujian Uji KIR Berkala</option>
                  <option value="Perbaikan Darurat / Sparepart">🛠️ Perbaikan / Penggantian Sparepart Non-Rutin</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Rincian Sparepart Diganti</label>
                <input type="text" placeholder="Contoh: Aki GS Astra 45Ah, Kampas Rem" className="w-full border p-2 rounded-xl" value={partsReplacedInput} onChange={(e) => setPartsReplacedInput(e.target.value)} required />
              </div>
              <div>
                <label className="block font-semibold mb-1">Bengkel / Rekanan</label>
                <input type="text" placeholder="Nama Bengkel / Dishub" className="w-full border p-2 rounded-xl" value={workshopInput} onChange={(e) => setWorkshopInput(e.target.value)} required />
              </div>
              <div>
                <label className="block font-semibold mb-1">Total Biaya (Rp)</label>
                <input type="number" placeholder="450000" className="w-full border p-2 rounded-xl font-mono font-bold" value={serviceCostInput} onChange={(e) => setServiceCostInput(e.target.value)} required />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setSelectedVehicle(null)} className="w-1/2 bg-slate-100 p-2 rounded-xl font-bold">Batal</button>
                <button type="submit" className="w-1/2 bg-slate-900 text-white p-2 rounded-xl font-bold">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ==========================================
// 6. Component Main Admin Dashboard
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
  { id: 1, plate_number: 'B 1234 ABC', service_type: 'Ganti Oli & Filter Mesin', parts_replaced: 'Oli Shell Helix 4L', cost: 450000, workshop: 'Auto2000', km_done: 40000, date: '2026-06-15' },
]

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [vehicles] = useState(DEFAULT_VEHICLES)
  const [logs, setLogs] = useState<any[]>(DEFAULT_LOGS)
  const [serviceHistory, setServiceHistory] = useState<any[]>(DEFAULT_SERVICE_HISTORY)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analytics' | 'maintenance'>('dashboard')
  const [selectedVehicle, setSelectedVehicle] = useState('ALL')

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
          <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center mx-auto text-slate-950 font-bold">
            <Icons.Fuel />
          </div>
          <h1 className="text-lg font-bold">Akses Admin FleetOps 360</h1>
          <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="password"
              maxLength={4}
              placeholder="PIN (1234)"
              className="w-full text-center text-xl py-2 border rounded-xl font-mono font-bold bg-slate-50 outline-none"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
            />
            <button type="submit" className="w-full bg-slate-900 text-white font-bold py-2.5 rounded-xl text-xs shadow-md">
              Masuk
            </button>
          </form>
          <Link href="/driver" className="text-xs text-amber-600 font-bold block pt-1">
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
    const spentCost = vLogs.reduce((acc, l) => acc + (Number(l.total_cost) || 0), 0)
    const vServices = serviceHistory.filter((s) => s.plate_number === v.plate_number)
    const spentMaintenance = vServices.reduce((acc, s) => acc + (Number(s.cost) || 0), 0)
    const totalOperationalCost = spentCost + spentMaintenance

    const km = vLogs.reduce((acc, l) => acc + (Number(l.distance_km) || 0), 0)
    const liters = vLogs.reduce((acc, l) => acc + (Number(l.liters) || 0), 0)
    const efficiency = liters > 0 ? Number((km / liters).toFixed(1)) : 0
    return { ...v, spentCost, spentMaintenance, totalOperationalCost, efficiency }
  })

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans text-slate-800">
      <aside className="w-64 bg-slate-900 text-slate-300 p-4 space-y-4">
        <div className="flex items-center gap-2 font-extrabold text-white text-sm pb-2 border-b border-slate-800">
          <Icons.Fuel className="w-5 h-5 text-amber-400" /> FLEETOPS 360
        </div>
        <nav className="space-y-1 text-xs">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full text-left p-2.5 rounded-xl font-bold transition ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-400'}`}>
            Dashboard Utama
          </button>
          <button onClick={() => setActiveTab('analytics')} className={`w-full text-left p-2.5 rounded-xl font-bold transition ${activeTab === 'analytics' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-400'}`}>
            Analytics & Grafik
          </button>
          <button onClick={() => setActiveTab('maintenance')} className={`w-full text-left p-2.5 rounded-xl font-bold transition ${activeTab === 'maintenance' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-400'}`}>
            Servis & Maintenance
          </button>
        </nav>
        <Link href="/driver" className="block text-xs text-amber-400 font-bold pt-4 border-t border-slate-800">
          Portal Driver ➔
        </Link>
      </aside>

      <main className="flex-1 p-6 space-y-6">
        {activeTab === 'dashboard' && (
          <>
            <ExecutiveCards totalCost={totalCost} avgKmPerLiter={avgKmPerLiter} totalLiters={totalLiters} totalMaintenanceCost={totalMaintenanceCost} vehicleStats={vehicleStats} />
            <FuelLogsTable filteredLogs={logs} safeVehicles={vehicles} selectedVehicle={selectedVehicle} setSelectedVehicle={setSelectedVehicle} handleDeleteLog={handleDeleteLog} />
          </>
        )}
        {activeTab === 'analytics' && <AnalyticsTab vehicleStats={vehicleStats} totalCost={totalCost} />}
        {activeTab === 'maintenance' && <MaintenanceTab vehicleStats={vehicleStats} serviceHistory={serviceHistory} totalMaintenanceCost={totalMaintenanceCost} onAddServiceRecord={handleAddServiceRecord} />}
      </main>
    </div>
  )
}
