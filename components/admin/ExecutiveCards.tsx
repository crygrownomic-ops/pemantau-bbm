'use client'

import { Icons } from './Icons'

export function ExecutiveCards({ totalCost, avgKmPerLiter, totalLiters, totalMaintenanceCost, vehicleStats }: any) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white rounded-2xl shadow-lg space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">Total Biaya BBM</span>
            <Icons.Price className="w-5 h-5 text-indigo-200" />
          </div>
          <div className="text-2xl font-extrabold font-mono">Rp {totalCost.toLocaleString('id-ID')}</div>
        </div>

        <div className="p-5 bg-gradient-to-br from-emerald-600 to-teal-800 text-white rounded-2xl shadow-lg space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">Rata-Rata Efisiensi</span>
            <Icons.Fuel className="w-5 h-5 text-emerald-200" />
          </div>
          <div className="text-2xl font-extrabold font-mono">{avgKmPerLiter} <span className="text-xs font-sans">KM/L</span></div>
        </div>

        <div className="p-5 bg-gradient-to-br from-amber-500 to-orange-600 text-slate-950 rounded-2xl shadow-lg space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-extrabold uppercase tracking-wider">Total Konsumsi BBM</span>
            <Icons.Truck className="w-5 h-5" />
          </div>
          <div className="text-2xl font-extrabold font-mono">{totalLiters.toLocaleString('id-ID')} <span className="text-xs font-sans">Liter</span></div>
        </div>

        <div className="p-5 bg-gradient-to-br from-slate-800 to-slate-950 text-white rounded-2xl shadow-lg space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Biaya Maintenance & KIR</span>
            <Icons.Wrench className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-amber-400">Rp {totalMaintenanceCost.toLocaleString('id-ID')}</div>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
        <div className="flex justify-between items-center border-b pb-3">
          <h2 className="text-xs font-extrabold text-slate-900 tracking-wider uppercase flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
            Realisasi Operasional & Batas Anggaran Bulanan
          </h2>
          <span className="text-[11px] text-slate-500 font-medium">Berdasarkan Pengisian & Servis Terkini</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {vehicleStats.map((v: any) => (
            <div key={v.plate_number} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold text-sm text-slate-900">{v.plate_number}</div>
                  <div className="text-xs text-slate-500">{v.model}</div>
                </div>
                {v.isOverBudget ? (
                  <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-rose-200">
                    ⚠️ Overbudget
                  </span>
                ) : (
                  <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                    ✓ Normal
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500 font-medium">Penggunaan Anggaran:</span>
                  <span className="font-mono font-bold text-slate-800">{v.usagePercent}%</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      v.usagePercent > 90 ? 'bg-rose-500' : v.usagePercent > 70 ? 'bg-amber-500' : 'bg-indigo-600'
                    }`}
                    style={{ width: `${Math.min(v.usagePercent, 100)}%` }}
                  ></div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/80 grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[10px]">Biaya BBM:</span>
                  <strong className="font-mono text-slate-800">Rp {(v.spentCost || 0).toLocaleString('id-ID')}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Servis / KIR:</span>
                  <strong className="font-mono text-slate-800">Rp {(v.spentMaintenance || 0).toLocaleString('id-ID')}</strong>
                </div>
              </div>

              <div className="pt-1 text-[11px] font-bold text-slate-900 border-t border-slate-200/80 flex justify-between">
                <span>Total Operasional:</span>
                <span className="font-mono text-indigo-900">Rp {(v.totalOperationalCost || 0).toLocaleString('id-ID')}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}