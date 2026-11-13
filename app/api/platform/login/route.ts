import { NextResponse } from 'next/server'
import {
  checkLoginRateLimit,
  clientKey,
  isSameOrigin,
  isSecureRequest,
  resetLoginRateLimit,
} from '@/lib/auth-session'
import { createSessionCookie } from '@/lib/auth'
import { authenticatePlatform } from '@/lib/server/auth-service'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ ok: false, message: 'Permintaan tidak valid.' }, { status: 403 })
  }

  const key = `platform:${clientKey(request)}`
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

  const result = authenticatePlatform(String(body.username || ''), String(body.password || ''))
  if (!result.user) {
    return NextResponse.json(
      { ok: false, message: result.message || 'Kredensial platform tidak valid.' },
      { status: result.status }
    )
  }

  resetLoginRateLimit(key)
  const maxAgeSeconds = 8 * 60 * 60
  result.user.exp = Math.floor(Date.now() / 1000) + maxAgeSeconds

  await createSessionCookie(result.user, maxAgeSeconds, isSecureRequest(request))
  return NextResponse.json({ ok: true, redirect: '/platform' })
}
