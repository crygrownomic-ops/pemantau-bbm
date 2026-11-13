import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { PlatformLoginForm } from '@/components/platform/PlatformLoginForm'

export const metadata = {
  title: 'Konsol Platform',
}

export const dynamic = 'force-dynamic'

export default async function PlatformLoginPage() {
  const session = await getSession()
  if (session) {
    if (session.role === 'owner') redirect('/platform')
    redirect(session.role === 'admin' ? '/admin' : '/driver')
  }

  return <PlatformLoginForm />
}
