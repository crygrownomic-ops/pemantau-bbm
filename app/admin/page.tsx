'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { PageHeader } from '@/components/ui/PageHeader'
import { Icon, type IconName } from '@/components/ui/Icon'
import { Modal } from '@/components/ui/Modal'
import { QualityGauge, TrendChart, type TrendPoint } from '@/components/ui/Charts'
import { useFleet } from '@/components/providers/FleetProvider'
import { FuelLogsTable } from '@/components/admin/FuelLogsTable'
import { ReimbursementTab } from '@/components/admin/ReimbursementTab'
import { DriverScorecardTab } from '@/components/admin/DriverScorecardTab'
import { AnalyticsTab } from '@/components/admin/AnalyticsTab'
import { MaintenanceTab } from '@/components/admin/MaintenanceTab'
import { aggregateQuality, efficiencyOf, isAnomalous, summarizeVehicleQuality } from '@/lib/fuel'
import { daysUntil, formatCompactCurrency, formatCurrency, formatNumber, MONTH_NAMES } from '@/lib/format'
import { downloadFile, fleetSummaryCsv } from '@/lib/export'

type TabKey = 'dashboard' | 'reimbursement' | 'scorecard' | 'analytics' | 'maintenance'

function KpiCard({
  label,
  value,
  hint,
  icon,
  tone = 'navy',
  badge,
}: {
  label: string
  value: string
  hint: string
  icon: IconName
  tone?: 'navy' | 'gold' | 'green' | 'red'
  badge?: string
}) {
  const toneClass = {
    navy: 'bg-navy-50 text-navy-800',
    gold: 'bg-gold-50 text-gold-700',
    green: 'bg-emerald-50 text-emerald-700',
    red: 'bg-rose-50 text-rose-700',
  }[tone]

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="stat-label">{label}</p>
        <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${toneClass}`}>
          <Icon name={icon} className="h-3.5 w-3.5" />
        </span>
      </div>
      <p className="stat-value mt-2">{value}</p>
      <div className="mt-1.5 flex items-center justify-between gap-2">
        <p className="text-[10px] font-medium leading-tight text-slate-500">{hint}</p>
        {badge && <span className="badge badge-slate shrink-0">{badge}</span>}
      </div>
    </div>
  )
}

function gradeFor(score: number) {
  if (score >= 92) return { label: 'Sangat Efisien', tone: 'badge-green', color: 'text-emerald-700' }
  if (score >= 78) return { label: 'Normal', tone: 'badge-blue', color: 'text-navy-700' }
  if (score >= 60) return { label: 'Perlu Perhatian', tone: 'badge-amber', color: 'text-amber-700' }
  return { label: 'Kritis', tone: 'badge-red', color: 'text-rose-700' }
}

function DashboardView() {
  const { data } = useFleet()
  const [month, setMonth] = useState('ALL')
  const [year, setYear] = useState(() => String(new Date().getFullYear()))
  const [vehicleFilter, setVehicleFilter] = useState('ALL')
  const [legalOpen, setLegalOpen] = useState(false)

  if (!data) return null

  const years = Array.from(
    new Set([
      ...data.fuelLogs.map((log) => log.date?.slice(0, 4)).filter(Boolean),
      ...data.serviceHistory.map((record) => record.date?.slice(0, 4)).filter(Boolean),
      String(new Date().getFullYear()),
    ])
  ).sort()

  const logsInPeriod = data.fuelLogs.filter((log) => {
    if (!log.date) return false
    const [logYear, logMonth] = log.date.split('-')
    return (year === 'ALL' || logYear === year) && (month === 'ALL' || logMonth === month)
  })

  const filteredLogs = logsInPeriod.filter((log) => vehicleFilter === 'ALL' || log.plate_number === vehicleFilter)

  const servicesInPeriod = data.serviceHistory.filter((record) => {
    if (!record.date) return false
    const [recordYear, recordMonth] = record.date.split('-')
    return (year === 'ALL' || recordYear === year) && (month === 'ALL' || recordMonth === month)
  })

  const claimsInPeriod = data.reimbursementClaims.filter((claim) => {
    if (!claim.date || claim.status !== 'APPROVED') return false
    const [claimYear, claimMonth] = claim.date.split('-')
    return (year === 'ALL' || claimYear === year) && (month === 'ALL' || claimMonth === month)
  })

  const monthsInPeriod = new Set(logsInPeriod.map((log) => log.date?.slice(0, 7)).filter(Boolean)).size || 1
  const fuelBudget = data.vehicles.reduce((total, vehicle) => total + (Number(vehicle.monthly_budget) || 0), 0) * monthsInPeriod

  const fuelSpend = filteredLogs.reduce((total, log) => total + (Number(log.total_cost) || 0), 0)
  const serviceSpend = servicesInPeriod.reduce((total, record) => total + (Number(record.cost) || 0), 0)
  const claimSpend = claimsInPeriod.reduce((total, claim) => total + (Number(claim.amount) || 0), 0)
  const totalOperational = fuelSpend + serviceSpend + claimSpend

  const quality = aggregateQuality(filteredLogs, data.vehicles)
  const grade = gradeFor(quality.avgScore)
  const vehicleMap = new Map(data.vehicles.map((vehicle) => [vehicle.plate_number, vehicle]))
  const anomalies = filteredLogs.filter((log) => isAnomalous(log, vehicleMap.get(log.plate_number)))
  const pendingClaims = data.reimbursementClaims.filter((claim) => claim.status === 'PENDING')

  const baselineAvg =
    data.vehicles.length > 0
      ? data.vehicles.reduce((total, vehicle) => total + (Number(vehicle.baseline_km_per_liter) || 0), 0) / data.vehicles.length
      : 0

  const summaries = data.vehicles
    .map((vehicle) => summarizeVehicleQuality(vehicle, filteredLogs))
    .sort((a, b) => a.qualityScore - b.qualityScore)

  const trendYear = year === 'ALL' ? String(new Date().getFullYear()) : year
  const trend: TrendPoint[] = MONTH_NAMES.map((label, index) => {
    const monthKey = String(index + 1).padStart(2, '0')
    const monthLogs = data.fuelLogs.filter((log) => log.date?.startsWith(`${trendYear}-${monthKey}`))
    const monthServices = data.serviceHistory.filter((record) => record.date?.startsWith(`${trendYear}-${monthKey}`))
    const monthClaims = data.reimbursementClaims.filter(
      (claim) => claim.date?.startsWith(`${trendYear}-${monthKey}`) && claim.status === 'APPROVED'
    )
    return {
      label: label.slice(0, 3),
      fuel: monthLogs.reduce((total, log) => total + (Number(log.total_cost) || 0), 0),
      service: monthServices.reduce((total, record) => total + (Number(record.cost) || 0), 0),
      claims: monthClaims.reduce((total, claim) => total + (Number(claim.amount) || 0), 0),
    }
  })

  const legalAlerts = data.vehicles
    .flatMap((vehicle) => {
      const kir = daysUntil(vehicle.kir_expiry)
      const stnk = daysUntil(vehicle.stnk_expiry)
      const driver = data.drivers.find((item) => item.assigned_vehicle === vehicle.plate_number)
      const items: Array<{ plate: string; model: string; kind: string; date: string; days: number; driver?: string; phone?: string }> = []
      if (kir !== null && kir <= 60) items.push({ plate: vehicle.plate_number, model: vehicle.model, kind: 'KIR', date: vehicle.kir_expiry, days: kir, driver: driver?.name, phone: driver?.phone })
      if (stnk !== null && stnk <= 60) items.push({ plate: vehicle.plate_number, model: vehicle.model, kind: 'STNK', date: vehicle.stnk_expiry, days: stnk, driver: driver?.name, phone: driver?.phone })
      return items
    })
    .sort((a, b) => a.days - b.days)

  const exportSummary = () => {
    downloadFile(
      `Ringkasan_FleetOps_${year}-${month}_${new Date().toISOString().slice(0, 10)}.csv`,
      fleetSummaryCsv(data.vehicles, filteredLogs, servicesInPeriod)
    )
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Control Center"
        title="Kualitas Konsumsi BBM"
        description={`${data.settings.company_name} · verifikasi efisiensi, anggaran, dan anomali operasional armada dalam satu tampilan.`}
        actions={
          <>
            <button type="button" onClick={() => setLegalOpen(true)} className="btn btn-ghost">
              <Icon name="shield" className="h-3.5 w-3.5" />
              Legalitas
              {legalAlerts.length > 0 && <span className="badge badge-amber">{legalAlerts.length}</span>}
            </button>
            <button type="button" onClick={exportSummary} className="btn btn-primary">
              <Icon name="download" className="h-3.5 w-3.5" />
              Unduh laporan
            </button>
          </>
        }
      />

      <div className="card p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
            <Icon name="filter" className="h-3.5 w-3.5 text-slate-400" />
            Periode analisis
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
            <select
              value={vehicleFilter}
              onChange={(event) => setVehicleFilter(event.target.value)}
              className="input w-auto py-2 font-semibold"
            >
              <option value="ALL">Semua armada</option>
              {data.vehicles.map((vehicle) => (
                <option key={vehicle.plate_number} value={vehicle.plate_number}>
                  {vehicle.plate_number}
                </option>
              ))}
            </select>
            <span className="badge badge-slate">{filteredLogs.length} transaksi</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Skor Kualitas"
          value={`${quality.avgScore}/100`}
          hint={`Target kualitas ${data.settings.quality_target}`}
          icon="gauge"
          tone={quality.avgScore >= 78 ? 'green' : quality.avgScore >= 60 ? 'gold' : 'red'}
          badge={grade.label}
        />
        <KpiCard
          label="Biaya BBM"
          value={formatCompactCurrency(fuelSpend)}
          hint={`Anggaran ${formatCompactCurrency(fuelBudget)} · ${fuelBudget > 0 ? Math.round((fuelSpend / fuelBudget) * 100) : 0}% terpakai`}
          icon="fuel"
          tone="gold"
        />
        <KpiCard
          label="Efisiensi Rata-rata"
          value={`${quality.avgEfficiency} KM/L`}
          hint={`Baseline armada ${baselineAvg.toFixed(1)} KM/L`}
          icon="chart"
          tone={quality.avgEfficiency >= baselineAvg * 0.9 ? 'green' : 'gold'}
          badge={`${quality.avgEfficiency >= baselineAvg ? '+' : ''}${baselineAvg > 0 ? Math.round(((quality.avgEfficiency - baselineAvg) / baselineAvg) * 100) : 0}%`}
        />
        <KpiCard
          label="Anomali BBM"
          value={`${anomalies.length}`}
          hint={`${pendingClaims.length} klaim menunggu verifikasi`}
          icon="alert"
          tone={anomalies.length > 0 ? 'red' : 'green'}
          badge={anomalies.length > 0 ? 'Perlu audit' : 'Bersih'}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <section className="card xl:col-span-8">
          <div className="card-header">
            <div>
              <h2 className="card-title">Tren biaya operasional {trendYear}</h2>
              <p className="card-subtitle">Perbandingan biaya BBM, servis, dan klaim jalan per bulan</p>
            </div>
            <span className="badge badge-slate">{formatCompactCurrency(totalOperational)} total</span>
          </div>
          <div className="p-4">
            <TrendChart data={trend} />
          </div>
        </section>

        <section className="card xl:col-span-4">
          <div className="card-header">
            <div>
              <h2 className="card-title">Kesehatan konsumsi</h2>
              <p className="card-subtitle">Skor gabungan terhadap baseline armada</p>
            </div>
          </div>
          <div className="flex flex-col items-center gap-4 p-5">
            <QualityGauge score={quality.avgScore} size={148} />
            <div className="text-center">
              <span className={`badge ${grade.tone}`}>{grade.label}</span>
              <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
                {quality.avgScore >= data.settings.quality_target
                  ? 'Konsumsi armada berada pada batas kualitas yang ditetapkan manajemen.'
                  : `Masih ${Math.max(0, data.settings.quality_target - quality.avgScore)} poin di bawah target kualitas.`}
              </p>
            </div>
            <div className="grid w-full grid-cols-3 gap-2 border-t border-slate-100 pt-4 text-center">
              <div>
                <p className="stat-label">Jarak</p>
                <p className="mt-1 font-mono text-xs font-bold text-slate-800">{formatNumber(filteredLogs.reduce((total, log) => total + (Number(log.distance_km) || 0), 0))}</p>
                <p className="text-[9px] text-slate-400">KM</p>
              </div>
              <div>
                <p className="stat-label">Liter</p>
                <p className="mt-1 font-mono text-xs font-bold text-slate-800">{formatNumber(Math.round(filteredLogs.reduce((total, log) => total + (Number(log.liters) || 0), 0)))}</p>
                <p className="text-[9px] text-slate-400">LITER</p>
              </div>
              <div>
                <p className="stat-label">Anomali</p>
                <p className={`mt-1 font-mono text-xs font-bold ${anomalies.length ? 'text-rose-600' : 'text-emerald-600'}`}>{anomalies.length}</p>
                <p className="text-[9px] text-slate-400">TEMUAN</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <section className="card overflow-hidden xl:col-span-8">
          <div className="card-header">
            <div>
              <h2 className="card-title">Kualitas per armada</h2>
              <p className="card-subtitle">Diurutkan dari skor terendah agar prioritas audit terlihat</p>
            </div>
            <span className="badge badge-slate">{summaries.length} unit</span>
          </div>
          <div className="overflow-x-auto">
            <table className="table-base min-w-[720px]">
              <thead>
                <tr>
                  <th>Armada</th>
                  <th>KM/L</th>
                  <th>Baseline</th>
                  <th>Varians</th>
                  <th>Skor</th>
                  <th>Anomali</th>
                  <th className="text-right">Biaya BBM</th>
                  <th>Anggaran</th>
                </tr>
              </thead>
              <tbody>
                {summaries.map((summary) => {
                  const summaryGrade = gradeFor(summary.qualityScore)
                  return (
                    <tr key={summary.vehicle.id}>
                      <td>
                        <p className="font-bold text-slate-900">{summary.vehicle.plate_number}</p>
                        <p className="text-[10px] text-slate-400">{summary.vehicle.model}</p>
                      </td>
                      <td className="font-mono font-bold text-slate-800">{summary.avgEfficiency || '-'}</td>
                      <td className="font-mono text-slate-500">{summary.baseline}</td>
                      <td>
                        <span className={`font-mono text-[11px] font-bold ${summary.variancePct < -10 ? 'text-rose-600' : summary.variancePct > 5 ? 'text-emerald-600' : 'text-slate-600'}`}>
                          {summary.variancePct > 0 ? '+' : ''}
                          {summary.variancePct}%
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className={`font-mono text-xs font-bold ${summaryGrade.color}`}>{summary.qualityScore}</span>
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={`h-full rounded-full ${summary.qualityScore >= 78 ? 'bg-emerald-500' : summary.qualityScore >= 60 ? 'bg-gold-400' : 'bg-rose-500'}`}
                              style={{ width: `${Math.max(4, summary.qualityScore)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td>
                        {summary.anomalyCount > 0 ? (
                          <span className="badge badge-red">{summary.anomalyCount} temuan</span>
                        ) : (
                          <span className="badge badge-green">Bersih</span>
                        )}
                      </td>
                      <td className="text-right font-mono font-bold text-slate-900">{formatCurrency(summary.totalCost)}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-14 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={`h-full rounded-full ${summary.budgetUsagePct > 100 ? 'bg-rose-500' : summary.budgetUsagePct > 80 ? 'bg-gold-400' : 'bg-emerald-500'}`}
                              style={{ width: `${Math.min(100, Math.max(4, summary.budgetUsagePct))}%` }}
                            />
                          </div>
                          <span className="font-mono text-[10px] font-bold text-slate-500">{summary.budgetUsagePct}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {summaries.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-400">
                      Tidak ada armada pada filter ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card xl:col-span-4">
          <div className="card-header">
            <div>
              <h2 className="card-title">Perlu perhatian</h2>
              <p className="card-subtitle">Temuan yang memengaruhi kualitas BBM</p>
            </div>
            {anomalies.length > 0 && <span className="badge badge-red">{anomalies.length}</span>}
          </div>
          <div className="scroll-thin max-h-[380px] space-y-2 overflow-y-auto p-3">
            {anomalies.slice(0, 6).map((log) => (
              <div key={String(log.id)} className="rounded-xl border border-rose-100 bg-rose-50/60 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-extrabold text-rose-900">{log.plate_number}</p>
                    <p className="text-[10px] text-rose-700">{log.driver_name} · {log.date}</p>
                  </div>
                  <span className="badge badge-red">{efficiencyOf(log)} KM/L</span>
                </div>
                <p className="mt-1.5 text-[10px] leading-relaxed text-rose-700">
                  {log.audit_note || (log.fill_location === 'ECERAN' ? 'Pengisian eceran non-SPBU terdeteksi.' : 'Rasio konsumsi di bawah batas wajar armada.')}
                </p>
              </div>
            ))}
            {anomalies.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <Icon name="check" className="h-5 w-5" />
                </span>
                <p className="text-[11px] font-bold text-slate-700">Tidak ada anomali</p>
                <p className="max-w-[200px] text-[10px] leading-relaxed text-slate-400">
                  Semua transaksi pada periode ini berada dalam batas kualitas.
                </p>
              </div>
            )}

            {pendingClaims.length > 0 && (
              <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-3">
                <p className="text-[11px] font-extrabold text-amber-900">{pendingClaims.length} klaim menunggu</p>
                <p className="mt-0.5 text-[10px] text-amber-700">Buka modul Uang Jalan &amp; Klaim untuk memverifikasi nota driver.</p>
              </div>
            )}
          </div>
        </section>
      </div>

      <FuelLogsTable logs={filteredLogs} vehicles={data.vehicles} drivers={data.drivers} />

      <Modal
        open={legalOpen}
        onClose={() => setLegalOpen(false)}
        title="Pengingat legalitas armada"
        description="KIR dan STNK yang jatuh tempo dalam 60 hari ke depan."
        size="lg"
      >
        <div className="space-y-2">
          {legalAlerts.length === 0 ? (
            <p className="py-8 text-center text-xs text-slate-400">Seluruh dokumen armada masih dalam masa berlaku aman.</p>
          ) : (
            legalAlerts.map((item) => {
              const phone = (item.phone || '').replace(/\D/g, '').replace(/^0/, '62')
              const message = encodeURIComponent(
                `Pengingat legalitas ${item.kind} armada ${item.plate} (${item.model}) jatuh tempo ${item.date}. Mohon segera diproses.`
              )
              return (
                <div key={`${item.plate}-${item.kind}`} className="flex flex-col gap-2 rounded-xl border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-900">{item.plate} · {item.kind}</p>
                    <p className="text-[10px] text-slate-500">{item.model} · jatuh tempo {item.date} ({item.days < 0 ? `${Math.abs(item.days)} hari lewat` : `${item.days} hari lagi`})</p>
                  </div>
                  {phone ? (
                    <a href={`https://wa.me/${phone}?text=${message}`} target="_blank" rel="noreferrer" className="btn btn-ghost px-3 py-2 text-[10px]">
                      <Icon name="external" className="h-3 w-3" />
                      Ingatkan {item.driver}
                    </a>
                  ) : (
                    <span className="badge badge-slate">Tanpa kontak driver</span>
                  )}
                </div>
              )
            })
          )}
        </div>
      </Modal>
    </div>
  )
}

