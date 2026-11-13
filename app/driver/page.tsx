import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { DriverPortal } from '@/components/driver/DriverPortal'

export const dynamic = 'force-dynamic'

export default async function DriverPage() {
  const session = await getSession()

  if (!session) {
    redirect('/login?next=/driver')
  }

  return (
    <DriverPortal
      user={{
        username: session.username,
        name: session.name,
        role: session.role,
        driverName: session.driverName,
      }}
    />
  )
}
