import type {
  AuditEntry,
  CashAdvance,
  Driver,
  FleetDatabase,
  FuelLog,
  FuelPrice,
  Inspection,
  ReimbursementClaim,
  ServiceRecord,
  Vehicle,
} from './types'

const VEHICLES: Vehicle[] = [
  {
    id: 'V1',
    plate_number: 'B 1234 ABC',
    model: 'Toyota Avanza 1.5 G',
    year: 2022,
    monthly_budget: 1_500_000,
    monthly_service_budget: 500_000,
    target_km_monthly: 1_500,
    baseline_km_per_liter: 13,
    last_km: 45_860,
    kir_expiry: '2026-10-15',
    stnk_expiry: '2027-08-20',
    status: 'ACTIVE',
  },
  {
    id: 'V2',
    plate_number: 'B 5678 XYZ',
    model: 'Daihatsu Gran Max Blind Van',
    year: 2021,
    monthly_budget: 2_000_000,
    monthly_service_budget: 750_000,
    target_km_monthly: 2_500,
    baseline_km_per_liter: 11,
    last_km: 32_000,
    kir_expiry: '2026-09-10',
    stnk_expiry: '2026-12-05',
    status: 'ACTIVE',
  },
  {
    id: 'V3',
    plate_number: 'B 9012 DEF',
    model: 'Isuzu Traga Pick Up',
    year: 2023,
    monthly_budget: 2_500_000,
    monthly_service_budget: 1_000_000,
    target_km_monthly: 3_500,
    baseline_km_per_liter: 9,
    last_km: 51_800,
    kir_expiry: '2026-12-01',
    stnk_expiry: '2028-01-15',
    status: 'ACTIVE',
  },
  {
    id: 'V4',
    plate_number: 'KB 1234 YK',
    model: 'Toyota Innova Zenix',
    year: 2024,
    monthly_budget: 2_500_000,
    monthly_service_budget: 800_000,
    target_km_monthly: 2_000,
    baseline_km_per_liter: 14,
    last_km: 47_905,
    kir_expiry: '2027-02-15',
    stnk_expiry: '2027-11-11',
    status: 'ACTIVE',
  },
]

const DRIVERS: Driver[] = [
  {
    id: 'D1',
    name: 'Ahmad Supardi',
    nik: '3171012304850001',
    phone: '081234567890',
    address: 'Jl. Merdeka No. 12, Jakarta Barat',
    sim_type: 'SIM B1 Umum',
    sim_number: '9283-1928-0001',
    sim_expiry: '2027-05-20',
    emergency_name: 'Siti Aminah',
    emergency_relation: 'Istri',
    emergency_phone: '081298765432',
    emergency_contact_name: 'Siti Aminah (Istri)',
    emergency_contact_phone: '081298765432',
    assigned_vehicle: 'B 1234 ABC',
    photo: '',
    status: 'ACTIVE',
    joined_at: '2021-04-12',
  },
  {
    id: 'D2',
    name: 'Budi Santoso',
    nik: '3171011508900002',
    phone: '085678901234',
    address: 'Jl. Anggrek Raya No. 45, Tangerang',
    sim_type: 'SIM A',
    sim_number: '8123-4567-0002',
    sim_expiry: '2026-11-10',
    emergency_name: 'Rudi Santoso',
    emergency_relation: 'Adik',
    emergency_phone: '085611223344',
    emergency_contact_name: 'Rudi Santoso (Adik)',
    emergency_contact_phone: '085611223344',
    assigned_vehicle: 'B 5678 XYZ',
    photo: '',
    status: 'ACTIVE',
    joined_at: '2022-08-01',
  },
  {
    id: 'D3',
    name: 'Udin Kamarudin',
    nik: '3171012011880003',
    phone: '082254127596',
    address: 'Jl. Melati IV No. 8, Jakarta Selatan',
    sim_type: 'SIM A',
    sim_number: '83585451',
    sim_expiry: '2028-11-10',
    emergency_name: 'Jamila',
    emergency_relation: 'Istri',
    emergency_phone: '082254127596',
    emergency_contact_name: 'Jamila (Istri)',
    emergency_contact_phone: '082254127596',
    assigned_vehicle: 'B 9012 DEF',
    photo: '',
    status: 'ACTIVE',
    joined_at: '2020-02-17',
  },
  {
    id: 'D4',
    name: 'Rizky Pratama',
    nik: '3171010706930004',
    phone: '081399887766',
    address: 'Jl. Kenanga No. 21, Bekasi',
    sim_type: 'SIM B1 Umum',
    sim_number: '9012-3344-0004',
    sim_expiry: '2029-03-14',
    emergency_name: 'Dewi Lestari',
    emergency_relation: 'Istri',
    emergency_phone: '081377665544',
    emergency_contact_name: 'Dewi Lestari (Istri)',
    emergency_contact_phone: '081377665544',
    assigned_vehicle: 'KB 1234 YK',
    photo: '',
    status: 'ACTIVE',
    joined_at: '2024-01-08',
  },
]

