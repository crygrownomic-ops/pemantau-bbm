import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { isSameOrigin } from '@/lib/auth-session'
import { appendAudit, createId, isValidCollection, mutateDatabase } from '@/lib/server/store'
import type { CollectionName, FleetDatabase, SessionUser } from '@/lib/types'

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

function fail(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status })
}

function asNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function cleanReceipt(value: unknown): string {
  const receipt = typeof value === 'string' ? value : ''
  if (receipt.length > MAX_RECEIPT_CHARS) {
    throw new ApiError(413, 'Ukuran foto struk terlalu besar. Maksimal sekitar 2 MB.')
  }
  return receipt
}

function createFuelLog(database: FleetDatabase, session: SessionUser, body: any) {
  const plate = String(body.plate_number || '')
  const vehicle = database.vehicles.find((item) => item.plate_number === plate)
  if (!vehicle) throw new ApiError(400, 'Armada tidak ditemukan pada master data.')

  const initialKm = asNumber(vehicle.last_km)
  const finalKm = asNumber(body.final_km)
  const liters = asNumber(body.liters)
  const distanceKm = finalKm - initialKm

  if (finalKm <= 0) throw new ApiError(400, 'KM odometer akhir wajib diisi.')
  if (distanceKm <= 0) throw new ApiError(400, `KM akhir harus lebih besar dari KM awal (${initialKm}).`)
  if (liters <= 0) throw new ApiError(400, 'Jumlah liter BBM harus lebih dari 0.')

  const fuelType = String(body.fuel_type || '')
  const fuelPrice = database.fuelPrices.find((fuel) => fuel.name === fuelType)
  const unitPrice = asNumber(body.unit_price) || asNumber(fuelPrice?.price)
  if (unitPrice <= 0) throw new ApiError(400, 'Harga satuan BBM tidak valid.')

  const fillLocation = body.fill_location === 'ECERAN' ? 'ECERAN' : 'SPBU Resmi'
  const driverName =
    session.role === 'driver' ? session.driverName || session.name : String(body.driver_name || 'Driver')

  const item = {
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
    eceran_note: fillLocation === 'ECERAN' ? String(body.eceran_note || '') : '',
    date: String(body.date || new Date().toISOString().slice(0, 10)),
    status: fillLocation === 'ECERAN' ? 'FLAGGED' : 'PENDING',
    receipt_image: cleanReceipt(body.receipt_image),
    audit_note: fillLocation === 'ECERAN' ? 'Pengisian BBM eceran / darurat terdeteksi.' : '',
    created_by: session.name,
    created_at: new Date().toISOString(),
  }

  database.fuelLogs.unshift(item)
  vehicle.last_km = finalKm

  return item
}

function createInspection(database: FleetDatabase, session: SessionUser, body: any) {
  const plate = String(body.plate_number || '')
  if (!database.vehicles.some((vehicle) => vehicle.plate_number === plate)) {
    throw new ApiError(400, 'Armada tidak ditemukan pada master data.')
  }
  const details = body.details && typeof body.details === 'object' ? body.details : {}
  const allOk = Object.keys(details).length > 0 && Object.values(details).every(Boolean)
  const now = new Date()
  const item = {
    id: createId('CHK'),
    date: String(body.date || now.toISOString().slice(0, 10)),
    time: now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    driver_name: session.role === 'driver' ? session.driverName || session.name : String(body.driver_name || 'Driver'),
    plate_number: plate,
    status: allOk ? 'READY' : 'NEEDS_ATTENTION',
    details,
    notes: String(body.notes || ''),
    created_by: session.name,
  }
  database.inspections.unshift(item)
  return item
}

