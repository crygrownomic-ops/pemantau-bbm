import { NextResponse } from 'next/server'
import { checkLoginRateLimit, clientKey, isSameOrigin, isSecureRequest, resetLoginRateLimit } from '@/lib/auth-session'
import { createSessionCookie } from '@/lib/auth'
import { createTenantRecord } from '@/lib/server/platform-store'
import { readDatabase } from '@/lib/server/store'
import { planLimits } from '@/lib/plans'

export const runtime = 'nodejs'

const CODE_PATTERN = /^[a-z0-9][a-z0-9-]{1,23}$/
const USERNAME_PATTERN = /^[a-zA-Z0-9._-]{3,32}$/

function fail(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status })
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return fail('Permintaan tidak valid.', 403)

  const key = `register:${clientKey(request)}`
  const limit = checkLoginRateLimit(key)
  if (!limit.allowed) {
    return fail(`Terlalu banyak percobaan pendaftaran. Coba lagi dalam ${limit.retryAfterSeconds} detik.`, 429)
  }

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return fail('Format permintaan tidak valid.')
  }

  const companyName = String(body.company_name || '').trim()
  const companyCode = String(body.company_code || '').trim().toLowerCase()
  const adminName = String(body.admin_name || '').trim()
  const username = String(body.username || '').trim().toLowerCase()
  const password = String(body.password || '')
  const contactEmail = String(body.email || '').trim()
  const contactPhone = String(body.phone || '').trim()

  if (companyName.length < 2) return fail('Nama perusahaan minimal 2 karakter.')
  if (!CODE_PATTERN.test(companyCode)) {
    return fail('Kode perusahaan harus 2-24 karakter: huruf kecil, angka, atau tanda hubung.')
  }
  if (adminName.length < 2) return fail('Nama administrator minimal 2 karakter.')
  if (!USERNAME_PATTERN.test(username)) {
    return fail('Username 3-32 karakter: huruf, angka, titik, garis bawah, atau tanda hubung.')
  }
  if (password.length < 8) return fail('Password minimal 8 karakter.')
  if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    return fail('Format email tidak valid.')
  }

  try {
    const tenant = await createTenantRecord({
      name: companyName,
      code: companyCode,
      plan: 'trial',
      adminName,
      adminUsername: username,
      adminPassword: password,
      contactEmail,
      contactPhone,
      contactName: adminName,
    })

    resetLoginRateLimit(key)

    const database = await readDatabase(tenant.id)
    const hours = Number(database.settings.session_hours)
    const maxAgeSeconds = (Number.isFinite(hours) && hours >= 1 && hours <= 72 ? hours : 8) * 3600

    await createSessionCookie(
      {
        username,
        name: adminName,
        role: 'admin',
        tenantId: tenant.id,
        tenantName: tenant.name,
        exp: Math.floor(Date.now() / 1000) + Math.round(maxAgeSeconds),
      },
      Math.round(maxAgeSeconds),
      isSecureRequest(request)
    )

    return NextResponse.json({
      ok: true,
      tenant: { id: tenant.id, code: tenant.code, name: tenant.name, plan: tenant.plan, limits: planLimits(tenant.plan) },
      redirect: '/admin',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Pendaftaran gagal.'
    if (/sudah digunakan|sudah terdaftar/.test(message)) {
      return fail(message, 409)
    }
    console.error('Tenant registration failed', error)
    return fail('Pendaftaran gagal. Coba beberapa saat lagi.', 500)
  }
}
