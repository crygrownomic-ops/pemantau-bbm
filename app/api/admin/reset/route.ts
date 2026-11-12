import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { isSameOrigin } from '@/lib/auth-session'
import { resetDatabase } from '@/lib/server/store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ ok: false, message: 'Sesi tidak valid. Silakan login ulang.' }, { status: 401 })
  }
  if (session.role !== 'admin') {
    return NextResponse.json({ ok: false, message: 'Hanya admin yang dapat mereset database.' }, { status: 403 })
  }
  if (!isSameOrigin(request)) {
    return NextResponse.json({ ok: false, message: 'Permintaan tidak valid.' }, { status: 403 })
  }

  try {
    const database = await resetDatabase()
    return NextResponse.json({ ok: true, data: database })
  } catch (error) {
    console.error('Failed to reset database', error)
    return NextResponse.json({ ok: false, message: 'Gagal mereset database.' }, { status: 500 })
  }
}
