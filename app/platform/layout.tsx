import type { ReactNode } from 'react'

export const metadata = {
  title: 'Konsol Platform',
  robots: { index: false, follow: false },
}

export default function PlatformLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
