'use client'

import { useMemo, useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Icon, type IconName } from '@/components/ui/Icon'
import { useFleet } from '@/components/providers/FleetProvider'
import { formatCurrency, formatNumber, MONTH_NAMES } from '@/lib/format'
import { buildMonthlyReport, resolvePeriod, type ReportDriverRow } from '@/lib/reports'

function tierBadge(tier: ReportDriverRow['tier']): string {
  if (tier === 'Platinum') return 'badge-green'
  if (tier === 'Gold') return 'badge-amber'
  if (tier === 'Silver') return 'badge-blue'
  return 'badge-red'
}

function SummaryCard({
  label,
  value,
  hint,
  icon,
  tone = 'navy',
}: {
  label: string
  value: string
  hint?: string
  icon: IconName
  tone?: 'navy' | 'gold' | 'emerald' | 'rose'
}) {
  const toneClass = {
    navy: 'bg-navy-50 text-navy-800',
    gold: 'bg-gold-50 text-gold-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    rose: 'bg-rose-50 text-rose-700',
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
      {hint && <p className="mt-1 text-[10px] font-medium text-slate-500">{hint}</p>}
    </div>
  )
}

function ProgressBar({ value }: { value: number }) {
  const width = Math.min(100, Math.max(0, value))
  const tone = value > 100 ? 'bg-rose-500' : value > 85 ? 'bg-amber-400' : 'bg-emerald-500'
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-full min-w-[54px] overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${width}%` }} />
      </div>
      <span className={`font-mono text-[10px] font-bold ${value > 100 ? 'text-rose-600' : 'text-slate-500'}`}>
        {value}%
      </span>
    </div>
  )
}

export function ReportsView() {
  const { data, notify } = useFleet()
  const now = useMemo(() => new Date(), [])
  const [month, setMonth] = useState(String(now.getMonth() + 1).padStart(2, '0'))
  const [year, setYear] = useState(String(now.getFullYear()))
  const [downloading, setDownloading] = useState<'csv' | 'pdf' | null>(null)

  const years = useMemo(() => {
    const set = new Set<string>([String(now.getFullYear())])
    for (const log of data?.fuelLogs || []) if (log.date) set.add(log.date.slice(0, 4))
    for (const record of data?.serviceHistory || []) if (record.date) set.add(record.date.slice(0, 4))
    for (const claim of data?.reimbursementClaims || []) if (claim.date) set.add(claim.date.slice(0, 4))
    return Array.from(set).sort().reverse()
  }, [data, now])

  const period = useMemo(() => resolvePeriod(year, month), [year, month])

  const report = useMemo(() => {
    if (!data) return null
    return buildMonthlyReport(data, period)
  }, [data, period])

  const download = async (format: 'csv' | 'pdf') => {
    if (downloading) return
    setDownloading(format)
    try {
      const response = await fetch(
        `/api/reports/monthly?year=${period.year}&month=${period.month}&format=${format}`,
        { credentials: 'same-origin' }
      )
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null
        throw new Error(payload?.message || 'Gagal mengunduh laporan.')
      }
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Laporan-Bulanan-${period.year}-${String(period.month).padStart(2, '0')}.${format}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      notify(`Laporan ${format.toUpperCase()} berhasil diunduh.`, 'success')
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Gagal mengunduh laporan.', 'error')
    } finally {
      setDownloading(null)
    }
  }

  if (!data || !report) {
    return (
      <div className="card flex items-center gap-3 p-6 text-xs font-bold text-slate-500">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-navy-800" />
        Menyiapkan laporan…
      </div>
    )
  }

  return (
    <div className="report-print space-y-5">
      <PageHeader
        eyebrow="Reporting & Audit"
        title="Laporan Bulanan"
        description="Rekap konsumsi BBM, biaya servis, klaim perjalanan, inspeksi, dan performa driver dalam satu dokumen siap cetak."
        actions={
          <div className="no-print flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => window.print()} className="btn btn-ghost">
              <Icon name="print" className="h-3.5 w-3.5" />
              Cetak
            </button>
            <button type="button" onClick={() => void download('csv')} disabled={downloading !== null} className="btn btn-ghost">
              <Icon name="download" className={`h-3.5 w-3.5 ${downloading === 'csv' ? 'animate-pulse' : ''}`} />
              CSV
            </button>
            <button type="button" onClick={() => void download('pdf')} disabled={downloading !== null} className="btn btn-gold">
              <Icon name="fileText" className={`h-3.5 w-3.5 ${downloading === 'pdf' ? 'animate-pulse' : ''}`} />
              {downloading === 'pdf' ? 'Menyusun PDF…' : 'Unduh PDF'}
            </button>
          </div>
        }
      />

      <div className="no-print card flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
          <Icon name="calendar" className="h-3.5 w-3.5 text-slate-400" />
          Periode laporan
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={month} onChange={(event) => setMonth(event.target.value)} className="input w-auto py-2 font-semibold">
            {MONTH_NAMES.map((name, index) => (
              <option key={name} value={String(index + 1).padStart(2, '0')}>
                {name}
              </option>
            ))}
          </select>
          <select value={year} onChange={(event) => setYear(event.target.value)} className="input w-auto py-2 font-semibold">
            {years.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <span className="badge badge-slate">{report.period.label}</span>
          <span className="badge badge-slate">{report.fuel.trips} transaksi</span>
        </div>
      </div>

      <div className="hidden items-end justify-between border-b-2 border-navy-950 pb-3 print:flex">
        <div>
          <p className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-gold-600">FleetOps 360</p>
          <h1 className="mt-1 text-xl font-extrabold text-navy-950">Laporan Bulanan Operasional Armada</h1>
          <p className="mt-1 text-[11px] text-slate-500">
            {report.company.name} · Periode {report.period.label}
          </p>
        </div>
        <p className="text-[10px] text-slate-500">
          Dibuat {new Date(report.generatedAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Total biaya operasional"
          value={formatCurrency(report.totals.grandTotal)}
          hint={`${report.totals.budgetUsagePct}% dari anggaran bulanan`}
          icon="creditCard"
          tone={report.totals.budgetUsagePct > 100 ? 'rose' : 'navy'}
        />
        <SummaryCard
          label="Biaya BBM"
          value={formatCurrency(report.totals.fuelCost)}
          hint={`${formatNumber(report.fuel.liters)} liter · ${report.fuel.trips} transaksi`}
          icon="fuel"
          tone="gold"
        />
        <SummaryCard
          label="Servis & klaim"
          value={formatCurrency(report.totals.serviceCost + report.totals.claimCost)}
          hint={`${report.service.count} servis · ${report.claims.approved} klaim disetujui`}
          icon="wrench"
        />
        <SummaryCard
          label="Efisiensi armada"
          value={`${formatNumber(report.fuel.avgKmL)} KM/L`}
          hint={`${formatNumber(report.totals.distanceKm)} KM · ${report.fuel.anomalyCount} anomali`}
          icon="gauge"
          tone={report.fuel.anomalyCount > 0 ? 'rose' : 'emerald'}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
        <section className="card overflow-hidden">
          <div className="card-header">
            <div>
              <p className="card-title">Rekapitulasi per armada</p>
              <p className="card-subtitle">Total biaya mencakup BBM dan servis pada periode terpilih.</p>
            </div>
            <span className="badge badge-slate">{report.vehicles.length} armada</span>
          </div>

          <div className="overflow-x-auto">
            <table className="table-base min-w-[860px]">
              <thead>
                <tr>
                  <th>Armada</th>
                  <th className="text-right">Trip</th>
                  <th className="text-right">Jarak</th>
                  <th className="text-right">BBM</th>
                  <th className="text-right">Servis</th>
                  <th className="text-right">Total</th>
                  <th className="text-right">KM/L</th>
                  <th>Anggaran</th>
                  <th className="text-center">Anomali</th>
                </tr>
              </thead>
              <tbody>
                {report.vehicles.map((vehicle) => (
                  <tr key={vehicle.plate_number}>
                    <td>
                      <p className="font-mono text-[11px] font-extrabold text-navy-950">{vehicle.plate_number}</p>
                      <p className="max-w-[190px] truncate text-[10px] text-slate-400">
                        {vehicle.model}
                        {vehicle.drivers ? ` · ${vehicle.drivers}` : ''}
                      </p>
                    </td>
                    <td className="text-right font-mono">{vehicle.trips}</td>
                    <td className="whitespace-nowrap text-right font-mono">{formatNumber(vehicle.distanceKm)} KM</td>
                    <td className="whitespace-nowrap text-right font-mono">{formatCurrency(vehicle.fuelCost)}</td>
                    <td className="whitespace-nowrap text-right font-mono">{formatCurrency(vehicle.serviceCost)}</td>
                    <td className="whitespace-nowrap text-right font-mono font-bold text-navy-950">
                      {formatCurrency(vehicle.totalCost)}
                    </td>
                    <td className="text-right font-mono">
                      <span
                        className={
                          vehicle.avgKmL <= 0
                            ? 'text-slate-400'
                            : vehicle.avgKmL >= vehicle.baseline
                              ? 'font-bold text-emerald-700'
                              : vehicle.avgKmL >= vehicle.baseline * 0.85
                                ? 'font-bold text-amber-700'
                                : 'font-bold text-rose-700'
                        }
                      >
                        {vehicle.avgKmL > 0 ? formatNumber(vehicle.avgKmL) : '-'}
                      </span>
                    </td>
                    <td className="min-w-[110px]">
                      <ProgressBar value={vehicle.budgetUsagePct} />
                    </td>
                    <td className="text-center">
                      {vehicle.anomalyCount > 0 ? (
                        <span className="badge badge-red">{vehicle.anomalyCount}</span>
                      ) : (
                        <span className="badge badge-green">Bersih</span>
                      )}
                    </td>
                  </tr>
                ))}
                {report.vehicles.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-slate-400">
                      Belum ada armada terdaftar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <div className="space-y-4">
          <section className="card">
            <div className="card-header">
              <div>
                <p className="card-title">Inspeksi & klaim</p>
                <p className="card-subtitle">Kepatuhan harian dan verifikasi biaya jalan.</p>
              </div>
            </div>
            <div className="space-y-3 p-4">
              <div>
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <Icon name="shield" className="h-3.5 w-3.5 text-slate-400" />
                    Kepatuhan inspeksi
                  </span>
                  <span className="font-mono text-navy-950">{report.inspections.coveragePct}%</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${report.inspections.coveragePct >= 80 ? 'bg-emerald-500' : report.inspections.coveragePct >= 50 ? 'bg-amber-400' : 'bg-rose-500'}`}
                    style={{ width: `${Math.min(100, report.inspections.coveragePct)}%` }}
                  />
                </div>
                <p className="mt-1.5 text-[10px] text-slate-400">
                  {report.inspections.total} inspeksi · {report.inspections.ready} siap jalan ·{' '}
                  {report.inspections.needsAttention} perlu perhatian
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                <div className="rounded-lg bg-slate-50 px-3 py-2">
                  <p className="stat-label">Klaim disetujui</p>
                  <p className="mt-0.5 font-mono text-xs font-bold text-slate-800">{formatCurrency(report.claims.approvedAmount)}</p>
                  <p className="text-[10px] text-slate-400">{report.claims.approved} klaim</p>
                </div>
                <div className="rounded-lg bg-slate-50 px-3 py-2">
                  <p className="stat-label">Menunggu verifikasi</p>
                  <p className="mt-0.5 font-mono text-xs font-bold text-amber-700">{formatCurrency(report.claims.pendingAmount)}</p>
                  <p className="text-[10px] text-slate-400">{report.claims.pending} klaim</p>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-[11px] font-bold text-slate-600">
                <span>Anggaran bulanan armada</span>
                <span className="font-mono text-navy-950">{formatCurrency(report.totals.budget)}</span>
              </div>
            </div>
          </section>

          <section className="card">
            <div className="card-header">
              <div>
                <p className="card-title">Catatan otomatis</p>
                <p className="card-subtitle">Temuan yang perlu ditindaklanjuti manajemen.</p>
              </div>
            </div>
            <ul className="space-y-2.5 p-4">
              {report.insights.map((insight) => (
                <li key={insight} className="flex items-start gap-2 text-[11px] leading-relaxed text-slate-600">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-400" />
                  {insight}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      <section className="card overflow-hidden">
        <div className="card-header">
          <div>
            <p className="card-title">Rapor performa driver</p>
            <p className="card-subtitle">
              Skor = 50 efisiensi + 30 kepatuhan inspeksi + 20 integritas transaksi.
            </p>
          </div>
          <span className="badge badge-slate">{report.drivers.length} driver</span>
        </div>

        <div className="overflow-x-auto">
          <table className="table-base min-w-[900px]">
            <thead>
              <tr>
                <th className="w-10">#</th>
                <th>Driver</th>
                <th className="text-right">Trip</th>
                <th className="text-right">Jarak</th>
                <th className="text-right">KM/L</th>
                <th className="text-right">Baseline</th>
                <th className="text-center">Inspeksi</th>
                <th className="text-center">Anomali</th>
                <th className="text-center">Komponen skor</th>
                <th className="text-center">Skor</th>
                <th>Predikat</th>
              </tr>
            </thead>
            <tbody>
              {report.drivers.map((driver, index) => (
                <tr key={driver.name}>
                  <td className="font-mono text-[11px] font-bold text-slate-400">{index + 1}</td>
                  <td>
                    <p className="font-bold text-slate-900">{driver.name}</p>
                    <p className="text-[10px] text-slate-400">{driver.assignedVehicle || 'Belum ada armada'}</p>
                  </td>
                  <td className="text-right font-mono">{driver.trips}</td>
                  <td className="whitespace-nowrap text-right font-mono">{formatNumber(driver.distanceKm)} KM</td>
                  <td className="text-right font-mono font-bold">
                    <span
                      className={
                        driver.avgKmL <= 0
                          ? 'text-slate-400'
                          : driver.avgKmL >= driver.baseline
                            ? 'text-emerald-700'
                            : driver.avgKmL >= driver.baseline * 0.85
                              ? 'text-amber-700'
                              : 'text-rose-700'
                      }
                    >
                      {driver.avgKmL > 0 ? formatNumber(driver.avgKmL) : '-'}
                    </span>
                  </td>
                  <td className="text-right font-mono text-slate-500">{formatNumber(driver.baseline)}</td>
                  <td className="text-center">
                    <span className="badge badge-slate">
                      {driver.inspectionCount}/{driver.trips}
                    </span>
                  </td>
                  <td className="text-center">
                    {driver.anomalyCount > 0 ? (
                      <span className="badge badge-red">{driver.anomalyCount}</span>
                    ) : (
                      <span className="badge badge-green">Bersih</span>
                    )}
                  </td>
                  <td>
                    <div className="flex items-center justify-center gap-1 font-mono text-[10px] font-bold">
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
                  <td className="text-center font-mono text-sm font-bold text-navy-950">{driver.totalScore}</td>
                  <td>
                    <span className={`badge ${tierBadge(driver.tier)}`}>{driver.tier}</span>
                  </td>
                </tr>
              ))}
              {report.drivers.length === 0 && (
                <tr>
                  <td colSpan={11} className="py-10 text-center text-slate-400">
                    Belum ada driver atau transaksi pada periode ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-3 text-[10px] font-semibold text-slate-500">
          Laporan dihasilkan dari data transaksi yang tercatat. PDF dan CSV mengikuti periode yang dipilih di atas.
        </div>
      </section>
    </div>
  )
}

export default ReportsView
