import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { PlatformConsole } from '@/components/platform/PlatformConsole'

export const dynamic = 'force-dynamic'

export default async function PlatformPage() {
  const session = await getSession()
  if (!session) redirect('/platform/login')
  if (session.role !== 'owner') redirect(session.role === 'admin' ? '/admin' : '/driver')

  return <PlatformConsole ownerName={session.name || session.username} />
}