const FUEL_PRICES: FuelPrice[] = [
  { id: 'F1', name: 'Pertalite', price: 10_000, category: 'Subsidi' },
  { id: 'F2', name: 'Pertamax', price: 12_950, category: 'Non-Subsidi' },
  { id: 'F3', name: 'Pertamax Turbo', price: 14_400, category: 'Non-Subsidi' },
  { id: 'F4', name: 'Dexlite', price: 14_550, category: 'Non-Subsidi' },
  { id: 'F5', name: 'Bio Solar', price: 6_800, category: 'Subsidi' },
]

const VEHICLE_FUEL: Record<string, string> = {
  'B 1234 ABC': 'Pertalite',
  'B 5678 XYZ': 'Bio Solar',
  'B 9012 DEF': 'Bio Solar',
  'KB 1234 YK': 'Pertamax',
}

const VEHICLE_DRIVER: Record<string, string> = {
  'B 1234 ABC': 'Ahmad Supardi',
  'B 5678 XYZ': 'Budi Santoso',
  'B 9012 DEF': 'Udin Kamarudin',
  'KB 1234 YK': 'Rizky Pratama',
}

function money(value: number): number {
  return Math.round(value)
}

function buildFuelLogs(vehicles: Vehicle[]): FuelLog[] {
  const startKm: Record<string, number> = {
    'B 1234 ABC': 30_860,
    'B 5678 XYZ': 10_000,
    'B 9012 DEF': 19_800,
    'KB 1234 YK': 27_905,
  }
  const currentKm = { ...startKm }
  const logs: FuelLog[] = []
  const priceByName = new Map(FUEL_PRICES.map((fuel) => [fuel.name, fuel.price]))

  vehicles.forEach((vehicle, vehicleIndex) => {
    for (let month = 1; month <= 10; month++) {
      const monthKey = String(month).padStart(2, '0')
      const splits = [0.54, 0.46]
      splits.forEach((share, splitIndex) => {
        const distance = Math.round(vehicle.target_km_monthly * share)
        const variation = 0.94 + (((month * 7 + vehicleIndex * 5 + splitIndex * 3) % 13) / 100)
        const efficiency = Number((vehicle.baseline_km_per_liter * variation).toFixed(2))
        const liters = Number((distance / efficiency).toFixed(2))
        const unitPrice = priceByName.get(VEHICLE_FUEL[vehicle.plate_number]) || 10_000
        const initialKm = currentKm[vehicle.plate_number]
        const finalKm = initialKm + distance
        currentKm[vehicle.plate_number] = finalKm

        logs.push({
          id: `FL-2026${monthKey}-${vehicle.id}-${splitIndex + 1}`,
          plate_number: vehicle.plate_number,
          vehicle_model: vehicle.model,
          driver_name: VEHICLE_DRIVER[vehicle.plate_number],
          initial_km: initialKm,
          final_km: finalKm,
          distance_km: distance,
          liters,
          unit_price: unitPrice,
          km_per_liter: efficiency,
          total_cost: money(liters * unitPrice),
          fuel_type: VEHICLE_FUEL[vehicle.plate_number],
          fill_location: 'SPBU Resmi',
          date: `2026-${monthKey}-${splitIndex === 0 ? '08' : '22'}`,
          status: 'VERIFIED',
          receipt_image: '',
          audit_note: '',
          created_by: VEHICLE_DRIVER[vehicle.plate_number],
          created_at: `2026-${monthKey}-${splitIndex === 0 ? '08' : '22'}T09:30:00.000Z`,
        })
      })
    }
    vehicle.last_km = currentKm[vehicle.plate_number]
  })

  const applyAnomaly = (
    id: string,
    efficiency: number,
    status: FuelLog['status'],
    location: FuelLog['fill_location'],
    note: string
  ) => {
    const log = logs.find((item) => item.id === id)
    if (!log) return
    log.km_per_liter = efficiency
    log.liters = Number((log.distance_km / efficiency).toFixed(2))
    log.total_cost = money(log.liters * log.unit_price)
    log.status = status
    log.fill_location = location
    log.audit_note = note
  }

  applyAnomaly('FL-2026-08-V2-2', 5.6, 'FLAGGED', 'ECERAN', 'Pengisian eceran non-SPBU dan konsumsi 49% di bawah baseline.')
  applyAnomaly('FL-2026-09-V1-2', 8.1, 'FLAGGED', 'SPBU Resmi', 'Rasio konsumsi jauh di bawah baseline. Mohon konfirmasi odometer & struk.')
  applyAnomaly('FL-2026-07-V3-2', 7.2, 'PENDING', 'ECERAN', 'Pengisian darurat eceran di luar SPBU rekanan.')
  applyAnomaly('FL-2026-10-V4-2', 11.4, 'PENDING', 'SPBU Resmi', 'Menunggu verifikasi struk oleh admin.')

  return logs.sort((a, b) => (a.date < b.date ? 1 : -1))
}

