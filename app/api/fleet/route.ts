import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { databaseForSession, readDatabase } from '@/lib/server/store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ ok: false, message: 'Sesi tidak valid. Silakan login ulang.' }, { status: 401 })
  }

  try {
    const database = await readDatabase()
    return NextResponse.json({ ok: true, data: databaseForSession(database, session) })
  } catch (error) {
    console.error('Failed to read fleet database', error)
    return NextResponse.json({ ok: false, message: 'Gagal membaca database armada.' }, { status: 500 })
  }
}
