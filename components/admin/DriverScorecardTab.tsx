'use client'

import { useMemo, useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { PageHeader } from '@/components/ui/PageHeader'
import { useFleet } from '@/components/providers/FleetProvider'
import { downloadFile, toCsv } from '@/lib/export'
import { isAnomalous } from '@/lib/fuel'
import {
  clamp,
  formatCurrency,
  formatNumber,
  formatNumberInput,
  MONTH_NAMES,
  parseNumberInput,
} from '@/lib/format'

interface Tier {
  key: 'platinum' | 'gold' | 'silver' | 'supervision'
  label: string
  range: string
  badge: string
  ring: string
  accent: string
}

const TIERS: Tier[] = [
  {
    key: 'platinum',
    label: 'Platinum',
    range: 'Skor ≥ 85',
    badge: 'badge-green',
    ring: 'border-emerald-300 bg-emerald-50/50',
    accent: 'text-emerald-700',
  },
  {
    key: 'gold',
    label: 'Gold',
    range: 'Skor 70 – 84',
    badge: 'badge-amber',
    ring: 'border-gold-300 bg-gold-50/60',
    accent: 'text-gold-700',
  },
  {
    key: 'silver',
    label: 'Silver',
    range: 'Skor 55 – 69',
    badge: 'badge-blue',
    ring: 'border-navy-200 bg-navy-50/60',
    accent: 'text-navy-700',
  },
  {
    key: 'supervision',
    label: 'Perlu Bimbingan',
    range: 'Skor < 55',
    badge: 'badge-red',
    ring: 'border-rose-200 bg-rose-50/50',
    accent: 'text-rose-700',
  },
]

function tierFor(score: number): Tier {
  if (score >= 85) return TIERS[0]
  if (score >= 70) return TIERS[1]
  if (score >= 55) return TIERS[2]
  return TIERS[3]
}

export function DriverScorecardTab() {
  const { data, notify } = useFleet()
  const [month, setMonth] = useState('ALL')
  const [year, setYear] = useState(() => String(new Date().getFullYear()))
  const [bonusPlatinum, setBonusPlatinum] = useState('200.000')
  const [bonusGold, setBonusGold] = useState('100.000')
  const [bonusSilver, setBonusSilver] = useState('50.000')

  const bonusValues = useMemo(
    () => ({
      platinum: parseNumberInput(bonusPlatinum),
      gold: parseNumberInput(bonusGold),
      silver: parseNumberInput(bonusSilver),
    }),
    [bonusPlatinum, bonusGold, bonusSilver]
  )

  const years = useMemo(() => {
    const set = new Set<string>([String(new Date().getFullYear())])
    for (const log of data?.fuelLogs || []) if (log.date) set.add(log.date.slice(0, 4))
    for (const inspection of data?.inspections || []) if (inspection.date) set.add(inspection.date.slice(0, 4))
    return Array.from(set).sort()
  }, [data])

  const scorecard = useMemo(() => {
    if (!data) return []

    const inPeriod = (date?: string) => {
      if (!date) return false
      const [itemYear, itemMonth] = date.split('-')
      return (year === 'ALL' || itemYear === year) && (month === 'ALL' || itemMonth === month)
    }

    const logs = data.fuelLogs.filter((log) => inPeriod(log.date))
    const inspections = data.inspections.filter((inspection) => inPeriod(inspection.date))
    const vehicleMap = new Map(data.vehicles.map((vehicle) => [vehicle.plate_number, vehicle]))

    const globalBaseline =
      data.vehicles.length > 0
        ? data.vehicles.reduce((total, vehicle) => total + (Number(vehicle.baseline_km_per_liter) || 0), 0) /
          data.vehicles.length
        : 10

    const names = Array.from(
      new Set([
        ...data.drivers.map((driver) => driver.name),
        ...logs.map((log) => log.driver_name).filter(Boolean),
      ])
    )

    return names
      .map((name) => {
        const driverLogs = logs.filter(
          (log) => (log.driver_name || '').trim().toLowerCase() === name.trim().toLowerCase()
        )
        const driverInspections = inspections.filter(
          (inspection) => (inspection.driver_name || '').trim().toLowerCase() === name.trim().toLowerCase()
        )

        const totalKm = driverLogs.reduce((total, log) => total + (Number(log.distance_km) || 0), 0)
        const totalLiters = driverLogs.reduce((total, log) => total + (Number(log.liters) || 0), 0)
        const totalCost = driverLogs.reduce((total, log) => total + (Number(log.total_cost) || 0), 0)
        const avgKmL = totalLiters > 0 ? Number((totalKm / totalLiters).toFixed(2)) : 0

        const baselines = driverLogs
          .map((log) => Number(vehicleMap.get(log.plate_number)?.baseline_km_per_liter) || 0)
          .filter((value) => value > 0)
        const baseline =
          baselines.length > 0
            ? baselines.reduce((total, value) => total + value, 0) / baselines.length
            : globalBaseline

        const anomalyCount = driverLogs.filter((log) => isAnomalous(log, vehicleMap.get(log.plate_number))).length

        // 50 poin efisiensi terhadap baseline, 30 poin kepatuhan inspeksi, 20 poin integritas transaksi.
        const efficiencyScore =
          totalLiters > 0 && baseline > 0 ? clamp(Math.round((avgKmL / baseline) * 45), 0, 50) : 0
        const complianceRatio =
          driverLogs.length > 0 ? Math.min(1, driverInspections.length / driverLogs.length) : 0
        const complianceScore = Math.round(complianceRatio * 30)
        const integrityScore = Math.max(0, 20 - anomalyCount * 10)
        const totalScore = clamp(efficiencyScore + complianceScore + integrityScore, 0, 100)
        const tier = tierFor(totalScore)

        const bonus =
          tier.key === 'platinum'
            ? bonusValues.platinum
            : tier.key === 'gold'
              ? bonusValues.gold
              : tier.key === 'silver'
                ? bonusValues.silver
                : 0

        return {
          name,
          phone: data.drivers.find((driver) => driver.name === name)?.phone || '',
          assignedVehicle: data.drivers.find((driver) => driver.name === name)?.assigned_vehicle || '',
          logCount: driverLogs.length,
          inspectionCount: driverInspections.length,
          totalKm,
          totalLiters,
          totalCost,
          avgKmL,
          baseline: Number(baseline.toFixed(1)),
          anomalyCount,
          efficiencyScore,
          complianceScore,
          integrityScore,
          totalScore,
          tier,
          bonus,
        }
      })
      .sort((a, b) => b.totalScore - a.totalScore || b.totalKm - a.totalKm)
  }, [data, month, year, bonusValues])

  if (!data) return null

  const totalBonus = scorecard.reduce((total, driver) => total + driver.bonus, 0)
  const totalKm = scorecard.reduce((total, driver) => total + driver.totalKm, 0)
  const totalAnomalies = scorecard.reduce((total, driver) => total + driver.anomalyCount, 0)
  const activeDrivers = scorecard.filter((driver) => driver.logCount > 0).length
  const topDrivers = scorecard.filter((driver) => driver.totalScore > 0).slice(0, 3)

  const exportScorecard = () => {
    if (scorecard.length === 0) {
      notify('Belum ada data driver untuk diekspor.', 'info')
      return
    }
    const rows: unknown[][] = [
      ['RAPOR PERFORMA & BONUS DRIVER — FLEETOPS 360'],
      ['Periode', `${month === 'ALL' ? 'Semua bulan' : MONTH_NAMES[Number(month) - 1]} ${year === 'ALL' ? 'Semua tahun' : year}`],
      ['Dicetak', new Date().toLocaleString('id-ID')],
      [],
      [
        'Peringkat',
        'Driver',
        'Armada',
        'Trip',
        'Jarak (KM)',
        'Liter',
        'KM/L',
        'Baseline',
        'Inspeksi',
        'Anomali',
        'Skor Efisiensi',
        'Skor Kepatuhan',
        'Skor Integritas',
        'Skor Akhir',
        'Predikat',
        'Estimasi Bonus',
      ],
      ...scorecard.map((driver, index) => [
        index + 1,
        driver.name,
        driver.assignedVehicle,
        driver.logCount,
        driver.totalKm,
        Number(driver.totalLiters.toFixed(2)),
        driver.avgKmL,
        driver.baseline,
        driver.inspectionCount,
        driver.anomalyCount,
        driver.efficiencyScore,
        driver.complianceScore,
        driver.integrityScore,
        driver.totalScore,
        driver.tier.label,
        driver.bonus,
      ]),
    ]
    downloadFile(`Scorecard_Driver_${year}-${month}.csv`, toCsv(rows))
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="People & Reward Control"
        title="Scorecard Driver"
        description="Rapor efisiensi BBM, kepatuhan inspeksi harian, dan estimasi bonus eco-driving berbasis baseline tiap armada."
        actions={
          <>
            <button type="button" onClick={exportScorecard} className="btn btn-ghost">
              <Icon name="download" className="h-3.5 w-3.5" />
              Ekspor rapor
            </button>
            <span className="badge badge-slate">{activeDrivers} driver aktif</span>
          </>
        }
      />

      <div className="card flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
          <Icon name="filter" className="h-3.5 w-3.5 text-slate-400" />
          Periode evaluasi
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={month} onChange={(event) => setMonth(event.target.value)} className="input w-auto py-2 font-semibold">
            <option value="ALL">Semua bulan</option>
            {MONTH_NAMES.map((name, index) => (
              <option key={name} value={String(index + 1).padStart(2, '0')}>
                {name}
              </option>
            ))}
          </select>
          <select value={year} onChange={(event) => setYear(event.target.value)} className="input w-auto py-2 font-semibold">
            <option value="ALL">Semua tahun</option>
            {years.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <span className="badge badge-slate">{formatNumber(totalKm)} KM</span>
          <span className={`badge ${totalAnomalies > 0 ? 'badge-red' : 'badge-green'}`}>
            {totalAnomalies} anomali
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="card p-4">
          <div className="flex items-start justify-between">
            <p className="stat-label">Total bonus estimasi</p>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <Icon name="award" className="h-3.5 w-3.5" />
            </span>
          </div>
          <p className="stat-value mt-2 text-emerald-700">{formatCurrency(totalBonus)}</p>
          <p className="mt-1 text-[10px] font-medium text-slate-500">Berdasarkan plafon bonus di bawah</p>
        </div>
        <div className="card p-4">
          <div className="flex items-start justify-between">
            <p className="stat-label">Driver dievaluasi</p>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-navy-50 text-navy-800">
              <Icon name="users" className="h-3.5 w-3.5" />
            </span>
          </div>
          <p className="stat-value mt-2">{scorecard.length}</p>
          <p className="mt-1 text-[10px] font-medium text-slate-500">{activeDrivers} memiliki transaksi BBM</p>
        </div>
        <div className="card p-4">
          <div className="flex items-start justify-between">
            <p className="stat-label">Jarak terverifikasi</p>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gold-50 text-gold-700">
              <Icon name="gauge" className="h-3.5 w-3.5" />
            </span>
          </div>
          <p className="stat-value mt-2">{formatNumber(totalKm)}</p>
          <p className="mt-1 text-[10px] font-medium text-slate-500">Kilometer dari transaksi pada periode</p>
        </div>
        <div className="card p-4">
          <div className="flex items-start justify-between">
            <p className="stat-label">Temuan integritas</p>
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                totalAnomalies > 0 ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
              }`}
            >
              <Icon name="shield" className="h-3.5 w-3.5" />
            </span>
          </div>
          <p className={`stat-value mt-2 ${totalAnomalies > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
            {totalAnomalies}
          </p>
          <p className="mt-1 text-[10px] font-medium text-slate-500">
            {totalAnomalies > 0 ? 'Perlu klarifikasi driver' : 'Tidak ada anomali pada periode'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {topDrivers.map((driver, index) => (
          <div key={driver.name} className={`card border-2 p-4 ${driver.tier.ring}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-extrabold ${
                    index === 0
                      ? 'bg-gold-400 text-navy-950'
                      : index === 1
                        ? 'bg-navy-100 text-navy-800'
                        : 'bg-orange-100 text-orange-800'
                  }`}
                >
                  {index + 1}
                </span>
                <div>
                  <p className="text-sm font-extrabold text-navy-950">{driver.name}</p>
                  <p className="text-[10px] font-semibold text-slate-500">
                    {driver.assignedVehicle || 'Armada operasional'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-mono text-xl font-bold text-navy-950">{driver.totalScore}</p>
                <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Poin</p>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/60 pt-3 text-[11px]">
              <div>
                <p className="stat-label">Efisiensi</p>
                <p className={`mt-0.5 font-mono font-bold ${driver.tier.accent}`}>{driver.avgKmL} KM/L</p>
              </div>
              <div className="text-right">
                <p className="stat-label">Estimasi bonus</p>
                <p className="mt-0.5 font-mono font-bold text-emerald-700">{formatCurrency(driver.bonus)}</p>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <span className={`badge ${driver.tier.badge}`}>{driver.tier.label}</span>
              <span className="text-[10px] font-semibold text-slate-500">
                {driver.inspectionCount}/{driver.logCount} inspeksi
              </span>
            </div>
          </div>
        ))}
        {topDrivers.length === 0 && (
          <div className="card col-span-full flex flex-col items-center gap-2 p-10 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <Icon name="award" className="h-5 w-5" />
            </span>
            <p className="text-xs font-bold text-slate-700">Belum ada transaksi pada periode ini</p>
            <p className="max-w-sm text-[11px] leading-relaxed text-slate-400">
              Scorecard akan terisi otomatis setelah driver mengirim laporan BBM melalui portal driver.
            </p>
          </div>
        )}
      </div>

      <section className="card">
        <div className="card-header flex-col gap-2 sm:flex-row sm:items-center">
          <div>
            <h2 className="card-title">Plafon bonus eco-driving</h2>
            <p className="card-subtitle">Nominal ini hanya estimasi perhitungan, bukan transaksi pembayaran.</p>
          </div>
          <span className="badge badge-slate">Per driver / bulan</span>
        </div>
        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-3">
          {TIERS.slice(0, 3).map((tier) => {
            const value =
              tier.key === 'platinum' ? bonusPlatinum : tier.key === 'gold' ? bonusGold : bonusSilver
            const setter =
              tier.key === 'platinum'
                ? setBonusPlatinum
                : tier.key === 'gold'
                  ? setBonusGold
                  : setBonusSilver
            return (
              <div key={tier.key} className={`rounded-xl border p-3 ${tier.ring}`}>
                <div className="flex items-center justify-between">
                  <span className={`badge ${tier.badge}`}>{tier.label}</span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{tier.range}</span>
                </div>
                <div className="relative mt-2 flex items-center">
                  <span className="absolute left-3 text-[11px] font-bold text-slate-400">Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={value}
                    onChange={(event) => setter(formatNumberInput(event.target.value))}
                    className="input py-2 pl-9 font-mono font-bold"
                    aria-label={`Plafon bonus ${tier.label}`}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="card-header flex-col gap-2 sm:flex-row sm:items-center">
          <div>
            <h2 className="card-title">Rapor seluruh driver</h2>
            <p className="card-subtitle">
              Skor = 50 efisiensi + 30 kepatuhan inspeksi + 20 integritas transaksi. Baseline mengikuti armada yang digunakan.
            </p>
          </div>
          <span className="badge badge-slate">{scorecard.length} driver</span>
        </div>

        <div className="scroll-thin max-h-[560px] overflow-auto">
          <table className="table-base min-w-[1040px]">
            <thead>
              <tr>
                <th className="w-10">#</th>
                <th>Driver</th>
                <th>Jarak</th>
                <th>KM/L</th>
                <th>Baseline</th>
                <th>Inspeksi</th>
                <th>Anomali</th>
                <th>Komponen skor</th>
                <th>Skor akhir</th>
                <th>Predikat</th>
                <th className="text-right">Estimasi bonus</th>
              </tr>
            </thead>
            <tbody>
              {scorecard.map((driver, index) => (
                <tr key={driver.name}>
                  <td className="font-mono text-[11px] font-bold text-slate-400">{index + 1}</td>
                  <td>
                    <p className="font-bold text-slate-900">{driver.name}</p>
                    <p className="text-[10px] text-slate-400">
                      {driver.assignedVehicle || 'Belum ada armada'} · {driver.logCount} trip
                    </p>
                  </td>
                  <td className="whitespace-nowrap font-mono text-slate-700">{formatNumber(driver.totalKm)} KM</td>
                  <td>
                    <span
                      className={`font-mono text-xs font-bold ${
                        driver.avgKmL >= driver.baseline
                          ? 'text-emerald-700'
                          : driver.avgKmL >= driver.baseline * 0.85
                            ? 'text-amber-700'
                            : 'text-rose-700'
                      }`}
                    >
                      {driver.avgKmL || '-'}
                    </span>
                  </td>
                  <td className="font-mono text-slate-500">{driver.baseline}</td>
                  <td>
                    <span className="badge badge-slate">
                      {driver.inspectionCount}/{driver.logCount}
                    </span>
                  </td>
                  <td>
                    {driver.anomalyCount > 0 ? (
                      <span className="badge badge-red">{driver.anomalyCount} temuan</span>
                    ) : (
                      <span className="badge badge-green">Bersih</span>
                    )}
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-slate-500">
                      <span title="Efisiensi" className="rounded bg-navy-50 px-1.5 py-0.5 text-navy-700">
                        {driver.efficiencyScore}
                      </span>
                      <span title="Kepatuhan" className="rounded bg-gold-50 px-1.5 py-0.5 text-gold-700">
                        {driver.complianceScore}
                      </span>
                      <span title="Integritas" className="rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-700">
                        {driver.integrityScore}
                      </span>
                    </div>
                  </td>
                  <td className="font-mono text-sm font-bold text-navy-950">{driver.totalScore}</td>
                  <td>
                    <span className={`badge ${driver.tier.badge}`}>{driver.tier.label}</span>
                  </td>
                  <td className="text-right font-mono font-bold text-emerald-700">{formatCurrency(driver.bonus)}</td>
                </tr>
              ))}
              {scorecard.length === 0 && (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    Belum ada driver atau transaksi pada periode ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/60 px-4 py-3 text-[11px] font-semibold text-slate-500">
          <span>
            Total estimasi bonus:{' '}
            <span className="font-mono font-bold text-slate-800">{formatCurrency(totalBonus)}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Icon name="shield" className="h-3 w-3 text-slate-400" />
            Anomali dihitung dari status audit, pengisian eceran, dan rasio di bawah baseline.
          </span>
        </div>
      </section>
    </div>
  )
}

export default DriverScorecardTab
