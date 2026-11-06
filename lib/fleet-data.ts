export const DEFAULT_DRIVERS = [
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
    assigned_vehicle: 'KB 1234 YK',
    photo: '',
    status: 'ACTIVE',
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
    assigned_vehicle: 'B 1234 ABC',
    photo: '',
    status: 'ACTIVE',
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
    assigned_vehicle: 'B 5678 XYZ',
    photo: '',
    status: 'ACTIVE',
  },
] as const

export const DEFAULT_VEHICLES = [
  { id: 'V1', plate_number: 'B 1234 ABC', model: 'Toyota Avanza 1.5 G', year: 2022, monthly_budget: 1500000, monthly_service_budget: 500000, target_km_monthly: 1500, last_km: 45860, kir_expiry: '2026-10-15', stnk_expiry: '2027-02-20' },
  { id: 'V2', plate_number: 'B 5678 XYZ', model: 'Daihatsu Gran Max Blind Van', year: 2021, monthly_budget: 2000000, monthly_service_budget: 750000, target_km_monthly: 2500, last_km: 32000, kir_expiry: '2026-09-10', stnk_expiry: '2026-12-12' },
  { id: 'V3', plate_number: 'B 9012 DEF', model: 'Isuzu Traga Pick Up', year: 2023, monthly_budget: 2500000, monthly_service_budget: 1000000, target_km_monthly: 3500, last_km: 18500, kir_expiry: '2026-12-01', stnk_expiry: '2027-03-05' },
  { id: 'V4', plate_number: 'KB 1234 YK', model: 'Toyota Innova Zenix', year: 2024, monthly_budget: 2500000, monthly_service_budget: 800000, target_km_monthly: 2000, last_km: 47905, kir_expiry: '2027-02-15', stnk_expiry: '2027-05-17' },
] as const

export const DEFAULT_FUELS = [
  { id: 'F1', name: 'Pertalite', price: 10000, category: 'Subsidi' },
  { id: 'F2', name: 'Pertamax', price: 12950, category: 'Non-Subsidi' },
  { id: 'F3', name: 'Pertamax Turbo', price: 14400, category: 'Non-Subsidi' },
  { id: 'F4', name: 'Dexlite', price: 14550, category: 'Non-Subsidi' },
  { id: 'F5', name: 'Bio Solar', price: 6800, category: 'Subsidi' },
] as const

export const DEFAULT_LOGS = [
  {
    id: 1,
    plate_number: 'B 1234 ABC',
    vehicle_model: 'Toyota Avanza',
    driver_name: 'Ahmad Supardi',
    initial_km: 45250,
    final_km: 45750,
    distance_km: 500,
    liters: 15,
    unit_price: 10000,
    km_per_liter: 33.33,
    total_cost: 150000,
    fuel_type: 'Pertalite',
    fill_location: 'SPBU Resmi',
    date: '2026-08-31',
    status: 'VERIFIED',
    audit_note: '',
  },
] as const

export const DEFAULT_SERVICES = [
  {
    id: 1,
    plate_number: 'B 1234 ABC',
    category: 'Servis Rutin & Oli',
    service_type: 'Ganti Oli & Filter Mesin',
    parts_replaced: 'Oli Shell Helix 4L',
    cost: 450000,
    workshop: 'Auto2000',
    km_done: 40000,
    date: '2026-06-15',
  },
] as const

export const FLEET_STORAGE_KEYS = {
  drivers: 'master_drivers',
  vehicles: 'vehicle_budgets',
  fuels: 'master_fuel_prices',
  logs: 'fuel_logs',
  services: 'service_history',
  inspections: 'pre_trip_inspections',
  reimbursements: 'reimbursement_claims',
} as const

export function readStorageJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback

  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) {
      window.localStorage.setItem(key, JSON.stringify(fallback))
      return fallback
    }

    const parsed = JSON.parse(raw)
    if (parsed === null || parsed === undefined) {
      window.localStorage.setItem(key, JSON.stringify(fallback))
      return fallback
    }

    return parsed as T
  } catch (error) {
    console.error(`Failed reading ${key}:`, error)
    window.localStorage.setItem(key, JSON.stringify(fallback))
    return fallback
  }
}

export function writeStorageJson<T>(key: string, value: T) {
  if (typeof window === 'undefined') return
  const nextValue = JSON.stringify(value)
  window.localStorage.setItem(key, nextValue)
  window.dispatchEvent(new StorageEvent('storage', { key, newValue: nextValue }))
  window.dispatchEvent(new CustomEvent('fleet-data-sync', { detail: { key, value } }))
}

export function ensureFleetSeedData() {
  if (typeof window === 'undefined') return

  const seedMap = {
    [FLEET_STORAGE_KEYS.drivers]: DEFAULT_DRIVERS,
    [FLEET_STORAGE_KEYS.vehicles]: DEFAULT_VEHICLES,
    [FLEET_STORAGE_KEYS.fuels]: DEFAULT_FUELS,
    [FLEET_STORAGE_KEYS.logs]: DEFAULT_LOGS,
    [FLEET_STORAGE_KEYS.services]: DEFAULT_SERVICES,
  }

  Object.entries(seedMap).forEach(([key, fallback]) => {
    const current = readStorageJson(key, fallback)
    if (Array.isArray(current) && current.length === 0) {
      writeStorageJson(key, fallback)
    }
  })
}
