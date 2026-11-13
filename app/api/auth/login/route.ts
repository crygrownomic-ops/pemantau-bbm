import { NextResponse } from 'next/server'
import {
  checkLoginRateLimit,
  clientKey,
  isSameOrigin,
  isSecureRequest,
  resetLoginRateLimit,
  SESSION_MAX_AGE_SECONDS,
} from '@/lib/auth-session'
import { createSessionCookie } from '@/lib/auth'
import { authenticateTenant } from '@/lib/server/auth-service'
import { readDatabase } from '@/lib/server/store'

export const runtime = 'nodejs'

async function sessionHours(tenantId: string): Promise<number> {
  try {
    const database = await readDatabase(tenantId)
    const hours = Number(database.settings?.session_hours)
    if (Number.isFinite(hours) && hours >= 1 && hours <= 72) return Math.round(hours)
  } catch {
    // Gunakan durasi default bila database belum dapat dibaca.
  }
  return SESSION_MAX_AGE_SECONDS / 3600
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ ok: false, message: 'Permintaan tidak valid.' }, { status: 403 })
  }

  const key = clientKey(request)
  const limit = checkLoginRateLimit(key)
  if (!limit.allowed) {
    return NextResponse.json(
      { ok: false, message: `Terlalu banyak percobaan. Coba lagi dalam ${limit.retryAfterSeconds} detik.` },
      { status: 429 }
    )
  }

  let body: { company_code?: string; username?: string; password?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, message: 'Format permintaan tidak valid.' }, { status: 400 })
  }

  const companyCode = String(body.company_code || '').trim()
  const username = String(body.username || '').trim()
  const password = String(body.password || '')

  if (!username || !password) {
    return NextResponse.json({ ok: false, message: 'Username dan password wajib diisi.' }, { status: 400 })
  }

  const result = await authenticateTenant(companyCode, username, password)
  if (!result.user) {
    return NextResponse.json(
      { ok: false, message: result.message || 'Username atau password salah.' },
      { status: result.status || 401 }
    )
  }

  const user = result.user
  const hours = await sessionHours(user.tenantId as string)
  const maxAgeSeconds = Math.round(hours * 3600)
  user.exp = Math.floor(Date.now() / 1000) + maxAgeSeconds

  resetLoginRateLimit(key)
  await createSessionCookie(user, maxAgeSeconds, isSecureRequest(request))

  return NextResponse.json({
    ok: true,
    user: {
      username: user.username,
      name: user.name,
      role: user.role,
      driverName: user.driverName,
      tenantId: user.tenantId,
      tenantName: user.tenantName,
    },
    redirect: user.role === 'admin' ? '/admin' : '/driver',
  })
}
