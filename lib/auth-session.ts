import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import type { Role, SessionUser } from './types'

export const SESSION_COOKIE = 'fleetops_session'
export const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60

const DEV_SECRET = 'fleetops-dev-secret-change-me-before-production'

export function sessionSecret(): string {
  return process.env.SESSION_SECRET || DEV_SECRET
}

export function isDefaultSecret(): boolean {
  return !process.env.SESSION_SECRET
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url')
}

function safeEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a)
  const bufferB = Buffer.from(b)
  if (bufferA.length !== bufferB.length) return false
  return timingSafeEqual(bufferA, bufferB)
}

export function signSessionToken(user: SessionUser): string {
  const payload = base64url(JSON.stringify(user))
  const signature = createHmac('sha256', sessionSecret()).update(payload).digest('base64url')
  return `${payload}.${signature}`
}

export function verifySessionToken(token: string | undefined | null): SessionUser | null {
  if (!token || !token.includes('.')) return null
  const [payload, signature] = token.split('.')
  if (!payload || !signature) return null
  const expected = createHmac('sha256', sessionSecret()).update(payload).digest('base64url')
  if (!safeEqual(signature, expected)) return null
  try {
    const user = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as SessionUser
    if (!user || !user.role || !user.username) return null
    if (!user.exp || user.exp < Math.floor(Date.now() / 1000)) return null
    if (user.role !== 'admin' && user.role !== 'driver') return null
    return user
  } catch {
    return null
  }
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const key = scryptSync(password, salt, 64).toString('hex')
  return `scrypt$${salt}$${key}`
}

export function verifyPassword(password: string, stored: string): boolean {
  if (!stored) return false
  if (stored.startsWith('scrypt$')) {
    const [, salt, key] = stored.split('$')
    if (!salt || !key) return false
    const candidate = scryptSync(password, salt, 64).toString('hex')
    return safeEqual(candidate, key)
  }
  return safeEqual(password, stored)
}

interface CredentialUser {
  username: string
  password?: string
  passwordHash?: string
  name: string
  role: Role
  driverName?: string
}

export function getCredentialUsers(): CredentialUser[] {
  const adminUsername = process.env.ADMIN_USERNAME || 'admin'
  const adminName = process.env.ADMIN_NAME || 'Administrator FleetOps'
  const driverUsername = process.env.DRIVER_USERNAME || 'driver'
  const driverName = process.env.DRIVER_NAME || 'Ahmad Supardi'

  const users: CredentialUser[] = [
    {
      username: adminUsername,
      name: adminName,
      role: 'admin',
      passwordHash: process.env.ADMIN_PASSWORD_HASH,
      password: process.env.ADMIN_PASSWORD_HASH ? undefined : process.env.ADMIN_PASSWORD || 'admin123',
    },
    {
      username: driverUsername,
      name: driverName,
      role: 'driver',
      driverName,
      passwordHash: process.env.DRIVER_PASSWORD_HASH,
      password: process.env.DRIVER_PASSWORD_HASH ? undefined : process.env.DRIVER_PASSWORD || 'driver123',
    },
  ]

  if (process.env.OPERATOR_USERNAME && (process.env.OPERATOR_PASSWORD || process.env.OPERATOR_PASSWORD_HASH)) {
    users.push({
      username: process.env.OPERATOR_USERNAME,
      name: process.env.OPERATOR_NAME || 'Fleet Operator',
      role: 'admin',
      passwordHash: process.env.OPERATOR_PASSWORD_HASH,
      password: process.env.OPERATOR_PASSWORD_HASH ? undefined : process.env.OPERATOR_PASSWORD,
    })
  }

  return users
}

export function authenticate(username: string, password: string): SessionUser | null {
  const normalized = String(username || '').trim().toLowerCase()
  const user = getCredentialUsers().find((item) => item.username.trim().toLowerCase() === normalized)
  if (!user) return null
  const stored = user.passwordHash || user.password || ''
  if (!verifyPassword(password, stored)) return null
  return {
    username: user.username,
    name: user.name,
    role: user.role,
    driverName: user.driverName,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
  }
}

export function isSecureRequest(request: Request): boolean {
  const forwarded = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim().toLowerCase()
  if (forwarded === 'https') return true
  if (forwarded === 'http') return false
  try {
    return new URL(request.url).protocol === 'https:'
  } catch {
    return false
  }
}

export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin')
  if (!origin) return true
  const host = request.headers.get('host')
  if (!host) return false
  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}

const attempts = new Map<string, { count: number; resetAt: number }>()

export function checkLoginRateLimit(key: string): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now()
  const entry = attempts.get(key)
  if (!entry || entry.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + 10 * 60 * 1000 })
    return { allowed: true, retryAfterSeconds: 0 }
  }
  entry.count += 1
  if (entry.count > 8) {
    return { allowed: false, retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000) }
  }
  return { allowed: true, retryAfterSeconds: 0 }
}

export function resetLoginRateLimit(key: string): void {
  attempts.delete(key)
}

export function clientKey(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'local'
  )
}