const SERVICE_HISTORY: ServiceRecord[] = [
  { id: 'SV-001', plate_number: 'B 1234 ABC', category: 'Servis Rutin & Oli', service_type: 'Ganti Oli & Filter Mesin', parts_replaced: 'Oli Shell Helix 4L', cost: 450_000, workshop: 'Auto2000', km_done: 34_000, date: '2026-02-12' },
  { id: 'SV-002', plate_number: 'B 5678 XYZ', category: 'Ban & Sistem Rem', service_type: 'Ganti Kampas Rem Depan', parts_replaced: 'Kampas rem original', cost: 1_250_000, workshop: 'Bridgestone Service', km_done: 15_000, date: '2026-03-05' },
  { id: 'SV-003', plate_number: 'B 9012 DEF', category: 'Servis Besar', service_type: 'Servis Besar 50.000 KM', parts_replaced: 'Timing belt, filter, oli', cost: 2_400_000, workshop: 'Isuzu Astra', km_done: 28_000, date: '2026-04-18' },
  { id: 'SV-004', plate_number: 'KB 1234 YK', category: 'Servis Rutin & Oli', service_type: 'Ganti Oli & Filter Udara', parts_replaced: 'Oli Toyota Genuine 5L', cost: 650_000, workshop: 'Auto2000', km_done: 36_000, date: '2026-05-09' },
  { id: 'SV-005', plate_number: 'B 1234 ABC', category: 'Servis Rutin & Oli', service_type: 'Tune Up & Bersih Injector', parts_replaced: 'Busi, injector cleaner', cost: 850_000, workshop: 'Auto2000', km_done: 41_000, date: '2026-06-21' },
  { id: 'SV-006', plate_number: 'B 5678 XYZ', category: 'Legalitas & Retribusi', service_type: 'Perpanjangan KIR & STNK', parts_replaced: '-', cost: 450_000, workshop: 'Samsat Jakarta', km_done: 24_000, date: '2026-07-14' },
  { id: 'SV-007', plate_number: 'B 9012 DEF', category: 'Ban & Sistem Rem', service_type: 'Ganti Ban Belakang 2 Unit', parts_replaced: 'Ban GT Radial 2 pcs', cost: 1_800_000, workshop: 'Bridgestone Service', km_done: 44_000, date: '2026-08-02' },
  { id: 'SV-008', plate_number: 'KB 1234 YK', category: 'Servis Rutin & Oli', service_type: 'Ganti Oli & Filter Mesin', parts_replaced: 'Oli Toyota Genuine 5L', cost: 700_000, workshop: 'Auto2000', km_done: 46_000, date: '2026-09-19' },
  { id: 'SV-009', plate_number: 'B 1234 ABC', category: 'Sparepart & Kelistrikan', service_type: 'Perbaikan Alternator', parts_replaced: 'Regulator alternator', cost: 600_000, workshop: 'Auto2000', km_done: 44_500, date: '2026-10-06' },
]

