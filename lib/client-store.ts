import type { AppSettings, CollectionName, FleetDatabase, SessionUser } from './types'

interface ApiPayload<T> {
  ok: boolean
  data?: T
  item?: T
  message?: string
  count?: number
  user?: SessionUser | null
  redirect?: string
}

async function request<T>(url: string, init?: RequestInit): Promise<ApiPayload<T>> {
  let response: Response
  try {
    response = await fetch(url, {
      credentials: 'same-origin',
      ...init,
      headers: {
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...(init?.headers || {}),
      },
    })
  } catch {
    throw new Error('Tidak dapat menghubungi server. Periksa koneksi Anda.')
  }

  const payload = (await response.json().catch(() => null)) as ApiPayload<T> | null

  if (response.status === 401 && typeof window !== 'undefined' && !url.includes('/auth/login')) {
    // Redirect penuh diperlukan karena sesi habis di luar siklus navigasi React.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`
    throw new Error('Sesi berakhir. Silakan login ulang.')
  }

  if (!response.ok || !payload || payload.ok === false) {
    throw new Error(payload?.message || 'Terjadi kesalahan pada server.')
  }

  return payload
}

export async function fetchFleet(): Promise<FleetDatabase> {
  const payload = await request<FleetDatabase>('/api/fleet', { cache: 'no-store' })
  if (!payload.data) throw new Error('Data armada tidak tersedia.')
  return payload.data
}

export async function createItem<T = Record<string, unknown>>(
  collection: CollectionName,
  body: Record<string, unknown>
): Promise<T> {
  const payload = await request<T>(`/api/fleet/${collection}`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
  if (!payload.item) throw new Error('Data gagal disimpan.')
  return payload.item
}

export async function patchItem<T = Record<string, unknown>>(
  collection: CollectionName,
  id: string | number,
  patch: Record<string, unknown>
): Promise<T> {
  const payload = await request<T>(`/api/fleet/${collection}`, {
    method: 'PATCH',
    body: JSON.stringify({ id, patch }),
  })
  if (!payload.item) throw new Error('Data gagal diperbarui.')
  return payload.item
}

export async function deleteItem(collection: CollectionName, id: string | number): Promise<void> {
  await request(`/api/fleet/${collection}?id=${encodeURIComponent(String(id))}`, { method: 'DELETE' })
}

export async function replaceCollection<T>(
  collection: CollectionName,
  items: T[]
): Promise<void> {
  await request(`/api/fleet/${collection}`, {
    method: 'PUT',
    body: JSON.stringify({ items }),
  })
}

export async function saveSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
  const payload = await request<AppSettings>('/api/settings', {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
  if (!payload.data) throw new Error('Pengaturan gagal disimpan.')
  return payload.data
}

export async function resetDemoData(): Promise<FleetDatabase> {
  const payload = await request<FleetDatabase>('/api/admin/reset', { method: 'POST' })
  if (!payload.data) throw new Error('Data gagal direset.')
  return payload.data
}

export async function logout(): Promise<void> {
  await request('/api/auth/logout', { method: 'POST' })
}

export async function login(username: string, password: string) {
  const payload = await request<never>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
  return payload
}

export async function fetchSessionUser(): Promise<SessionUser | null> {
  const payload = await request<never>('/api/auth/session', { cache: 'no-store' })
  return payload.user ?? null
}
