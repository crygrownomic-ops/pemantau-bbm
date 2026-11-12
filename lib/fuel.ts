import type { FuelLog, QualityResult, Vehicle } from './types'
import { clamp } from './format'

export function efficiencyOf(log: Pick<FuelLog, 'distance_km' | 'liters' | 'km_per_liter'>): number {
  if (Number(log.km_per_liter) > 0) return Number(log.km_per_liter)
  const liters = Number(log.liters) || 0
  return liters > 0 ? Number(((Number(log.distance_km) || 0) / liters).toFixed(2)) : 0
}

export function isAnomalous(log: FuelLog, vehicle?: Vehicle): boolean {
  if (log.status === 'FLAGGED' || log.fill_location === 'ECERAN') return true
  const actual = efficiencyOf(log)
  if (actual <= 0) return false
  const expected = Number(vehicle?.baseline_km_per_liter) || 10
  return actual < expected * 0.72
}

/**
 * Skor kualitas pemakaian BBM per transaksi.
 * 100 = sesuai baseline pabrikan/armada. Penalti diberikan untuk anomali operasional.
 */
export function scoreFuelLog(log: FuelLog, vehicle?: Vehicle): QualityResult {
  const actual = efficiencyOf(log)
  const expected = Number(vehicle?.baseline_km_per_liter) || 10
  const variancePct = expected > 0 ? Number((((actual - expected) / expected) * 100).toFixed(1)) : 0
  const reasons: string[] = []

  let score = expected > 0 && actual > 0 ? Math.round((actual / expected) * 100) : 0

  if (actual <= 0) {
    reasons.push('Data odometer/liter tidak lengkap')
    score = 0
  }
  if (log.fill_location === 'ECERAN') {
    score -= 20
    reasons.push('Pengisian non-SPBU (eceran)')
  }
  if (!log.receipt_image) {
    score -= 4
    reasons.push('Bukti struk belum diunggah')
  }
  if (log.status === 'FLAGGED') {
    score -= 8
    reasons.push('Transaksi ditandai anomali oleh admin')
  }
  if (variancePct < -25) reasons.push(`Konsumsi ${Math.abs(variancePct).toFixed(1)}% di bawah baseline`)
  if (variancePct > 15) reasons.push(`Konsumsi ${variancePct.toFixed(1)}% di atas baseline (efisien)`)

  score = clamp(score, 0, 100)

  let grade: QualityResult['grade'] = 'CRITICAL'
  let label = 'Kritis'
  if (score >= 92) {
    grade = 'EXCELLENT'
    label = 'Sangat Efisien'
  } else if (score >= 78) {
    grade = 'GOOD'
    label = 'Normal'
  } else if (score >= 60) {
    grade = 'WATCH'
    label = 'Perlu Perhatian'
  }

  if (reasons.length === 0) reasons.push('Konsumsi sesuai baseline armada')

  return { score, grade, label, variancePct, expected, actual, reasons }
}

export interface VehicleQualitySummary {
  vehicle: Vehicle
  logs: FuelLog[]
  totalKm: number
  totalLiters: number
  totalCost: number
  avgEfficiency: number
  baseline: number
  variancePct: number
  qualityScore: number
  anomalyCount: number
  spend: number
  budgetUsagePct: number
}

export function summarizeVehicleQuality(vehicle: Vehicle, logs: FuelLog[]): VehicleQualitySummary {
  const vehicleLogs = logs.filter((log) => log.plate_number === vehicle.plate_number)
  const totalKm = vehicleLogs.reduce((acc, log) => acc + (Number(log.distance_km) || 0), 0)
  const totalLiters = vehicleLogs.reduce((acc, log) => acc + (Number(log.liters) || 0), 0)
  const totalCost = vehicleLogs.reduce((acc, log) => acc + (Number(log.total_cost) || 0), 0)
  const avgEfficiency = totalLiters > 0 ? Number((totalKm / totalLiters).toFixed(2)) : 0
  const baseline = Number(vehicle.baseline_km_per_liter) || 10
  const variancePct = baseline > 0 ? Number((((avgEfficiency - baseline) / baseline) * 100).toFixed(1)) : 0
  const anomalyCount = vehicleLogs.filter((log) => isAnomalous(log, vehicle)).length

  const logScores = vehicleLogs.map((log) => scoreFuelLog(log, vehicle).score)
  const avgLogScore = logScores.length > 0 ? logScores.reduce((a, b) => a + b, 0) / logScores.length : 0
  const qualityScore = Math.round(clamp(avgLogScore - anomalyCount * 1.5, 0, 100))
  const spend = totalCost
  const budgetUsagePct = Number(vehicle.monthly_budget) > 0 ? Math.round((spend / Number(vehicle.monthly_budget)) * 100) : 0

  return {
    vehicle,
    logs: vehicleLogs,
    totalKm,
    totalLiters,
    totalCost,
    avgEfficiency,
    baseline,
    variancePct,
    qualityScore,
    anomalyCount,
    spend,
    budgetUsagePct,
  }
}

export function aggregateQuality(logs: FuelLog[], vehicles: Vehicle[]) {
  const vehicleMap = new Map(vehicles.map((vehicle) => [vehicle.plate_number, vehicle]))
  const scored = logs.map((log) => ({ log, quality: scoreFuelLog(log, vehicleMap.get(log.plate_number)) }))
  const avgScore = scored.length > 0 ? Math.round(scored.reduce((acc, item) => acc + item.quality.score, 0) / scored.length) : 0
  const anomalyCount = logs.filter((log) => isAnomalous(log, vehicleMap.get(log.plate_number))).length
  const totalKm = logs.reduce((acc, log) => acc + (Number(log.distance_km) || 0), 0)
  const totalLiters = logs.reduce((acc, log) => acc + (Number(log.liters) || 0), 0)
  const avgEfficiency = totalLiters > 0 ? Number((totalKm / totalLiters).toFixed(2)) : 0
  return { avgScore, anomalyCount, avgEfficiency, scored }
}
