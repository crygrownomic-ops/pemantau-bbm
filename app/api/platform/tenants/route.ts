import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { isSameOrigin } from '@/lib/auth-session'
import {
  createTenantRecord,
  deleteTenantRecord,
  updateTenantRecord,
} from '@/lib/server/platform-store'
import type { PlanId, TenantStatus } from '@/lib/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const CODE_PATTERN = /^[a-z0-9][a-z0-9-]{1,23}$/
const USERNAME_PATTERN = /^[a-zA-Z0-9._-]{3,32}$/
const PLANS: PlanId[] = ['trial', 'starter', 'growth', 'enterprise']
const STATUSES: TenantStatus[] = ['TRIAL', 'ACTIVE', 'SUSPENDED', 'EXPIRED']

function fail(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status })
}

async function guard(request: Request) {
  const session = await getSession()
  if (!session || session.role !== 'owner') return { error: fail('Akses platform ditolak.', 403) }
  if (!isSameOrigin(request)) return { error: fail('Permintaan tidak valid.', 403) }
  return { session }
}

export async function POST(request: Request) {
  const guardResult = await guard(request)
  if (guardResult.error) return guardResult.error

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return fail('Format data tidak valid.')
  }

  const name = String(body.name || '').trim()
  const code = String(body.code || '').trim().toLowerCase()
  const adminName = String(body.adminName || '').trim()
  const adminUsername = String(body.adminUsername || '').trim().toLowerCase()
  const adminPassword = String(body.adminPassword || '')
  const plan = PLANS.includes(body.plan as PlanId) ? (body.plan as PlanId) : 'trial'

  if (name.length < 2) return fail('Nama perusahaan minimal 2 karakter.')
  if (!CODE_PATTERN.test(code)) return fail('Kode perusahaan tidak valid.')
  if (adminName.length < 2) return fail('Nama administrator minimal 2 karakter.')
  if (!USERNAME_PATTERN.test(adminUsername)) return fail('Username administrator tidak valid.')
  if (adminPassword.length < 8) return fail('Password administrator minimal 8 karakter.')

  try {
    const tenant = await createTenantRecord({
      name,
      code,
      plan,
      adminName,
      adminUsername,
      adminPassword,
      contactName: String(body.contactName || adminName).trim(),
      contactEmail: String(body.contactEmail || '').trim(),
      contactPhone: String(body.contactPhone || '').trim(),
      notes: String(body.notes || '').trim(),
      status: 'ACTIVE',
    })
    return NextResponse.json({ ok: true, tenant })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal membuat tenant.'
    if (/sudah digunakan|sudah terdaftar/.test(message)) return fail(message, 409)
    console.error('Create tenant failed', error)
    return fail('Gagal membuat tenant.', 500)
  }
}

export async function PATCH(request: Request) {
  const guardResult = await guard(request)
  if (guardResult.error) return guardResult.error

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return fail('Format data tidak valid.')
  }

  const id = String(body.id || '')
  if (!id) return fail('ID tenant wajib dikirim.')

  try {
    const tenant = await updateTenantRecord({
      id,
      name: typeof body.name === 'string' ? body.name : undefined,
      plan: PLANS.includes(body.plan as PlanId) ? (body.plan as PlanId) : undefined,
      status: STATUSES.includes(body.status as TenantStatus) ? (body.status as TenantStatus) : undefined,
      activeUntil: typeof body.activeUntil === 'string' ? body.activeUntil : undefined,
      trialEndsAt: typeof body.trialEndsAt === 'string' ? body.trialEndsAt : undefined,
      contactName: typeof body.contactName === 'string' ? body.contactName : undefined,
      contactEmail: typeof body.contactEmail === 'string' ? body.contactEmail : undefined,
      contactPhone: typeof body.contactPhone === 'string' ? body.contactPhone : undefined,
      notes: typeof body.notes === 'string' ? body.notes : undefined,
    })
    return NextResponse.json({ ok: true, tenant })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal memperbarui tenant.'
    console.error('Update tenant failed', error)
    return fail(message, 400)
  }
}

export async function DELETE(request: Request) {
  const guardResult = await guard(request)
  if (guardResult.error) return guardResult.error

  const id = new URL(request.url).searchParams.get('id')
  if (!id) return fail('ID tenant wajib dikirim.')

  try {
    await deleteTenantRecord(id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal menghapus tenant.'
    return fail(message, 400)
  }
}
