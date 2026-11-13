import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ ok: true, user: null })
  }
  return NextResponse.json({
    ok: true,
    user: {
      username: session.username,
      name: session.name,
      role: session.role,
      driverName: session.driverName,
      tenantId: session.tenantId,
      tenantName: session.tenantName,
    },
  })
}
