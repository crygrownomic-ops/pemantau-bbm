'use client'

import { useState } from 'react'

const MONTH_OPTIONS = [
  { value: 'ALL', label: 'Semua Bulan' },
  { value: '01', label: 'Januari' },
  { value: '02', label: 'Februari' },
  { value: '03', label: 'Maret' },
  { value: '04', label: 'April' },
  { value: '05', label: 'Mei' },
  { value: '06', label: 'Juni' },
  { value: '07', label: 'Juli' },
  { value: '08', label: 'Agustus' },
  { value: '09', label: 'September' },
  { value: '10', label: 'Oktober' },
  { value: '11', label: 'November' },
  { value: '12', label: 'Desember' },
]

export function AnalyticsTab({
  vehicleStats = [],
  logs = [],
  serviceHistory = [],
}: any) {
  const [selectedMonth, setSelectedMonth] = useState('ALL')
  const [selectedYear, setSelectedYear] = useState('2026')

  // Opsi Tahun Dinamis
  const yearSet = new Set<string>()
  for (let y = 2024; y <= 2035; y++) yearSet.add(String(y))
  logs.forEach((l: any) => {
    if (l.date) {
      const yr = l.date.split('-')[0]
      if (yr) yearSet.add(yr)
    }
  })
  const YEAR_OPTIONS = ['ALL', ...Array.from(yearSet).sort()]

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

  // Kalkulasi Total Terpisah (BBM vs Perbaikan)
  const totalFuelCost = filteredLogs.reduce((acc: number, l: any) => acc + (Number(l.total_cost) || 0), 0)
  const totalServiceCost = filteredServices.reduce((acc: number, s: any) => acc + (Number(s.cost) || 0), 0)
  const totalGrandCost = totalFuelCost + totalServiceCost

  const totalKm = filteredLogs.reduce((acc: number, l: any) => acc + (Number(l.distance_km) || 0), 0)
  const totalLiters = filteredLogs.reduce((acc: number, l: any) => acc + (Number(l.liters) || 0), 0)
  const avgEfficiency = totalLiters > 0 ? (totalKm / totalLiters).toFixed(1) : '0'

  return (
    <div className="space-y-6">
      {/* TOOLBAR CUT-OFF */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h2 className="text-xs font-extrabold text-slate-900 tracking-wider uppercase flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
            Analisis Komparatif Operasional & Grafik Tren
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Perbandingan terpisah antara pengeluaran BBM dan Biaya Perbaikan/Maintenance Armada
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
              {MONTH_OPTIONS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <label className="text-xs font-bold text-slate-700">Tahun:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="text-xs font-bold bg-slate-900 text-amber-400 border border-slate-800 rounded-xl px-3 py-2 outline-none shadow-sm cursor-pointer"
            >
              {YEAR_OPTIONS.map((y) => (
                <option key={y} value={y}>
                  {y === 'ALL' ? 'Semua Tahun' : y}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 3 KARTU METRIK UTAMA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Total Biaya BBM</span>
          <strong className="text-xl font-mono font-extrabold text-amber-700 mt-1 block">
            Rp {totalFuelCost.toLocaleString('id-ID')}
          </strong>
          <span className="text-[11px] text-slate-500 mt-1 block">Rata-rata Efisiensi: {avgEfficiency} KM/L</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Total Biaya Perbaikan & Servis</span>
          <strong className="text-xl font-mono font-extrabold text-indigo-900 mt-1 block">
            Rp {totalServiceCost.toLocaleString('id-ID')}
          </strong>
          <span className="text-[11px] text-slate-500 mt-1 block">{filteredServices.length} Transaksi Bengkel/KIR</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Total Operasional Combined</span>
          <strong className="text-xl font-mono font-extrabold text-slate-900 mt-1 block">
            Rp {totalGrandCost.toLocaleString('id-ID')}
          </strong>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Rasio BBM : Perbaikan = {totalGrandCost > 0 ? Math.round((totalFuelCost / totalGrandCost) * 100) : 0}% : {totalGrandCost > 0 ? Math.round((totalServiceCost / totalGrandCost) * 100) : 0}%
          </span>
        </div>
      </div>

      {/* RASIO EFISIENSI & BIAYA PER ARMADA */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="border-b pb-3">
          <h3 className="text-xs font-extrabold text-slate-900 tracking-wider uppercase">
            Rincian Biaya BBM vs Perbaikan Per Kendaraan
          </h3>
        </div>

        <div className="space-y-3">
          {vehicleStats.map((v: any) => {
            const vLogs = filteredLogs.filter((l: any) => l.plate_number === v.plate_number)
            const vServices = filteredServices.filter((s: any) => s.plate_number === v.plate_number)

            const fuelC = vLogs.reduce((acc: number, l: any) => acc + (Number(l.total_cost) || 0), 0)
            const serviceC = vServices.reduce((acc: number, s: any) => acc + (Number(s.cost) || 0), 0)
            const totalC = fuelC + serviceC

            return (
              <div key={v.plate_number} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-2 text-xs">
                <div>
                  <strong className="text-slate-900 block">{v.plate_number}</strong>
                  <span className="text-[11px] text-slate-500">{v.model}</span>
                </div>

                <div className="flex items-center gap-4 font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-sans">BBM:</span>
                    <strong className="text-amber-700">Rp {fuelC.toLocaleString('id-ID')}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-sans">Perbaikan:</span>
                    <strong className="text-indigo-700">Rp {serviceC.toLocaleString('id-ID')}</strong>
                  </div>
                  <div className="border-l pl-3 border-slate-300">
                    <span className="text-[10px] text-slate-400 block font-sans">Total:</span>
                    <strong className="text-slate-900 font-extrabold">Rp {totalC.toLocaleString('id-ID')}</strong>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default AnalyticsTab