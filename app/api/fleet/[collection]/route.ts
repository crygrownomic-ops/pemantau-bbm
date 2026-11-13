import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { isSameOrigin } from '@/lib/auth-session'
import { appendAudit, createId, isValidCollection, mutateDatabase } from '@/lib/server/store'
import type {
  CollectionName,
  FleetDatabase,
  FuelLog,
  Inspection,
  ReimbursementClaim,
  SessionUser,
} from '@/lib/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

const DRIVER_ALLOWED_CREATE: CollectionName[] = ['fuelLogs', 'inspections', 'reimbursementClaims']
const MAX_RECEIPT_CHARS = 2_500_000

type Body = Record<string, unknown>
type CollectionRow = Body & { id: string | number }

function fail(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status })
}

function asNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function asRecord(value: unknown): Body {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as Body) : {}
}

function cleanReceipt(value: unknown): string {
  const receipt = typeof value === 'string' ? value : ''
  if (receipt.length > MAX_RECEIPT_CHARS) {
    throw new ApiError(413, 'Ukuran foto struk terlalu besar. Maksimal sekitar 2 MB.')
  }
  return receipt
}

function rowsOf(database: FleetDatabase, collection: CollectionName): CollectionRow[] {
  return database[collection] as unknown as CollectionRow[]
}

function setRows(database: FleetDatabase, collection: CollectionName, rows: CollectionRow[]): void {
  ;(database as unknown as Record<CollectionName, CollectionRow[]>)[collection] = rows
}

function createFuelLog(database: FleetDatabase, session: SessionUser, body: Body): FuelLog {
  const plate = asText(body.plate_number)
  const vehicle = database.vehicles.find((item) => item.plate_number === plate)
  if (!vehicle) throw new ApiError(400, 'Armada tidak ditemukan pada master data.')

  const initialKm = asNumber(vehicle.last_km)
  const finalKm = asNumber(body.final_km)
  const liters = asNumber(body.liters)
  const distanceKm = finalKm - initialKm

  if (finalKm <= 0) throw new ApiError(400, 'KM odometer akhir wajib diisi.')
  if (distanceKm <= 0) throw new ApiError(400, `KM akhir harus lebih besar dari KM awal (${initialKm}).`)
  if (liters <= 0) throw new ApiError(400, 'Jumlah liter BBM harus lebih dari 0.')

  const fuelType = asText(body.fuel_type)
  const fuelPrice = database.fuelPrices.find((fuel) => fuel.name === fuelType)
  const unitPrice = asNumber(body.unit_price) || asNumber(fuelPrice?.price)
  if (unitPrice <= 0) throw new ApiError(400, 'Harga satuan BBM tidak valid.')

  const fillLocation: FuelLog['fill_location'] = body.fill_location === 'ECERAN' ? 'ECERAN' : 'SPBU Resmi'
  const status: FuelLog['status'] = fillLocation === 'ECERAN' ? 'FLAGGED' : 'PENDING'
  const driverName =
    session.role === 'driver' ? session.driverName || session.name : asText(body.driver_name, 'Driver')

  const item: FuelLog = {
    id: createId('FL'),
    plate_number: plate,
    vehicle_model: vehicle.model,
    driver_name: driverName,
    initial_km: initialKm,
    final_km: finalKm,
    distance_km: distanceKm,
    liters: Number(liters.toFixed(2)),
    unit_price: Math.round(unitPrice),
    km_per_liter: Number((distanceKm / liters).toFixed(2)),
    total_cost: Math.round(liters * unitPrice),
    fuel_type: fuelType,
    fill_location: fillLocation,
    eceran_note: fillLocation === 'ECERAN' ? asText(body.eceran_note) : '',
    date: asText(body.date, new Date().toISOString().slice(0, 10)),
    status,
    receipt_image: cleanReceipt(body.receipt_image),
    audit_note: fillLocation === 'ECERAN' ? 'Pengisian BBM eceran / darurat terdeteksi.' : '',
    created_by: session.name,
    created_at: new Date().toISOString(),
  }

  database.fuelLogs.unshift(item)
  vehicle.last_km = finalKm

  return item
}

