import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { hashPassword, isSameOrigin } from '@/lib/auth-session'
import { getTenant } from '@/lib/server/platform-store'
import { appendAudit, createId, mutateDatabase, publicUser, readDatabase } from '@/lib/server/store'
import type { FleetDatabase, SessionUser, Tenant, TenantUser } from '@/lib/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

type Body = Record<string, unknown>

function fail(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status })
}

function asRecord(value: unknown): Body {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as Body) : {}
}

function asText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeUsername(value: string): string {
  return value.trim().toLowerCase()
}

function validateUsername(username: string): string | null {
  if (!/^[a-z0-9][a-z0-9._-]{2,31}$/.test(username)) {
    return 'Username 3-32 karakter, hanya huruf kecil, angka, titik, garis bawah, atau tanda hubung.'
  }
  return null
}

function validatePassword(password: string): string | null {
  if (password.length < 8) return 'Password minimal 8 karakter.'
  if (password.length > 128) return 'Password terlalu panjang (maksimal 128 karakter).'
  return null
}

async function readBody(request: Request): Promise<Body> {
  try {
    return asRecord(await request.json())
  } catch {
    throw new ApiError(400, 'Format data tidak valid.')
  }
}

async function requireAdminTenant(request: Request): Promise<SessionUser & { tenantId: string }> {
  const session = await getSession()
  if (!session || !session.tenantId) throw new ApiError(401, 'Sesi tidak valid. Silakan login ulang.')
  if (session.role !== 'admin') throw new ApiError(403, 'Hanya admin yang dapat mengelola pengguna.')
  if (!isSameOrigin(request)) throw new ApiError(403, 'Permintaan tidak valid.')
  return session as SessionUser & { tenantId: string }
}

function activeAdmins(database: { users?: TenantUser[] }): TenantUser[] {
  return (database.users || []).filter((user) => user.role === 'admin' && user.status !== 'INACTIVE')
}

function isSelf(session: SessionUser, user: TenantUser): boolean {
  return user.username.toLowerCase() === session.username.toLowerCase()
}

function assertAdminRemains(
  tenant: Tenant | null,
  session: SessionUser,
  target: TenantUser,
  nextRole: TenantUser['role'],
  nextStatus: TenantUser['status'],
  database: FleetDatabase
): void {
  if (target.role !== 'admin') return
  if (nextRole === 'admin' && nextStatus !== 'INACTIVE') return
  if (isSelf(session, target)) {
    throw new ApiError(400, 'Anda tidak dapat menurunkan atau menonaktifkan akun sendiri.')
  }
  if (tenant?.bootstrap) return
  const remaining = activeAdmins(database).filter((user) => user.id !== target.id)
  if (remaining.length === 0) {
    throw new ApiError(400, 'Minimal harus ada satu admin aktif pada perusahaan.')
  }
}

