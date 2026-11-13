import { NextResponse } from 'next/server'
import { clearSessionCookie } from '@/lib/auth'
import { isSecureRequest } from '@/lib/auth-session'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  await clearSessionCookie(isSecureRequest(request))
  return NextResponse.json({ ok: true })
}
