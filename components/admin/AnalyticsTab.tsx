'use client'

import { useState, useEffect } from 'react'

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
  totalCost = 0,
}: any) {
  const [selectedMonth, setSelectedMonth] = useState('ALL')
  const [selectedYear, setSelectedYear] = useState('2026')
  const [drivers, setDrivers] = useState<any[]>([])

  useEffect(() => {
    try {
      const storedDrivers = localStorage.getItem('master_drivers')
      if (storedDrivers) setDrivers(JSON.parse(storedDrivers))
    } catch (e) {
      console.error(e)
    }
  }, [])

  // Opsi Tahun Dinamis (2024 - 2035+)
  const yearSet = new Set<string>()
  const startYear = 2024
  const endYear = Math.max(new Date().getFullYear() + 10, 2035)
  for (let y = startYear; y <= endYear; y++) {
    yearSet.add(String(y))
  }
  logs.forEach((l: any) => {
    if (l.date) {
      const yr = l.date.split('-')[0]
      if (yr) yearSet.add(yr)
    }
  })
  const YEAR_OPTIONS = ['ALL', ...Array.from(yearSet).sort()]

  // Filter Logs & Service berdasarkan Cutoff Periode
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

  // Kalkulasi Metrik KPI
  const periodFuelCost = filteredLogs.reduce((acc: number, l: any) => acc + (Number(l.total_cost) || 0), 0)
  const periodMaintenanceCost = filteredServices.reduce((acc: number, s: any) => acc + (Number(s.cost) || 0), 0)
  const periodTotalOperational = periodFuelCost + periodMaintenanceCost

  const totalKm = filteredLogs.reduce((acc: number, l: any) => acc + (Number(l.distance_km) || 0), 0)
  const totalLiters = filteredLogs.reduce((acc: number, l: any) => acc + (Number(l.liters) || 0), 0)
  const avgEfficiency = totalLiters > 0 ? (totalKm / totalLiters).toFixed(1) : '0'

  const eceranCount = filteredLogs.filter((l: any) => l.fill_location === 'ECERAN').length
  const anomalyCount = filteredLogs.filter((l: any) => l.status === 'FLAGGED').length

  // Analisis Per Driver
  const driverMap: Record<string, { name: string; sim: string; txCount: number; totalCost: number; liters: number; eceranCount: number }> = {}

  drivers.forEach((d: any) => {
    driverMap[d.name.trim().toLowerCase()] = {
      name: d.name,
      sim: d.sim_type || 'SIM B1 Umum',
      txCount: 0,
      totalCost: 0,
      liters: 0,
      eceranCount: 0,
    }
  })

  filteredLogs.forEach((l: any) => {
    const dName = l.driver_name ? l.driver_name.trim() : 'Unassigned'
    const key = dName.toLowerCase()
    if (!driverMap[key]) {
      driverMap[key] = {
        name: dName,
        sim: 'SIM Driver',
        txCount: 0,
        totalCost: 0,
        liters: 0,
        eceranCount: 0,
      }
    }
    driverMap[key].txCount += 1
    driverMap[key].totalCost += Number(l.total_cost) || 0
    driverMap[key].liters += Number(l.liters) || 0
    if (l.fill_location === 'ECERAN') {
      driverMap[key].eceranCount += 1
    }
  })

  const driverList = Object.values(driverMap)

  // Analisis Per Armada
  const vehicleAnalytics = vehicleStats.map((v: any) => {
    const vLogs = filteredLogs.filter((l: any) => l.plate_number === v.plate_number)
    const vServices = filteredServices.filter((s: any) => s.plate_number === v.plate_number)

    const fuelCost = vLogs.reduce((acc: number, l: any) => acc + (Number(l.total_cost) || 0), 0)
    const maintCost = vServices.reduce((acc: number, s: any) => acc + (Number(s.cost) || 0), 0)
    const km = vLogs.reduce((acc: number, l: any) => acc + (Number(l.distance_km) || 0), 0)
    const liters = vLogs.reduce((acc: number, l: any) => acc + (Number(l.liters) || 0), 0)
    const kmPerLiter = liters > 0 ? (km / liters).toFixed(1) : '0'

    return {
      ...v,
      fuelCost,
      maintCost,
      totalCost: fuelCost + maintCost,
      kmPerLiter,
      logCount: vLogs.length,
      serviceCount: vServices.length,
    }
  })

  return (
    <div className="space-y-6">
      {/* TOOLBAR CUT-OFF ANALYTICS */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h2 className="text-xs font-extrabold text-slate-900 tracking-wider uppercase flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
            Analisis Eksekutif & Grafis Performa FleetOps 360
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Statistik komprehensif efisiensi armada, performa driver, dan alokasi anggaran operasional
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

      {/* 1. CARDS KPI EKSEKUTIF */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
          <div>
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Total Operasional (BBM+Servis)</span>
            <strong className="text-lg font-mono font-extrabold text-slate-900 mt-0.5 block">
              Rp {periodTotalOperational.toLocaleString('id-ID')}
            </strong>
            <span className="text-[10px] text-slate-500">BBM: Rp {periodFuelCost.toLocaleString('id-ID')}</span>
          </div>
          <div className="w-10 h-10 bg-indigo-50 text-indigo-700 rounded-xl flex items-center justify-center font-bold">
            💰
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
          <div>
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Rata-Rata Efisiensi Fleet</span>
            <strong className="text-lg font-mono font-extrabold text-emerald-700 mt-0.5 block">
              {avgEfficiency} KM/L
            </strong>
            <span className="text-[10px] text-slate-500">Total Jarak: {totalKm.toLocaleString('id-ID')} KM</span>
          </div>
          <div className="w-10 h-10 bg-emerald-50 text-emerald-700 rounded-xl flex items-center justify-center font-bold">
            ⚡
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
          <div>
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Pengisian Eceran / Darurat</span>
            <strong className={eceranCount > 0 ? "text-lg font-mono font-extrabold text-rose-600 mt-0.5 block" : "text-lg font-mono font-extrabold text-slate-900 mt-0.5 block"}>
              {eceranCount} Transaksi
            </strong>
            <span className="text-[10px] text-slate-500">Memerlukan Audit Admin</span>
          </div>
          <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center font-bold">
            ⚠️
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
          <div>
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Total Transaksi BBM</span>
            <strong className="text-lg font-mono font-extrabold text-amber-600 mt-0.5 block">
              {filteredLogs.length} Laporan
            </strong>
            <span className="text-[10px] text-slate-500">Status Anomali: {anomalyCount}</span>
          </div>
          <div className="w-10 h-10 bg-amber-50 text-amber-700 rounded-xl flex items-center justify-center font-bold">
            ⛽
          </div>
        </div>
      </div>

      {/* 2. ANALISIS KINERJA & BIAYA PER ARMADA */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="border-b pb-3 flex justify-between items-center">
          <div>
            <h3 className="text-xs font-extrabold text-slate-900 tracking-wider uppercase flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              Efisiensi Konsumsi BBM & Total Biaya Per Armada (KM / LITER)
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Visualisasi perbandingan efisiensi BBM dan akumulasi biaya BBM vs Maintenance
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {vehicleAnalytics.map((v: any) => {
            const effNum = Number(v.kmPerLiter) || 0
            const isBoros = effNum < 10 && effNum > 0
            const barWidth = Math.min(Math.round((effNum / 20) * 100), 100)

            return (
              <div key={v.plate_number} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1 text-xs">
                  <div>
                    <span className="font-extrabold text-slate-900">{v.plate_number}</span>
                    <span className="text-slate-500 ml-2">({v.model})</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-[11px]">
                    <span className="text-slate-600">BBM: <strong>Rp {v.fuelCost.toLocaleString('id-ID')}</strong></span>
                    <span className="text-slate-600">Servis: <strong>Rp {v.maintCost.toLocaleString('id-ID')}</strong></span>
                    <span className="text-slate-900 font-bold bg-white px-2 py-0.5 rounded-md border border-slate-200">
                      Total: Rp {v.totalCost.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-500 font-medium">Rasio Konsumsi BBM:</span>
                    <span className={`font-mono font-bold ${isBoros ? 'text-rose-600' : 'text-emerald-700'}`}>
                      {effNum > 0 ? `${effNum} KM/L` : '0 KM/L (Belum Ada Data)'}
                      {isBoros && <span className="ml-1 text-[10px] bg-rose-100 text-rose-700 px-1 rounded font-bold">Boros</span>}
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        isBoros ? 'bg-rose-500' : effNum >= 10 ? 'bg-emerald-500' : 'bg-slate-400'
                      }`}
                      style={{ width: `${barWidth}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 3. ANALISIS PERFORMA & PERILAKU DRIVER */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="border-b pb-3 flex justify-between items-center">
          <div>
            <h3 className="text-xs font-extrabold text-slate-900 tracking-wider uppercase flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
              Analisis Performa, Pengeluaran & Audit Driver
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Rekapitulasi total klaim BBM, frekuensi pengisian, dan riwayat pengisian eceran per pengemudi
            </p>
          </div>
        </div>

        <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-900 text-white font-bold sticky top-0 z-10">
              <tr>
                <th className="p-3.5">Nama Driver</th>
                <th className="p-3.5">Lisensi / SIM</th>
                <th className="p-3.5 text-center">Jumlah Transaksi</th>
                <th className="p-3.5 text-center">Total Volume (L)</th>
                <th className="p-3.5 text-right">Total Biaya Klaim BBM</th>
                <th className="p-3.5 text-center">Status Audit Eceran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {driverList.map((d: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition">
                  <td className="p-3.5 font-bold text-slate-900 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-800 font-extrabold flex items-center justify-center text-[10px] border border-slate-200">
                      {d.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span>{d.name}</span>
                  </td>
                  <td className="p-3.5 text-slate-500">{d.sim}</td>
                  <td className="p-3.5 text-center font-mono font-semibold text-slate-800">
                    {d.txCount} Pengisian
                  </td>
                  <td className="p-3.5 text-center font-mono text-slate-800">
                    {d.liters.toFixed(1)} L
                  </td>
                  <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                    Rp {d.totalCost.toLocaleString('id-ID')}
                  </td>
                  <td className="p-3.5 text-center">
                    {d.eceranCount > 0 ? (
                      <span className="text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-bold inline-block">
                        ⚠️ {d.eceranCount} Kios Eceran
                      </span>
                    ) : (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold inline-block">
                        ✓ 100% SPBU Resmi
                      </span>
                    )}
                  </td>
                </tr>
              ))}

              {driverList.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 italic">
                    Belum ada data driver yang terdaftar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}