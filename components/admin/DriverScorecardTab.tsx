'use client'

import { useState } from 'react'

export function DriverScorecardTab({
  drivers = [],
  logs = [],
  inspections = [],
}: {
  drivers: any[]
  logs: any[]
  inspections: any[]
}) {
  const [bonusPlatinum, setBonusPlatinum] = useState(200000)
  const [bonusGold, setBonusGold] = useState(100000)
  const [bonusSilver, setBonusSilver] = useState(50000)

  // Menggabungkan daftar driver dari master data dan yang ada di log
  const driverNames = Array.from(
    new Set([
      ...drivers.map((d) => d.name),
      ...logs.map((l) => l.driver_name).filter(Boolean),
    ])
  )

  // Hitung Skor & Performa Masing-Masing Driver
  const scorecardData = driverNames.map((name) => {
    const driverLogs = logs.filter((l) => l.driver_name === name)
    const driverInspections = inspections.filter((i) => i.driver_name === name)

    const totalKm = driverLogs.reduce((acc, l) => acc + (Number(l.distance_km) || 0), 0)
    const totalLiters = driverLogs.reduce((acc, l) => acc + (Number(l.liters) || 0), 0)
    const avgKmL = totalLiters > 0 ? Number((totalKm / totalLiters).toFixed(2)) : 0

    const anomalyCount = driverLogs.filter(
      (l) => l.fill_location === 'ECERAN' || l.status === 'FLAGGED'
    ).length

    // 1. Skor Efisiensi BBM (0 - 50 Poin) - Standar baseline 10 KM/L
    let effScore = totalLiters > 0 ? Math.min(50, Math.round((avgKmL / 10) * 40)) : 25

    // 2. Skor Kepatuhan Pre-Trip Inspection (0 - 30 Poin)
    const inspectionRatio =
      driverLogs.length > 0 ? Math.min(1, driverInspections.length / driverLogs.length) : 1
    const compScore = Math.round(inspectionRatio * 30)

    // 3. Skor Integritas (0 - 20 Poin)
    const integrityScore = Math.max(0, 20 - anomalyCount * 10)

    const totalScore = effScore + compScore + integrityScore

    let predicate = 'Needs Supervision'
    let badge = '🔴 Perlu Bimbingan'
    let badgeStyle = 'bg-rose-100 text-rose-800 border-rose-300'
    let estimatedBonus = 0

    if (totalScore >= 85) {
      predicate = 'Platinum'
      badge = '🥇 Platinum Driver'
      badgeStyle = 'bg-amber-100 text-amber-900 border-amber-300 font-extrabold'
      estimatedBonus = bonusPlatinum
    } else if (totalScore >= 70) {
      predicate = 'Gold'
      badge = '🥈 Gold Driver'
      badgeStyle = 'bg-slate-200 text-slate-800 border-slate-300 font-extrabold'
      estimatedBonus = bonusGold
    } else if (totalScore >= 55) {
      predicate = 'Silver'
      badge = '🥉 Silver Driver'
      badgeStyle = 'bg-orange-100 text-orange-900 border-orange-300 font-bold'
      estimatedBonus = bonusSilver
    }

    return {
      name,
      totalKm,
      totalLiters,
      avgKmL,
      logCount: driverLogs.length,
      inspectionCount: driverInspections.length,
      anomalyCount,
      totalScore,
      predicate,
      badge,
      badgeStyle,
      estimatedBonus,
    }
  })

  // Urutkan berdasarkan Skor Tertinggi
  scorecardData.sort((a, b) => b.totalScore - a.totalScore)

  const totalBonusBudget = scorecardData.reduce((acc, d) => acc + d.estimatedBonus, 0)

  return (
    <div className="space-y-6 font-sans">
      {/* HEADER BAR */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-sm font-extrabold text-slate-900 tracking-wider uppercase flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            Driver Scorecard & Sistem Reward Eco-Driving
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Rapor efisiensi BBM, kepatuhan inspeksi harian, dan kalkulasi bonus insentif pengemudi
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 text-xs">
          <span className="font-bold text-slate-700">Total Anggaran Bonus:</span>
          <strong className="font-mono text-emerald-700 text-sm">
            Rp {totalBonusBudget.toLocaleString('id-ID')}
          </strong>
        </div>
      </div>

      {/* TOP 3 PODIUM LEADERBOARD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {scorecardData.slice(0, 3).map((driver, index) => {
          const rankIcon = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'
          const borderBg =
            index === 0
              ? 'border-amber-400 bg-amber-50/50'
              : index === 1
              ? 'border-slate-300 bg-slate-50/50'
              : 'border-orange-300 bg-orange-50/30'

          return (
            <div
              key={driver.name}
              className={`p-4 rounded-2xl border-2 ${borderBg} shadow-sm space-y-3 relative overflow-hidden`}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{rankIcon}</span>
                  <div>
                    <strong className="text-sm text-slate-900 block font-bold">{driver.name}</strong>
                    <span className="text-[10px] text-slate-500">Peringkat #{index + 1} Supir Terbaik</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xl font-mono font-black text-slate-900">{driver.totalScore}</span>
                  <span className="text-[9px] text-slate-400 block uppercase font-bold">Poin</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200/60 font-mono">
                <div>
                  <span className="text-[10px] text-slate-500 block">Rata-Rata KM/L</span>
                  <strong className="text-amber-800 font-bold">{driver.avgKmL} KM/L</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Estimasi Bonus</span>
                  <strong className="text-emerald-700 font-bold">
                    Rp {driver.estimatedBonus.toLocaleString('id-ID')}
                  </strong>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* REGULASI SETTING NOMINAL BONUS */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
          <span>⚙️</span> Pengaturan Nominal Bonus Eco-Driving (Plafon Per Bulan)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-amber-50/60 p-2.5 rounded-xl border border-amber-200">
            <label className="block text-[10px] font-bold text-amber-900 mb-1">🥇 Platinum (Skor ≥ 85)</label>
            <input
              type="number"
              className="w-full bg-white border p-1.5 rounded-lg font-mono font-bold text-slate-900 outline-none"
              value={bonusPlatinum}
              onChange={(e) => setBonusPlatinum(Number(e.target.value))}
            />
          </div>

          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <label className="block text-[10px] font-bold text-slate-800 mb-1">🥈 Gold (Skor 70 - 84)</label>
            <input
              type="number"
              className="w-full bg-white border p-1.5 rounded-lg font-mono font-bold text-slate-900 outline-none"
              value={bonusGold}
              onChange={(e) => setBonusGold(Number(e.target.value))}
            />
          </div>

          <div className="bg-orange-50/60 p-2.5 rounded-xl border border-orange-200">
            <label className="block text-[10px] font-bold text-orange-900 mb-1">🥉 Silver (Skor 55 - 69)</label>
            <input
              type="number"
              className="w-full bg-white border p-1.5 rounded-lg font-mono font-bold text-slate-900 outline-none"
              value={bonusSilver}
              onChange={(e) => setBonusSilver(Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      {/* TABEL DETAIL SCORECARD SELURUH DRIVER */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Tabel Evaluasi & Rapor Performa Seluruh Supir
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-900 text-white font-bold">
              <tr>
                <th className="p-3.5">Nama Supir</th>
                <th className="p-3.5 text-center">Total Jarak (KM)</th>
                <th className="p-3.5 text-center">Efisiensi (KM/L)</th>
                <th className="p-3.5 text-center">Inspeksi Siap Jalan</th>
                <th className="p-3.5 text-center">Klaim Anomali</th>
                <th className="p-3.5 text-center">Skor Akhir</th>
                <th className="p-3.5 text-center">Predikat</th>
                <th className="p-3.5 text-right">Hak Bonus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {scorecardData.map((d) => (
                <tr key={d.name} className="hover:bg-slate-50 transition">
                  <td className="p-3.5 font-bold text-slate-900">{d.name}</td>
                  <td className="p-3.5 text-center font-mono">{d.totalKm.toLocaleString('id-ID')} KM</td>
                  <td className="p-3.5 text-center font-mono font-bold text-amber-800">{d.avgKmL} KM/L</td>
                  <td className="p-3.5 text-center font-mono">
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-bold text-slate-700">
                      {d.inspectionCount} / {d.logCount} Trip
                    </span>
                  </td>
                  <td className="p-3.5 text-center font-mono">
                    {d.anomalyCount > 0 ? (
                      <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded text-[10px] font-bold">
                        ⚠️ {d.anomalyCount} Anomali
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-bold">🟢 0 (Bersih)</span>
                    )}
                  </td>
                  <td className="p-3.5 text-center font-mono text-sm font-black text-slate-900">
                    {d.totalScore}
                  </td>
                  <td className="p-3.5 text-center">
                    <span className={`px-2.5 py-1 rounded-xl text-[10px] border ${d.badgeStyle}`}>
                      {d.badge}
                    </span>
                  </td>
                  <td className="p-3.5 text-right font-mono font-extrabold text-emerald-700">
                    Rp {d.estimatedBonus.toLocaleString('id-ID')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default DriverScorecardTab