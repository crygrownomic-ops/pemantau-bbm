import { cookies } from 'next/headers'
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  signSessionToken,
  verifySessionToken,
} from './auth-session'
import type { SessionUser } from './types'

export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies()
  return verifySessionToken(store.get(SESSION_COOKIE)?.value)
}

export async function requireSession(): Promise<SessionUser> {
  const session = await getSession()
  if (!session) throw new Error('UNAUTHORIZED')
  return session
}

export async function requireAdmin(): Promise<SessionUser> {
  const session = await requireSession()
  if (session.role !== 'admin') throw new Error('FORBIDDEN')
  return session
}

/** Sesi tenant yang valid (admin atau driver) beserta ID tenant-nya. */
export async function requireTenantSession(): Promise<SessionUser & { tenantId: string }> {
  const session = await requireSession()
  if (!session.tenantId) throw new Error('FORBIDDEN')
  return session as SessionUser & { tenantId: string }
}

export async function requireOwner(): Promise<SessionUser> {
  const session = await requireSession()
  if (session.role !== 'owner') throw new Error('FORBIDDEN')
  return session
}

export async function createSessionCookie(
  user: SessionUser,
  maxAgeSeconds: number = SESSION_MAX_AGE_SECONDS,
  secure: boolean = process.env.NODE_ENV === 'production'
): Promise<void> {
  const store = await cookies()
  store.set(SESSION_COOKIE, signSessionToken(user), {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: maxAgeSeconds,
  })
}

export async function clearSessionCookie(secure: boolean = process.env.NODE_ENV === 'production'): Promise<void> {
  const store = await cookies()
  store.set(SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: 0,
  })
}
