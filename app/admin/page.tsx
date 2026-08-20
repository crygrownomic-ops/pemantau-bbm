'use client'

import { useState } from 'react'
import Link from 'next/link'

// Data Tiruan Master Kendaraan & Log BBM
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
    total_cost: 520000,
    fuel_type: 'Solar',
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
    total_cost: 675000,
    fuel_type: 'Solar',
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
    fuel_type: 'Pertalite',
    date: '2026-08-20',
  },
]

export default function AdminDashboard() {
  const [selectedVehicle, setSelectedVehicle] = useState<string>('ALL')

  // Filter Data
  const filteredLogs = selectedVehicle === 'ALL'
    ? MOCK_LOGS
    : MOCK_LOGS.filter((log) => log.plate_number === selectedVehicle)

  // Kalkulasi Agregat
  const totalCost = filteredLogs.reduce((acc, item) => acc + item.total_cost, 0)
  const totalLiters = filteredLogs.reduce((acc, item) => acc + item.liters, 0)
  const totalKm = filteredLogs.reduce((acc, item) => acc + item.distance_km, 0)
  const avgKmPerLiter = totalLiters > 0 ? (totalKm / totalLiters).toFixed(2) : '0'

  // Agregasi per Kendaraan untuk Grafik/Statistik
  const vehicleStats = Array.from(new Set(MOCK_LOGS.map((l) => l.plate_number))).map((plate) => {
    const logs = MOCK_LOGS.filter((l) => l.plate_number === plate)
    const cost = logs.reduce((acc, l) => acc + l.total_cost, 0)
    const km = logs.reduce((acc, l) => acc + l.distance_km, 0)
    const liters = logs.reduce((acc, l) => acc + l.liters, 0)
    const efficiency = liters > 0 ? (km / liters).toFixed(1) : '0'
    return { plate, model: logs[0].model, cost, efficiency: Number(efficiency) }
  })

  // Mencari nilai biaya tertinggi untuk skala grafik
  const maxCost = Math.max(...vehicleStats.map((v) => v.cost), 1)

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header Navigasi */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-5 rounded-xl shadow-sm border border-gray-200 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Monitoring BBM</h1>
            <p className="text-xs text-gray-500 mt-1">Rekapitulasi efisiensi dan pengeluaran armada kendaraan</p>
          </div>
          <Link
            href="/"
            className="text-xs font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-lg transition"
          >
            ← Halaman Input Driver
          </Link>
        </div>

        {/* Ringkasan Kartu Metrik */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <span className="text-xs font-medium text-gray-500">Total Pengeluaran</span>
            <div className="text-2xl font-extrabold text-gray-900 mt-2">
              Rp {totalCost.toLocaleString('id-ID')}
            </div>
            <span className="text-[10px] text-green-600 font-medium">Pengisian BBM</span>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <span className="text-xs font-medium text-gray-500">Rata-rata Efisiensi</span>
            <div className="text-2xl font-extrabold text-blue-600 mt-2">
              {avgKmPerLiter} <span className="text-sm font-normal text-gray-600">KM/Liter</span>
            </div>
            <span className="text-[10px] text-gray-400">Total Jarak: {totalKm} KM</span>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <span className="text-xs font-medium text-gray-500">Total Volume BBM</span>
            <div className="text-2xl font-extrabold text-gray-900 mt-2">
              {totalLiters.toLocaleString('id-ID')} <span className="text-sm font-normal text-gray-600">Liter</span>
            </div>
            <span className="text-[10px] text-gray-400">Pertalite & Solar</span>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <span className="text-xs font-medium text-gray-500">Total Transaksi</span>
            <div className="text-2xl font-extrabold text-gray-900 mt-2">
              {filteredLogs.length} <span className="text-sm font-normal text-gray-600">Pengisian</span>
            </div>
            <span className="text-[10px] text-gray-400">Log Pengemudi</span>
          </div>
        </div>

        {/* Section Grafik & Breakdown Per Kendaraan */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Grafik Pengeluaran per Kendaraan */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 space-y-4">
            <h2 className="text-sm font-bold text-gray-800">Total Pengeluaran per Kendaraan</h2>
            <div className="space-y-4 pt-2">
              {vehicleStats.map((v) => {
                const percentage = Math.round((v.cost / maxCost) * 100)
                return (
                  <div key={v.plate} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-gray-700">{v.plate} ({v.model})</span>
                      <span className="text-gray-900">Rp {v.cost.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Indikator Efisiensi (KM/Liter) */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 space-y-4">
            <h2 className="text-sm font-bold text-gray-800">Efisiensi Konsumsi BBM (KM / Liter)</h2>
            <div className="grid grid-cols-1 gap-3 pt-1">
              {vehicleStats.map((v) => (
                <div key={v.plate} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div>
                    <div className="text-xs font-bold text-gray-800">{v.plate}</div>
                    <div className="text-[11px] text-gray-500">{v.model}</div>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-bold ${v.efficiency >= 10 ? 'text-green-600' : 'text-amber-600'}`}>
                      {v.efficiency} KM/L
                    </span>
                    <div className="text-[10px] text-gray-400">
                      {v.efficiency >= 10 ? 'Sangat Irit' : 'Cukup Boros'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Tabel Riwayat Transaksi */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h2 className="text-sm font-bold text-gray-800">Rincian Transaksi Pengisian BBM</h2>
            
            {/* Filter Kendaraan */}
            <select
              className="text-xs border border-gray-300 rounded-lg p-2 bg-white font-medium text-gray-700"
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
            >
              <option value="ALL">Semua Kendaraan</option>
              {vehicleStats.map((v) => (
                <option key={v.plate} value={v.plate}>
                  {v.plate} - {v.model}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600">
              <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
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
                    <td className="p-3.5 whitespace-nowrap">{log.date}</td>
                    <td className="p-3.5 whitespace-nowrap font-medium text-gray-900">{log.plate_number}</td>
                    <td className="p-3.5 whitespace-nowrap">{log.driver_name}</td>
                    <td className="p-3.5 whitespace-nowrap">{log.fuel_type}</td>
                    <td className="p-3.5 whitespace-nowrap">{log.liters} L</td>
                    <td className="p-3.5 whitespace-nowrap">{log.distance_km} KM</td>
                    <td className="p-3.5 whitespace-nowrap font-semibold text-blue-600">{log.km_per_liter} KM/L</td>
                    <td className="p-3.5 whitespace-nowrap text-right font-bold text-gray-900">
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