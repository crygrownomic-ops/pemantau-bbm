'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Icons } from '@/components/ui/Icons'
import ExecutiveCards from '@/components/admin/ExecutiveCards'
import FuelLogsTable from '@/components/admin/FuelLogsTable'
import AnalyticsTab from '@/components/admin/AnalyticsTab'

const DEFAULT_VEHICLES = [
  { id: '1', plate_number: 'B 1234 ABC', model: 'Toyota Avanza', monthly_budget: 1500000, last_km: 45320, kir_expiry: '2026-10-15' },
  { id: '2', plate_number: 'B 5678 XYZ', model: 'Daihatsu Gran Max', monthly_budget: 2000000, last_km: 32000, kir_expiry: '2026-09-10' },
  { id: '3', plate_number: 'B 9012 DEF', model: 'Isuzu Traga', monthly_budget: 2500000, last_km: 18500, kir_expiry: '2026-12-01' },
]

const DEFAULT_LOGS = [
  { id: 1, plate_number: 'B 1234 ABC', vehicle_model: 'Toyota Avanza', driver_name: 'Ahmad Supardi', initial_km: 45250, final_km: 45750, distance_km: 500, liters: 15, unit_price: 10000, km_per_liter: 33.33, total_cost: 150000, fuel_type: 'Pertalite', fill_location: 'SPBU', emergency_note: '', date: '2026-08-31', status: 'PENDING' },
  { id: 2, plate_number: 'KB 1234 YK', vehicle_model: 'Toyota Avanza', driver_name: 'Budi Santoso', initial_km: 47582, final_km: 47896, distance_km: 314, liters: 30, unit_price: 10000, km_per_liter: 10.47, total_cost: 300000, fuel_type: 'Pertalite', fill_location: 'SPBU', emergency_note: '', date: '2026-08-31', status: 'PENDING' },
  { id: 3, plate_number: 'KB 1234 YK', vehicle_model: 'Toyota Avanza', driver_name: 'Budi Santoso', initial_km: 47500, final_km: 47582, distance_km: 82, liters: 35.5, unit_price: 12500, km_per_liter: 2.31, total_cost: 443750, fuel_type: 'Pertalite', fill_location: 'ECERAN', emergency_note: 'SPBU Terdekat Habis Stok', date: '2026-08-31', status: 'PENDING' },
]

const DEFAULT_SERVICE_HISTORY = [
  { id: 1, plate_number: 'B 1234 ABC', service_type: 'Ganti Oli & Filter Mesin', parts_replaced: 'Oli Shell Helix 4L, Filter Oli Denso', cost: 450000, workshop: 'Auto2000 Grogol', km_done: 40000, date: '2026-06-15' },
  { id: 2, plate_number: 'B 5678 XYZ', service_type: 'Servis Berkala Mesin', parts_replaced: 'Busi Iridium (4pcs), Filter Udara', cost: 1200000, workshop: 'Bengkel Resmi Daihatsu', km_done: 30000, date: '2026-07-02' },
  { id: 3, plate_number: 'B 5678 XYZ', service_type: 'Pengujian Uji KIR Berkala', parts_replaced: 'Stiker Uji & Buku KIR Dishub', cost: 350000, workshop: 'Dinas Perhubungan', km_done: 31500, date: '2026-03-10' },
  { id: 4, plate_number: 'B 9012 DEF', service_type: 'Perbaikan Darurat / Sparepart', parts_replaced: 'Aki GS Astra 45Ah, Tali Kipas/V-Belt', cost: 850000, workshop: 'Bengkel Kakubakti', km_done: 18000, date: '2026-08-05' },
]