function createInspection(database: FleetDatabase, session: SessionUser, body: Body): Inspection {
  const plate = asText(body.plate_number)
  if (!database.vehicles.some((vehicle) => vehicle.plate_number === plate)) {
    throw new ApiError(400, 'Armada tidak ditemukan pada master data.')
  }

  const details: Record<string, boolean> = {}
  for (const [key, value] of Object.entries(asRecord(body.details))) {
    details[key] = Boolean(value)
  }

  const allOk = Object.keys(details).length > 0 && Object.values(details).every(Boolean)
  const status: Inspection['status'] = allOk ? 'READY' : 'NEEDS_ATTENTION'
  const now = new Date()
  const item: Inspection = {
    id: createId('CHK'),
    date: asText(body.date, now.toISOString().slice(0, 10)),
    time: now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    driver_name:
      session.role === 'driver' ? session.driverName || session.name : asText(body.driver_name, 'Driver'),
    plate_number: plate,
    status,
    details,
    notes: asText(body.notes),
    created_by: session.name,
  }
  database.inspections.unshift(item)
  return item
}

function createClaim(database: FleetDatabase, session: SessionUser, body: Body): ReimbursementClaim {
  const plate = asText(body.plate_number)
  if (!database.vehicles.some((vehicle) => vehicle.plate_number === plate)) {
    throw new ApiError(400, 'Armada tidak ditemukan pada master data.')
  }
  const amount = asNumber(body.amount)
  if (amount <= 0) throw new ApiError(400, 'Nominal klaim harus lebih dari 0.')
  const now = new Date()
  const item: ReimbursementClaim = {
    id: createId('CLM'),
    date: asText(body.date, now.toISOString().slice(0, 10)),
    time: now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    driver_name:
      session.role === 'driver' ? session.driverName || session.name : asText(body.driver_name, 'Driver'),
    plate_number: plate,
    category: asText(body.category, 'Lainnya'),
    amount: Math.round(amount),
    notes: asText(body.notes),
    receipt_photo: cleanReceipt(body.receipt_photo),
    status: 'PENDING',
  }
  database.reimbursementClaims.unshift(item)
  return item
}

function createGeneric(collection: CollectionName, session: SessionUser, body: Body): CollectionRow {
  const prefixes: Partial<Record<CollectionName, string>> = {
    vehicles: 'V',
    drivers: 'D',
    fuelPrices: 'F',
    serviceHistory: 'SV',
    cashAdvances: 'ADV',
  }
  const hasId = typeof body.id === 'string' || typeof body.id === 'number'
  return {
    ...body,
    id: hasId ? (body.id as string | number) : createId(prefixes[collection] || 'REC'),
    created_by: session.name,
    created_at: new Date().toISOString(),
  }
}

