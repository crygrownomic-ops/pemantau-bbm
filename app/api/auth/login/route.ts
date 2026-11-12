import { NextResponse } from 'next/server'
import {
  authenticate,
  checkLoginRateLimit,
  clientKey,
  isSameOrigin,
  resetLoginRateLimit,
} from '@/lib/auth-session'
import { createSessionCookie } from '@/lib/auth'

export const runtime = 'nodejs'

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

  resetLoginRateLimit(key)
  await createSessionCookie(user)

  return NextResponse.json({
    ok: true,
    user: { username: user.username, name: user.name, role: user.role, driverName: user.driverName },
    redirect: user.role === 'admin' ? '/admin' : '/driver',
  })
}