function getMaintenanceSchedule(currentKm: number, kirExpiryDate?: string) {
  const km = Number(currentKm) || 0
  const oilInterval = 5000
  const serviceInterval = 10000

  const nextOilKm = Math.ceil((km + 1) / oilInterval) * oilInterval
  const remainingOilKm = nextOilKm - km

  const nextServiceKm = Math.ceil((km + 1) / serviceInterval) * serviceInterval
  const remainingServiceKm = nextServiceKm - km

  let daysToKir = 999
  let isKirCritical = false
  if (kirExpiryDate) {
    const today = new Date()
    const exp = new Date(kirExpiryDate)
    const diffTime = exp.getTime() - today.getTime()
    daysToKir = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    if (daysToKir <= 30) isKirCritical = true
  }

  let status: 'CRITICAL' | 'WARNING' | 'OK' = 'OK'
  if (remainingOilKm <= 300 || remainingServiceKm <= 300 || isKirCritical) {
    status = 'CRITICAL'
  } else if (remainingOilKm <= 1000 || remainingServiceKm <= 1000 || daysToKir <= 60) {
    status = 'WARNING'
  }

  return { nextOilKm, remainingOilKm, nextServiceKm, remainingServiceKm, daysToKir, isKirCritical, status }
}

// KOMPONEN MAINTENANCE TAB (INLINE)
function MaintenanceTabContent({ vehicleStats, serviceHistory, totalMaintenanceCost, onAddServiceRecord }: any) {
  const [serviceStartDate, setServiceStartDate] = useState('')
  const [serviceEndDate, setServiceEndDate] = useState('')
  const [serviceSelectedVehicle, setServiceSelectedVehicle] = useState('ALL')
  const [selectedVehicle, setSelectedVehicle] = useState<any | null>(null)
  const [serviceTypeInput, setServiceTypeInput] = useState('Ganti Oli & Filter Mesin')
  const [partsReplacedInput, setPartsReplacedInput] = useState('')
  const [serviceCostInput, setServiceCostInput] = useState('')
  const [workshopInput, setWorkshopInput] = useState('')
  const [newKirExpiryInput, setNewKirExpiryInput] = useState('')

  const filteredHistory = serviceHistory.filter((s: any) => {
    const matchVehicle = serviceSelectedVehicle === 'ALL' || s.plate_number === serviceSelectedVehicle
    const matchStart = !serviceStartDate || s.date >= serviceStartDate
    const matchEnd = !serviceEndDate || s.date <= serviceEndDate
    return matchVehicle && matchStart && matchEnd
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedVehicle) return

    onAddServiceRecord(
      {
        plate_number: selectedVehicle.plate_number,
        service_type: serviceTypeInput,
        parts_replaced: partsReplacedInput.trim() || '-',
        cost: Number(serviceCostInput) || 0,
        workshop: workshopInput || 'Bengkel / Dishub',
        km_done: selectedVehicle.last_km,
        date: new Date().toISOString().split('T')[0],
      },
      serviceTypeInput === 'Pengujian Uji KIR Berkala' ? newKirExpiryInput : undefined
    )

    setSelectedVehicle(null)
    setPartsReplacedInput('')
    setServiceCostInput('')
    setWorkshopInput('')
    setNewKirExpiryInput('')
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Icons.Wrench className="w-5 h-5 text-indigo-600" /> Modul Pengawas Servis, Legalitas KIR & Perbaikan
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Monitoring jatuh tempo Uji KIR, sparepart, dan estimasi servis.</p>
        </div>
        <div className="bg-indigo-50 border border-indigo-200/80 p-3 rounded-xl text-xs font-mono text-indigo-900">
          <span className="text-[10px] text-indigo-500 block font-sans">Total Biaya Maintenance:</span>
          <strong className="text-sm font-bold">Rp {totalMaintenanceCost.toLocaleString('id-ID')}</strong>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {vehicleStats.map((v: any) => (
          <div key={v.plate_number} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start border-b pb-3">
                <div>
                  <div className="font-bold text-sm text-slate-900">{v.plate_number}</div>
                  <div className="text-xs text-slate-500">{v.model}</div>
                </div>
                {v.maintenance.status === 'CRITICAL' ? (
                  <span className="bg-rose-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full animate-pulse">🚨 BUTUH TINDAKAN</span>
                ) : (
                  <span className="bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">✓ KONDISI PRIMA</span>
                )}
              </div>
              <div className="space-y-3 pt-3">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Odometer Terkini:</span>
                  <span className="font-mono font-bold">{v.last_km.toLocaleString('id-ID')} KM</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold block text-[11px]">📜 Legalitas Uji KIR</span>
                    <span className="text-[10px] text-slate-500 font-mono">Exp: {v.kir_expiry}</span>
                  </div>
                  <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">{v.maintenance.daysToKir} Hari</span>
                </div>
              </div>
            </div>
            <button onClick={() => setSelectedVehicle(v)} className="w-full bg-slate-900 text-white font-bold text-xs py-2.5 rounded-xl shadow-md flex items-center justify-center gap-1.5 mt-2">
              <Icons.Wrench className="w-4 h-4" /> Catat Servis / Perbaikan / Uji KIR
            </button>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xs font-extrabold text-slate-900 uppercase">Riwayat Pengerjaan Servis & Sparepart</h3>
        </div>
        <div className="overflow-x-auto max-h-[190px] overflow-y-auto">
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
              {filteredHistory.map((s: any) => (
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
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-bold text-slate-900">Catat Perawatan & Sparepart Armada</h3>
              <button onClick={() => setSelectedVehicle(null)} className="text-slate-400 font-bold">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Kategori Pengerjaan</label>
                <select className="w-full text-xs border rounded-xl p-2.5 bg-slate-50" value={serviceTypeInput} onChange={(e) => setServiceTypeInput(e.target.value)}>
                  <option value="Ganti Oli & Filter Mesin">🛢️ Ganti Oli & Filter Mesin</option>
                  <option value="Servis Berkala Mesin">🔧 Servis Berkala Mesin</option>
                  <option value="Pengujian Uji KIR Berkala">📜 Pengujian Uji KIR Berkala</option>
                  <option value="Perbaikan Darurat / Sparepart">🛠️ Perbaikan / Penggantian Sparepart Non-Rutin</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Sparepart / Komponen Diganti</label>
                <input type="text" placeholder="Contoh: Aki GS Astra 45Ah, Kampas Rem" className="w-full text-xs border rounded-xl p-2.5 bg-slate-50" value={partsReplacedInput} onChange={(e) => setPartsReplacedInput(e.target.value)} required />
              </div>
              {serviceTypeInput === 'Pengujian Uji KIR Berkala' && (
                <div>
                  <label className="block text-xs font-semibold text-amber-800 mb-1">Tanggal Expired KIR Baru</label>
                  <input type="date" className="w-full text-xs border rounded-xl p-2.5 bg-amber-50" value={newKirExpiryInput} onChange={(e) => setNewKirExpiryInput(e.target.value)} required />
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Bengkel / Rekanan</label>
                <input type="text" placeholder="Nama Bengkel" className="w-full text-xs border rounded-xl p-2.5 bg-slate-50" value={workshopInput} onChange={(e) => setWorkshopInput(e.target.value)} required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Total Biaya (Rp)</label>
                <input type="number" placeholder="450000" className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-mono font-bold" value={serviceCostInput} onChange={(e) => setServiceCostInput(e.target.value)} required />
              </div>
              <div className="pt-2 flex gap-2">
                <button type="button" onClick={() => setSelectedVehicle(null)} className="w-1/2 bg-slate-100 text-slate-700 text-xs font-bold py-2.5 rounded-xl">Batal</button>
                <button type="submit" className="w-1/2 bg-slate-900 text-white text-xs font-bold py-2.5 rounded-xl">Simpan Catatan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState(false)

  const [vehicles, setVehicles] = useState(DEFAULT_VEHICLES)
  const [logs, setLogs] = useState<any[]>(DEFAULT_LOGS)
  const [serviceHistory, setServiceHistory] = useState<any[]>(DEFAULT_SERVICE_HISTORY)

  const [activeTab, setActiveTab] = useState<'dashboard' | 'analytics' | 'maintenance'>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
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

  useEffect(() => {
    try {
      const storedVehicles = localStorage.getItem('vehicle_budgets')
      const storedLogs = localStorage.getItem('fuel_logs')
      const storedServices = localStorage.getItem('service_history')

      if (storedVehicles) setVehicles(JSON.parse(storedVehicles))
      if (storedLogs) setLogs(JSON.parse(storedLogs))
      if (storedServices) setServiceHistory(JSON.parse(storedServices))
    } catch (err) {
      console.error(err)
    }
  }, [])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (pinInput === '1234') {
      setIsAuthenticated(true)
      localStorage.setItem('admin_authenticated', 'true')
      setPinError(false)
    } else {
      setPinError(true)
    }
  }

  const handleLogout = () => {
    if (confirm('Kunci kembali akses Admin?')) {
      localStorage.removeItem('admin_authenticated')
      setIsAuthenticated(false)
    }
  }

  const handleUpdateStatus = (id: number, newStatus: 'VERIFIED' | 'FLAGGED') => {
    const updatedLogs = logs.map((l) => (l.id === id ? { ...l, status: newStatus } : l))
    setLogs(updatedLogs)
    localStorage.setItem('fuel_logs', JSON.stringify(updatedLogs))
    if (previewReceipt && previewReceipt.id === id) setPreviewReceipt({ ...previewReceipt, status: newStatus })
  }

  const handleDeleteLog = (id: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus catatan ini?')) {
      const updatedLogs = logs.filter((l) => l.id !== id)
      setLogs(updatedLogs)
      localStorage.setItem('fuel_logs', JSON.stringify(updatedLogs))
    }
  }

  const handleAddServiceRecord = (record: any, newKirExpiry?: string) => {
    const newRecord = { ...record, id: Date.now() }
    const updatedHistory = [newRecord, ...serviceHistory]
    setServiceHistory(updatedHistory)
    localStorage.setItem('service_history', JSON.stringify(updatedHistory))

    if (newKirExpiry) {
      const updatedVehicles = vehicles.map((v) =>
        v.plate_number === record.plate_number ? { ...v, kir_expiry: newKirExpiry } : v
      )
      setVehicles(updatedVehicles)
      localStorage.setItem('vehicle_budgets', JSON.stringify(updatedVehicles))
    }

    alert('Catatan Servis / Perbaikan berhasil disimpan!')
  }

  const handleDownloadReceipt = (receiptBase64: string, plateNumber: string, date: string, finalKm: number) => {
    const cleanPlate = (plateNumber || 'ARMADA').replace(/\s+/g, '').toUpperCase()
    const a = document.createElement('a')
    a.href = receiptBase64
    a.download = `${cleanPlate}_${date || 'NO_DATE'}_${finalKm || 0}.jpg`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
        <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm w-full space-y-5 text-center border border-slate-100">
          <div className="w-12 h-12 bg-amber-500 text-slate-950 rounded-2xl flex items-center justify-center mx-auto text-xl font-bold shadow-lg">
            <Icons.Fuel />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Dashboard Admin</h1>
            <p className="text-xs text-slate-500 mt-0.5">FleetOps 360 • System Control Center</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="password"
              maxLength={4}
              placeholder="••••"
              className="w-full text-center text-2xl tracking-widest py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-mono font-bold bg-slate-50"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
            />

            {pinError && <p className="text-xs text-rose-600 font-semibold">PIN tidak valid (Default: 1234)</p>}

            <button type="submit" className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl text-xs shadow-md">
              Verifikasi Akses Admin
            </button>
          </form>

          <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
            <Link href="/driver" className="hover:text-amber-600 font-bold transition flex items-center gap-1">
              <Icons.Mobile /> Portal Driver
            </Link>
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
    const maintenance = getMaintenanceSchedule(v.last_km, v.kir_expiry)

    return { ...v, spentCost, spentMaintenance, totalOperationalCost, efficiency, usagePercent, isOverBudget, maintenance }
  })

  const criticalServiceCount = vehicleStats.filter((v) => v.maintenance.status === 'CRITICAL').length

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans text-slate-800">
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static flex flex-col justify-between ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div>
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 rounded-xl flex items-center justify-center font-extrabold shadow-md">
                <Icons.Fuel />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white tracking-wide">FLEETOPS 360</h2>
                <span className="text-[10px] text-amber-400 font-bold tracking-wider uppercase">Enterprise Edition</span>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400">✕</button>
          </div>

          <nav className="p-4 space-y-1">
            <Link href="/driver" className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950 shadow-md mb-3">
              <Icons.Mobile /> Form Input BBM Driver
            </Link>

            <button onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false) }} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white font-bold shadow-md' : 'hover:bg-slate-800 text-slate-400'}`}>
              <Icons.Dashboard /> Dashboard Utama
            </button>

            <button onClick={() => { setActiveTab('analytics'); setSidebarOpen(false) }} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold ${activeTab === 'analytics' ? 'bg-indigo-600 text-white font-bold shadow-md' : 'hover:bg-slate-800 text-slate-400'}`}>
              <Icons.Analytics /> Analytics & Grafik
            </button>

            <button onClick={() => { setActiveTab('maintenance'); setSidebarOpen(false) }} className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold ${activeTab === 'maintenance' ? 'bg-indigo-600 text-white font-bold shadow-md' : 'hover:bg-slate-800 text-slate-400'}`}>
              <div className="flex items-center gap-3"><Icons.Wrench /> Servis & Maintenance</div>
              {criticalServiceCount > 0 && <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">{criticalServiceCount}</span>}
            </button>

            <div className="pt-3">
              <button onClick={() => setIsKelolaOpen(!isKelolaOpen)} className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white">
                <span className="uppercase text-[10px] tracking-wider text-amber-400 font-extrabold flex items-center gap-2"><Icons.Settings /> Pusat Kelola Operasional</span>
                <span>{isKelolaOpen ? '▲' : '▼'}</span>
              </button>

              {isKelolaOpen && (
                <div className="mt-1 pl-3 space-y-1 border-l-2 border-slate-700 ml-3">
                  <Link href="/settings?tab=drivers" className="block px-3 py-1.5 text-xs text-slate-300 hover:text-amber-400">Master Driver</Link>
                  <Link href="/settings?tab=vehicles" className="block px-3 py-1.5 text-xs text-slate-300 hover:text-amber-400">Armada Kendaraan</Link>
                  <Link href="/settings?tab=prices" className="block px-3 py-1.5 text-xs text-slate-300 hover:text-amber-400">Tarif BBM</Link>
                </div>
              )}
            </div>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800 space-y-2">
          <button onClick={handleLogout} className="w-full bg-slate-800 text-slate-300 py-2 rounded-xl text-xs font-semibold">Kunci Akses Admin</button>
          <div className="text-[10px] text-slate-500 text-center">Dev by Urai Ikhsan Fadhilah</div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex justify-between items-center sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-700 text-xl">☰</button>
            <h1 className="text-lg font-bold text-slate-900">
              {activeTab === 'dashboard' ? 'Monitoring Operasional BBM' : activeTab === 'analytics' ? 'Analytics Kinerja BBM' : 'Jadwal Servis, KIR & Perbaikan Armada'}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/driver" className="bg-amber-500 text-slate-950 font-bold text-xs px-3.5 py-2 rounded-xl">Portal Driver</Link>
          </div>
        </header>

        <main className="p-6 space-y-6 overflow-y-auto">
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
                handleUpdateStatus={handleUpdateStatus}
                handleDeleteLog={handleDeleteLog}
                handleDownloadReceipt={handleDownloadReceipt}
              />
            </>
          )}

          {activeTab === 'analytics' && <AnalyticsTab vehicleStats={vehicleStats} totalCost={totalCost} />}

          {activeTab === 'maintenance' && (
            <MaintenanceTabContent
              vehicleStats={vehicleStats}
              serviceHistory={serviceHistory}
              totalMaintenanceCost={totalMaintenanceCost}
              onAddServiceRecord={handleAddServiceRecord}
            />
          )}
        </main>
      </div>

      {previewReceipt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-5 space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-xs font-bold text-slate-900">Detail Audit Struk BBM</h3>
              <button onClick={() => setPreviewReceipt(null)} className="text-slate-400 font-bold">✕</button>
            </div>
            <div className="max-h-[45vh] overflow-y-auto rounded-xl border bg-slate-50 p-2 flex items-center justify-center">
              {previewReceipt.receipt_image ? (
                <img src={previewReceipt.receipt_image} alt="Struk" className="max-w-full h-auto rounded-lg" />
              ) : (
                <span className="text-xs text-slate-400">Tidak ada foto struk</span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => handleUpdateStatus(previewReceipt.id, 'VERIFIED')} className="bg-emerald-600 text-white text-xs font-bold py-2 rounded-xl">✓ Setujui</button>
              <button onClick={() => handleUpdateStatus(previewReceipt.id, 'FLAGGED')} className="bg-amber-600 text-white text-xs font-bold py-2 rounded-xl">⚠ Tandai Anomali</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}