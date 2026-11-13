import { clamp, MONTH_NAMES } from './format'
import { isAnomalous } from './fuel'
import type { FleetDatabase } from './types'

export interface MonthlyPeriod {
  year: number
  month: number
  label: string
  start: string
  end: string
}

export interface ReportVehicleRow {
  plate_number: string
  model: string
  drivers: string
  trips: number
  distanceKm: number
  liters: number
  fuelCost: number
  serviceCost: number
  totalCost: number
  avgKmL: number
  baseline: number
  variancePct: number
  anomalyCount: number
  qualityScore: number
  budget: number
  budgetUsagePct: number
}

export interface ReportDriverRow {
  name: string
  assignedVehicle: string
  trips: number
  distanceKm: number
  liters: number
  avgKmL: number
  baseline: number
  anomalyCount: number
  inspectionCount: number
  efficiencyScore: number
  complianceScore: number
  integrityScore: number
  totalScore: number
  tier: 'Platinum' | 'Gold' | 'Silver' | 'Perlu Bimbingan'
}

export interface MonthlyReport {
  period: MonthlyPeriod
  generatedAt: string
  company: { name: string; short: string }
  fuel: {
    trips: number
    distanceKm: number
    liters: number
    cost: number
    avgKmL: number
    anomalyCount: number
    anomalyRatePct: number
    flagged: number
    pending: number
  }
  service: { count: number; cost: number }
  claims: {
    total: number
    approved: number
    pending: number
    rejected: number
    approvedAmount: number
    pendingAmount: number
  }
  inspections: {
    total: number
    ready: number
    needsAttention: number
    coveragePct: number
  }
  vehicles: ReportVehicleRow[]
  drivers: ReportDriverRow[]
  totals: {
    fuelCost: number
    serviceCost: number
    claimCost: number
    grandTotal: number
    budget: number
    budgetUsagePct: number
    distanceKm: number
    liters: number
  }
  insights: string[]
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

export function resolvePeriod(yearInput: string | number, monthInput: string | number): MonthlyPeriod {
  const now = new Date()
  const year = clamp(Number(yearInput) || now.getFullYear(), 2000, 2100)
  const month = clamp(Number(monthInput) || now.getMonth() + 1, 1, 12)
  const lastDay = new Date(year, month, 0).getDate()
  return {
    year,
    month,
    label: `${MONTH_NAMES[month - 1]} ${year}`,
    start: `${year}-${pad(month)}-01`,
    end: `${year}-${pad(month)}-${pad(lastDay)}`,
  }
}

function tierFor(score: number): ReportDriverRow['tier'] {
  if (score >= 85) return 'Platinum'
  if (score >= 70) return 'Gold'
  if (score >= 55) return 'Silver'
  return 'Perlu Bimbingan'
}

export function buildMonthlyReport(database: FleetDatabase, period: MonthlyPeriod): MonthlyReport {
  const inPeriod = (date: string | undefined): boolean => {
    if (!date) return false
    const day = date.slice(0, 10)
    return day >= period.start && day <= period.end
  }

  const vehicleMap = new Map(database.vehicles.map((vehicle) => [vehicle.plate_number, vehicle]))
  const logs = database.fuelLogs.filter((log) => inPeriod(log.date))
  const services = database.serviceHistory.filter((record) => inPeriod(record.date))
  const inspections = database.inspections.filter((inspection) => inPeriod(inspection.date))
  const claims = database.reimbursementClaims.filter((claim) => inPeriod(claim.date))

  const distanceKm = logs.reduce((total, log) => total + (Number(log.distance_km) || 0), 0)
  const liters = logs.reduce((total, log) => total + (Number(log.liters) || 0), 0)
  const fuelCost = logs.reduce((total, log) => total + (Number(log.total_cost) || 0), 0)
  const serviceCost = services.reduce((total, record) => total + (Number(record.cost) || 0), 0)
  const anomalyCount = logs.filter((log) => isAnomalous(log, vehicleMap.get(log.plate_number))).length

  const approvedClaims = claims.filter((claim) => claim.status === 'APPROVED')
  const pendingClaims = claims.filter((claim) => claim.status === 'PENDING')
  const rejectedClaims = claims.filter((claim) => claim.status === 'REJECTED')
  const approvedAmount = approvedClaims.reduce((total, claim) => total + (Number(claim.amount) || 0), 0)
  const pendingAmount = pendingClaims.reduce((total, claim) => total + (Number(claim.amount) || 0), 0)

  const vehicles: ReportVehicleRow[] = database.vehicles
    .map((vehicle) => {
      const vehicleLogs = logs.filter((log) => log.plate_number === vehicle.plate_number)
      const vehicleServices = services.filter((record) => record.plate_number === vehicle.plate_number)
      const vehicleKm = vehicleLogs.reduce((total, log) => total + (Number(log.distance_km) || 0), 0)
      const vehicleLiters = vehicleLogs.reduce((total, log) => total + (Number(log.liters) || 0), 0)
      const vehicleFuelCost = vehicleLogs.reduce((total, log) => total + (Number(log.total_cost) || 0), 0)
      const vehicleServiceCost = vehicleServices.reduce((total, record) => total + (Number(record.cost) || 0), 0)
      const avgKmL = vehicleLiters > 0 ? Number((vehicleKm / vehicleLiters).toFixed(2)) : 0
      const baseline = Number(vehicle.baseline_km_per_liter) || 0
      const variancePct = baseline > 0 && avgKmL > 0 ? Number((((avgKmL - baseline) / baseline) * 100).toFixed(1)) : 0
      const budget = (Number(vehicle.monthly_budget) || 0) + (Number(vehicle.monthly_service_budget) || 0)
      const totalCost = vehicleFuelCost + vehicleServiceCost
      const drivers = Array.from(
        new Set(vehicleLogs.map((log) => (log.driver_name || '').trim()).filter(Boolean))
      ).join(', ')

      return {
        plate_number: vehicle.plate_number,
        model: vehicle.model,
        drivers,
        trips: vehicleLogs.length,
        distanceKm: vehicleKm,
        liters: vehicleLiters,
        fuelCost: vehicleFuelCost,
        serviceCost: vehicleServiceCost,
        totalCost,
        avgKmL,
        baseline,
        variancePct,
        anomalyCount: vehicleLogs.filter((log) => isAnomalous(log, vehicle)).length,
        qualityScore: vehicleLiters > 0 ? clamp(Math.round((avgKmL / (baseline || 10)) * 100), 0, 100) : 0,
        budget,
        budgetUsagePct: budget > 0 ? Math.round((totalCost / budget) * 100) : 0,
      }
    })
    .sort((a, b) => b.totalCost - a.totalCost || a.plate_number.localeCompare(b.plate_number))

  const globalBaseline =
    database.vehicles.length > 0
      ? database.vehicles.reduce((total, vehicle) => total + (Number(vehicle.baseline_km_per_liter) || 0), 0) /
        database.vehicles.length
      : 10

  const driverNames = Array.from(
    new Set([
      ...database.drivers.map((driver) => driver.name),
      ...logs.map((log) => log.driver_name).filter(Boolean),
    ])
  )

  const drivers: ReportDriverRow[] = driverNames
    .map((name) => {
      const key = name.trim().toLowerCase()
      const driverLogs = logs.filter((log) => (log.driver_name || '').trim().toLowerCase() === key)
      const driverInspections = inspections.filter(
        (inspection) => (inspection.driver_name || '').trim().toLowerCase() === key
      )
      const driverKm = driverLogs.reduce((total, log) => total + (Number(log.distance_km) || 0), 0)
      const driverLiters = driverLogs.reduce((total, log) => total + (Number(log.liters) || 0), 0)
      const avgKmL = driverLiters > 0 ? Number((driverKm / driverLiters).toFixed(2)) : 0

      const baselines = driverLogs
        .map((log) => Number(vehicleMap.get(log.plate_number)?.baseline_km_per_liter) || 0)
        .filter((value) => value > 0)
      const baseline =
        baselines.length > 0 ? baselines.reduce((total, value) => total + value, 0) / baselines.length : globalBaseline

      const driverAnomalies = driverLogs.filter((log) => isAnomalous(log, vehicleMap.get(log.plate_number))).length
      const efficiencyScore =
        driverLiters > 0 && baseline > 0 ? clamp(Math.round((avgKmL / baseline) * 45), 0, 50) : 0
      const complianceRatio = driverLogs.length > 0 ? Math.min(1, driverInspections.length / driverLogs.length) : 0
      const complianceScore = Math.round(complianceRatio * 30)
      const integrityScore = Math.max(0, 20 - driverAnomalies * 10)
      const totalScore = clamp(efficiencyScore + complianceScore + integrityScore, 0, 100)

      return {
        name,
        assignedVehicle: database.drivers.find((driver) => driver.name === name)?.assigned_vehicle || '',
        trips: driverLogs.length,
        distanceKm: driverKm,
        liters: driverLiters,
        avgKmL,
        baseline: Number(baseline.toFixed(1)),
        anomalyCount: driverAnomalies,
        inspectionCount: driverInspections.length,
        efficiencyScore,
        complianceScore,
        integrityScore,
        totalScore,
        tier: tierFor(totalScore),
      }
    })
    .sort((a, b) => b.totalScore - a.totalScore || b.distanceKm - a.distanceKm)

  const budget = database.vehicles.reduce(
    (total, vehicle) =>
      total + (Number(vehicle.monthly_budget) || 0) + (Number(vehicle.monthly_service_budget) || 0),
    0
  )
  const grandTotal = fuelCost + serviceCost + approvedAmount

  const ready = inspections.filter((inspection) => inspection.status === 'READY').length
  const needsAttention = inspections.filter((inspection) => inspection.status === 'NEEDS_ATTENTION').length

  const insights: string[] = []
  if (logs.length === 0) {
    insights.push('Belum ada transaksi BBM pada periode ini; angka biaya hanya mencakup servis dan klaim yang tercatat.')
  } else {
    const efficiency = liters > 0 ? distanceKm / liters : 0
    insights.push(
      `Efisiensi armada ${efficiency.toFixed(2)} KM/L dari ${logs.length} transaksi, dengan ${anomalyCount} transaksi perlu audit.`
    )
  }
  const overBudget = vehicles.filter((vehicle) => vehicle.budget > 0 && vehicle.budgetUsagePct > 100)
  if (overBudget.length > 0) {
    insights.push(
      `${overBudget.length} armada melewati anggaran bulanan: ${overBudget
        .slice(0, 3)
        .map((vehicle) => `${vehicle.plate_number} (${vehicle.budgetUsagePct}%)`)
        .join(', ')}.`
    )
  }
  if (pendingClaims.length > 0) {
    insights.push(`${pendingClaims.length} klaim perjalanan masih menunggu verifikasi admin.`)
  }
  if (inspections.length === 0 && logs.length > 0) {
    insights.push('Tidak ada inspeksi harian tercatat pada periode ini; kepatuhan driver perlu ditinjau.')
  }
  if (insights.length === 0) {
    insights.push('Operasional periode ini berjalan tanpa temuan signifikan.')
  }

  return {
    period,
    generatedAt: new Date().toISOString(),
    company: {
      name: database.settings.company_name,
      short: database.settings.company_short,
    },
    fuel: {
      trips: logs.length,
      distanceKm,
      liters: Number(liters.toFixed(2)),
      cost: fuelCost,
      avgKmL: liters > 0 ? Number((distanceKm / liters).toFixed(2)) : 0,
      anomalyCount,
      anomalyRatePct: logs.length > 0 ? Math.round((anomalyCount / logs.length) * 100) : 0,
      flagged: logs.filter((log) => log.status === 'FLAGGED').length,
      pending: logs.filter((log) => log.status === 'PENDING').length,
    },
    service: { count: services.length, cost: serviceCost },
    claims: {
      total: claims.length,
      approved: approvedClaims.length,
      pending: pendingClaims.length,
      rejected: rejectedClaims.length,
      approvedAmount,
      pendingAmount,
    },
    inspections: {
      total: inspections.length,
      ready,
      needsAttention,
      coveragePct: logs.length > 0 ? Math.min(100, Math.round((inspections.length / logs.length) * 100)) : 0,
    },
    vehicles,
    drivers,
    totals: {
      fuelCost,
      serviceCost,
      claimCost: approvedAmount,
      grandTotal,
      budget,
      budgetUsagePct: budget > 0 ? Math.round((grandTotal / budget) * 100) : 0,
      distanceKm,
      liters: Number(liters.toFixed(2)),
    },
    insights,
  }
}
