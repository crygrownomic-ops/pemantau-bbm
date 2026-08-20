'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const DEFAULT_VEHICLES = [
  { id: '1', plate_number: 'B 1234 ABC', model: 'Toyota Avanza', monthly_budget: 1500000 },
  { id: '2', plate_number: 'B 5678 XYZ', model: 'Daihatsu Gran Max', monthly_budget: 2000000 },
  { id: '3', plate_number: 'B 9012 DEF', model: 'Isuzu Traga', monthly_budget: 2500000 },
]

const MOCK_LOGS = [
  { id: 1, plate_number: 'B 1234 ABC', driver_name: 'Budi', distance_km: 420, liters: 35, km_per_liter: 12.0, total_cost: 350000, fuel_type: 'Pertalite', date: '2026-08-18' },
  { id: 2, plate_number: 'B 5678 XYZ', driver_name: 'Ahmad', distance_km: 300, liters: 40, km_per_liter: 7.5, total_cost: 1850000, fuel_type: 'Biosolar / Solar', date: '2026-08-19' },
  { id: 3, plate_number: 'B 9012 DEF', driver_name: 'Dede', distance_km: 550, liters: 50, km_per_liter: 11.0, total_cost: 2700000, fuel_type: 'Dexlite', date: '2026-08-20' },
  { id: 4, plate_number: 'B 1234 ABC', driver_name: 'Budi', distance_km: 380, liters: 30, km_per_liter: 12.67, total_cost: 300000, fuel_type: 'Pertamax', date: '2026-08-20' },
]

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState(false)
  const [vehicles, setVehicles] = useState(DEFAULT_VEHICLES)
  const [selectedVehicle, setSelectedVehicle] = useState('ALL')

  useEffect(() => {
    const storedVehicles = localStorage.getItem('vehicle_budgets')
    if (storedVehicles) setVehicles(JSON.parse(storedVehicles))
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

  const filteredLogs = selectedVehicle === 'ALL'
    ? MOCK_LOGS
    : MOCK_LOGS.filter((log) => log.plate_number === selectedVehicle)

  const totalCost = filteredLogs.reduce((acc, l) => acc + l.total_cost, 0)
  const totalLiters = filteredLogs.reduce((acc, l) => acc + l.liters, 0)
  const totalKm = filteredLogs.reduce((acc, l) => acc + l.distance_km, 0)
  const avgKmPerLiter = totalLiters > 0 ? (totalKm / totalLiters).toFixed(2) : '0'

  const vehicleStats = vehicles.map((v) => {
    const logs = MOCK_LOGS.filter((l) => l.plate_number === v.plate_number)
    const spentCost = logs.reduce((acc, l) => acc + l.total_cost, 0)
    const km = logs.reduce((acc, l) => acc + l.distance_km, 0)
    const liters = logs.reduce((acc, l) => acc + l.liters, 0)
    const efficiency = liters > 0 ? (km / liters).toFixed(1) : '0'
    const usagePercent = Math.min(Math.round((spentCost / (v.monthly_budget || 1)) * 100), 100)
    const isOverBudget = spentCost > v.monthly_budget

    return { ...v, spentCost, efficiency: Number(efficiency), usagePercent, isOverBudget }
  })

  const exportToCSV = () => {
    const headers = 'Tanggal,Kendaraan,Pengemudi,Jenis BBM,Volume (L),Jarak (KM),Efisiensi (KM/L),Total Biaya (Rp)\n'
    const rows = filteredLogs
      .map((l) => `${l.date},${l.plate_number},${l.driver_name},${l.fuel_type},${l.liters},${l.distance_km},${l.km_per_liter},${l.total_cost}`)
      .join('\n')
    
    const blob = new Blob([headers + rows], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rekap-bbm.csv`
    a.click()
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
            <p className="text-xs text-slate-500 mt-0.5">Masukkan PIN keamanan untuk melihat data operasional</p>
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

          <Link href="/" className="inline-block text-xs text-slate-500 hover:text-slate-800 font-medium transition pt-1">
            ← Form Driver
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 font-sans text-slate-800">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header Dashboard */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-5 rounded-xl border border-slate-200 gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Monitoring Operasional BBM</h1>
            <p className="text-xs text-slate-500 mt-0.5">Pengawasan efisiensi konsumsi dan rekapitulasi pagu anggaran</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/settings"
              className="text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 px-3 py-2 rounded-lg border border-slate-200 transition flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Pengaturan Tarif & Pagu
            </Link>
            <button
              onClick={exportToCSV}
              className="text-xs font-medium bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-3 py-2 rounded-lg border border-emerald-200 transition flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export CSV
            </button>
            <Link
              href="/"
              className="text-xs font-medium bg-slate-900 hover:bg-slate-800 text-white px-3 py-2 rounded-lg transition"
            >
              Form Driver
            </Link>
          </div>
        </div>

        {/* Ringkasan Metrik */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200">
            <span className="text-xs font-medium text-slate-500">Total Biaya Operasional</span>
            <div className="text-xl font-bold font-mono text-slate-900 mt-1">
              Rp {totalCost.toLocaleString('id-ID')}
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
              {totalLiters.toLocaleString('id-ID')} <span className="text-xs font-sans font-normal text-slate-500">Liter</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200">
            <span className="text-xs font-medium text-slate-500">Total Transaksi Pengisian</span>
            <div className="text-xl font-bold font-mono text-slate-900 mt-1">
              {filteredLogs.length} <span className="text-xs font-sans font-normal text-slate-500">Laporan</span>
            </div>
          </div>
        </div>

        {/* Pemantauan Budget Operasional Mandiri */}
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
                      Rp {v.spentCost.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                    <span className="font-sans">Pagu Mandiri:</span>
                    <span>Rp {v.monthly_budget.toLocaleString('id-ID')}</span>
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
                  <span className="text-slate-500">Efisiensi:</span>
                  <span className="font-mono font-bold text-slate-800">{v.efficiency} KM/L</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabel Rekapitulasi */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h2 className="text-xs font-bold text-slate-900 tracking-wider uppercase">Rincian Transaksi Pengisian</h2>
            
            <select
              className="text-xs border border-slate-300 rounded-lg p-2 bg-white font-medium text-slate-700 outline-none"
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
            >
              <option value="ALL">Semua Armada</option>
              {vehicles.map((v) => (
                <option key={v.plate_number} value={v.plate_number}>
                  {v.plate_number} - {v.model}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Tanggal</th>
                  <th className="p-3.5">Kendaraan</th>
                  <th className="p-3.5">Pengemudi</th>
                  <th className="p-3.5">Jenis BBM</th>
                  <th className="p-3.5">Volume</th>
                  <th className="p-3.5">Jarak (KM)</th>
                  <th className="p-3.5">Efisiensi</th>
                  <th className="p-3.5 text-right">Total Biaya</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 font-medium">{log.date}</td>
                    <td className="p-3.5 font-bold text-slate-900">{log.plate_number}</td>
                    <td className="p-3.5">{log.driver_name}</td>
                    <td className="p-3.5">
                      <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-medium text-[11px]">
                        {log.fuel_type}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono">{log.liters} L</td>
                    <td className="p-3.5 font-mono">{log.distance_km} KM</td>
                    <td className="p-3.5 font-mono font-bold text-slate-800">{log.km_per_liter} KM/L</td>
                    <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                      Rp {log.total_cost.toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}