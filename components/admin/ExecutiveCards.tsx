'use client'

import React from 'react'
import { Icons } from '@/components/ui/Icons'

interface VehicleStat {
  plate_number: string
  model: string
  spentCost: number
  spentMaintenance: number
  totalOperationalCost: number
  usagePercent: number
  isOverBudget: boolean
  kir_expiry: string
  maintenance: {
    isKirCritical: boolean
    daysToKir: number
  }
}

interface ExecutiveCardsProps {
  totalCost: number
  avgKmPerLiter: string
  totalLiters: number
  totalMaintenanceCost: number
  vehicleStats: VehicleStat[]
}

export default function ExecutiveCards({
  totalCost,
  avgKmPerLiter,
  totalLiters,
  totalMaintenanceCost,
  vehicleStats,
}: ExecutiveCardsProps) {
  return (
    <div className="space-y-6">
      {/* 4 KARTU METRIK UTAMA */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white rounded-2xl shadow-lg relative overflow-hidden space-y-2 border border-indigo-500/30">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">Total Biaya BBM</span>
            <span className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
              <Icons.Price className="w-5 h-5" />
            </span>
          </div>
          <div className="text-2xl font-extrabold font-mono text-white">
            Rp {totalCost.toLocaleString('id-ID')}
          </div>
          <span className="text-[10px] font-medium text-indigo-100 block">Akumulasi Pengeluaran Bahan Bakar</span>
        </div>

        <div className="p-5 bg-gradient-to-br from-emerald-600 to-teal-800 text-white rounded-2xl shadow-lg relative overflow-hidden space-y-2 border border-emerald-500/30">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">Rata-Rata Efisiensi</span>
            <span className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
              <Icons.Fuel className="w-5 h-5" />
            </span>
          </div>
          <div className="text-2xl font-extrabold font-mono text-white">
            {avgKmPerLiter} <span className="text-xs font-sans font-medium text-emerald-100">KM/L</span>
          </div>
          <span className="text-[10px] font-medium text-emerald-100 block">Rasio Efisiensi Seluruh Armada</span>
        </div>

        <div className="p-5 bg-gradient-to-br from-amber-500 to-orange-600 text-slate-950 rounded-2xl shadow-lg relative overflow-hidden space-y-2 border border-amber-400/30">
          <div className="flex justify-between items-center">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-900">Total Konsumsi BBM</span>
            <span className="w-8 h-8 rounded-xl bg-slate-950/20 backdrop-blur-md text-slate-950 flex items-center justify-center">
              <Icons.Truck className="w-5 h-5" />
            </span>
          </div>
          <div className="text-2xl font-extrabold font-mono text-slate-950">
            {totalLiters.toLocaleString('id-ID')} <span className="text-xs font-sans font-semibold text-slate-800">Liter</span>
          </div>
          <span className="text-[10px] font-bold text-slate-900 block">Total Volume BBM Terdistribusi</span>
        </div>

        <div className="p-5 bg-gradient-to-br from-slate-800 to-slate-950 text-white rounded-2xl shadow-lg relative overflow-hidden space-y-2 border border-slate-700/50">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Biaya Maintenance & KIR</span>
            <span className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-amber-400">
              <Icons.Wrench className="w-5 h-5" />
            </span>
          </div>
          <div className="text-2xl font-extrabold font-mono text-amber-400">
            Rp {totalMaintenanceCost.toLocaleString('id-ID')}
          </div>
          <span className="text-[10px] font-medium text-slate-400 block">Total Servis, Perbaikan & Legalitas KIR</span>
        </div>
      </div>

      {/* EVALUASI ANGGARAN & OPERASIONAL PER ARMADA */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
        <div className="flex justify-between items-center border-b pb-3">
          <h2 className="text-xs font-extrabold text-slate-900 tracking-wider uppercase flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
            Realisasi Anggaran BBM & Total Pengeluaran Per Armada
          </h2>
          <span className="text-[11px] text-slate-500 font-medium">Pengeluaran BBM + Perbaikan/KIR</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {vehicleStats.map((v) => (
            <div key={v.plate_number} className="p-4 bg-gradient-to-b from-slate-50 to-slate-100/60 rounded-xl border border-slate-200/90 space-y-3 hover:shadow-md transition">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-extrabold text-xs text-slate-900">{v.plate_number}</div>
                  <div className="text-[11px] text-slate-500">{v.model}</div>
                </div>
                {v.isOverBudget ? (
                  <span className="bg-rose-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                    Exceeded
                  </span>
                ) : (
                  <span className="bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                    Normal
                  </span>
                )}
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-500 font-sans">Biaya BBM:</span>
                  <span className={v.isOverBudget ? 'text-rose-600 font-bold' : 'text-slate-900 font-semibold'}>
                    Rp {v.spentCost.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-500 font-sans">Perbaikan & KIR:</span>
                  <span className="text-amber-700 font-bold">
                    Rp {v.spentMaintenance.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between text-xs font-mono pt-1 border-t border-slate-200">
                  <span className="text-slate-900 font-extrabold font-sans">Total Operasional:</span>
                  <span className="text-indigo-900 font-extrabold">
                    Rp {v.totalOperationalCost.toLocaleString('id-ID')}
                  </span>
                </div>

                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden mt-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      v.isOverBudget ? 'bg-gradient-to-r from-rose-500 to-red-600' : 'bg-gradient-to-r from-indigo-500 to-blue-600'
                    }`}
                    style={{ width: `${v.usagePercent}%` }}
                  ></div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/80 flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Jatuh Tempo KIR:</span>
                <span className={`font-mono font-bold text-[11px] ${v.maintenance.isKirCritical ? 'text-rose-600' : 'text-slate-700'}`}>
                  {v.kir_expiry} ({v.maintenance.daysToKir} Hari)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}