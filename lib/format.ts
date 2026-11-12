export const MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
]

export const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des']

export function formatCurrency(value: number | string | null | undefined): string {
  const num = Number(value) || 0
  return `Rp ${num.toLocaleString('id-ID')}`
}

export function formatNumber(value: number | string | null | undefined): string {
  return (Number(value) || 0).toLocaleString('id-ID')
}

export function formatCompactCurrency(value: number): string {
  const num = Number(value) || 0
  if (Math.abs(num) >= 1_000_000_000) return `Rp ${(num / 1_000_000_000).toFixed(1)} M`
  if (Math.abs(num) >= 1_000_000) return `Rp ${(num / 1_000_000).toFixed(1)} jt`
  if (Math.abs(num) >= 1_000) return `Rp ${(num / 1_000).toFixed(0)} rb`
  return `Rp ${num.toLocaleString('id-ID')}`
}

export function formatNumberInput(value: number | string | null | undefined): string {
  if (value === '' || value === null || value === undefined) return ''
  const digits = String(value).replace(/\D/g, '')
  if (!digits) return ''
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

export function parseNumberInput(value: string): number {
  return Number(String(value).replace(/\./g, '').replace(/[^\d-]/g, '')) || 0
}

export function formatDate(value: string | undefined | null): string {
  if (!value) return '-'
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function daysUntil(value: string | undefined | null): number | null {
  if (!value) return null
  const target = new Date(`${value}T00:00:00`).getTime()
  if (Number.isNaN(target)) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.ceil((target - today.getTime()) / (1000 * 60 * 60 * 24))
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function monthLabel(monthNumber: string | number): string {
  const index = Number(monthNumber) - 1
  return MONTH_NAMES[index] || '-'
}

export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}