function createClaim(database: FleetDatabase, session: SessionUser, body: any) {
  const plate = String(body.plate_number || '')
  if (!database.vehicles.some((vehicle) => vehicle.plate_number === plate)) {
    throw new ApiError(400, 'Armada tidak ditemukan pada master data.')
  }
  const amount = asNumber(body.amount)
  if (amount <= 0) throw new ApiError(400, 'Nominal klaim harus lebih dari 0.')
  const now = new Date()
  const item = {
    id: createId('CLM'),
    date: String(body.date || now.toISOString().slice(0, 10)),
    time: now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    driver_name: session.role === 'driver' ? session.driverName || session.name : String(body.driver_name || 'Driver'),
    plate_number: plate,
    category: String(body.category || 'Lainnya'),
    amount: Math.round(amount),
    notes: String(body.notes || ''),
    receipt_photo: cleanReceipt(body.receipt_photo),
    status: 'PENDING' as const,
  }
  database.reimbursementClaims.unshift(item)
  return item
}

function createGeneric(collection: CollectionName, session: SessionUser, body: any) {
  const prefixes: Record<string, string> = {
    vehicles: 'V',
    drivers: 'D',
    fuelPrices: 'F',
    serviceHistory: 'SV',
    cashAdvances: 'ADV',
  }
  return {
    ...body,
    id: body.id || createId(prefixes[collection] || 'REC'),
    created_by: session.name,
    created_at: new Date().toISOString(),
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

  let body: any
  try {
    body = await request.json()
  } catch {
    return fail('Format data tidak valid.')
  }

  try {
    const item = await mutateDatabase((database) => {
      let created: any
      if (collection === 'fuelLogs') created = createFuelLog(database, session, body)
      else if (collection === 'inspections') created = createInspection(database, session, body)
      else if (collection === 'reimbursementClaims') created = createClaim(database, session, body)
      else created = createGeneric(collection, session, body)

      ;(database as any)[collection] = [created, ...(database as any)[collection]]
      appendAudit(
        database,
        session,
        'CREATE',
        collection,
        String(created.id),
        `Menambahkan data ${collection} baru${created.plate_number ? ` untuk ${created.plate_number}` : ''}.`
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

  let body: any
  try {
    body = await request.json()
  } catch {
    return fail('Format data tidak valid.')
  }

  const items = Array.isArray(body) ? body : body?.items
  if (!Array.isArray(items)) return fail('Payload harus berupa array data.')

  try {
    await mutateDatabase((database) => {
      const normalized = items.map((item: any) => ({ ...item, id: item.id || createId('REC') }))
      ;(database as any)[collection] = normalized
      appendAudit(
        database,
        session,
        'REPLACE',
        collection,
        undefined,
        `Memperbarui seluruh master ${collection} (${normalized.length} baris).`
      )
    })
    return NextResponse.json({ ok: true, count: items.length })
  } catch (error) {
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

  let body: any
  try {
    body = await request.json()
  } catch {
    return fail('Format data tidak valid.')
  }

  const id = body?.id
  const patch = body?.patch
  if (id === undefined || id === null || !patch || typeof patch !== 'object') {
    return fail('ID dan data perubahan wajib dikirim.')
  }

  try {
    const updated = await mutateDatabase((database) => {
      const list = (database as any)[collection] as any[]
      const index = list.findIndex((item) => String(item.id) === String(id))
      if (index < 0) throw new ApiError(404, 'Data tidak ditemukan.')

      const next = { ...list[index], ...patch }
      if (collection === 'reimbursementClaims' && patch.status) {
        next.reviewed_by = session.username
        next.reviewed_at = new Date().toISOString()
      }
      if (collection === 'fuelLogs' && patch.status) {
        next.reviewed_by = session.username
        next.reviewed_at = new Date().toISOString()
      }
      list[index] = next
      appendAudit(
        database,
        session,
        'UPDATE',
        collection,
        String(id),
        `Memperbarui ${collection}${next.plate_number ? ` ${next.plate_number}` : ''}${patch.status ? ` menjadi ${patch.status}` : ''}.`
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
      const list = (database as any)[collection] as any[]
      const before = list.length
      ;(database as any)[collection] = list.filter((item) => String(item.id) !== String(id))
      if ((database as any)[collection].length === before) throw new ApiError(404, 'Data tidak ditemukan.')
      appendAudit(database, session, 'DELETE', collection, id, `Menghapus data ${collection}.`)
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof ApiError) return fail(error.message, error.status)
    console.error('Delete collection item failed', error)
    return fail('Gagal menghapus data.', 500)
  }
}
