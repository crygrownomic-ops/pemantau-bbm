'use client'

export function AnalyticsTab({ vehicleStats }: any) {
  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
        <h2 className="text-sm font-bold text-slate-900">Analisis Kinerja & Efisiensi BBM</h2>
        <p className="text-xs text-slate-500">Visualisasi statistik rasio efisiensi KM/L per armada kendaraan</p>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-slate-900 uppercase">Rasio Efisiensi Jarak Tempuh (KM / Liter)</h3>
        {vehicleStats.map((v: any) => (
          <div key={v.plate_number} className="space-y-1">
            <div className="flex justify-between text-xs font-semibold">
              <span>{v.plate_number} ({v.model})</span>
              <span className="font-bold text-emerald-700 font-mono">{v.efficiency} KM/L</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all"
                style={{ width: `${Math.min((v.efficiency / 35) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}