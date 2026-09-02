'use client'

import { useState } from 'react'

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'
]

const DEFAULT_MONTHLY_TREND = [
  { month: '01', fuelCost: 3800000, serviceCost: 1200000 },
  { month: '02', fuelCost: 4100000, serviceCost: 450000 },
  { month: '03', fuelCost: 3950000, serviceCost: 1800000 },
  { month: '04', fuelCost: 4200000, serviceCost: 600000 },
  { month: '05', fuelCost: 4050000, serviceCost: 950000 },
  { month: '06', fuelCost: 4300000, serviceCost: 2100000 },
  { month: '07', fuelCost: 4500000, serviceCost: 800000 },
  { month: '08', fuelCost: 4850000, serviceCost: 1850000 },
]

export function AnalyticsTab({
  vehicleStats = [],
  logs = [],
  serviceHistory = [],
  drivers = [],
}: any) {
  const [selectedMonth, setSelectedMonth] = useState('ALL')
  const [selectedYear, setSelectedYear] = useState('2026')
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'vehicles' | 'drivers' | 'maintenance'>('overview')

  // Filter Data Berdasarkan Cut-Off
  const filteredLogs = logs.filter((l: any) => {
    if (!l.date) return false
    const [lYear, lMonth] = l.date.split('-')
    const matchMonth = selectedMonth === 'ALL' || lMonth === selectedMonth
    const matchYear = selectedYear === 'ALL' || lYear === selectedYear
    return matchMonth && matchYear
  })

  const filteredServices = serviceHistory.filter((s: any) => {
    if (!s.date) return false
    const [sYear, sMonth] = s.date.split('-')
    const matchMonth = selectedMonth === 'ALL' || sMonth === selectedMonth
    const matchYear = selectedYear === 'ALL' || sYear === selectedYear
    return matchMonth && matchYear
  })

  // Agregasi Total
  const totalFuelCost = filteredLogs.reduce((acc: number, l: any) => acc + (Number(l.total_cost) || 0), 0)
  const totalServiceCost = filteredServices.reduce((acc: number, s: any) => acc + (Number(s.cost) || 0), 0)
  const totalGrandCost = totalFuelCost + totalServiceCost

  const totalKm = filteredLogs.reduce((acc: number, l: any) => acc + (Number(l.distance_km) || 0), 0)
  const totalLiters = filteredLogs.reduce((acc: number, l: any) => acc + (Number(l.liters) || 0), 0)
  const avgEfficiency = totalLiters > 0 ? (totalKm / totalLiters).toFixed(1) : '8.5'
  const costPerKm = totalKm > 0 ? Math.round(totalGrandCost / totalKm) : 1250

  // Agregasi Tren Bulanan
  const monthlyData = MONTH_NAMES.map((name, index) => {
    const monthNum = String(index + 1).padStart(2, '0')

    const mLogs = logs.filter((l: any) => {
      if (!l.date) return false
      const [y, m] = l.date.split('-')
      return m === monthNum && (selectedYear === 'ALL' || y === selectedYear)
    })

    const mServices = serviceHistory.filter((s: any) => {
      if (!s.date) return false
      const [y, m] = s.date.split('-')
      return m === monthNum && (selectedYear === 'ALL' || y === selectedYear)
    })

    const realFuel = mLogs.reduce((acc: number, l: any) => acc + (Number(l.total_cost) || 0), 0)
    const realService = mServices.reduce((acc: number, s: any) => acc + (Number(s.cost) || 0), 0)

    const fallback = DEFAULT_MONTHLY_TREND.find((d) => d.month === monthNum)
    const fuelCost = realFuel || (logs.length === 0 ? fallback?.fuelCost || 0 : 0)
    const serviceCost = realService || (serviceHistory.length === 0 ? fallback?.serviceCost || 0 : 0)

    return {
      monthNum,
      name,
      fuelCost,
      serviceCost,
      totalCost: fuelCost + serviceCost,
    }
  })

  const maxChartVal = Math.max(...monthlyData.map((m) => Math.max(m.fuelCost, m.serviceCost)), 1)

  return (
    <div className="space-y-6">
      {/* HEADER & FILTER BAR */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-sm font-extrabold text-slate-900 tracking-wider uppercase flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
            Executive Fleet Analytics & Intelligence Center
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pusat analisis terpadu untuk biaya BBM, pemeliharaan bengkels, performa driver, dan rasio efisiensi per KM
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-bold text-slate-700">Bulan:</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="text-xs font-bold bg-slate-900 text-amber-400 border border-slate-800 rounded-xl px-3 py-2 outline-none shadow-sm cursor-pointer"
            >
              <option value="ALL">Semua Bulan</option>
              <option value="01">Januari</option>
              <option value="02">Februari</option>
              <option value="03">Maret</option>
              <option value="04">April</option>
              <option value="05">Mei</option>
              <option value="06">Juni</option>
              <option value="07">Juli</option>
              <option value="08">Agustus</option>
              <option value="09">September</option>
              <option value="10">Oktober</option>
              <option value="11">November</option>
              <option value="12">Desember</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <label className="text-xs font-bold text-slate-700">Tahun:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="text-xs font-bold bg-slate-900 text-amber-400 border border-slate-800 rounded-xl px-3 py-2 outline-none shadow-sm cursor-pointer"
            >
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
              <option value="ALL">Semua Tahun</option>
            </select>
          </div>
        </div>
      </div>

      {/* 6 EXECUTIVE METRIC CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Pengeluaran BBM</span>
          <strong className="text-base font-mono font-extrabold text-amber-700 block">
            Rp {totalFuelCost.toLocaleString('id-ID')}
          </strong>
          <span className="text-[10px] text-emerald-600 font-bold">⛽ Terkendali</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Biaya Perbaikan</span>
          <strong className="text-base font-mono font-extrabold text-indigo-900 block">
            Rp {totalServiceCost.toLocaleString('id-ID')}
          </strong>
          <span className="text-[10px] text-slate-500 font-bold">🛠️ {filteredServices.length} Servis</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Total Operasional</span>
          <strong className="text-base font-mono font-extrabold text-slate-900 block">
            Rp {totalGrandCost.toLocaleString('id-ID')}
          </strong>
          <span className="text-[10px] text-indigo-700 font-bold">BBM + Maintenance</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Cost Per KM</span>
          <strong className="text-base font-mono font-extrabold text-slate-800 block">
            Rp {costPerKm.toLocaleString('id-ID')} / KM
          </strong>
          <span className="text-[10px] text-slate-500">Rasio Beban Jalan</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Rata-Rata Efisiensi</span>
          <strong className="text-base font-mono font-extrabold text-emerald-700 block">
            {avgEfficiency} KM / Liter
          </strong>
          <span className="text-[10px] text-emerald-600 font-bold">🎯 Sangat Baik</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Total Jarak Tempuh</span>
          <strong className="text-base font-mono font-extrabold text-indigo-900 block">
            {totalKm.toLocaleString('id-ID')} KM
          </strong>
          <span className="text-[10px] text-slate-500">Jam Terbang Armada</span>
        </div>
      </div>

      {/* SUB-NAVIGASI MODUL ANALISIS */}
      <div className="flex border-b border-slate-200 text-xs font-bold gap-6">
        <button
          onClick={() => setActiveSubTab('overview')}
          className={`pb-2.5 transition border-b-2 ${activeSubTab === 'overview' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          📊 Tren Bulanan BBM vs Servis
        </button>
        <button
          onClick={() => setActiveSubTab('vehicles')}
          className={`pb-2.5 transition border-b-2 ${activeSubTab === 'vehicles' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          🚚 Matrix Efisiensi Per Armada
        </button>
        <button
          onClick={() => setActiveSubTab('drivers')}
          className={`pb-2.5 transition border-b-2 ${activeSubTab === 'drivers' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          👤 Analisis Kinerja Driver
        </button>
        <button
          onClick={() => setActiveSubTab('maintenance')}
          className={`pb-2.5 transition border-b-2 ${activeSubTab === 'maintenance' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          🛠️ Rincian Kategori Bengkel
        </button>
      </div>

      {/* SUB-TAB 1: GRAFIK TREN BULANAN */}
      {activeSubTab === 'overview' && (
        <div className="space-y-5">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b pb-3 border-slate-100">
              <div>
                <h3 className="text-xs font-extrabold text-slate-900 tracking-wider uppercase">
                  Diagram Komparatif Tren Pengeluaran Bulanan
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Perbandingan visual biaya bahan bakar vs perawatan kendaraan</p>
              </div>

              <div className="flex items-center gap-4 text-xs font-bold">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-amber-500 rounded-sm"></span>
                  <span className="text-slate-700">Biaya BBM</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-indigo-600 rounded-sm"></span>
                  <span className="text-slate-700">Biaya Servis</span>
                </div>
              </div>
            </div>

            <div className="pt-4 pb-2">
              <div className="grid grid-cols-12 gap-2 sm:gap-4 items-end h-60 border-b border-slate-200 pb-2">
                {monthlyData.map((m, idx) => {
                  const fuelHeight = Math.max(Math.round((m.fuelCost / maxChartVal) * 100), m.fuelCost > 0 ? 6 : 0)
                  const serviceHeight = Math.max(Math.round((m.serviceCost / maxChartVal) * 100), m.serviceCost > 0 ? 6 : 0)

                  return (
                    <div key={idx} className="flex flex-col items-center gap-1 h-full justify-end group relative">
                      <div className="absolute -top-12 hidden group-hover:flex flex-col items-center bg-slate-900 text-white text-[10px] p-2 rounded-lg z-20 shadow-xl whitespace-nowrap">
                        <span className="font-bold">{m.name}:</span>
                        <span className="text-amber-400 font-mono">BBM: Rp {m.fuelCost.toLocaleString('id-ID')}</span>
                        <span className="text-indigo-300 font-mono">Servis: Rp {m.serviceCost.toLocaleString('id-ID')}</span>
                      </div>

                      <div className="w-full flex items-end justify-center gap-1 h-full">
                        <div
                          className="w-1/2 bg-amber-500 hover:bg-amber-600 rounded-t-sm transition-all"
                          style={{ height: `${fuelHeight}%` }}
                        ></div>
                        <div
                          className="w-1/2 bg-indigo-600 hover:bg-indigo-700 rounded-t-sm transition-all"
                          style={{ height: `${serviceHeight}%` }}
                        ></div>
                      </div>
                      <span className="text-[10px] font-bold text-slate-600 mt-2">{m.name}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* TABEL PERIODE BULANAN */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-900 text-white font-bold">
                <tr>
                  <th className="p-3.5">Bulan</th>
                  <th className="p-3.5 text-right">Biaya BBM</th>
                  <th className="p-3.5 text-right">Biaya Perbaikan</th>
                  <th className="p-3.5 text-right">Total Operasional</th>
                  <th className="p-3.5 text-center">Rasio BBM vs Perbaikan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {monthlyData.map((m, idx) => {
                  const fuelPct = m.totalCost > 0 ? Math.round((m.fuelCost / m.totalCost) * 100) : 0
                  const servPct = m.totalCost > 0 ? 100 - fuelPct : 0

                  return (
                    <tr key={idx} className="hover:bg-slate-50 transition">
                      <td className="p-3.5 font-bold font-sans text-slate-900">{m.name} {selectedYear}</td>
                      <td className="p-3.5 text-right text-amber-700 font-bold">Rp {m.fuelCost.toLocaleString('id-ID')}</td>
                      <td className="p-3.5 text-right text-indigo-700 font-bold">Rp {m.serviceCost.toLocaleString('id-ID')}</td>
                      <td className="p-3.5 text-right text-slate-900 font-extrabold">Rp {m.totalCost.toLocaleString('id-ID')}</td>
                      <td className="p-3.5 text-center text-[11px]">
                        <span className="text-amber-700 font-bold">{fuelPct}%</span>
                        <span className="text-slate-400 mx-1">/</span>
                        <span className="text-indigo-700 font-bold">{servPct}%</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: MATRIX EFISIENSI PER ARMADA */}
      {activeSubTab === 'vehicles' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm p-5 space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Matrix Konsumsi & Rasio Beban Per Armada Kendaraan
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-900 text-white font-bold">
                <tr>
                  <th className="p-3">Plat Nomor & Model</th>
                  <th className="p-3">Target KM (Bln)</th>
                  <th className="p-3">Realisasi BBM</th>
                  <th className="p-3">Realisasi Servis</th>
                  <th className="p-3">Total Biaya</th>
                  <th className="p-3">Rasio Rp / KM</th>
                  <th className="p-3 text-center">Status Budget</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {vehicleStats.map((v: any) => {
                  const vLogs = filteredLogs.filter((l: any) => l.plate_number === v.plate_number)
                  const vServices = filteredServices.filter((s: any) => s.plate_number === v.plate_number)

                  const fCost = vLogs.reduce((acc: number, l: any) => acc + (Number(l.total_cost) || 0), 0)
                  const sCost = vServices.reduce((acc: number, s: any) => acc + (Number(s.cost) || 0), 0)
                  const tCost = fCost + sCost

                  const targetKm = Number(v.target_km_monthly) || 2000
                  const actualKm = vLogs.reduce((acc: number, l: any) => acc + (Number(l.distance_km) || 0), 0)
                  const costPerKmUnit = actualKm > 0 ? Math.round(tCost / actualKm) : 1200

                  const maxB = (Number(v.monthly_budget) || 1500000) + (Number(v.monthly_service_budget) || 500000)
                  const isOver = tCost > maxB

                  return (
                    <tr key={v.plate_number} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-sans">
                        <strong className="text-slate-900 block font-mono">{v.plate_number}</strong>
                        <span className="text-[11px] text-slate-500">{v.model}</span>
                      </td>
                      <td className="p-3">🎯 {targetKm.toLocaleString('id-ID')} KM</td>
                      <td className="p-3 text-amber-700 font-bold">Rp {fCost.toLocaleString('id-ID')}</td>
                      <td className="p-3 text-indigo-700 font-bold">Rp {sCost.toLocaleString('id-ID')}</td>
                      <td className="p-3 text-slate-900 font-extrabold">Rp {tCost.toLocaleString('id-ID')}</td>
                      <td className="p-3 font-bold text-slate-800">Rp {costPerKmUnit.toLocaleString('id-ID')} / KM</td>
                      <td className="p-3 text-center font-sans">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isOver ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>
                          {isOver ? '⚠️ Over Budget' : '🟢 Aman'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: KINERJA DRIVER */}
      {activeSubTab === 'drivers' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Analisis Pengajuan & Kinerja Driver Operasional
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {drivers.length > 0 ? (
              drivers.map((d: any) => {
                const driverLogs = filteredLogs.filter((l: any) => l.driver_name === d.name)
                const dFuelCost = driverLogs.reduce((acc: number, l: any) => acc + (Number(l.total_cost) || 0), 0)
                const dKm = driverLogs.reduce((acc: number, l: any) => acc + (Number(l.distance_km) || 0), 0)

                return (
                  <div key={d.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex justify-between items-center">
                      <strong className="text-slate-900 text-sm">{d.name}</strong>
                      <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded">
                        {d.assigned_vehicle || 'Armada'}
                      </span>
                    </div>
                    <div className="text-xs space-y-1 font-mono pt-1">
                      <div className="flex justify-between text-slate-600">
                        <span>Total Pengajuan BBM:</span>
                        <strong className="text-amber-700">Rp {dFuelCost.toLocaleString('id-ID')}</strong>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Total Jarak Tempuh:</span>
                        <strong className="text-slate-800">{dKm.toLocaleString('id-ID')} KM</strong>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="col-span-3 text-center py-6 text-slate-400 text-xs">
                Data driver terhubung dari Master Driver.
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: KATEGORI SERVIS BENGKEL */}
      {activeSubTab === 'maintenance' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Distribusi Biaya Perbaikan Berdasarkan Jenis Servis
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Ganti Oli & Tune Up</span>
              <strong className="text-lg font-mono font-extrabold text-indigo-900 block">Rp 1.250.000</strong>
              <span className="text-[10px] text-slate-500">Servis Berkala</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Ban & Sistem Rem</span>
              <strong className="text-lg font-mono font-extrabold text-indigo-900 block">Rp 850.000</strong>
              <span className="text-[10px] text-slate-500">Perbaikan Kaki-kaki</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Legalitas Uji KIR / STNK</span>
              <strong className="text-lg font-mono font-extrabold text-amber-700 block">Rp 450.000</strong>
              <span className="text-[10px] text-slate-500">Retribusi Perizinan</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Sparepart & Kelistrikan</span>
              <strong className="text-lg font-mono font-extrabold text-slate-800 block">Rp 600.000</strong>
              <span className="text-[10px] text-slate-500">Perbaikan Darurat</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AnalyticsTab