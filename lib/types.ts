export type Role = 'admin' | 'driver' | 'owner'

export interface SessionUser {
  username: string
  name: string
  role: Role
  tenantId?: string
  tenantName?: string
  driverName?: string
  exp: number
}

export interface TenantUser {
  id: string
  username: string
  name: string
  role: 'admin' | 'driver'
  password_hash: string
  driver_name?: string
  status: 'ACTIVE' | 'INACTIVE'
  created_at?: string
  last_login_at?: string
}

export interface Vehicle {
  id: string
  plate_number: string
  model: string
  year: number
  monthly_budget: number
  monthly_service_budget: number
  target_km_monthly: number
  baseline_km_per_liter: number
  last_km: number
  kir_expiry: string
  stnk_expiry: string
  status?: 'ACTIVE' | 'INACTIVE'
  created_at?: string
}

export interface Driver {
  id: string
  name: string
  nik?: string
  phone?: string
  address?: string
  sim_type?: string
  sim_number?: string
  sim_expiry?: string
  emergency_name?: string
  emergency_relation?: string
  emergency_phone?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  assigned_vehicle?: string
  photo?: string
  photo_url?: string
  status?: 'ACTIVE' | 'INACTIVE'
  joined_at?: string
}

export interface FuelPrice {
  id: string
  name: string
  price: number
  category: 'Subsidi' | 'Non-Subsidi' | string
}

export type FuelLogStatus = 'VERIFIED' | 'FLAGGED' | 'PENDING'

export interface FuelLog {
  id: string | number
  plate_number: string
  vehicle_model: string
  driver_name: string
  initial_km: number
  final_km: number
  distance_km: number
  liters: number
  unit_price: number
  km_per_liter: number
  total_cost: number
  fuel_type: string
  fill_location: 'SPBU Resmi' | 'ECERAN'
  eceran_note?: string
  date: string
  status: FuelLogStatus
  receipt_image?: string
  audit_note?: string
  created_by?: string
  created_at?: string
}

export interface ServiceRecord {
  id: string | number
  plate_number: string
  category: string
  service_type: string
  parts_replaced?: string
  cost: number
  workshop: string
  km_done: number
  date: string
  created_by?: string
  created_at?: string
}

export interface Inspection {
  id: string
  date: string
  time: string
  driver_name: string
  plate_number: string
  status: 'READY' | 'NEEDS_ATTENTION'
  details: Record<string, boolean>
  notes?: string
  created_by?: string
}

export interface ReimbursementClaim {
  id: string
  date: string
  time?: string
  driver_name: string
  plate_number: string
  category: 'Tol' | 'Parkir' | 'Retribusi' | 'Timbangan' | 'Lainnya' | string
  amount: number
  notes?: string
  receipt_photo?: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  reviewed_by?: string
  reviewed_at?: string
}

export interface CashAdvance {
  id: string
  driver_name: string
  plate_number: string
  amount: number
  date: string
  notes?: string
  created_by?: string
}

export interface AuditEntry {
  id: string
  at: string
  actor: string
  role: Role
  action: string
  collection: string
  itemId?: string
  summary: string
}

export interface AppSettings {
  company_name: string
  company_short: string
  currency: string
  fuel_anomaly_threshold: number
  quality_target: number
  session_hours: number
}

export interface FleetDatabase {
  version: number
  updated_at: string
  settings: AppSettings
  users: TenantUser[]
  vehicles: Vehicle[]
  drivers: Driver[]
  fuelPrices: FuelPrice[]
  fuelLogs: FuelLog[]
  serviceHistory: ServiceRecord[]
  inspections: Inspection[]
  reimbursementClaims: ReimbursementClaim[]
  cashAdvances: CashAdvance[]
  auditTrail: AuditEntry[]
}

export type CollectionName =
  | 'vehicles'
  | 'drivers'
  | 'fuelPrices'
  | 'fuelLogs'
  | 'serviceHistory'
  | 'inspections'
  | 'reimbursementClaims'
  | 'cashAdvances'
  | 'auditTrail'

export interface QualityResult {
  score: number
  grade: 'EXCELLENT' | 'GOOD' | 'WATCH' | 'CRITICAL'
  label: string
  variancePct: number
  expected: number
  actual: number
  reasons: string[]
}

/* ------------------------------------------------------------------ */
/* SaaS: paket, tenant, dan penagihan                                  */
/* ------------------------------------------------------------------ */

export type PlanId = 'trial' | 'starter' | 'growth' | 'enterprise'

export interface PlanLimits {
  vehicles: number
  drivers: number
  users: number
}

export interface Plan {
  id: PlanId
  name: string
  tagline: string
  price_monthly: number
  limits: PlanLimits
  features: string[]
}

export type TenantStatus = 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'EXPIRED'

export interface Tenant {
  id: string
  code: string
  name: string
  plan: PlanId
  status: TenantStatus
  created_at: string
  trial_ends_at?: string
  active_until?: string
  contact_name?: string
  contact_email?: string
  contact_phone?: string
  notes?: string
  /** Tenant bawaan dari instalasi lama; kredensial env tetap berlaku. */
  bootstrap?: boolean
  limits: PlanLimits
}

export type InvoiceStatus = 'UNPAID' | 'PAID' | 'VOID'

export interface Invoice {
  id: string
  tenant_id: string
  number: string
  plan: PlanId
  period_start: string
  period_end: string
  amount: number
  status: InvoiceStatus
  issued_at: string
  due_at: string
  paid_at?: string
  method?: string
  note?: string
}

export interface PlatformAuditEntry {
  id: string
  at: string
  actor: string
  action: string
  target: string
  summary: string
}

export interface PlatformDatabase {
  version: number
  updated_at: string
  tenants: Tenant[]
  invoices: Invoice[]
  auditTrail: PlatformAuditEntry[]
}

export interface TenantUsage {
  vehicles: number
  drivers: number
  users: number
  fuelLogs: number
}
