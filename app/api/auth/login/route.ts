import { NextResponse } from 'next/server'
import {
  authenticate,
  checkLoginRateLimit,
  clientKey,
  isSameOrigin,
  isSecureRequest,
  resetLoginRateLimit,
  SESSION_MAX_AGE_SECONDS,
} from '@/lib/auth-session'
import { createSessionCookie } from '@/lib/auth'
import { readDatabase } from '@/lib/server/store'

export const runtime = 'nodejs'

async function sessionHours(): Promise<number> {
  try {
    const database = await readDatabase()
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

  let body: { username?: string; password?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, message: 'Format permintaan tidak valid.' }, { status: 400 })
  }

  const username = String(body.username || '').trim()
  const password = String(body.password || '')

  if (!username || !password) {
    return NextResponse.json({ ok: false, message: 'Username dan password wajib diisi.' }, { status: 400 })
  }

  const user = authenticate(username, password)
  if (!user) {
    return NextResponse.json({ ok: false, message: 'Username atau password salah.' }, { status: 401 })
  }

  const hours = await sessionHours()
  const maxAgeSeconds = Math.round(hours * 3600)
  user.exp = Math.floor(Date.now() / 1000) + maxAgeSeconds

  resetLoginRateLimit(key)
  await createSessionCookie(user, maxAgeSeconds, isSecureRequest(request))

  return NextResponse.json({
    ok: true,
    user: { username: user.username, name: user.name, role: user.role, driverName: user.driverName },
    redirect: user.role === 'admin' ? '/admin' : '/driver',
  })
}
