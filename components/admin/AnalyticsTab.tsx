'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, Suspense } from 'react'
import { AdminSidebar } from '@/components/admin/AdminSidebar'

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'
]

const DEFAULT_MONTHLY_TREND = [
  { month: '01', name: 'Januari', fuelCost: 3800000, serviceCost: 1200000 },
  { month: '02', name: 'Februari', fuelCost: 4100000, serviceCost: 450000 },
  { month: '03', name: 'Maret', fuelCost: 3950000, serviceCost: 1800000 },
  { month: '04', name: 'April', fuelCost: 4200000, serviceCost: 600000 },
  { month: '05', name: 'Mei', fuelCost: 4050000, serviceCost: 950000 },
  { month: '06', name: 'Juni', fuelCost: 4300000, serviceCost: 2100000 },
  { month: '07', name: 'Juli', fuelCost: 4500000, serviceCost: 800000 },
  { month: '08', name: 'Agustus', fuelCost: 4850000, serviceCost: 1850000 },
]

function AnalyticsContent() {
  const [selectedYear, setSelectedYear] = useState('2026')
  const [logs, setLogs] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])

  useEffect(() => {
    try {
      const storedLogs = localStorage.getItem('fuel_logs')
      const storedServices = localStorage.getItem('service_history')

      if (storedLogs) setLogs(JSON.parse(storedLogs))
      if (storedServices) setServices(JSON.parse(storedServices))
    } catch (e) {
      console.error(e)
    }
  }, [])

  // Akumulasi data bulanan memisahkan BBM dan Servis/Perbaikan
  const monthlyData = MONTH_NAMES.map((name, index) => {
    const monthNum = String(index + 1).padStart(2, '0')

    const mLogs = logs.filter((l) => {
      if (!l.date) return false
      const [y, m] = l.date.split('-')
      return m === monthNum && (selectedYear === 'ALL' || y === selectedYear)
    })

    const mServices = services.filter((s) => {
      if (!s.date) return false
      const [y, m] = s.date.split('-')
      return m === monthNum && (selectedYear === 'ALL' || y === selectedYear)
    })

    const fuelCost = mLogs.reduce((acc, l) => acc + (Number(l.total_cost) || 0), 0)
    const serviceCost = mServices.reduce((acc, s) => acc + (Number(s.cost) || 0), 0)

    const defaultItem = DEFAULT_MONTHLY_TREND.find((d) => d.month === monthNum)
    const finalFuelCost = fuelCost || (logs.length === 0 ? defaultItem?.fuelCost || 0 : 0)
    const finalServiceCost = serviceCost || (services.length === 0 ? defaultItem?.serviceCost || 0 : 0)

    return {
      monthNum,
      name,
      fuelCost: finalFuelCost,
      serviceCost: finalServiceCost,
      totalCost: finalFuelCost + finalServiceCost,
    }
  })

  const totalFuelYear = monthlyData.reduce((acc, m) => acc + m.fuelCost, 0)
  const totalServiceYear = monthlyData.reduce((acc, m) => acc + m.serviceCost, 0)
  const totalGrandYear = totalFuelYear + totalServiceYear

  const maxVal = Math.max(...monthlyData.map((m) => Math.max(m.fuelCost, m.serviceCost)), 1)

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans text-slate-800">
      <AdminSidebar />

      <main className="flex-1 p-6 space-y-6 overflow-y-auto">
        {/* HEADER */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-sm font-bold text-slate-900 tracking-wider uppercase flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
              Analytics & Grafik Tren Operasional
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Analisa komparatif tren pengeluaran BBM vs Biaya Perbaikan (Servis & KIR) per bulan
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-700">Tahun:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="text-xs font-bold bg-slate-900 text-amber-400 border border-slate-800 rounded-xl px-3 py-2 outline-none shadow-sm cursor-pointer"
            >
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
              <option value="ALL">Semua Tahun</option>
            </select>
          </div>
        </div>

        {/* REKAPITULASI TAHUNAN */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Total Pengeluaran BBM ({selectedYear})</span>
            <strong className="text-xl font-mono font-extrabold text-amber-700 mt-1 block">
              Rp {totalFuelYear.toLocaleString('id-ID')}
            </strong>
            <span className="text-[11px] text-slate-500 mt-1 block">Rata-rata: Rp {Math.round(totalFuelYear / 12).toLocaleString('id-ID')} / bulan</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Total Perbaikan & Servis ({selectedYear})</span>
            <strong className="text-xl font-mono font-extrabold text-indigo-900 mt-1 block">
              Rp {totalServiceYear.toLocaleString('id-ID')}
            </strong>
            <span className="text-[11px] text-slate-500 mt-1 block">Rata-rata: Rp {Math.round(totalServiceYear / 12).toLocaleString('id-ID')} / bulan</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Total Operasional Combined</span>
            <strong className="text-xl font-mono font-extrabold text-slate-900 mt-1 block">
              Rp {totalGrandYear.toLocaleString('id-ID')}
            </strong>
            <span className="text-[11px] text-slate-500 mt-1 block">Rasio BBM : Servis = {totalGrandYear > 0 ? Math.round((totalFuelYear / totalGrandYear) * 100) : 0}% : {totalGrandYear > 0 ? Math.round((totalServiceYear / totalGrandYear) * 100) : 0}%</span>
          </div>
        </div>

        {/* GRAFIK BATANG KOMPARATIF BIAYA BBM VS PERBAIKAN */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b pb-3 border-slate-100 gap-2">
            <div>
              <h2 className="text-xs font-extrabold text-slate-900 tracking-wider uppercase flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                Grafik Perbandingan Tren Bulanan (BBM vs Perbaikan)
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">Visualisasi perbandingan pengeluaran bensin dan pemeliharaan armada</p>
            </div>

            <div className="flex items-center gap-4 text-xs font-bold">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-amber-500 rounded-sm"></span>
                <span className="text-slate-700">Biaya BBM</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-indigo-600 rounded-sm"></span>
                <span className="text-slate-700">Biaya Perbaikan</span>
              </div>
            </div>
          </div>

          <div className="pt-4 pb-2">
            <div className="grid grid-cols-12 gap-2 sm:gap-4 items-end h-56 border-b border-slate-200 pb-2">
              {monthlyData.map((m, idx) => {
                const fuelHeight = Math.max(Math.round((m.fuelCost / maxVal) * 100), m.fuelCost > 0 ? 5 : 0)
                const serviceHeight = Math.max(Math.round((m.serviceCost / maxVal) * 100), m.serviceCost > 0 ? 5 : 0)

                return (
                  <div key={idx} className="flex flex-col items-center gap-1 h-full justify-end group relative">
                    <div className="absolute -top-12 hidden group-hover:flex flex-col items-center bg-slate-900 text-white text-[10px] p-2 rounded-lg z-20 shadow-xl whitespace-nowrap">
                      <span>{m.name}:</span>
                      <span className="text-amber-400">BBM: Rp {m.fuelCost.toLocaleString('id-ID')}</span>
                      <span className="text-indigo-300">Servis: Rp {m.serviceCost.toLocaleString('id-ID')}</span>
                    </div>

                    <div className="w-full flex items-end justify-center gap-1 h-full">
                      <div
                        className="w-1/2 bg-amber-500 hover:bg-amber-600 rounded-t-sm transition-all"
                        style={{ height: `${fuelHeight}%` }}
                        title={`BBM ${m.name}: Rp ${m.fuelCost.toLocaleString('id-ID')}`}
                      ></div>
                      <div
                        className="w-1/2 bg-indigo-600 hover:bg-indigo-700 rounded-t-sm transition-all"
                        style={{ height: `${serviceHeight}%` }}
                        title={`Servis ${m.name}: Rp ${m.serviceCost.toLocaleString('id-ID')}`}
                      ></div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-600 mt-2">{m.name}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* TABEL RINCIAN ANGKA TREN BULANAN */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Tabel Matriks Rincian Pengeluaran Bulanan
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-900 text-white font-bold">
                <tr>
                  <th className="p-3.5">Bulan</th>
                  <th className="p-3.5 text-right">Pengeluaran BBM</th>
                  <th className="p-3.5 text-right">Biaya Perbaikan & Servis</th>
                  <th className="p-3.5 text-right">Total Operasional</th>
                  <th className="p-3.5 text-center">Proporsi (BBM / Servis)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {monthlyData.map((m, idx) => {
                  const fuelPct = m.totalCost > 0 ? Math.round((m.fuelCost / m.totalCost) * 100) : 0
                  const servPct = m.totalCost > 0 ? 100 - fuelPct : 0

                  return (
                    <tr key={idx} className="hover:bg-slate-50 transition">
                      <td className="p-3.5 font-bold text-slate-900">{m.name} {selectedYear}</td>
                      <td className="p-3.5 text-right font-mono font-bold text-amber-700">
                        Rp {m.fuelCost.toLocaleString('id-ID')}
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-indigo-700">
                        Rp {m.serviceCost.toLocaleString('id-ID')}
                      </td>
                      <td className="p-3.5 text-right font-mono font-extrabold text-slate-900">
                        Rp {m.totalCost.toLocaleString('id-ID')}
                      </td>
                      <td className="p-3.5 text-center font-mono text-[11px]">
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
      </main>
    </div>
  )
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 text-white p-6">Memuat Analytics...</div>}>
      <AnalyticsContent />
    </Suspense>
  )
}