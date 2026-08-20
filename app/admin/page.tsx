'use client'

import { useState } from 'react'
import Link from 'next/link'

// Master Kendaraan dengan Pagu Anggaran Bulanan (Monthly Budget)
const MOCK_VEHICLES = [
  { id: '1', plate_number: 'B 1234 ABC', model: 'Toyota Avanza', monthly_budget: 1500000 },
  { id: '2', plate_number: 'B 5678 XYZ', model: 'Daihatsu Gran Max', monthly_budget: 2000000 },
  { id: '3', plate_number: 'B 9012 DEF', model: 'Isuzu Traga', monthly_budget: 2500000 },
]

const MOCK_LOGS = [
  {
    id: 1,
    plate_number: 'B 1234 ABC',
    model: 'Toyota Avanza',
    driver_name: 'Budi Santoso',
    distance_km: 420,
    liters: 35,
    km_per_liter: 12.0,
    total_cost: 350000,
    fuel_type: 'Pertalite',
    date: '2026-08-18',
  },
  {
    id: 2,
    plate_number: 'B 5678 XYZ',
    model: 'Daihatsu Gran Max',
    driver_name: 'Ahmad Supriadi',
    distance_km: 300,
    liters: 40,
    km_per_liter: 7.5,
    total_cost: 1850000,
    fuel_type: 'Biosolar / Solar',
    date: '2026-08-19',
  },
  {
    id: 3,
    plate_number: 'B 9012 DEF',
    model: 'Isuzu Traga',
    driver_name: 'Dede Kurnia',
    distance_km: 550,
    liters: 50,
    km_per_liter: 11.0,
    total_cost: 2700000,
    fuel_type: 'Dexlite',
    date: '2026-08-20',
  },
  {
    id: 4,
    plate_number: 'B 1234 ABC',
    model: 'Toyota Avanza',
    driver_name: 'Budi Santoso',
    distance_km: 380,
    liters: 30,
    km_per_liter: 12.67,
    total_cost: 300000,
    fuel_type: 'Pertamax',
    date: '2026-08-20',
  },
]