const INSPECTIONS: Inspection[] = [
  { id: 'CHK-001', date: '2026-11-10', time: '06:42', driver_name: 'Ahmad Supardi', plate_number: 'B 1234 ABC', status: 'READY', details: { brakes: true, tires: true, engine_oil: true, lights: true, body_condition: true }, notes: 'Armada siap jalan.' },
  { id: 'CHK-002', date: '2026-11-10', time: '06:55', driver_name: 'Budi Santoso', plate_number: 'B 5678 XYZ', status: 'NEEDS_ATTENTION', details: { brakes: true, tires: false, engine_oil: true, lights: true, body_condition: true }, notes: 'Tekanan angin ban belakang kurang.' },
  { id: 'CHK-003', date: '2026-11-11', time: '07:05', driver_name: 'Udin Kamarudin', plate_number: 'B 9012 DEF', status: 'READY', details: { brakes: true, tires: true, engine_oil: true, lights: true, body_condition: true }, notes: '' },
  { id: 'CHK-004', date: '2026-11-11', time: '07:12', driver_name: 'Rizky Pratama', plate_number: 'KB 1234 YK', status: 'READY', details: { brakes: true, tires: true, engine_oil: true, lights: true, body_condition: true }, notes: '' },
  { id: 'CHK-005', date: '2026-11-12', time: '06:38', driver_name: 'Ahmad Supardi', plate_number: 'B 1234 ABC', status: 'READY', details: { brakes: true, tires: true, engine_oil: true, lights: true, body_condition: true }, notes: '' },
  { id: 'CHK-006', date: '2026-11-12', time: '06:47', driver_name: 'Budi Santoso', plate_number: 'B 5678 XYZ', status: 'READY', details: { brakes: true, tires: true, engine_oil: true, lights: true, body_condition: true }, notes: 'Sudah ditambahkan angin ban.' },
]

const CLAIMS: ReimbursementClaim[] = [
  { id: 'CLM-001', date: '2026-10-28', time: '18:20', driver_name: 'Ahmad Supardi', plate_number: 'B 1234 ABC', category: 'Tol', amount: 85_000, notes: 'Tol Cipularang PP', status: 'APPROVED', reviewed_by: 'admin', reviewed_at: '2026-10-29T03:10:00.000Z' },
  { id: 'CLM-002', date: '2026-11-02', time: '12:05', driver_name: 'Budi Santoso', plate_number: 'B 5678 XYZ', category: 'Parkir', amount: 25_000, notes: 'Parkir Rest Area KM 57', status: 'PENDING' },
  { id: 'CLM-003', date: '2026-11-04', time: '21:40', driver_name: 'Udin Kamarudin', plate_number: 'B 9012 DEF', category: 'Tol', amount: 320_000, notes: 'Tol Trans Jawa operasional', status: 'APPROVED', reviewed_by: 'admin', reviewed_at: '2026-11-05T02:30:00.000Z' },
  { id: 'CLM-004', date: '2026-11-07', time: '09:15', driver_name: 'Rizky Pratama', plate_number: 'KB 1234 YK', category: 'Timbangan', amount: 50_000, notes: 'Jembatan timbang Cikampek', status: 'PENDING' },
  { id: 'CLM-005', date: '2026-11-09', time: '16:30', driver_name: 'Ahmad Supardi', plate_number: 'B 1234 ABC', category: 'Retribusi', amount: 30_000, notes: 'Retribusi jalan daerah', status: 'APPROVED', reviewed_by: 'admin', reviewed_at: '2026-11-10T01:20:00.000Z' },
  { id: 'CLM-006', date: '2026-11-11', time: '19:55', driver_name: 'Budi Santoso', plate_number: 'B 5678 XYZ', category: 'Parkir', amount: 15_000, notes: 'Parkir gudang tujuan', status: 'PENDING' },
]

