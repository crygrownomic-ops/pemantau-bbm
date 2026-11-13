import { authenticateEnv, SESSION_MAX_AGE_SECONDS, verifyPassword } from '@/lib/auth-session'
import { effectiveTenantStatus } from '@/lib/plans'
import type { SessionUser, Tenant, TenantUser } from '@/lib/types'
import { getTenantByCode, readPlatform } from './platform-store'
import { mutateDatabase, readDatabase } from './store'

export interface AuthResult {
  user?: SessionUser
  message?: string
  status: number
}

function sessionForTenant(tenant: Tenant, user: Omit<SessionUser, 'exp' | 'tenantId' | 'tenantName'>): SessionUser {
  return {
    username: user.username,
    name: user.name,
    role: user.role,
    driverName: user.driverName,
    tenantId: tenant.id,
    tenantName: tenant.name,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
  }
}

function inactiveMessage(tenant: Tenant): string | null {
  const status = effectiveTenantStatus(tenant)
  if (status === 'SUSPENDED') return 'Akun perusahaan ditangguhkan. Hubungi administrator platform.'
  if (status === 'EXPIRED') return 'Masa aktif langganan telah berakhir. Hubungi administrator platform.'
  return null
}

interface CandidateMatch {
  tenant: Tenant
  user: Pick<TenantUser, 'username' | 'name' | 'role' | 'driver_name'> & { driverName?: string }
  userId?: string
}

async function matchInTenant(tenant: Tenant, username: string, password: string): Promise<CandidateMatch | null> {
  const database = await readDatabase(tenant.id).catch(() => null)

  if (database) {
    const user = (database.users || []).find(
      (item) => item.username.toLowerCase() === username && item.status !== 'INACTIVE'
    )
    if (user && user.password_hash && verifyPassword(password, user.password_hash)) {
      return {
        tenant,
        userId: user.id,
        user: {
          username: user.username,
          name: user.name,
          role: user.role,
          driver_name: user.driver_name,
          driverName: user.driver_name,
        },
      }
    }
  }

  // Kredensial env hanya berlaku untuk tenant bawaan hasil migrasi.
  if (tenant.bootstrap) {
    const envUser = authenticateEnv(username, password)
    if (envUser) {
      return {
        tenant,
        user: {
          username: envUser.username,
          name: envUser.name,
          role: envUser.role as 'admin' | 'driver',
          driverName: envUser.driverName,
        },
      }
    }
  }

  return null
}

export async function authenticateTenant(
  code: string,
  username: string,
  password: string
): Promise<AuthResult> {
  const normalizedUser = String(username || '').trim().toLowerCase()
  if (!normalizedUser) return { status: 400, message: 'Username wajib diisi.' }

  let candidates: Tenant[] = []
  if (code.trim()) {
    const tenant = await getTenantByCode(code)
    if (!tenant) {
      return { status: 401, message: 'Kode perusahaan tidak ditemukan.' }
    }
    candidates = [tenant]
  } else {
    const platform = await readPlatform()
    candidates = platform.tenants.slice(0, 100)
  }

  let matched: CandidateMatch | null = null
  for (const tenant of candidates) {
    const result = await matchInTenant(tenant, normalizedUser, password)
    if (result) {
      matched = result
      break
    }
  }

  if (!matched) {
    return {
      status: 401,
      message: code.trim()
        ? 'Username atau password salah untuk perusahaan tersebut.'
        : 'Username atau password salah. Isi kode perusahaan bila akun Anda terdaftar pada perusahaan tertentu.',
    }
  }

  const blocked = inactiveMessage(matched.tenant)
  if (blocked) return { status: 403, message: blocked }

  if (matched.userId) {
    const userId = matched.userId
    void mutateDatabase(matched.tenant.id, (database) => {
      const user = (database.users || []).find((item) => item.id === userId)
      if (user) user.last_login_at = new Date().toISOString()
    }).catch(() => undefined)
  }

  return {
    status: 200,
    user: sessionForTenant(matched.tenant, {
      username: matched.user.username,
      name: matched.user.name,
      role: matched.user.role,
      driverName: matched.user.driverName,
    }),
  }
}

export function authenticatePlatform(username: string, password: string): AuthResult {
  const platformUsername = (process.env.PLATFORM_USERNAME || 'owner').trim()
  const platformName = process.env.PLATFORM_NAME || 'Platform Owner'
  const stored = process.env.PLATFORM_PASSWORD_HASH || process.env.PLATFORM_PASSWORD || 'owner123'

  if (
    String(username || '').trim().toLowerCase() !== platformUsername.toLowerCase() ||
    !verifyPassword(password, stored)
  ) {
    return { status: 401, message: 'Kredensial platform tidak valid.' }
  }

  return {
    status: 200,
    user: {
      username: platformUsername,
      name: platformName,
      role: 'owner',
      exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
    },
  }
}
