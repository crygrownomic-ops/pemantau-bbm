'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const DEFAULT_VEHICLES = [
  { id: '1', plate_number: 'B 1234 ABC', model: 'Toyota Avanza', monthly_budget: 1500000 },
  { id: '2', plate_number: 'B 5678 XYZ', model: 'Daihatsu Gran Max', monthly_budget: 2000000 },
  { id: '3', plate_number: 'B 9012 DEF', model: 'Isuzu Traga', monthly_budget: 2500000 },
]

const DEFAULT_LOGS = [
  { id: 1, plate_number: 'B 1234 ABC', vehicle_model: 'Toyota Avanza', driver_name: 'Budi', initial_km: 44580, final_km: 45000, distance_km: 420, liters: 35, unit_price: 10000, km_per_liter: 12.0, total_cost: 350000, fuel_type: 'Pertalite', date: '2026-08-18', status: 'VERIFIED' },
  { id: 2, plate_number: 'B 5678 XYZ', vehicle_model: 'Daihatsu Gran Max', driver_name: 'Ahmad', initial_km: 31700, final_km: 32000, distance_km: 300, liters: 40, unit_price: 6800, km_per_liter: 7.5, total_cost: 1850000, fuel_type: 'Biosolar / Solar', date: '2026-08-19', status: 'FLAGGED' },
  { id: 3, plate_number: 'B 9012 DEF', vehicle_model: 'Isuzu Traga', driver_name: 'Dede', initial_km: 17950, final_km: 18500, distance_km: 550, liters: 50, unit_price: 14550, km_per_liter: 11.0, total_cost: 2700000, fuel_type: 'Dexlite', date: '2026-08-20', status: 'VERIFIED' },
  { id: 4, plate_number: 'B 1234 ABC', vehicle_model: 'Toyota Avanza', driver_name: 'Budi', initial_km: 45000, final_km: 45380, distance_km: 380, liters: 30, unit_price: 12950, km_per_liter: 12.67, total_cost: 300000, fuel_type: 'Pertamax', date: '2026-08-20', status: 'PENDING' },
]