const ADVANCES: CashAdvance[] = [
  { id: 'ADV-001', driver_name: 'Ahmad Supardi', plate_number: 'B 1234 ABC', amount: 500_000, date: '2026-10-27', notes: 'Uang jalan luar kota Bandung', created_by: 'admin' },
  { id: 'ADV-002', driver_name: 'Budi Santoso', plate_number: 'B 5678 XYZ', amount: 350_000, date: '2026-11-01', notes: 'Uang jalan dalam kota Tangerang', created_by: 'admin' },
  { id: 'ADV-003', driver_name: 'Udin Kamarudin', plate_number: 'B 9012 DEF', amount: 750_000, date: '2026-11-03', notes: 'Uang jalan pengiriman Semarang', created_by: 'admin' },
]

const AUDIT_TRAIL: AuditEntry[] = [
  { id: 'AUD-001', at: '2026-11-10T01:20:00.000Z', actor: 'admin', role: 'admin', action: 'UPDATE_STATUS', collection: 'reimbursementClaims', itemId: 'CLM-005', summary: 'Menyetujui klaim retribusi Rp 30.000 (Ahmad Supardi).' },
  { id: 'AUD-002', at: '2026-11-10T02:05:00.000Z', actor: 'admin', role: 'admin', action: 'UPDATE_STATUS', collection: 'fuelLogs', itemId: 'FL-2026-10-V4-2', summary: 'Menandai transaksi BBM sebagai menunggu verifikasi struk.' },
  { id: 'AUD-003', at: '2026-11-12T00:35:00.000Z', actor: 'Ahmad Supardi', role: 'driver', action: 'CREATE', collection: 'inspections', itemId: 'CHK-005', summary: 'Checklist pre-trip armada B 1234 ABC dinyatakan siap jalan.' },
]

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

export function buildSeedDatabase(): FleetDatabase {
  const vehicles = clone(VEHICLES)
  const logs = buildFuelLogs(vehicles)
  return {
    version: 1,
    updated_at: new Date().toISOString(),
    settings: {
      company_name: 'PT Nusantara Logistik Prima',
      company_short: 'NLP',
      currency: 'IDR',
      fuel_anomaly_threshold: 72,
      quality_target: 85,
      session_hours: 8,
    },
    vehicles,
    drivers: clone(DRIVERS),
    fuelPrices: clone(FUEL_PRICES),
    fuelLogs: logs,
    serviceHistory: clone(SERVICE_HISTORY),
    inspections: clone(INSPECTIONS),
    reimbursementClaims: clone(CLAIMS),
    cashAdvances: clone(ADVANCES),
    auditTrail: clone(AUDIT_TRAIL),
  }
}

export const seedMeta = {
  vehicles: VEHICLES,
  drivers: DRIVERS,
  fuelPrices: FUEL_PRICES,
  serviceHistory: SERVICE_HISTORY,
  inspections: INSPECTIONS,
  reimbursementClaims: CLAIMS,
  cashAdvances: ADVANCES,
}
