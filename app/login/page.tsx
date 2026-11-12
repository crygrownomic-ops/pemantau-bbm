import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { LoginForm } from '@/components/auth/LoginForm'

export const metadata = {
  title: 'Masuk',
}

export const dynamic = 'force-dynamic'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const session = await getSession()
  if (session) {
    redirect(session.role === 'admin' ? '/admin' : '/driver')
  }

  const params = await searchParams
  return <LoginForm nextPath={params.next} />
}
