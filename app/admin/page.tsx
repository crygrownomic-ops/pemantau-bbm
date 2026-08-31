'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const DEFAULT_VEHICLES = [
  { id: '1', plate_number: 'B 1234 ABC', model: 'Toyota Avanza', monthly_budget: 1500000, last_km: 45320 },
  { id: '2', plate_number: 'B 5678 XYZ', model: 'Daihatsu Gran Max', monthly_budget: 2000000, last_km: 32000 },
  { id: '3', plate_number: 'B 9012 DEF', model: 'Isuzu Traga', monthly_budget: 2500000, last_km: 18500 },
]

const DEFAULT_LOGS = [
  { id: 1, plate_number: 'B 1234 ABC', vehicle_model: 'Toyota Avanza', driver_name: 'Budi', initial_km: 44580, final_km: 45000, distance_km: 420, liters: 35, unit_price: 10000, km_per_liter: 12.0, total_cost: 350000, fuel_type: 'Pertalite', date: '2026-08-18', status: 'VERIFIED' },
  { id: 2, plate_number: 'B 5678 XYZ', vehicle_model: 'Daihatsu Gran Max', driver_name: 'Ahmad', initial_km: 31700, final_km: 32000, distance_km: 300, liters: 40, unit_price: 6800, km_per_liter: 7.5, total_cost: 1850000, fuel_type: 'Biosolar / Solar', date: '2026-08-19', status: 'FLAGGED' },
  { id: 3, plate_number: 'B 9012 DEF', vehicle_model: 'Isuzu Traga', driver_name: 'Dede', initial_km: 17950, final_km: 18500, distance_km: 550, liters: 50, unit_price: 14550, km_per_liter: 11.0, total_cost: 2700000, fuel_type: 'Dexlite', date: '2026-08-20', status: 'VERIFIED' },
  { id: 4, plate_number: 'B 1234 ABC', vehicle_model: 'Toyota Avanza', driver_name: 'Budi', initial_km: 45000, final_km: 45320, distance_km: 320, liters: 27.23, unit_price: 10000, km_per_liter: 11.75, total_cost: 272300, fuel_type: 'Pertalite', date: '2026-08-20', status: 'VERIFIED' },
]

function sanitizeVehicles(data: any) {
  if (!Array.isArray(data) || data.length === 0) return DEFAULT_VEHICLES
  return data.map((v, idx) => ({
    id: v?.id ? String(v.id) : String(idx + 1),
    plate_number: String(v?.plate_number || 'ARMADA').toUpperCase(),
    model: String(v?.model || 'Kendaraan'),
    monthly_budget: Number(v?.monthly_budget) || 0,
    last_km: Number(v?.last_km) || 0,
  }))
}

function sanitizeLogs(data: any) {
  if (!Array.isArray(data)) return DEFAULT_LOGS
  return data.map((l, idx) => ({
    id: l?.id || Date.now() + idx,
    plate_number: String(l?.plate_number || 'ARMADA').toUpperCase(),
    vehicle_model: String(l?.vehicle_model || '-'),
    driver_name: String(l?.driver_name || 'Driver'),
    initial_km: Number(l?.initial_km) || 0,
    final_km: Number(l?.final_km) || 0,
    distance_km: Number(l?.distance_km) || 0,
    liters: Number(l?.liters) || 0,
    unit_price: Number(l?.unit_price) || 0,
    km_per_liter: l?.km_per_liter ? String(l.km_per_liter) : '0',
    total_cost: Number(l?.total_cost) || 0,
    fuel_type: String(l?.fuel_type || 'Pertalite'),
    receipt_image: l?.receipt_image || '',
    date: String(l?.date || new Date().toISOString().split('T')[0]),
    status: String(l?.status || 'PENDING'),
  }))
}