export default function AdminDashboard() {
  // Sistem Proteksi Akses Admin (PIN Default: 1234)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState(false)

  const [selectedVehicle, setSelectedVehicle] = useState<string>('ALL')

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (pinInput === '1234') {
      setIsAuthenticated(true)
      setPinError(false)
    } else {
      setPinError(true)
    }
  }

  // Filter Log
  const filteredLogs = selectedVehicle === 'ALL'
    ? MOCK_LOGS
    : MOCK_LOGS.filter((log) => log.plate_number === selectedVehicle)

  // Agregat Metrik
  const totalCost = filteredLogs.reduce((acc, item) => acc + item.total_cost, 0)
  const totalLiters = filteredLogs.reduce((acc, item) => acc + item.liters, 0)
  const totalKm = filteredLogs.reduce((acc, item) => acc + item.distance_km, 0)
  const avgKmPerLiter = totalLiters > 0 ? (totalKm / totalLiters).toFixed(2) : '0'

  // Perhitungan Anggaran & Efisiensi per Kendaraan
  const vehicleStats = MOCK_VEHICLES.map((v) => {
    const logs = MOCK_LOGS.filter((l) => l.plate_number === v.plate_number)
    const spentCost = logs.reduce((acc, l) => acc + l.total_cost, 0)
    const km = logs.reduce((acc, l) => acc + l.distance_km, 0)
    const liters = logs.reduce((acc, l) => acc + l.liters, 0)
    const efficiency = liters > 0 ? (km / liters).toFixed(1) : '0'
    const usagePercent = Math.min(Math.round((spentCost / v.monthly_budget) * 100), 100)
    const isOverBudget = spentCost > v.monthly_budget

    return {
      ...v,
      spentCost,
      efficiency: Number(efficiency),
      usagePercent,
      isOverBudget,
    }
  })

  // Export Data ke CSV
  const exportToCSV = () => {
    const headers = 'Tanggal,Kendaraan,Pengemudi,Jenis BBM,Volume (L),Jarak (KM),Efisiensi (KM/L),Total Biaya (Rp)\n'
    const rows = filteredLogs
      .map((l) => `${l.date},${l.plate_number},${l.driver_name},${l.fuel_type},${l.liters},${l.distance_km},${l.km_per_liter},${l.total_cost}`)
      .join('\n')
    
    const blob = new Blob([headers + rows], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rekap-bbm-${selectedVehicle.replace(/\s+/g, '')}.csv`
    a.click()
  }

  // Tampilan Login Modal PIN
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 max-w-sm w-full space-y-4 text-center">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
            🔒
          </div>
          <h1 className="text-lg font-bold text-gray-800">Akses Dashboard Admin</h1>
          <p className="text-xs text-gray-500">Masukkan PIN Keamanan untuk membuka dashboard</p>

          <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="password"
              maxLength={4}
              placeholder="PIN (Default: 1234)"
              className="w-full text-center text-lg tracking-widest p-2.5 border rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none font-bold"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
            />

            {pinError && (
              <p className="text-xs text-red-600 font-medium">PIN salah! Gunakan PIN: 1234</p>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg text-sm transition"
            >
              Masuk Dashboard
            </button>
          </form>

          <Link href="/" className="block text-xs text-gray-500 hover:underline pt-2">
            ← Kembali ke Form Driver
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header Dashboard */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-5 rounded-xl shadow-sm border border-gray-200 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Monitoring Operasional BBM</h1>
            <p className="text-xs text-gray-500 mt-1">Pengawasan efisiensi BBM dan kontrol pagu anggaran armada</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportToCSV}
              className="text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-3.5 py-2 rounded-lg border border-emerald-200 transition"
            >
              📥 Export CSV
            </button>
            <Link
              href="/"
              className="text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 px-3.5 py-2 rounded-lg transition"
            >
              ← Form Driver
            </Link>
          </div>
        </div>

        {/* Ringkasan Metrik */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <span className="text-xs font-semibold text-gray-500">Total Pengeluaran</span>
            <div className="text-2xl font-extrabold text-gray-900 mt-1">
              Rp {totalCost.toLocaleString('id-ID')}
            </div>
            <span className="text-[11px] text-gray-500">Total belanja BBM</span>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <span className="text-xs font-semibold text-gray-500">Rata-Rata Efisiensi Armada</span>
            <div className="text-2xl font-extrabold text-blue-600 mt-1">
              {avgKmPerLiter} <span className="text-xs font-normal text-gray-600">KM/L</span>
            </div>
            <span className="text-[11px] text-gray-500">Total Jarak: {totalKm} KM</span>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <span className="text-xs font-semibold text-gray-500">Total Volume BBM</span>
            <div className="text-2xl font-extrabold text-gray-900 mt-1">
              {totalLiters.toLocaleString('id-ID')} <span className="text-xs font-normal text-gray-600">Liter</span>
            </div>
            <span className="text-[11px] text-gray-500">Semua Jenis Bahan Bakar</span>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <span className="text-xs font-semibold text-gray-500">Total Transaksi</span>
            <div className="text-2xl font-extrabold text-gray-900 mt-1">
              {filteredLogs.length} <span className="text-xs font-normal text-gray-600">Pengisian</span>
            </div>
            <span className="text-[11px] text-gray-500">Laporan terverifikasi</span>
          </div>
        </div>

        {/* Pemantauan Budget Operasional per Kendaraan */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 space-y-4">
          <div className="flex justify-between items-center border-b border-gray-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-gray-800">Kontrol Anggaran Operasional Bulanan</h2>
              <p className="text-xs text-gray-500">Realisasi pengeluaran BBM terhadap batas pagu anggaran</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            {vehicleStats.map((v) => (
              <div key={v.plate_number} className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-sm text-gray-900">{v.plate_number}</div>
                    <div className="text-xs text-gray-500">{v.model}</div>
                  </div>
                  {v.isOverBudget ? (
                    <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Over Budget!
                    </span>
                  ) : (
                    <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Aman
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-gray-600">Realisasi:</span>
                    <span className={v.isOverBudget ? 'text-red-600 font-bold' : 'text-gray-900'}>
                      Rp {v.spentCost.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] text-gray-500">
                    <span>Pagu Anggaran:</span>
                    <span>Rp {v.monthly_budget.toLocaleString('id-ID')}</span>
                  </div>

                  {/* Progress Bar Anggaran */}
                  <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden mt-1">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-500 ${
                        v.isOverBudget ? 'bg-red-600' : v.usagePercent > 80 ? 'bg-amber-500' : 'bg-blue-600'
                      }`}
                      style={{ width: `${v.usagePercent}%` }}
                    ></div>
                  </div>
                  <div className="text-right text-[10px] font-medium text-gray-500 pt-0.5">
                    Terpakai {v.usagePercent}%
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-200 flex justify-between items-center text-xs">
                  <span className="text-gray-500">Efisiensi Rata-rata:</span>
                  <span className={`font-bold ${v.efficiency >= 10 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {v.efficiency} KM/L
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabel Rekap Transaksi */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h2 className="text-sm font-bold text-gray-800">Rincian Transaksi Pengisian BBM</h2>
            
            <select
              className="text-xs border border-gray-300 rounded-lg p-2 bg-white font-semibold text-gray-700 outline-none"
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
            >
              <option value="ALL">Semua Armada Kendaraan</option>
              {MOCK_VEHICLES.map((v) => (
                <option key={v.plate_number} value={v.plate_number}>
                  {v.plate_number} - {v.model}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600">
              <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200">
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
              <tbody className="divide-y divide-gray-100">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition">
                    <td className="p-3.5 whitespace-nowrap font-medium">{log.date}</td>
                    <td className="p-3.5 whitespace-nowrap font-bold text-gray-900">{log.plate_number}</td>
                    <td className="p-3.5 whitespace-nowrap">{log.driver_name}</td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium text-[11px]">
                        {log.fuel_type}
                      </span>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">{log.liters} L</td>
                    <td className="p-3.5 whitespace-nowrap">{log.distance_km} KM</td>
                    <td className="p-3.5 whitespace-nowrap font-bold text-blue-600">{log.km_per_liter} KM/L</td>
                    <td className="p-3.5 whitespace-nowrap text-right font-extrabold text-gray-900">
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