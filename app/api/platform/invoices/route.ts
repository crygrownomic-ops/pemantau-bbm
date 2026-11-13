import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { isSameOrigin } from '@/lib/auth-session'
import { createInvoiceRecord, updateInvoiceRecord } from '@/lib/server/platform-store'
import type { InvoiceStatus, PlanId } from '@/lib/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const PLANS: PlanId[] = ['trial', 'starter', 'growth', 'enterprise']
const STATUSES: InvoiceStatus[] = ['UNPAID', 'PAID', 'VOID']

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

  const tenantId = String(body.tenantId || '')
  if (!tenantId) return fail('Tenant wajib dipilih.')

  try {
    const invoice = await createInvoiceRecord({
      tenantId,
      plan: PLANS.includes(body.plan as PlanId) ? (body.plan as PlanId) : undefined,
      periodStart: typeof body.periodStart === 'string' ? body.periodStart : undefined,
      periodEnd: typeof body.periodEnd === 'string' ? body.periodEnd : undefined,
      amount: body.amount === undefined || body.amount === '' ? undefined : Number(body.amount),
      dueInDays: body.dueInDays === undefined ? undefined : Number(body.dueInDays),
      note: typeof body.note === 'string' ? body.note : undefined,
    })
    return NextResponse.json({ ok: true, invoice })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal membuat invoice.'
    console.error('Create invoice failed', error)
    return fail(message, 400)
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
  if (!id) return fail('ID invoice wajib dikirim.')

  try {
    const invoice = await updateInvoiceRecord({
      id,
      status: STATUSES.includes(body.status as InvoiceStatus) ? (body.status as InvoiceStatus) : undefined,
      method: typeof body.method === 'string' ? body.method : undefined,
      note: typeof body.note === 'string' ? body.note : undefined,
      amount: body.amount === undefined || body.amount === '' ? undefined : Number(body.amount),
    })
    return NextResponse.json({ ok: true, invoice })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal memperbarui invoice.'
    console.error('Update invoice failed', error)
    return fail(message, 400)
  }
}
