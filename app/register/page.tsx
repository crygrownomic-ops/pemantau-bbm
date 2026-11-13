import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { RegisterForm } from '@/components/auth/RegisterForm'

export const metadata = {
  title: 'Daftar Perusahaan',
}

export const dynamic = 'force-dynamic'

export default async function RegisterPage() {
  const session = await getSession()
  if (session) {
    redirect(session.role === 'owner' ? '/platform' : session.role === 'admin' ? '/admin' : '/driver')
  }

  return <RegisterForm />
}
