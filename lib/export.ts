import type { FuelLog, ServiceRecord, Vehicle } from './types'
import { efficiencyOf } from './fuel'

function cell(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value)
  return `"${text.replace(/"/g, '""')}"`
}

export function toCsv(rows: unknown[][]): string {
  return `\uFEFF${rows.map((row) => row.map(cell).join(';')).join('\r\n')}`
}

export function downloadFile(filename: string, content: string, mime = 'text/csv;charset=utf-8;') {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function fuelLogsCsv(logs: FuelLog[]): string {
  const rows: unknown[][] = [
    ['ID', 'Tanggal', 'Plat', 'Model', 'Driver', 'Jenis BBM', 'Lokasi', 'KM Awal', 'KM Akhir', 'Jarak (KM)', 'Liter', 'Harga/L', 'Total Biaya', 'KM/L', 'Status', 'Catatan Audit'],
  ]
  for (const log of logs) {
    rows.push([
      log.id,
      log.date,
      log.plate_number,
      log.vehicle_model,
      log.driver_name,
      log.fuel_type,
      log.fill_location,
      log.initial_km,
      log.final_km,
      log.distance_km,
      log.liters,
      log.unit_price,
      log.total_cost,
      efficiencyOf(log),
      log.status,
      log.audit_note || '',
    ])
  }
  return toCsv(rows)
}

export function fleetSummaryCsv(vehicles: Vehicle[], logs: FuelLog[], services: ServiceRecord[]): string {
  const rows: unknown[][] = [
    ['RINGKASAN ARMADA — FLEETOPS 360'],
    ['Dicetak', new Date().toLocaleString('id-ID')],
    [],
    ['Plat', 'Model', 'Tahun', 'Odometer', 'Anggaran BBM/Bulan', 'Anggaran Servis/Bulan', 'Target KM/Bulan', 'Baseline KM/L', 'Total BBM', 'Total Servis', 'Jarak BBM', 'Liter', 'KM/L Aktual', 'KIR', 'STNK'],
  ]

  for (const vehicle of vehicles) {
    const vehicleLogs = logs.filter((log) => log.plate_number === vehicle.plate_number)
    const vehicleServices = services.filter((record) => record.plate_number === vehicle.plate_number)
    const totalKm = vehicleLogs.reduce((total, log) => total + (Number(log.distance_km) || 0), 0)
    const totalLiters = vehicleLogs.reduce((total, log) => total + (Number(log.liters) || 0), 0)
    rows.push([
      vehicle.plate_number,
      vehicle.model,
      vehicle.year,
      vehicle.last_km,
      vehicle.monthly_budget,
      vehicle.monthly_service_budget,
      vehicle.target_km_monthly,
      vehicle.baseline_km_per_liter,
      vehicleLogs.reduce((total, log) => total + (Number(log.total_cost) || 0), 0),
      vehicleServices.reduce((total, record) => total + (Number(record.cost) || 0), 0),
      totalKm,
      Number(totalLiters.toFixed(2)),
      totalLiters > 0 ? Number((totalKm / totalLiters).toFixed(2)) : 0,
      vehicle.kir_expiry,
      vehicle.stnk_expiry,
    ])
  }

  rows.push([], ['RINCIAN TRANSAKSI BBM'])
  for (const log of logs) {
    rows.push([
      log.date,
      log.plate_number,
      log.driver_name,
      log.fuel_type,
      log.liters,
      log.total_cost,
      efficiencyOf(log),
      log.status,
    ])
  }

  return toCsv(rows)
}
