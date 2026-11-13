import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { JetBrains_Mono, Manrope } from 'next/font/google'
import { PwaProvider } from '@/components/pwa/PwaProvider'
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
  appleWebApp: {
    capable: true,
    title: 'FleetOps 360',
    statusBarStyle: 'black-translucent',
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '64x64', type: 'image/x-icon' },
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0b1a29' },
    { media: '(prefers-color-scheme: dark)', color: '#0b1a29' },
  ],
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id" className={`${manrope.variable} ${jetbrains.variable} h-full`}>
      <body className="min-h-full antialiased">
        {children}
        <PwaProvider />
      </body>
    </html>
  )
}