function AdminContent() {
  const searchParams = useSearchParams()
  const { data, loading, error, refresh } = useFleet()
  const tab = (searchParams.get('tab') as TabKey) || 'dashboard'

  if (loading && !data) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-64 animate-pulse rounded-lg bg-slate-200/70" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="card h-28 animate-pulse bg-slate-100" />
          ))}
        </div>
        <div className="card h-72 animate-pulse bg-slate-100" />
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="card mx-auto mt-10 max-w-md p-6 text-center">
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-rose-50 text-rose-600">
          <Icon name="alert" className="h-5 w-5" />
        </span>
        <h2 className="mt-3 text-sm font-extrabold text-slate-900">Data gagal dimuat</h2>
        <p className="mt-1 text-xs text-slate-500">{error}</p>
        <button type="button" onClick={() => void refresh()} className="btn btn-primary mt-4">
          <Icon name="refresh" className="h-3.5 w-3.5" />
          Coba lagi
        </button>
      </div>
    )
  }

  if (!data) return null

  if (tab === 'reimbursement') return <ReimbursementTab />
  if (tab === 'scorecard') return <DriverScorecardTab />
  if (tab === 'analytics') return <AnalyticsTab />
  if (tab === 'maintenance') return <MaintenanceTab />

  return <DashboardView />
}

export default function AdminDashboard() {
  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-slate-100" />}>
      <AdminContent />
    </Suspense>
  )
}
