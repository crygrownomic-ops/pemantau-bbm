'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { Icons } from '@/components/admin/Icons'

const DEFAULT_VEHICLES = [
  { id: 'V1', plate_number: 'B 1234 ABC', model: 'Toyota Avanza 1.5 G', monthly_budget: 1500000, monthly_service_budget: 500000, target_km_monthly: 1500, last_km: 45860 },
  { id: 'V2', plate_number: 'B 5678 XYZ', model: 'Daihatsu Gran Max', monthly_budget: 2000000, monthly_service_budget: 750000, target_km_monthly: 2500, last_km: 32000 },
  { id: 'V3', plate_number: 'B 9012 DEF', model: 'Isuzu Traga Pick Up', monthly_budget: 2500000, monthly_service_budget: 1000000, target_km_monthly: 3500, last_km: 18500 },
  { id: 'V4', plate_number: 'KB 1234 YK', model: 'Toyota Innova Zenix', monthly_budget: 2500000, monthly_service_budget: 800000, target_km_monthly: 2000, last_km: 47905 },
]

function DashboardContent() {
  const [vehicles, setVehicles] = useState<any[]>(DEFAULT_VEHICLES)
  const [driverCount, setDriverCount] = useState<number>(3)

  // Estimasi Pengeluaran Riil (Simulasi Data)
  const [fuelSpent, setFuelSpent] = useState<number>(4850000)
  const [serviceSpent, setServiceSpent] = useState<number>(1850000)

  useEffect(() => {
    try {
      const storedVehicles = localStorage.getItem('vehicle_budgets')
      const storedDrivers = localStorage.getItem('master_drivers')

      if (storedVehicles) {
        const parsedV = JSON.parse(storedVehicles)
        if (Array.isArray(parsedV) && parsedV.length > 0) {
          setVehicles(parsedV)
        }
      }

      if (storedDrivers) {
        const parsedD = JSON.parse(storedDrivers)
        if (Array.isArray(parsedD)) {
          setDriverCount(parsedD.length)
        }
      }
    } catch (e) {
      console.error(e)
    }
  }, [])

  // Akumulasi Total Anggaran dari Master Data Armada
  const totalFuelBudget = vehicles.reduce((acc, v) => acc + (Number(v.monthly_budget) || 0), 0)
  const totalServiceBudget = vehicles.reduce((acc, v) => acc + (Number(v.monthly_service_budget) || 500000), 0)
  const totalOperationalBudget = totalFuelBudget + totalServiceBudget
  const totalOperationalSpent = fuelSpent + serviceSpent

  const fuelPercentage = totalFuelBudget > 0 ? Math.min(Math.round((fuelSpent / totalFuelBudget) * 100), 100) : 0
  const servicePercentage = totalServiceBudget > 0 ? Math.min(Math.round((serviceSpent / totalServiceBudget) * 100), 100) : 0

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans text-slate-800">
      <AdminSidebar />

      <main className="flex-1 p-6 space-y-6 overflow-y-auto">
        {/* HEADER DASHBOARD */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
          <div>
            <h1 className="text-sm font-bold text-slate-900 tracking-wider uppercase flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              Dashboard Utama — Control Center FleetOps 360
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Pemantauan terpisah antara Anggaran BBM, Biaya Servis/Perbaikan, dan Jam Terbang Armada
            </p>
          </div>

          <Link
            href="/admin/settings?tab=vehicles"
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition"
          >
            ⚙️ Pengaturan Anggaran
          </Link>
        </div>

        {/* 4 KARTU KPI UTAMA (TERPISAH BBM DAN SERVIS) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KARTU 1: BIAYA BBM */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-slate-500">
              <span>⛽ BIAYA BBM (BULAN INI)</span>
              <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded-full">BBM</span>
            </div>
            <div className="text-xl font-extrabold font-mono text-amber-700">
              Rp {fuelSpent.toLocaleString('id-ID')}
            </div>
            <div className="text-[11px] text-slate-500">
              Batas Budget: <strong className="font-mono text-slate-700">Rp {totalFuelBudget.toLocaleString('id-ID')}</strong>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-1">
              <div
                className={`h-full ${fuelPercentage > 90 ? 'bg-rose-500' : 'bg-amber-500'}`}
                style={{ width: `${fuelPercentage}%` }}
              ></div>
            </div>
            <div className="text-[10px] text-right font-mono text-slate-400">{fuelPercentage}% Terpakai</div>
          </div>

          {/* KARTU 2: BIAYA SERVIS & PERBAIKAN */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-slate-500">
              <span>🛠️ BIAYA SERVIS & KIR</span>
              <span className="bg-indigo-100 text-indigo-800 text-[10px] px-2 py-0.5 rounded-full">Maintenance</span>
            </div>
            <div className="text-xl font-extrabold font-mono text-indigo-900">
              Rp {serviceSpent.toLocaleString('id-ID')}
            </div>
            <div className="text-[11px] text-slate-500">
              Batas Budget: <strong className="font-mono text-slate-700">Rp {totalServiceBudget.toLocaleString('id-ID')}</strong>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-1">
              <div
                className={`h-full ${servicePercentage > 90 ? 'bg-rose-500' : 'bg-indigo-600'}`}
                style={{ width: `${servicePercentage}%` }}
              ></div>
            </div>
            <div className="text-[10px] text-right font-mono text-slate-400">{servicePercentage}% Terpakai</div>
          </div>

          {/* KARTU 3: TOTAL OPERASIONAL COMBINED */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-slate-500">
              <span>💼 TOTAL OPERASIONAL</span>
              <span className="bg-slate-100 text-slate-800 text-[10px] px-2 py-0.5 rounded-full">Combined</span>
            </div>
            <div className="text-xl font-extrabold font-mono text-slate-900">
              Rp {totalOperationalSpent.toLocaleString('id-ID')}
            </div>
            <div className="text-[11px] text-slate-500">
              Total Plafon: <strong className="font-mono text-slate-700">Rp {totalOperationalBudget.toLocaleString('id-ID')}</strong>
            </div>
            <div className="text-[11px] text-emerald-700 font-bold pt-1">
              Sisa Anggaran: Rp {(totalOperationalBudget - totalOperationalSpent).toLocaleString('id-ID')}
            </div>
          </div>

          {/* KARTU 4: STATUS ARMADA & DRIVER */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-slate-500">
              <span>🚚 ARMADA & DRIVER</span>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full">Status</span>
            </div>
            <div className="flex justify-between items-baseline pt-1">
              <div>
                <span className="text-2xl font-extrabold text-slate-900">{vehicles.length}</span>
                <span className="text-xs text-slate-500 ml-1">Armada</span>
              </div>
              <div>
                <span className="text-2xl font-extrabold text-indigo-900">{driverCount}</span>
                <span className="text-xs text-slate-500 ml-1">Driver</span>
              </div>
            </div>
            <div className="text-[11px] text-slate-500 border-t pt-2 border-slate-100">
              Status Operasional: <strong className="text-emerald-600">🟢 Ready 100%</strong>
            </div>
          </div>
        </div>

        {/* TABEL PERBANDINGAN RINCIAN ANGGARAN PER ARMADA */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-3 p-5">
          <div className="flex justify-between items-center border-b pb-3 border-slate-100">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Rincian Anggaran & Jam Terbang Per Armada
              </h3>
              <p className="text-[11px] text-slate-500">
                Alokasi BBM, Maintenance, serta Target Jam Terbang (KM) per unit
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-900 text-white font-bold">
                <tr>
                  <th className="p-3">Plat Nomor & Model</th>
                  <th className="p-3">Odometer</th>
                  <th className="p-3">Target KM (Bln)</th>
                  <th className="p-3">Anggaran BBM</th>
                  <th className="p-3">Anggaran Servis</th>
                  <th className="p-3">Total Anggaran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vehicles.map((v) => {
                  const fB = Number(v.monthly_budget) || 0
                  const sB = Number(v.monthly_service_budget) || 500000
                  const tB = fB + sB
                  const targetKm = Number(v.target_km_monthly) || 2000

                  return (
                    <tr key={v.id} className="hover:bg-slate-50 transition">
                      <td className="p-3">
                        <strong className="text-slate-900 block">{v.plate_number}</strong>
                        <span className="text-[11px] text-slate-500">{v.model}</span>
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-800">
                        {(v.last_km || 0).toLocaleString('id-ID')} KM
                      </td>
                      <td className="p-3 font-mono">
                        <span className="bg-indigo-50 text-indigo-900 font-bold px-2 py-0.5 rounded-md border border-indigo-100">
                          🎯 {targetKm.toLocaleString('id-ID')} KM
                        </span>
                      </td>
                      <td className="p-3 font-mono font-bold text-amber-700">
                        Rp {fB.toLocaleString('id-ID')}
                      </td>
                      <td className="p-3 font-mono font-bold text-indigo-700">
                        Rp {sB.toLocaleString('id-ID')}
                      </td>
                      <td className="p-3 font-mono font-extrabold text-slate-900">
                        Rp {tB.toLocaleString('id-ID')}
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

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 text-white p-6">Memuat Dashboard Utama...</div>}>
      <DashboardContent />
    </Suspense>
  )
}