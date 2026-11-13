import { Suspense, type ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { FleetProvider } from '@/components/providers/FleetProvider'
import { AdminShell } from '@/components/admin/AdminShell'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getSession()

  if (!session) {
    redirect('/login?next=/admin')
  }
  if (session.role === 'owner') {
    redirect('/platform')
  }
  if (session.role !== 'admin' || !session.tenantId) {
    redirect('/driver')
  }

  return (
    <FleetProvider>
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-canvas">
            <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-navy-800" />
              Memuat workspace…
            </div>
          </div>
        }
      >
        <AdminShell
          user={{
            username: session.username,
            name: session.name,
            role: session.role,
            tenantName: session.tenantName,
          }}
        >
          {children}
        </AdminShell>
      </Suspense>
    </FleetProvider>
  )
}
