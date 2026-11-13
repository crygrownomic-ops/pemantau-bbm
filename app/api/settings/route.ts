import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { isSameOrigin } from '@/lib/auth-session'
import { appendAudit, mutateDatabase } from '@/lib/server/store'
import type { AppSettings } from '@/lib/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const NUMERIC_FIELDS: Array<'fuel_anomaly_threshold' | 'quality_target' | 'session_hours'> = [
  'fuel_anomaly_threshold',
  'quality_target',
  'session_hours',
]

function fail(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status })
}

export async function PATCH(request: Request) {
  const session = await getSession()
  if (!session) return fail('Sesi tidak valid. Silakan login ulang.', 401)
  if (session.role !== 'admin') return fail('Hanya admin yang dapat mengubah pengaturan.', 403)
  if (!isSameOrigin(request)) return fail('Permintaan tidak valid.', 403)

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return fail('Format data tidak valid.')
  }

  try {
    const settings = await mutateDatabase((database) => {
      const next: AppSettings = { ...database.settings }

      if (typeof body.company_name === 'string') next.company_name = body.company_name.trim().slice(0, 120)
      if (typeof body.company_short === 'string') next.company_short = body.company_short.trim().slice(0, 24)
      if (typeof body.currency === 'string') next.currency = body.currency.trim().slice(0, 8) || 'IDR'

      for (const field of NUMERIC_FIELDS) {
        const raw = body[field]
        if (raw === undefined || raw === null || raw === '') continue
        const value = Number(raw)
        if (!Number.isFinite(value) || value < 0) continue
        if (field === 'quality_target' || field === 'fuel_anomaly_threshold') {
          next[field] = Math.min(100, Math.max(0, Math.round(value)))
        } else {
          next[field] = Math.min(72, Math.max(1, Math.round(value)))
        }
      }

      if (!next.company_name) next.company_name = database.settings.company_name
      if (!next.company_short) next.company_short = database.settings.company_short

      database.settings = next
      appendAudit(database, session, 'UPDATE', 'settings', undefined, 'Memperbarui pengaturan perusahaan dan ambang kualitas BBM.')
      return next
    })

    return NextResponse.json({ ok: true, data: settings })
  } catch (error) {
    console.error('Failed to update settings', error)
    return fail('Gagal menyimpan pengaturan.', 500)
  }
}