// Fungsi Kalkulasi Pengingat Servis & Ganti Oli
function getMaintenanceSchedule(currentKm: number) {
  const km = Number(currentKm) || 0
  const oilInterval = 5000
  const serviceInterval = 10000

  const nextOilKm = Math.ceil((km + 1) / oilInterval) * oilInterval
  const remainingOilKm = nextOilKm - km

  const nextServiceKm = Math.ceil((km + 1) / serviceInterval) * serviceInterval
  const remainingServiceKm = nextServiceKm - km

  let status: 'CRITICAL' | 'WARNING' | 'OK' = 'OK'
  if (remainingOilKm <= 300 || remainingServiceKm <= 300) {
    status = 'CRITICAL'
  } else if (remainingOilKm <= 1000 || remainingServiceKm <= 1000) {
    status = 'WARNING'
  }

  return { nextOilKm, remainingOilKm, nextServiceKm, remainingServiceKm, status }
}

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState(false)

  const [vehicles, setVehicles] = useState(DEFAULT_VEHICLES)
  const [logs, setLogs] = useState<any[]>(DEFAULT_LOGS)

  // State Tab Navigasi Admin
  const [activeTab, setActiveTab] = useState<'dashboard' | 'maintenance'>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [selectedVehicle, setSelectedVehicle] = useState('ALL')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [previewReceipt, setPreviewReceipt] = useState<any | null>(null)

  const [adminPage, setAdminPage] = useState(1)
  const logsPerPage = 5

  const [showResetModal, setShowResetModal] = useState(false)
  const [resetPinInput, setResetPinInput] = useState('')
  const [resetPinError, setResetPinError] = useState(false)

  useEffect(() => {
    try {
      const storedVehicles = localStorage.getItem('vehicle_budgets')
      const storedLogs = localStorage.getItem('fuel_logs')

      if (storedVehicles) {
        const parsedV = JSON.parse(storedVehicles)
        setVehicles(sanitizeVehicles(parsedV))
      }
      if (storedLogs) {
        const parsedL = JSON.parse(storedLogs)
        setLogs(sanitizeLogs(parsedL))
      }
    } catch (err) {
      console.error('Error loading stored data:', err)
      localStorage.removeItem('fuel_logs')
      localStorage.removeItem('vehicle_budgets')
    }
  }, [])

  useEffect(() => {
    setAdminPage(1)
  }, [selectedVehicle, startDate, endDate])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (pinInput === '1234') {
      setIsAuthenticated(true)
      setPinError(false)
    } else {
      setPinError(true)
    }
  }

  const handleUpdateStatus = (id: number, newStatus: 'VERIFIED' | 'FLAGGED') => {
    const updatedLogs = logs.map((l) => (l.id === id ? { ...l, status: newStatus } : l))
    setLogs(updatedLogs)
    localStorage.setItem('fuel_logs', JSON.stringify(updatedLogs))
    if (previewReceipt && previewReceipt.id === id) {
      setPreviewReceipt({ ...previewReceipt, status: newStatus })
    }
  }

  const handleDeleteLog = (id: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus catatan transaksi ini?')) {
      const updatedLogs = logs.filter((l) => l.id !== id)
      setLogs(updatedLogs)
      localStorage.setItem('fuel_logs', JSON.stringify(updatedLogs))
    }
  }

  const handleConfirmResetCache = (e: React.FormEvent) => {
    e.preventDefault()
    if (resetPinInput === '1234') {
      localStorage.removeItem('fuel_logs')
      setLogs(DEFAULT_LOGS)
      setShowResetModal(false)
      setResetPinInput('')
      setResetPinError(false)
      alert('Cache berhasil dibersihkan!')
    } else {
      setResetPinError(true)
    }
  }

  const handleDownloadReceipt = (receiptBase64: string, plateNumber: string, date: string, finalKm: number) => {
    const cleanPlate = (plateNumber || 'ARMADA').replace(/\s+/g, '').toUpperCase()
    const cleanDate = date || 'TANPATANGGAL'
    const fileName = `${cleanPlate}_${cleanDate}_${finalKm || 0}.jpg`

    const a = document.createElement('a')
    a.href = receiptBase64
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const renderEfficiencyBadge = (kmPerLiterVal: any) => {
    const val = Number(kmPerLiterVal) || 0
    if (val < 8) {
      return (
        <span className="bg-rose-100 text-rose-700 font-bold px-2.5 py-1 rounded-full text-[10px] inline-flex items-center gap-1.5 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse"></span>
          {val} KM/L (Boros)
        </span>
      )
    } else if (val < 12) {
      return (
        <span className="bg-amber-100 text-amber-800 font-bold px-2.5 py-1 rounded-full text-[10px] inline-flex items-center gap-1.5 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-amber-600"></span>
          {val} KM/L (Normal)
        </span>
      )
    } else {
      return (
        <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full text-[10px] inline-flex items-center gap-1.5 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
          {val} KM/L (Irit)
        </span>
      )
    }
  }

  const renderStatusBadge = (status?: string) => {
    if (status === 'VERIFIED') {
      return <span className="bg-emerald-500 text-white font-bold px-2.5 py-0.5 rounded-full text-[10px] shadow-sm">VERIFIED</span>
    } else if (status === 'FLAGGED') {
      return <span className="bg-rose-500 text-white font-bold px-2.5 py-0.5 rounded-full text-[10px] shadow-sm">ANOMALI</span>
    } else {
      return <span className="bg-amber-500 text-white font-bold px-2.5 py-0.5 rounded-full text-[10px] shadow-sm">PENDING</span>
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
        <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm w-full space-y-5 text-center border border-slate-100">
          <div className="w-12 h-12 bg-slate-900 text-amber-400 rounded-xl flex items-center justify-center mx-auto text-xl font-bold shadow-md">
            ⛽
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Dashboard Admin</h1>
            <p className="text-xs text-slate-500 mt-0.5">Sistem Monitoring BBM Armada</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="password"
              maxLength={4}
              placeholder="••••"
              className="w-full text-center text-2xl tracking-widest py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none font-mono font-bold bg-slate-50"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
            />

            {pinError && (
              <p className="text-xs text-rose-600 font-semibold">PIN tidak valid (Default: 1234)</p>
            )}

            <button
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl text-xs transition shadow-md"
            >
              Verifikasi Akses
            </button>
          </form>

          <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
            <Link href="/" className="hover:text-slate-800 font-medium transition">
              ← Form Driver
            </Link>
            <button
              onClick={() => setShowResetModal(true)}
              className="text-rose-600 hover:text-rose-800 font-semibold"
            >
              Reset Cache
            </button>
          </div>
        </div>
      </div>
    )
  }

  const safeLogs = Array.isArray(logs) ? logs : []
  const safeVehicles = Array.isArray(vehicles) ? vehicles : []

  const filteredLogs = safeLogs.filter((log) => {
    const matchVehicle = selectedVehicle === 'ALL' || log.plate_number === selectedVehicle
    const matchStart = !startDate || log.date >= startDate
    const matchEnd = !endDate || log.date <= endDate
    return matchVehicle && matchStart && matchEnd
  })

  const totalAdminPages = Math.ceil(filteredLogs.length / logsPerPage) || 1
  const paginatedAdminLogs = filteredLogs.slice((adminPage - 1) * logsPerPage, adminPage * logsPerPage)

  const pendingCount = safeLogs.filter((l) => !l.status || l.status === 'PENDING').length
  const highConsumptionLogs = safeLogs.filter((l) => Number(l.km_per_liter) < 8)

  const totalCost = filteredLogs.reduce((acc, l) => acc + (Number(l.total_cost) || 0), 0)
  const totalLiters = filteredLogs.reduce((acc, l) => acc + (Number(l.liters) || 0), 0)
  const totalKm = filteredLogs.reduce((acc, l) => acc + (Number(l.distance_km) || 0), 0)
  const avgKmPerLiter = totalLiters > 0 ? (totalKm / totalLiters).toFixed(2) : '0'

  const vehicleStats = safeVehicles.map((v) => {
    const vLogs = safeLogs.filter((l) => l.plate_number === v.plate_number)
    const spentCost = vLogs.reduce((acc, l) => acc + (Number(l.total_cost) || 0), 0)
    const km = vLogs.reduce((acc, l) => acc + (Number(l.distance_km) || 0), 0)
    const liters = vLogs.reduce((acc, l) => acc + (Number(l.liters) || 0), 0)
    const efficiency = liters > 0 ? (km / liters).toFixed(1) : '0'
    const budget = Number(v.monthly_budget) || 1
    const usagePercent = Math.min(Math.round((spentCost / budget) * 100), 100)
    const isOverBudget = spentCost > budget

    const maintenance = getMaintenanceSchedule(v.last_km)

    return { ...v, spentCost, efficiency: Number(efficiency), usagePercent, isOverBudget, monthly_budget: budget, maintenance }
  })

  const criticalServiceCount = vehicleStats.filter((v) => v.maintenance.status === 'CRITICAL').length

  const exportToExcel = () => {
    const title = 'REKAPITULASI OPERASIONAL PENGISIAN BBM'
    const periodStr = `Periode: ${startDate || 'Awal'} s/d ${endDate || 'Hari Ini'}`
    const filterStr = `Filter Armada: ${selectedVehicle === 'ALL' ? 'Semua Armada' : selectedVehicle}`

    let tableRows = ''
    filteredLogs.forEach((l) => {
      const effVal = Number(l.km_per_liter) || 0
      const statusEff = effVal < 8 ? 'Boros (<8 KM/L)' : effVal < 12 ? 'Normal (8-12 KM/L)' : 'Irit (>12 KM/L)'
      
      tableRows += `
        <tr>
          <td style="text-align: center;">${l.date || '-'}</td>
          <td style="font-weight: bold; text-align: center;">${l.plate_number || '-'}</td>
          <td>${l.vehicle_model || '-'}</td>
          <td>${l.driver_name || '-'}</td>
          <td style="text-align: center;">${l.fuel_type || '-'}</td>
          <td style="text-align: right;">${(Number(l.initial_km) || 0).toLocaleString('id-ID')}</td>
          <td style="text-align: right;">${(Number(l.final_km) || 0).toLocaleString('id-ID')}</td>
          <td style="text-align: right; font-weight: bold;">${(Number(l.distance_km) || 0).toLocaleString('id-ID')} KM</td>
          <td style="text-align: right;">${(Number(l.liters) || 0).toLocaleString('id-ID')} L</td>
          <td style="text-align: right;">Rp ${(Number(l.unit_price) || 0).toLocaleString('id-ID')}</td>
          <td style="text-align: right; font-weight: bold;">Rp ${(Number(l.total_cost) || 0).toLocaleString('id-ID')}</td>
          <td style="text-align: center;">${effVal} KM/L</td>
          <td style="text-align: center;">${statusEff}</td>
          <td style="text-align: center; font-weight: bold;">${l.status || 'PENDING'}</td>
        </tr>
      `
    })

    const excelHTML = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
        <style>
          body { font-family: Arial, sans-serif; }
          .header-title { font-size: 16px; font-weight: bold; color: #0f172a; }
          .header-meta { font-size: 11px; color: #475569; }
          table { border-collapse: collapse; width: 100%; margin-top: 12px; }
          th { background-color: #0f172a; color: #ffffff; font-weight: bold; border: 1px solid #cbd5e1; padding: 8px; text-align: center; font-size: 11px; }
          td { border: 1px solid #cbd5e1; padding: 6px; font-size: 11px; }
          .total-row { background-color: #f1f5f9; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header-title">${title}</div>
        <div class="header-meta">${periodStr}</div>
        <div class="header-meta">${filterStr}</div>
        <table>
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Plat Kendaraan</th>
              <th>Model / Tipe</th>
              <th>Pengemudi</th>
              <th>Jenis BBM</th>
              <th>KM Awal</th>
              <th>KM Akhir</th>
              <th>Jarak Tempuh</th>
              <th>Volume (Liter)</th>
              <th>Harga / Liter</th>
              <th>Total Biaya</th>
              <th>Efisiensi</th>
              <th>Kategori Efisiensi</th>
              <th>Status Audit</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
            <tr class="total-row">
              <td colspan="7" style="text-align: right;">TOTAL REKAPITULASI:</td>
              <td style="text-align: right;">${totalKm.toLocaleString('id-ID')} KM</td>
              <td style="text-align: right;">${totalLiters.toLocaleString('id-ID')} L</td>
              <td></td>
              <td style="text-align: right;">Rp ${totalCost.toLocaleString('id-ID')}</td>
              <td style="text-align: center;">${avgKmPerLiter} KM/L</td>
              <td colspan="2"></td>
            </tr>
          </tbody>
        </table>
      </body>
      </html>
    `

    const blob = new Blob(['\uFEFF' + excelHTML], { type: 'application/vnd.ms-excel;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `REKAP_OPERASIONAL_BBM_${selectedVehicle.replace(/\s+/g, '')}_${new Date().toISOString().split('T')[0]}.xls`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans text-slate-800">
      
      {/* SIDEBAR NAVIGATION KIRI */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static flex flex-col justify-between ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div>
          {/* Logo & Header Sidebar */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-amber-500 text-slate-900 rounded-xl flex items-center justify-center font-bold text-lg shadow-md">
                ⛽
              </div>
              <div>
                <h2 className="text-sm font-bold text-white tracking-wide">PEMANTAU BBM</h2>
                <span className="text-[10px] text-amber-400 font-semibold tracking-wider uppercase">Enterprise Edition</span>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
              ✕
            </button>
          </div>

          {/* Menu Items */}
          <nav className="p-4 space-y-1">
            <button
              onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${activeTab === 'dashboard' ? 'bg-amber-500 text-slate-950 shadow-md font-bold' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}
            >
              <span className="text-base">📊</span> Dashboard Utama
            </button>

            <button
              onClick={() => { setActiveTab('maintenance'); setSidebarOpen(false); }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${activeTab === 'maintenance' ? 'bg-amber-500 text-slate-950 shadow-md font-bold' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-base">🔧</span> Jadwal Servis Armada
              </div>
              {criticalServiceCount > 0 && (
                <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {criticalServiceCount}
                </span>
              )}
            </button>

            <Link
              href="/admin/settings"
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition"
            >
              <span className="text-base">⚙️</span> Master Data & BBM
            </Link>

            <Link
              href="/admin/backup"
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition"
            >
              <span className="text-base">💾</span> Pusat Backup (.JSON)
            </Link>
          </nav>
        </div>

        {/* Footer Sidebar */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          <button
            onClick={() => setShowResetModal(true)}
            className="w-full bg-rose-900/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 py-2 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2"
          >
            ⚠️ Reset Cache
          </button>
          <div className="text-[10px] text-slate-500 text-center">
            Dev by <span className="font-bold text-slate-400">Urai Ikhsan Fadhilah</span>
          </div>
        </div>
      </aside>

      {/* KONTEN UTAMA */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* TOP BAR / HEADER */}
        <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3.5 flex justify-between items-center sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-700 text-xl p-1">
              ☰
            </button>
            <h1 className="text-base sm:text-lg font-bold text-slate-900">
              {activeTab === 'dashboard' ? 'Monitoring Operasional BBM' : 'Jadwal Servis & Maintenance Armada'}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportToExcel}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export Excel (.XLS)
            </button>
          </div>
        </header>

        {/* MAIN BODY CONTENT */}
        <main className="p-4 sm:p-6 space-y-6 overflow-y-auto">
          
          {/* BANNER PERINGATAN ANOMALI */}
          {(pendingCount > 0 || highConsumptionLogs.length > 0 || criticalServiceCount > 0) && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚠️</span>
                <div className="text-xs text-amber-900">
                  <span className="font-bold">Sistem Perhatian Operasional:</span>
                  <span className="block mt-0.5">
                    Terdapat <strong className="underline">{pendingCount} laporan baru</strong> butuh verifikasi, <strong className="text-rose-700 underline">{highConsumptionLogs.length} transaksi boros (&lt; 8 KM/L)</strong>, serta <strong className="text-rose-700 underline">{criticalServiceCount} armada wajib servis segera</strong>.
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'dashboard' ? (
            <>
              {/* KARTU METRIK VISUAL GRADASI BERWARNA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Biaya */}
                <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-5 rounded-2xl text-white shadow-lg shadow-indigo-200/50">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold text-indigo-100">Total Biaya Operasional</span>
                    <span className="text-xl">💰</span>
                  </div>
                  <div className="text-2xl font-bold font-mono mt-2">
                    Rp {(Number(totalCost) || 0).toLocaleString('id-ID')}
                  </div>
                  <span className="text-[10px] text-indigo-200 mt-1 block">Real-Time Transaksi BBM</span>
                </div>

                {/* Efisiensi Armada */}
                <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-5 rounded-2xl text-white shadow-lg shadow-emerald-200/50">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold text-emerald-100">Rata-Rata Efisiensi</span>
                    <span className="text-xl">⚡</span>
                  </div>
                  <div className="text-2xl font-bold font-mono mt-2">
                    {avgKmPerLiter} <span className="text-xs font-sans font-normal text-emerald-100">KM/L</span>
                  </div>
                  <span className="text-[10px] text-emerald-200 mt-1 block">Rasio Konsumsi Keseluruhan</span>
                </div>

                {/* Total Konsumsi */}
                <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-5 rounded-2xl text-white shadow-lg shadow-amber-200/50">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold text-amber-100">Total Konsumsi BBM</span>
                    <span className="text-xl">🛢️</span>
                  </div>
                  <div className="text-2xl font-bold font-mono mt-2">
                    {(Number(totalLiters) || 0).toLocaleString('id-ID')} <span className="text-xs font-sans font-normal text-amber-100">Liter</span>
                  </div>
                  <span className="text-[10px] text-amber-200 mt-1 block">Volume BBM Terdistribusi</span>
                </div>

                {/* Total Laporan */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-5 rounded-2xl text-white shadow-lg shadow-slate-300/50">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold text-slate-300">Total Laporan Pengisian</span>
                    <span className="text-xl">📋</span>
                  </div>
                  <div className="text-2xl font-bold font-mono mt-2">
                    {filteredLogs.length} <span className="text-xs font-sans font-normal text-slate-400">Laporan</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">Audit & Verifikasi Berkas</span>
                </div>
              </div>

              {/* PAGU ANGGARAN BULANAN */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
                <h2 className="text-xs font-bold text-slate-900 tracking-wider uppercase">Pagu Anggaran Bulanan Per Kendaraan</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {vehicleStats.map((v) => (
                    <div key={v.plate_number} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 hover:shadow-md transition">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-bold text-xs text-slate-900">{v.plate_number}</div>
                          <div className="text-[11px] text-slate-500">{v.model}</div>
                        </div>
                        {v.isOverBudget ? (
                          <span className="bg-rose-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm">
                            Exceeded
                          </span>
                        ) : (
                          <span className="bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm">
                            Normal
                          </span>
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-slate-500 font-sans">Realisasi:</span>
                          <span className={v.isOverBudget ? 'text-rose-600 font-bold' : 'text-slate-900 font-semibold'}>
                            Rp {(Number(v.spentCost) || 0).toLocaleString('id-ID')}
                          </span>
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                          <span className="font-sans">Pagu Mandiri:</span>
                          <span>Rp {(Number(v.monthly_budget) || 0).toLocaleString('id-ID')}</span>
                        </div>

                        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden mt-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${
                              v.isOverBudget ? 'bg-rose-600' : 'bg-slate-900'
                            }`}
                            style={{ width: `${v.usagePercent}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs">
                        <span className="text-slate-500">Efisiensi Rata-Rata:</span>
                        {renderEfficiencyBadge(v.efficiency)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* TABEL REKAPITULASI AUDIT LOGS */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
                  <h2 className="text-xs font-bold text-slate-900 tracking-wider uppercase">Rincian Transaksi Pengisian</h2>
                  
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <div className="flex items-center gap-1 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                      <span className="text-slate-500 font-medium">Dari:</span>
                      <input
                        type="date"
                        className="bg-transparent font-medium text-slate-800 outline-none"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                      <span className="text-slate-500 font-medium">s/d</span>
                      <input
                        type="date"
                        className="bg-transparent font-medium text-slate-800 outline-none"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                      {(startDate || endDate) && (
                        <button
                          onClick={() => {
                            setStartDate('')
                            setEndDate('')
                          }}
                          className="text-slate-400 hover:text-slate-700 ml-1 font-bold"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    <select
                      className="text-xs border border-slate-300 rounded-xl p-2 bg-white font-medium text-slate-700 outline-none"
                      value={selectedVehicle}
                      onChange={(e) => setSelectedVehicle(e.target.value)}
                    >
                      <option value="ALL">Semua Armada</option>
                      {safeVehicles.map((v) => (
                        <option key={v.plate_number} value={v.plate_number}>
                          {v.plate_number} - {v.model}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3.5">Tanggal</th>
                        <th className="p-3.5">Kendaraan</th>
                        <th className="p-3.5">Pengemudi</th>
                        <th className="p-3.5">Jenis BBM</th>
                        <th className="p-3.5">KM Odometer</th>
                        <th className="p-3.5">Volume</th>
                        <th className="p-3.5">Efisiensi</th>
                        <th className="p-3.5">Audit Struk</th>
                        <th className="p-3.5">Status Admin</th>
                        <th className="p-3.5 text-right">Total Biaya</th>
                        <th className="p-3.5 text-center">Aksi Verifikasi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedAdminLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/80 transition">
                          <td className="p-3.5 font-medium whitespace-nowrap">{log.date}</td>
                          <td className="p-3.5 font-bold text-slate-900 whitespace-nowrap">{log.plate_number}</td>
                          <td className="p-3.5 whitespace-nowrap">{log.driver_name}</td>
                          <td className="p-3.5 whitespace-nowrap">
                            <span className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg font-medium text-[11px]">
                              {log.fuel_type}
                            </span>
                          </td>
                          <td className="p-3.5 font-mono whitespace-nowrap">
                            {(Number(log.initial_km) || 0).toLocaleString('id-ID')} → {(Number(log.final_km) || 0).toLocaleString('id-ID')} ({log.distance_km || 0} KM)
                          </td>
                          <td className="p-3.5 font-mono whitespace-nowrap">{log.liters || 0} L</td>
                          <td className="p-3.5 font-mono whitespace-nowrap">
                            {renderEfficiencyBadge(log.km_per_liter)}
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            {log.receipt_image ? (
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => setPreviewReceipt(log)}
                                  className="text-[11px] text-blue-600 hover:text-blue-800 font-bold underline"
                                >
                                  Lihat
                                </button>
                                <button
                                  onClick={() => handleDownloadReceipt(log.receipt_image, log.plate_number, log.date, log.final_km)}
                                  className="text-[10px] text-slate-700 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded border border-slate-200 font-mono"
                                  title="Unduh Struk"
                                >
                                  📥
                                </button>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[11px]">-</span>
                            )}
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            {renderStatusBadge(log.status)}
                          </td>
                          <td className="p-3.5 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                            Rp {(Number(log.total_cost) || 0).toLocaleString('id-ID')}
                          </td>
                          <td className="p-3.5 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              {log.status !== 'VERIFIED' && (
                                <button
                                  onClick={() => handleUpdateStatus(log.id, 'VERIFIED')}
                                  className="text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2 py-1 rounded-lg shadow-sm"
                                  title="Setujui Laporan"
                                >
                                  ✓ Verifikasi
                                </button>
                              )}
                              {log.status !== 'FLAGGED' && (
                                <button
                                  onClick={() => handleUpdateStatus(log.id, 'FLAGGED')}
                                  className="text-[10px] bg-amber-600 hover:bg-amber-700 text-white font-bold px-2 py-1 rounded-lg shadow-sm"
                                  title="Tandai Anomali"
                                >
                                  ⚠ Anomali
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteLog(log.id)}
                                className="text-[10px] text-rose-600 hover:text-rose-800 font-bold px-1.5 py-1 bg-rose-50 rounded-lg"
                                title="Hapus Permanent"
                              >
                                ✕
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-3.5 border-t border-slate-100 bg-slate-50 flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-mono text-[11px]">
                    Menampilkan {filteredLogs.length > 0 ? (adminPage - 1) * logsPerPage + 1 : 0} - {Math.min(adminPage * logsPerPage, filteredLogs.length)} dari {filteredLogs.length} transaksi
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      disabled={adminPage === 1}
                      onClick={() => setAdminPage((prev) => prev - 1)}
                      className="px-3 py-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 rounded-lg font-medium transition shadow-sm"
                    >
                      ← Prev
                    </button>
                    <span className="font-mono text-[11px] text-slate-700 px-2 font-bold">
                      {adminPage} / {totalAdminPages}
                    </span>
                    <button
                      disabled={adminPage === totalAdminPages || totalAdminPages === 0}
                      onClick={() => setAdminPage((prev) => prev + 1)}
                      className="px-3 py-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 rounded-lg font-medium transition shadow-sm"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* TAB MODUL JADWAL SERVIS & MAINTENANCE ARMADA */
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                <h2 className="text-sm font-bold text-slate-900">Modul Pengawas Servis & Ganti Oli Otomatis</h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Sistem menghitung posisi Odometer terkini dari laporan driver untuk mendeteksi batas ganti oli berkala (Kelipatan 5.000 KM) dan servis umum (Kelipatan 10.000 KM).
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {vehicleStats.map((v) => (
                  <div key={v.plate_number} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex justify-between items-start border-b pb-3">
                      <div>
                        <div className="font-bold text-sm text-slate-900">{v.plate_number}</div>
                        <div className="text-xs text-slate-500">{v.model}</div>
                      </div>
                      {v.maintenance.status === 'CRITICAL' ? (
                        <span className="bg-rose-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full animate-pulse shadow-sm">
                          🚨 WAJIB SERVIS SEGERA
                        </span>
                      ) : v.maintenance.status === 'WARNING' ? (
                        <span className="bg-amber-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                          ⚠️ MENDEKATI SERVIS
                        </span>
                      ) : (
                        <span className="bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                          ✓ PRIMA
                        </span>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Odometer Terkini:</span>
                        <span className="font-mono font-bold text-slate-900">{v.last_km.toLocaleString('id-ID')} KM</span>
                      </div>

                      {/* Info Ganti Oli */}
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                        <div className="flex justify-between text-[11px] font-semibold text-slate-700">
                          <span>🛢️ Target Ganti Oli:</span>
                          <span className="font-mono">{v.maintenance.nextOilKm.toLocaleString('id-ID')} KM</span>
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                          <span>Sisa Jarak:</span>
                          <span className={v.maintenance.remainingOilKm <= 300 ? 'text-rose-600 font-bold' : 'text-slate-800'}>
                            {v.maintenance.remainingOilKm.toLocaleString('id-ID')} KM Lagi
                          </span>
                        </div>
                      </div>

                      {/* Info Servis Berkala */}
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                        <div className="flex justify-between text-[11px] font-semibold text-slate-700">
                          <span>🔧 Target Servis Berkala:</span>
                          <span className="font-mono">{v.maintenance.nextServiceKm.toLocaleString('id-ID')} KM</span>
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                          <span>Sisa Jarak:</span>
                          <span className={v.maintenance.remainingServiceKm <= 300 ? 'text-rose-600 font-bold' : 'text-slate-800'}>
                            {v.maintenance.remainingServiceKm.toLocaleString('id-ID')} KM Lagi
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>
      </div>

      {/* MODAL PREVIEW STRUK */}
      {previewReceipt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-5 space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <div>
                <h3 className="text-xs font-bold text-slate-900">Verifikasi Audit Struk BBM</h3>
                <p className="text-[11px] text-slate-500">{previewReceipt.plate_number} • {previewReceipt.date} • {previewReceipt.driver_name}</p>
              </div>
              <button
                onClick={() => setPreviewReceipt(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <div className="max-h-[55vh] overflow-y-auto rounded-xl border bg-slate-50 flex items-center justify-center p-2">
              <img src={previewReceipt.receipt_image} alt="Foto Struk BBM" className="max-w-full h-auto rounded-lg" />
            </div>

            <div className="space-y-2 pt-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Status Saat Ini:</span>
                {renderStatusBadge(previewReceipt.status)}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleUpdateStatus(previewReceipt.id, 'VERIFIED')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 rounded-xl transition shadow-sm"
                >
                  ✓ Setujui (Verified)
                </button>
                <button
                  onClick={() => handleUpdateStatus(previewReceipt.id, 'FLAGGED')}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold py-2.5 rounded-xl transition shadow-sm"
                >
                  ⚠ Tandai Anomali
                </button>
              </div>

              <button
                onClick={() => handleDownloadReceipt(previewReceipt.receipt_image, previewReceipt.plate_number, previewReceipt.date, previewReceipt.final_km)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold py-2.5 rounded-xl border border-slate-200 transition"
              >
                📥 Unduh Berkas Struk
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL RESET CACHE BER-PIN */}
      {showResetModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 text-left">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 space-y-4">
            <div className="text-center space-y-1">
              <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center mx-auto text-lg font-bold">
                ⚠️
              </div>
              <h3 className="text-sm font-bold text-slate-900">Konfirmasi Reset Cache</h3>
              <p className="text-xs text-rose-600 font-medium leading-relaxed">
                PERINGATAN: Tindakan ini akan MENGHAPUS SELURUH riwayat transaksi lokal di browser ini!
              </p>
            </div>

            <form onSubmit={handleConfirmResetCache} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1 text-center">Masukkan PIN Admin untuk Konfirmasi</label>
                <input
                  type="password"
                  maxLength={4}
                  placeholder="••••"
                  className="w-full text-center text-lg tracking-widest py-2 border rounded-xl border-slate-300 focus:ring-2 focus:ring-slate-900 outline-none font-mono font-bold"
                  value={resetPinInput}
                  onChange={(e) => setResetPinInput(e.target.value)}
                />
                {resetPinError && (
                  <p className="text-[11px] text-rose-600 text-center font-medium mt-1">PIN Salah!</p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowResetModal(false)
                    setResetPinInput('')
                    setResetPinError(false)
                  }}
                  className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2.5 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold py-2.5 rounded-xl shadow-sm"
                >
                  Ya, Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}