async function readBody(request: Request): Promise<unknown> {
  try {
    return await request.json()
  } catch {
    throw new ApiError(400, 'Format data tidak valid.')
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ collection: string }> }) {
  const session = await getSession()
  if (!session) return fail('Sesi tidak valid. Silakan login ulang.', 401)
  if (!isSameOrigin(request)) return fail('Permintaan tidak valid.', 403)

  const { collection } = await params
  if (!isValidCollection(collection) || collection === 'auditTrail') {
    return fail('Koleksi data tidak valid.', 404)
  }
  if (session.role !== 'admin' && !DRIVER_ALLOWED_CREATE.includes(collection)) {
    return fail('Anda tidak memiliki izin untuk menambah data ini.', 403)
  }

  try {
    const body = asRecord(await readBody(request))
    const item = await mutateDatabase((database) => {
      let created: CollectionRow
      if (collection === 'fuelLogs') created = createFuelLog(database, session, body) as unknown as CollectionRow
      else if (collection === 'inspections')
        created = createInspection(database, session, body) as unknown as CollectionRow
      else if (collection === 'reimbursementClaims')
        created = createClaim(database, session, body) as unknown as CollectionRow
      else created = createGeneric(collection, session, body)

      setRows(database, collection, [created, ...rowsOf(database, collection)])
      const plate = asText(created.plate_number)
      appendAudit(
        database,
        session,
        'CREATE',
        collection,
        String(created.id),
        `Menambahkan data ${collection} baru${plate ? ` untuk ${plate}` : ''}.`
      )
      return created
    })
    return NextResponse.json({ ok: true, item })
  } catch (error) {
    if (error instanceof ApiError) return fail(error.message, error.status)
    console.error('Create collection item failed', error)
    return fail('Gagal menyimpan data.', 500)
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ collection: string }> }) {
  const session = await getSession()
  if (!session) return fail('Sesi tidak valid. Silakan login ulang.', 401)
  if (session.role !== 'admin') return fail('Hanya admin yang dapat mengubah master data.', 403)
  if (!isSameOrigin(request)) return fail('Permintaan tidak valid.', 403)

  const { collection } = await params
  if (!isValidCollection(collection) || collection === 'auditTrail') {
    return fail('Koleksi data tidak valid.', 404)
  }

  try {
    const body = await readBody(request)
    const items = Array.isArray(body) ? body : asRecord(body).items
    if (!Array.isArray(items)) return fail('Payload harus berupa array data.')

    const normalized: CollectionRow[] = items.map((entry) => {
      const row = asRecord(entry)
      const hasId = typeof row.id === 'string' || typeof row.id === 'number'
      return { ...row, id: hasId ? (row.id as string | number) : createId('REC') }
    })

    await mutateDatabase((database) => {
      setRows(database, collection, normalized)
      appendAudit(
        database,
        session,
        'REPLACE',
        collection,
        undefined,
        `Memperbarui seluruh master ${collection} (${normalized.length} baris).`
      )
    })
    return NextResponse.json({ ok: true, count: normalized.length })
  } catch (error) {
    if (error instanceof ApiError) return fail(error.message, error.status)
    console.error('Replace collection failed', error)
    return fail('Gagal menyimpan master data.', 500)
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ collection: string }> }) {
  const session = await getSession()
  if (!session) return fail('Sesi tidak valid. Silakan login ulang.', 401)
  if (session.role !== 'admin') return fail('Hanya admin yang dapat memperbarui status data.', 403)
  if (!isSameOrigin(request)) return fail('Permintaan tidak valid.', 403)

  const { collection } = await params
  if (!isValidCollection(collection) || collection === 'auditTrail') {
    return fail('Koleksi data tidak valid.', 404)
  }

  try {
    const body = asRecord(await readBody(request))
    const id = body.id
    const patch = asRecord(body.patch)
    if (id === undefined || id === null || Object.keys(patch).length === 0) {
      return fail('ID dan data perubahan wajib dikirim.')
    }

    const updated = await mutateDatabase((database) => {
      const list = rowsOf(database, collection)
      const index = list.findIndex((item) => String(item.id) === String(id))
      if (index < 0) throw new ApiError(404, 'Data tidak ditemukan.')

      const next: CollectionRow = { ...list[index], ...patch }
      if (
        (collection === 'reimbursementClaims' || collection === 'fuelLogs') &&
        patch.status !== undefined
      ) {
        next.reviewed_by = session.username
        next.reviewed_at = new Date().toISOString()
      }
      list[index] = next
      setRows(database, collection, list)
      const plate = asText(next.plate_number)
      appendAudit(
        database,
        session,
        'UPDATE',
        collection,
        String(id),
        `Memperbarui ${collection}${plate ? ` ${plate}` : ''}${patch.status ? ` menjadi ${String(patch.status)}` : ''}.`
      )
      return next
    })
    return NextResponse.json({ ok: true, item: updated })
  } catch (error) {
    if (error instanceof ApiError) return fail(error.message, error.status)
    console.error('Patch collection item failed', error)
    return fail('Gagal memperbarui data.', 500)
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ collection: string }> }) {
  const session = await getSession()
  if (!session) return fail('Sesi tidak valid. Silakan login ulang.', 401)
  if (session.role !== 'admin') return fail('Hanya admin yang dapat menghapus data.', 403)
  if (!isSameOrigin(request)) return fail('Permintaan tidak valid.', 403)

  const { collection } = await params
  if (!isValidCollection(collection) || collection === 'auditTrail') {
    return fail('Koleksi data tidak valid.', 404)
  }

  const id = new URL(request.url).searchParams.get('id')
  if (!id) return fail('ID data wajib dikirim.')

  try {
    await mutateDatabase((database) => {
      const list = rowsOf(database, collection)
      const next = list.filter((item) => String(item.id) !== String(id))
      if (next.length === list.length) throw new ApiError(404, 'Data tidak ditemukan.')
      setRows(database, collection, next)
      appendAudit(database, session, 'DELETE', collection, id, `Menghapus data ${collection}.`)
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof ApiError) return fail(error.message, error.status)
    console.error('Delete collection item failed', error)
    return fail('Gagal menghapus data.', 500)
  }
}