export async function GET() {
  try {
    const session = await getSession()
    if (!session || !session.tenantId) return fail('Sesi tidak valid. Silakan login ulang.', 401)
    if (session.role !== 'admin') return fail('Hanya admin yang dapat melihat daftar pengguna.', 403)

    const tenant = await getTenant(session.tenantId)
    const database = await readDatabase(session.tenantId)
    const users = (database.users || []).map(publicUser)

    return NextResponse.json({
      ok: true,
      users,
      limits: tenant?.limits || null,
      plan: tenant?.plan || null,
    })
  } catch (error) {
    console.error('Failed to list tenant users', error)
    return fail('Gagal memuat daftar pengguna.', 500)
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdminTenant(request)
    const tenantId = session.tenantId
    const body = await readBody(request)

    const username = normalizeUsername(asText(body.username))
    const name = asText(body.name).slice(0, 80)
    const role: TenantUser['role'] = body.role === 'driver' ? 'driver' : 'admin'
    const password = typeof body.password === 'string' ? body.password : ''
    const driverName = asText(body.driver_name).slice(0, 80)
    const status: TenantUser['status'] = body.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE'

    const usernameError = validateUsername(username)
    if (usernameError) throw new ApiError(400, usernameError)
    if (!name) throw new ApiError(400, 'Nama lengkap wajib diisi.')
    const passwordError = validatePassword(password)
    if (passwordError) throw new ApiError(400, passwordError)
    if (role === 'driver' && !driverName) {
      throw new ApiError(400, 'Nama driver wajib diisi untuk akun bertipe driver.')
    }

    const tenant = await getTenant(tenantId)
    const limit = tenant?.limits.users || 3

    const created = await mutateDatabase(tenantId, (database) => {
      if (!Array.isArray(database.users)) database.users = []
      if (database.users.length >= limit) {
        throw new ApiError(
          403,
          `Batas paket ${String(tenant?.plan || 'trial').toUpperCase()} tercapai (${limit} akun). Tingkatkan paket untuk menambah pengguna.`
        )
      }
      if (database.users.some((user) => user.username.toLowerCase() === username)) {
        throw new ApiError(409, 'Username sudah dipakai pada perusahaan ini.')
      }

      const user: TenantUser = {
        id: createId('USR'),
        username,
        name,
        role,
        password_hash: hashPassword(password),
        driver_name: role === 'driver' ? driverName : undefined,
        status,
        created_at: new Date().toISOString(),
      }
      database.users.push(user)
      appendAudit(
        database,
        session,
        'CREATE',
        'users',
        user.id,
        `Menambahkan akun ${role === 'admin' ? 'admin' : 'driver'} untuk ${name} (${username}).`
      )
      return publicUser(user)
    })

    return NextResponse.json({ ok: true, user: created })
  } catch (error) {
    if (error instanceof ApiError) return fail(error.message, error.status)
    console.error('Failed to create tenant user', error)
    return fail('Gagal menyimpan pengguna.', 500)
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireAdminTenant(request)
    const tenantId = session.tenantId
    const body = await readBody(request)
    const id = asText(body.id)
    if (!id) throw new ApiError(400, 'ID pengguna wajib dikirim.')

    const password = typeof body.password === 'string' ? body.password : ''
    if (password) {
      const passwordError = validatePassword(password)
      if (passwordError) throw new ApiError(400, passwordError)
    }

    // Dibaca di luar transaksi agar tidak memakai koneksi pool kedua.
    const tenant = await getTenant(tenantId)

    const updated = await mutateDatabase(tenantId, async (database) => {
      const index = (database.users || []).findIndex((user) => user.id === id)
      if (index < 0) throw new ApiError(404, 'Pengguna tidak ditemukan.')
      const target = database.users[index]

      const name = body.name === undefined ? target.name : asText(body.name).slice(0, 80)
      const role: TenantUser['role'] =
        body.role === undefined ? target.role : body.role === 'driver' ? 'driver' : 'admin'
      const status: TenantUser['status'] =
        body.status === undefined ? target.status : body.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE'
      const driverName =
        body.driver_name === undefined ? target.driver_name || '' : asText(body.driver_name).slice(0, 80)

      if (!name) throw new ApiError(400, 'Nama lengkap wajib diisi.')
      if (role === 'driver' && !driverName) {
        throw new ApiError(400, 'Nama driver wajib diisi untuk akun bertipe driver.')
      }
      assertAdminRemains(tenant, session, target, role, status, database)

      const next: TenantUser = {
        ...target,
        name,
        role,
        status,
        driver_name: role === 'driver' ? driverName : undefined,
        password_hash: password ? hashPassword(password) : target.password_hash,
      }
      database.users[index] = next

      const changes: string[] = []
      if (next.name !== target.name) changes.push('nama')
      if (next.role !== target.role) changes.push('peran')
      if (next.status !== target.status) changes.push('status')
      if (password) changes.push('password')
      appendAudit(
        database,
        session,
        'UPDATE',
        'users',
        next.id,
        `Memperbarui akun ${next.username}${changes.length > 0 ? ` (${changes.join(', ')})` : ''}.`
      )
      return publicUser(next)
    })

    return NextResponse.json({ ok: true, user: updated })
  } catch (error) {
    if (error instanceof ApiError) return fail(error.message, error.status)
    console.error('Failed to update tenant user', error)
    return fail('Gagal memperbarui pengguna.', 500)
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await requireAdminTenant(request)
    const tenantId = session.tenantId
    const id = new URL(request.url).searchParams.get('id') || ''
    if (!id) throw new ApiError(400, 'ID pengguna wajib dikirim.')

    // Dibaca di luar transaksi agar tidak memakai koneksi pool kedua.
    const tenant = await getTenant(tenantId)

    await mutateDatabase(tenantId, async (database) => {
      const index = (database.users || []).findIndex((user) => user.id === id)
      if (index < 0) throw new ApiError(404, 'Pengguna tidak ditemukan.')
      const target = database.users[index]

      if (isSelf(session, target)) {
        throw new ApiError(400, 'Anda tidak dapat menghapus akun sendiri.')
      }
      if (target.role === 'admin') {
        if (!tenant?.bootstrap) {
          const remaining = activeAdmins(database).filter((user) => user.id !== target.id)
          if (remaining.length === 0) {
            throw new ApiError(400, 'Minimal harus ada satu admin aktif pada perusahaan.')
          }
        }
      }

      database.users.splice(index, 1)
      appendAudit(database, session, 'DELETE', 'users', target.id, `Menghapus akun ${target.username}.`)
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof ApiError) return fail(error.message, error.status)
    console.error('Failed to delete tenant user', error)
    return fail('Gagal menghapus pengguna.', 500)
  }
}
