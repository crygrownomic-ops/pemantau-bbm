import type { Metadata, Viewport } from 'next'
import { JetBrains_Mono, Manrope } from 'next/font/google'
import './globals.css'

const manrope = Manrope({
  variable: '--font-manrope',
  subsets: ['latin'],
  display: 'swap',
})

const jetbrains = JetBrains_Mono({
  variable: '--font-jetbrains',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'FleetOps 360 — Kendali BBM & Operasional Armada',
    template: '%s · FleetOps 360',
  },
  description:
    'Sistem internal pengendalian konsumsi BBM, kualitas operasional armada, reimbursement, dan pemeliharaan kendaraan perusahaan.',
  applicationName: 'FleetOps 360',
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  themeColor: '#0b1a29',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="id" className={`${manrope.variable} ${jetbrains.variable} h-full`}>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  )
}
