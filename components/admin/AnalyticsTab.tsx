'use client'

import { useMemo, useState } from 'react'
import { Icon, type IconName } from '@/components/ui/Icon'
import { PageHeader } from '@/components/ui/PageHeader'
import { TrendChart, type TrendPoint } from '@/components/ui/Charts'
import { useFleet } from '@/components/providers/FleetProvider'
import { downloadFile, toCsv } from '@/lib/export'
import { isAnomalous } from '@/lib/fuel'
import {
  formatCompactCurrency,
  formatCurrency,
  formatNumber,
  MONTH_NAMES,
  MONTH_SHORT,
} from '@/lib/format'

type SubTab = 'overview' | 'vehicles' | 'drivers' | 'maintenance'

const SUB_TABS: Array<{ key: SubTab; label: string; icon: IconName }> = [
  { key: 'overview', label: 'Tren TCO', icon: 'chart' },
  { key: 'vehicles', label: 'Matrix armada', icon: 'truck' },
  { key: 'drivers', label: 'Performa driver', icon: 'users' },
  { key: 'maintenance', label: 'Kategori servis', icon: 'wrench' },
]

function Kpi({
  label,
  value,
  hint,
  icon,
  tone = 'navy',
}: {
  label: string
  value: string
  hint: string
  icon: IconName
  tone?: 'navy' | 'gold' | 'green' | 'red'
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
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${toneClass}`}>
          <Icon name={icon} className="h-3.5 w-3.5" />
        </span>
      </div>
      <p className="stat-value mt-2 text-[1.15rem]">{value}</p>
      <p className="mt-1 text-[10px] font-medium leading-tight text-slate-500">{hint}</p>
    </div>
  )
}

function tcoTone(costPerKm: number) {
  if (costPerKm <= 0) return { label: 'Belum ada data', badge: 'badge-slate' }
  if (costPerKm < 1200) return { label: 'Sangat efisien', badge: 'badge-green' }
  if (costPerKm <= 2200) return { label: 'Normal', badge: 'badge-amber' }
  return { label: 'Perlu evaluasi', badge: 'badge-red' }
}

export function AnalyticsTab() {
  const { data, notify } = useFleet()
  const [month, setMonth] = useState('ALL')
  const [year, setYear] = useState(() => String(new Date().getFullYear()))
  const [subTab, setSubTab] = useState<SubTab>('overview')

  const years = useMemo(() => {
    const set = new Set<string>([String(new Date().getFullYear())])
    for (const item of [
      ...(data?.fuelLogs || []),
      ...(data?.serviceHistory || []),
      ...(data?.reimbursementClaims || []),
    ]) {
      if (item.date) set.add(item.date.slice(0, 4))
    }
    return Array.from(set).sort()
  }, [data])

  const view = useMemo(() => {
    const logs = data?.fuelLogs || []
    const services = data?.serviceHistory || []
    const claims = data?.reimbursementClaims || []
    const vehicles = data?.vehicles || []
    const drivers = data?.drivers || []

    const inPeriod = (date?: string) => {
      if (!date) return false
      const [itemYear, itemMonth] = date.split('-')
      return (year === 'ALL' || itemYear === year) && (month === 'ALL' || itemMonth === month)
    }

    const filteredLogs = logs.filter((log) => inPeriod(log.date))
    const filteredServices = services.filter((record) => inPeriod(record.date))
    const filteredClaims = claims.filter((claim) => claim.status === 'APPROVED' && inPeriod(claim.date))
    const pendingClaims = claims.filter((claim) => claim.status === 'PENDING')

    const fuelCost = filteredLogs.reduce((total, log) => total + (Number(log.total_cost) || 0), 0)
    const serviceCost = filteredServices.reduce((total, record) => total + (Number(record.cost) || 0), 0)
    const claimCost = filteredClaims.reduce((total, claim) => total + (Number(claim.amount) || 0), 0)
    const totalCost = fuelCost + serviceCost + claimCost

    const totalKm = filteredLogs.reduce((total, log) => total + (Number(log.distance_km) || 0), 0)
    const totalLiters = filteredLogs.reduce((total, log) => total + (Number(log.liters) || 0), 0)
    const avgEfficiency = totalLiters > 0 ? Number((totalKm / totalLiters).toFixed(2)) : 0
    const costPerKm = totalKm > 0 ? Math.round(totalCost / totalKm) : 0
    const costPerLiter = totalLiters > 0 ? Math.round(fuelCost / totalLiters) : 0

    const vehicleMap = new Map(vehicles.map((vehicle) => [vehicle.plate_number, vehicle]))
    const anomalies = filteredLogs.filter((log) => isAnomalous(log, vehicleMap.get(log.plate_number)))

    const trendYear = year === 'ALL' ? String(new Date().getFullYear()) : year
    const trend: TrendPoint[] = MONTH_SHORT.map((label, index) => {
      const key = String(index + 1).padStart(2, '0')
      const monthLogs = logs.filter((log) => log.date?.startsWith(`${trendYear}-${key}`))
      const monthServices = services.filter((record) => record.date?.startsWith(`${trendYear}-${key}`))
      const monthClaims = claims.filter(
        (claim) => claim.status === 'APPROVED' && claim.date?.startsWith(`${trendYear}-${key}`)
      )
      return {
        label,
        fuel: monthLogs.reduce((total, log) => total + (Number(log.total_cost) || 0), 0),
        service: monthServices.reduce((total, record) => total + (Number(record.cost) || 0), 0),
        claims: monthClaims.reduce((total, claim) => total + (Number(claim.amount) || 0), 0),
      }
    })

    const monthly = MONTH_NAMES.map((name, index) => {
      const key = String(index + 1).padStart(2, '0')
      const monthLogs = filteredLogs.filter((log) => log.date?.slice(5, 7) === key)
      const monthServices = filteredServices.filter((record) => record.date?.slice(5, 7) === key)
      const monthClaims = filteredClaims.filter((claim) => claim.date?.slice(5, 7) === key)
      const fuel = monthLogs.reduce((total, log) => total + (Number(log.total_cost) || 0), 0)
      const service = monthServices.reduce((total, record) => total + (Number(record.cost) || 0), 0)
      const claim = monthClaims.reduce((total, item) => total + (Number(item.amount) || 0), 0)
      const km = monthLogs.reduce((total, log) => total + (Number(log.distance_km) || 0), 0)
      return { name, fuel, service, claim, total: fuel + service + claim, km, logs: monthLogs.length }
    })

    const perVehicle = vehicles.map((vehicle) => {
      const vehicleLogs = filteredLogs.filter((log) => log.plate_number === vehicle.plate_number)
      const vehicleServices = filteredServices.filter((record) => record.plate_number === vehicle.plate_number)
      const vehicleClaims = filteredClaims.filter((claim) => claim.plate_number === vehicle.plate_number)
      const fuel = vehicleLogs.reduce((total, log) => total + (Number(log.total_cost) || 0), 0)
      const service = vehicleServices.reduce((total, record) => total + (Number(record.cost) || 0), 0)
      const claim = vehicleClaims.reduce((total, item) => total + (Number(item.amount) || 0), 0)
      const km = vehicleLogs.reduce((total, log) => total + (Number(log.distance_km) || 0), 0)
      const liters = vehicleLogs.reduce((total, log) => total + (Number(log.liters) || 0), 0)
      const total = fuel + service + claim
      return {
        vehicle,
        fuel,
        service,
        claim,
        total,
        km,
        liters,
        efficiency: liters > 0 ? Number((km / liters).toFixed(2)) : 0,
        costPerKm: km > 0 ? Math.round(total / km) : 0,
        anomalies: vehicleLogs.filter((log) => isAnomalous(log, vehicle)).length,
      }
    })

    const perDriver = drivers
      .map((driver) => {
        const driverLogs = filteredLogs.filter((log) => log.driver_name === driver.name)
        const km = driverLogs.reduce((total, log) => total + (Number(log.distance_km) || 0), 0)
        const liters = driverLogs.reduce((total, log) => total + (Number(log.liters) || 0), 0)
        const fuel = driverLogs.reduce((total, log) => total + (Number(log.total_cost) || 0), 0)
        return {
          driver,
          trips: driverLogs.length,
          km,
          liters,
          fuel,
          efficiency: liters > 0 ? Number((km / liters).toFixed(2)) : 0,
          anomalies: driverLogs.filter((log) => isAnomalous(log, vehicleMap.get(log.plate_number))).length,
        }
      })
      .sort((a, b) => b.km - a.km)

    const categoryMap = new Map<string, { cost: number; count: number }>()
    for (const record of filteredServices) {
      const key = record.category || 'Lainnya'
      const current = categoryMap.get(key) || { cost: 0, count: 0 }
      categoryMap.set(key, { cost: current.cost + (Number(record.cost) || 0), count: current.count + 1 })
    }
    const categories = Array.from(categoryMap.entries())
      .map(([label, value]) => ({ label, ...value }))
      .sort((a, b) => b.cost - a.cost)

    return {
      filteredLogs,
      filteredServices,
      filteredClaims,
      pendingClaims,
      fuelCost,
      serviceCost,
      claimCost,
      totalCost,
      totalKm,
      totalLiters,
      avgEfficiency,
      costPerKm,
      costPerLiter,
      anomalies,
      trend,
      trendYear,
      monthly,
      perVehicle,
      perDriver,
      categories,
      vehicles,
      drivers,
    }
  }, [data, month, year])

  if (!data) return null

  const periodLabel = `${month === 'ALL' ? 'Semua bulan' : MONTH_NAMES[Number(month) - 1]} ${
    year === 'ALL' ? 'semua tahun' : year
  }`

  const exportTco = () => {
    if (view.perVehicle.length === 0) {
      notify('Belum ada data armada untuk diekspor.', 'info')
      return
    }
    const rows: unknown[][] = [
      ['LAPORAN TCO & EFISIENSI ARMADA — FLEETOPS 360'],
      ['Periode', periodLabel],
      ['Dicetak', new Date().toLocaleString('id-ID')],
      [],
      ['Plat', 'Model', 'Jarak (KM)', 'Liter', 'KM/L', 'Biaya BBM', 'Biaya Servis', 'Klaim Jalan', 'Total TCO', 'Biaya per KM', 'Anomali'],
      ...view.perVehicle.map((item) => [
        item.vehicle.plate_number,
        item.vehicle.model,
        item.km,
        Number(item.liters.toFixed(2)),
        item.efficiency,
        item.fuel,
        item.service,
        item.claim,
        item.total,
        item.costPerKm,
        item.anomalies,
      ]),
      [],
      ['KATEGORI SERVIS', 'Jumlah', 'Biaya'],
      ...view.categories.map((category) => [category.label, category.count, category.cost]),
    ]
    downloadFile(`Analytics_TCO_${year}-${month}.csv`, toCsv(rows))
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Executive Intelligence"
        title="Analytics & Total Cost of Ownership"
        description="Analisis biaya BBM, pemeliharaan, klaim jalan, dan efisiensi per kilometer untuk seluruh armada."
        actions={
          <>
            <button type="button" onClick={exportTco} className="btn btn-ghost">
              <Icon name="download" className="h-3.5 w-3.5" />
              Ekspor TCO
            </button>
            <span className="badge badge-slate">{periodLabel}</span>
          </>
        }
      />

      <div className="card flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
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
          <span className="badge badge-slate">{view.filteredLogs.length} transaksi BBM</span>
          <span className={`badge ${view.anomalies.length > 0 ? 'badge-red' : 'badge-green'}`}>
            {view.anomalies.length} anomali
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi
          label="Biaya BBM"
          value={formatCompactCurrency(view.fuelCost)}
          hint={`${formatCurrency(view.costPerLiter)} per liter`}
          icon="fuel"
          tone="gold"
        />
        <Kpi
          label="Biaya servis"
          value={formatCompactCurrency(view.serviceCost)}
          hint={`${view.filteredServices.length} pengerjaan`}
          icon="wrench"
          tone="navy"
        />
        <Kpi
          label="Klaim jalan"
          value={formatCompactCurrency(view.claimCost)}
          hint={`${view.filteredClaims.length} klaim disetujui`}
          icon="receipt"
          tone="green"
        />
        <Kpi
          label="Total TCO"
          value={formatCompactCurrency(view.totalCost)}
          hint="BBM + servis + klaim"
          icon="database"
          tone="navy"
        />
        <Kpi
          label="Jarak tempuh"
          value={`${formatNumber(view.totalKm)} KM`}
          hint={`${formatNumber(Math.round(view.totalLiters))} liter terpakai`}
          icon="gauge"
          tone="navy"
        />
        <Kpi
          label="Efisiensi rata-rata"
          value={`${view.avgEfficiency || 0} KM/L`}
          hint="Dihitung dari seluruh transaksi BBM"
          icon="chart"
          tone={view.avgEfficiency > 0 ? 'green' : 'red'}
        />
        <Kpi
          label="Biaya per KM"
          value={formatCurrency(view.costPerKm)}
          hint="Total TCO dibagi jarak tempuh"
          icon="spark"
          tone="gold"
        />
        <Kpi
          label="Armada & driver"
          value={`${view.vehicles.length} / ${view.drivers.length}`}
          hint={`${view.pendingClaims.length} klaim menunggu verifikasi`}
          icon="truck"
          tone="navy"
        />
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-slate-200">
        {SUB_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setSubTab(tab.key)}
            className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-[11px] font-extrabold transition ${
              subTab === tab.key
                ? 'border-navy-900 text-navy-950'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Icon name={tab.icon} className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {subTab === 'overview' && (
        <div className="space-y-4">
          <section className="card">
            <div className="card-header">
              <div>
                <h2 className="card-title">Tren biaya operasional {view.trendYear}</h2>
                <p className="card-subtitle">Perbandingan biaya BBM, servis, dan klaim jalan per bulan.</p>
              </div>
              <span className="badge badge-slate">{formatCompactCurrency(view.totalCost)} periode ini</span>
            </div>
            <div className="p-4">
              <TrendChart data={view.trend} />
            </div>
          </section>

          <section className="card overflow-hidden">
            <div className="card-header">
              <div>
                <h2 className="card-title">Rincian TCO bulanan</h2>
                <p className="card-subtitle">Kosong berarti belum ada transaksi pada bulan tersebut.</p>
              </div>
              <span className="badge badge-slate">{periodLabel}</span>
            </div>
            <div className="scroll-thin max-h-[460px] overflow-auto">
              <table className="table-base min-w-[720px]">
                <thead>
                  <tr>
                    <th>Bulan</th>
                    <th>Transaksi</th>
                    <th className="text-right">BBM</th>
                    <th className="text-right">Servis</th>
                    <th className="text-right">Klaim</th>
                    <th className="text-right">Total TCO</th>
                    <th className="text-right">Jarak</th>
                  </tr>
                </thead>
                <tbody>
                  {view.monthly.map((item) => (
                    <tr key={item.name} className={item.total === 0 ? 'opacity-55' : ''}>
                      <td className="font-bold text-slate-900">{item.name}</td>
                      <td className="font-mono text-[11px] text-slate-500">{item.logs}</td>
                      <td className="text-right font-mono text-gold-700">{formatCurrency(item.fuel)}</td>
                      <td className="text-right font-mono text-navy-700">{formatCurrency(item.service)}</td>
                      <td className="text-right font-mono text-emerald-700">{formatCurrency(item.claim)}</td>
                      <td className="text-right font-mono font-bold text-slate-900">{formatCurrency(item.total)}</td>
                      <td className="text-right font-mono text-slate-500">{formatNumber(item.km)} KM</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {subTab === 'vehicles' && (
        <section className="card overflow-hidden">
          <div className="card-header">
            <div>
              <h2 className="card-title">Matrix TCO per armada</h2>
              <p className="card-subtitle">Evaluasi biaya operasional gabungan terhadap jarak tempuh aktual.</p>
            </div>
            <span className="badge badge-slate">{view.perVehicle.length} unit</span>
          </div>
          <div className="scroll-thin max-h-[560px] overflow-auto">
            <table className="table-base min-w-[960px]">
              <thead>
                <tr>
                  <th>Armada</th>
                  <th className="text-right">Jarak</th>
                  <th className="text-right">KM/L</th>
                  <th className="text-right">BBM</th>
                  <th className="text-right">Servis</th>
                  <th className="text-right">Klaim</th>
                  <th className="text-right">Total TCO</th>
                  <th className="text-right">Biaya / KM</th>
                  <th>Evaluasi</th>
                </tr>
              </thead>
              <tbody>
                {view.perVehicle.map((item) => {
                  const tone = tcoTone(item.costPerKm)
                  return (
                    <tr key={item.vehicle.id}>
                      <td>
                        <p className="font-bold text-slate-900">{item.vehicle.plate_number}</p>
                        <p className="text-[10px] text-slate-400">{item.vehicle.model}</p>
                      </td>
                      <td className="text-right font-mono text-slate-600">{formatNumber(item.km)} KM</td>
                      <td>
                        <span
                          className={`font-mono text-xs font-bold ${
                            item.efficiency >= Number(item.vehicle.baseline_km_per_liter)
                              ? 'text-emerald-700'
                              : item.efficiency > 0
                                ? 'text-amber-700'
                                : 'text-slate-400'
                          }`}
                        >
                          {item.efficiency || '-'}
                        </span>
                      </td>
                      <td className="text-right font-mono text-gold-700">{formatCurrency(item.fuel)}</td>
                      <td className="text-right font-mono text-navy-700">{formatCurrency(item.service)}</td>
                      <td className="text-right font-mono text-emerald-700">{formatCurrency(item.claim)}</td>
                      <td className="text-right font-mono font-bold text-slate-900">{formatCurrency(item.total)}</td>
                      <td className="text-right font-mono font-bold text-slate-800">
                        {item.costPerKm > 0 ? formatCurrency(item.costPerKm) : '-'}
                      </td>
                      <td>
                        <div className="flex flex-col items-start gap-1">
                          <span className={`badge ${tone.badge}`}>{tone.label}</span>
                          {item.anomalies > 0 && <span className="text-[9px] font-bold text-rose-600">{item.anomalies} anomali BBM</span>}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {subTab === 'drivers' && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {view.perDriver.map((item) => (
            <div key={item.driver.id} className="card p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-extrabold text-navy-950">{item.driver.name}</p>
                  <p className="text-[10px] font-semibold text-slate-500">
                    {item.driver.assigned_vehicle || 'Tanpa armada tetap'}
                  </p>
                </div>
                <span className="badge badge-slate">{item.trips} trip</span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                <div>
                  <p className="stat-label">Biaya BBM</p>
                  <p className="mt-0.5 font-mono text-xs font-bold text-gold-700">{formatCurrency(item.fuel)}</p>
                </div>
                <div>
                  <p className="stat-label">Jarak</p>
                  <p className="mt-0.5 font-mono text-xs font-bold text-slate-800">{formatNumber(item.km)} KM</p>
                </div>
                <div>
                  <p className="stat-label">Efisiensi</p>
                  <p
                    className={`mt-0.5 font-mono text-xs font-bold ${
                      item.efficiency > 0 ? 'text-emerald-700' : 'text-slate-400'
                    }`}
                  >
                    {item.efficiency || '-'} KM/L
                  </p>
                </div>
                <div>
                  <p className="stat-label">Anomali</p>
                  <p className={`mt-0.5 font-mono text-xs font-bold ${item.anomalies > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {item.anomalies}
                  </p>
                </div>
              </div>
            </div>
          ))}
          {view.perDriver.length === 0 && (
            <div className="card col-span-full p-10 text-center text-xs text-slate-400">
              Belum ada driver pada master data.
            </div>
          )}
        </div>
      )}

      {subTab === 'maintenance' && (
        <section className="card overflow-hidden">
          <div className="card-header">
            <div>
              <h2 className="card-title">Distribusi biaya pemeliharaan</h2>
              <p className="card-subtitle">Kategori pengerjaan dengan biaya terbesar pada periode terpilih.</p>
            </div>
            <span className="badge badge-slate">{formatCurrency(view.serviceCost)}</span>
          </div>
          <div className="space-y-3 p-4">
            {view.categories.map((category) => {
              const share = view.serviceCost > 0 ? Math.round((category.cost / view.serviceCost) * 100) : 0
              return (
                <div key={category.label} className="rounded-xl border border-slate-200 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[11px] font-extrabold text-slate-900">{category.label}</p>
                      <p className="text-[10px] text-slate-500">{category.count} pengerjaan</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-xs font-bold text-slate-900">{formatCurrency(category.cost)}</p>
                      <p className="text-[10px] font-semibold text-slate-400">{share}% dari total</p>
                    </div>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-gold-400" style={{ width: `${Math.max(2, share)}%` }} />
                  </div>
                </div>
              )
            })}
            {view.categories.length === 0 && (
              <div className="py-10 text-center text-xs text-slate-400">
                Belum ada catatan servis pada periode ini.
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  )
}

export default AnalyticsTab