function sanitizeVehicles(data: any) {
  if (!Array.isArray(data) || data.length === 0) return DEFAULT_VEHICLES
  return data.map((v, idx) => ({
    id: v?.id ? String(v.id) : String(idx + 1),
    plate_number: String(v?.plate_number || 'ARMADA').toUpperCase(),
    model: String(v?.model || 'Kendaraan'),
    monthly_budget: Number(v?.monthly_budget) || 0,
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

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState(false)
  const [vehicles, setVehicles] = useState(DEFAULT_VEHICLES)
  const [logs, setLogs] = useState<any[]>(DEFAULT_LOGS)

  const [selectedVehicle, setSelectedVehicle] = useState('ALL')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [previewReceipt, setPreviewReceipt] = useState<any | null>(null)

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
        <span className="bg-rose-100 text-rose-700 font-bold px-2 py-0.5 rounded text-[10px] inline-flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
          {val} KM/L (Boros)
        </span>
      )
    } else if (val < 12) {
      return (
        <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded text-[10px] inline-flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
          {val} KM/L (Normal)
        </span>
      )
    } else {
      return (
        <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px] inline-flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
          {val} KM/L (Irit)
        </span>
      )
    }
  }

  const renderStatusBadge = (status?: string) => {
    if (status === 'VERIFIED') {
      return <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">VERIFIED</span>
    } else if (status === 'FLAGGED') {
      return <span className="bg-rose-100 text-rose-700 font-bold px-2 py-0.5 rounded text-[10px]">ANOMALI</span>
    } else {
      return <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded text-[10px]">PENDING</span>
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-800">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 max-w-sm w-full space-y-5 text-center">
          <div className="w-10 h-10 bg-slate-100 border border-slate-200 text-slate-700 rounded-lg flex items-center justify-center mx-auto">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900">Dashboard Administrator</h1>
            <p className="text-xs text-slate-500 mt-0.5">Masukkan PIN keamanan</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="password"
              maxLength={4}
              placeholder="••••"
              className="w-full text-center text-xl tracking-widest py-2.5 border rounded-lg border-slate-300 focus:ring-2 focus:ring-slate-900 outline-none font-mono font-bold"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
            />

            {pinError && (
              <p className="text-xs text-rose-600 font-medium">PIN tidak valid (Default: 1234)</p>
            )}

            <button
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 rounded-lg text-xs transition"
            >
              Masuk Dashboard
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

        {showResetModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 text-left">
            <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 space-y-4">
              <div className="text-center space-y-1">
                <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center mx-auto text-lg">
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
                    className="w-full text-center text-lg tracking-widest py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-slate-900 outline-none font-mono font-bold"
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
                    className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 rounded-lg"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold py-2 rounded-lg"
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

  const safeLogs = Array.isArray(logs) ? logs : []
  const safeVehicles = Array.isArray(vehicles) ? vehicles : []

  const filteredLogs = safeLogs.filter((log) => {
    const matchVehicle = selectedVehicle === 'ALL' || log.plate_number === selectedVehicle
    const matchStart = !startDate || log.date >= startDate
    const matchEnd = !endDate || log.date <= endDate
    return matchVehicle && matchStart && matchEnd
  })

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

    return { ...v, spentCost, efficiency: Number(efficiency), usagePercent, isOverBudget, monthly_budget: budget }
  })

  // FUNGSI EKSPOR EXCEL NATIVE BERKOLOM & BERSAMBUNG RAPI
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
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans text-slate-800">
      <div className="max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-6">
        
        {/* Header Navigation */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-5 rounded-xl border border-slate-200 gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Monitoring Operasional BBM</h1>
            <p className="text-xs text-slate-500 mt-0.5">Pengawasan efisiensi konsumsi & rekapitulasi pagu anggaran</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowResetModal(true)}
              className="text-xs font-medium bg-rose-50 hover:bg-rose-100 text-rose-700 px-3 py-2 rounded-lg border border-rose-200 transition"
              title="Reset data jika cache rusak"
            >
              Reset Cache
            </button>
            <Link
              href="/admin/backup"
              className="text-xs font-medium bg-slate-900 hover:bg-slate-800 text-white px-3 py-2 rounded-lg transition"
            >
              💾 Pusat Backup
            </Link>
            <Link
              href="/admin/settings"
              className="text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 px-3 py-2 rounded-lg border border-slate-200 transition flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Master Data
            </Link>
            <button
              onClick={exportToExcel}
              className="text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-lg transition flex items-center gap-1.5 shadow-sm"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export Excel (.XLS)
            </button>
          </div>
        </div>

        {/* Banner Peringatan Anomali */}
        {(pendingCount > 0 || highConsumptionLogs.length > 0) && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xl">⚠️</span>
              <div className="text-xs text-amber-900">
                <span className="font-bold">Sistem Perhatian Audit Operasional:</span>
                <span className="block mt-0.5">
                  Terdapat <strong className="underline">{pendingCount} laporan baru</strong> butuh verifikasi struk, serta <strong className="text-rose-700 underline">{highConsumptionLogs.length} transaksi terindikasi boros (&lt; 8 KM/L)</strong>.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Metrik */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200">
            <span className="text-xs font-medium text-slate-500">Total Biaya Operasional</span>
            <div className="text-xl font-bold font-mono text-slate-900 mt-1">
              Rp {(Number(totalCost) || 0).toLocaleString('id-ID')}
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200">
            <span className="text-xs font-medium text-slate-500">Rata-Rata Efisiensi Armada</span>
            <div className="text-xl font-bold font-mono text-slate-900 mt-1">
              {avgKmPerLiter} <span className="text-xs font-sans font-normal text-slate-500">KM/L</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200">
            <span className="text-xs font-medium text-slate-500">Total Konsumsi BBM</span>
            <div className="text-xl font-bold font-mono text-slate-900 mt-1">
              {(Number(totalLiters) || 0).toLocaleString('id-ID')} <span className="text-xs font-sans font-normal text-slate-500">Liter</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200">
            <span className="text-xs font-medium text-slate-500">Total Transaksi Pengisian</span>
            <div className="text-xl font-bold font-mono text-slate-900 mt-1">
              {filteredLogs.length} <span className="text-xs font-sans font-normal text-slate-500">Laporan</span>
            </div>
          </div>
        </div>

        {/* Pagu Anggaran */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
          <h2 className="text-xs font-bold text-slate-900 tracking-wider uppercase">Pagu Anggaran Bulanan Per Kendaraan</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {vehicleStats.map((v) => (
              <div key={v.plate_number} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-xs text-slate-900">{v.plate_number}</div>
                    <div className="text-[11px] text-slate-500">{v.model}</div>
                  </div>
                  {v.isOverBudget ? (
                    <span className="bg-rose-100 text-rose-700 text-[10px] font-semibold px-2 py-0.5 rounded">
                      Exceeded
                    </span>
                  ) : (
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-semibold px-2 py-0.5 rounded">
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

                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden mt-2">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-500 ${
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

        {/* Tabel Rekapitulasi */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
            <h2 className="text-xs font-bold text-slate-900 tracking-wider uppercase">Rincian Transaksi Pengisian</h2>
            
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="flex items-center gap-1 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
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
                className="text-xs border border-slate-300 rounded-lg p-2 bg-white font-medium text-slate-700 outline-none"
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
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 font-medium whitespace-nowrap">{log.date}</td>
                    <td className="p-3.5 font-bold text-slate-900 whitespace-nowrap">{log.plate_number}</td>
                    <td className="p-3.5 whitespace-nowrap">{log.driver_name}</td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-medium text-[11px]">
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
                            className="text-[10px] text-slate-700 bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 rounded border border-slate-200 font-mono"
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
                            className="text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2 py-1 rounded"
                            title="Setujui Laporan"
                          >
                            ✓ Verifikasi
                          </button>
                        )}
                        {log.status !== 'FLAGGED' && (
                          <button
                            onClick={() => handleUpdateStatus(log.id, 'FLAGGED')}
                            className="text-[10px] bg-amber-600 hover:bg-amber-700 text-white font-bold px-2 py-1 rounded"
                            title="Tandai Anomali"
                          >
                            ⚠ Anomali
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteLog(log.id)}
                          className="text-[10px] text-rose-600 hover:text-rose-800 font-bold px-1.5 py-1 bg-rose-50 rounded"
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
        </div>

      </div>

      {/* Modal Preview Struk */}
      {previewReceipt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-4 space-y-4">
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
            <div className="max-h-[55vh] overflow-y-auto rounded-lg border bg-slate-50 flex items-center justify-center p-2">
              <img src={previewReceipt.receipt_image} alt="Foto Struk BBM" className="max-w-full h-auto rounded" />
            </div>

            <div className="space-y-2 pt-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Status Saat Ini:</span>
                {renderStatusBadge(previewReceipt.status)}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleUpdateStatus(previewReceipt.id, 'VERIFIED')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 rounded-lg transition"
                >
                  ✓ Setujui (Verified)
                </button>
                <button
                  onClick={() => handleUpdateStatus(previewReceipt.id, 'FLAGGED')}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold py-2 rounded-lg transition"
                >
                  ⚠ Tandai Anomali
                </button>
              </div>

              <button
                onClick={() => handleDownloadReceipt(previewReceipt.receipt_image, previewReceipt.plate_number, previewReceipt.date, previewReceipt.final_km)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold py-2 rounded-lg border border-slate-200 transition"
              >
                📥 Unduh Berkas Struk
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Proteksi Reset Cache */}
      {showResetModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 text-left">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 space-y-4">
            <div className="text-center space-y-1">
              <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center mx-auto text-lg">
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
                  className="w-full text-center text-lg tracking-widest py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-slate-900 outline-none font-mono font-bold"
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
                  className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold py-2 rounded-lg"
                >
                  Ya, Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <footer className="py-4 text-center border-t border-slate-200 bg-white text-[11px] text-slate-500 font-medium mt-8">
        Developed by <span className="font-bold text-slate-800">Urai Ikhsan Fadhilah</span>
      </footer>
    </div>
  )
}