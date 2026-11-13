import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'FleetOps 360 — Kendali BBM & Operasional Armada',
    short_name: 'FleetOps 360',
    description:
      'Sistem pengendalian konsumsi BBM, kualitas operasional armada, reimbursement, dan pemeliharaan kendaraan perusahaan.',
    id: '/',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    display_override: ['window-controls-overlay', 'standalone', 'minimal-ui'],
    orientation: 'portrait-primary',
    background_color: '#f3f5f9',
    theme_color: '#0b1a29',
    lang: 'id',
    dir: 'ltr',
    categories: ['business', 'productivity', 'utilities'],
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
    shortcuts: [
      {
        name: 'Dashboard Admin',
        short_name: 'Dashboard',
        description: 'Buka dashboard kualitas BBM dan operasional armada.',
        url: '/admin',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Portal Driver',
        short_name: 'Driver',
        description: 'Kirim laporan BBM, inspeksi, dan klaim jalan.',
        url: '/driver',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Laporan Bulanan',
        short_name: 'Laporan',
        description: 'Rekap bulanan dan ekspor PDF.',
        url: '/admin/reports',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
      },
    ],
  }
}
