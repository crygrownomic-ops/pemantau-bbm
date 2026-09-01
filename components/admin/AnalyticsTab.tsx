'use client'

import React from 'react'

interface VehicleStat {
  plate_number: string
  model: string
  efficiency: number
  spentCost: number
}

interface AnalyticsTabProps {
  vehicleStats: VehicleStat[]
  totalCost: number
}

export default function AnalyticsTab({ vehicleStats, totalCost }: AnalyticsTabProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
        <h2 className="text-sm font-bold text-slate-900">Analisis Kinerja & Efisiensi Konsumsi BBM</h2>
        <p className="text-xs text-slate-500">
          Visualisasi statistik rasio efisiensi KM/L dan distribusi pengeluaran biaya BBM per kendaraan
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* GRAFIK EFISIENSI KM/L */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Perbandingan Efisiensi Armada (KM/Liter)
          </h3>
          <div className="space-y-4 pt-2">
            {vehicleStats.map((v) => {
              const eff = v.efficiency
              const maxEff = 15
              const percent = Math.min(Math.round((eff / maxEff) * 100), 100)
              const isBoros = eff < 8

              return (
                <div key={v.plate_number} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>
                      {v.plate_number} ({v.model})
                    </span>
                    <span className={isBoros ? 'text-rose-600 font-bold' : 'text-emerald-700 font-bold'}>
                      {eff} KM/L
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-3 rounded-full transition-all duration-700 ${
                        isBoros ? 'bg-gradient-to-r from-rose-500 to-red-600' : 'bg-gradient-to-r from-emerald-500 to-teal-600'
                      }`}
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* GRAFIK DISTRIBUSI BIAYA */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Alokasi Biaya BBM Per Kendaraan
          </h3>
          <div className="space-y-4 pt-2">
            {vehicleStats.map((v) => {
              const costShare = totalCost > 0 ? Math.round((v.spentCost / totalCost) * 100) : 0

              return (
                <div key={v.plate_number} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>{v.plate_number}</span>
                    <span className="font-mono text-slate-700">
                      Rp {v.spentCost.toLocaleString('id-ID')} ({costShare}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-3 rounded-full bg-gradient-to-r from-indigo-500 to-blue-600 transition-all duration-700"
                      style={{ width: `${costShare}%` }}
                    ></div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}