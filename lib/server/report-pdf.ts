import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib'
import type { MonthlyReport } from '@/lib/reports'

const PAGE_W = 841.89
const PAGE_H = 595.28
const MARGIN = 36
const USABLE = PAGE_W - MARGIN * 2

const NAVY = rgb(0.043, 0.102, 0.161)
const NAVY_SOFT = rgb(0.16, 0.25, 0.35)
const GOLD = rgb(0.851, 0.671, 0.176)
const SLATE = rgb(0.39, 0.45, 0.55)
const SLATE_LIGHT = rgb(0.62, 0.66, 0.72)
const LINE = rgb(0.88, 0.9, 0.93)
const SURFACE = rgb(0.972, 0.976, 0.984)
const WHITE = rgb(1, 1, 1)
const EMERALD = rgb(0.02, 0.47, 0.34)
const ROSE = rgb(0.75, 0.07, 0.24)
const AMBER = rgb(0.7, 0.4, 0.03)

function safe(value: string): string {
  return String(value ?? '')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u00b7/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/\u2264/g, '<=')
    .replace(/\u2265/g, '>=')
    .replace(/\u00a0/g, ' ')
    .replace(/[^\x20-\x7E]/g, '')
}

function money(value: number): string {
  return `Rp ${Math.round(Number(value) || 0).toLocaleString('id-ID')}`
}

function number(value: number, digits = 0): string {
  return (Number(value) || 0).toLocaleString('id-ID', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

function fit(text: string, font: PDFFont, size: number, width: number): string {
  const clean = safe(text)
  if (font.widthOfTextAtSize(clean, size) <= width) return clean
  let output = clean
  while (output.length > 1 && font.widthOfTextAtSize(`${output}...`, size) > width) {
    output = output.slice(0, -1)
  }
  return `${output}...`
}

function formatDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return safe(value)
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

export async function buildMonthlyReportPdf(report: MonthlyReport): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)

  doc.setTitle(`Laporan Bulanan ${report.period.label} - ${report.company.name}`)
  doc.setSubject('Laporan operasional armada, konsumsi BBM, servis, dan klaim')
  doc.setAuthor('FleetOps 360')
  doc.setCreator('FleetOps 360')

  let page: PDFPage = doc.addPage([PAGE_W, PAGE_H])
  let y = PAGE_H

  const drawHeader = (first: boolean) => {
    page.drawRectangle({ x: 0, y: PAGE_H - 92, width: PAGE_W, height: 92, color: NAVY })
    page.drawRectangle({ x: 0, y: PAGE_H - 95, width: PAGE_W, height: 3, color: GOLD })
    page.drawText('FLEETOPS 360', {
      x: MARGIN,
      y: PAGE_H - 34,
      size: 9,
      font: bold,
      color: GOLD,
    })
    page.drawText(safe(first ? 'LAPORAN BULANAN OPERASIONAL ARMADA' : 'LAPORAN BULANAN (LANJUTAN)'), {
      x: MARGIN,
      y: PAGE_H - 55,
      size: 16,
      font: bold,
      color: WHITE,
    })
    page.drawText(safe(`${report.company.name}  |  Periode ${report.period.label}`), {
      x: MARGIN,
      y: PAGE_H - 74,
      size: 9,
      font,
      color: rgb(0.78, 0.82, 0.87),
    })
    page.drawText(safe(`Dibuat ${formatDate(report.generatedAt)}`), {
      x: PAGE_W - MARGIN - 130,
      y: PAGE_H - 34,
      size: 8,
      font,
      color: rgb(0.72, 0.76, 0.82),
    })
    page.drawText('INTERNAL', {
      x: PAGE_W - MARGIN - 55,
      y: PAGE_H - 74,
      size: 8,
      font: bold,
      color: GOLD,
    })
    y = PAGE_H - 116
  }

  const newPage = () => {
    page = doc.addPage([PAGE_W, PAGE_H])
    drawHeader(false)
  }

  const ensure = (space: number) => {
    if (y - space < MARGIN + 30) newPage()
  }

  const sectionTitle = (title: string, note?: string) => {
    ensure(42)
    page.drawRectangle({ x: MARGIN, y: y - 12, width: 3, height: 12, color: GOLD })
    page.drawText(safe(title), { x: MARGIN + 9, y: y - 11, size: 11, font: bold, color: NAVY })
    if (note) {
      page.drawText(safe(note), {
        x: MARGIN + 9 + bold.widthOfTextAtSize(safe(title), 11) + 10,
        y: y - 10,
        size: 8,
        font,
        color: SLATE_LIGHT,
      })
    }
    y -= 22
  }

  const kpi = (x: number, top: number, width: number, label: string, value: string, hint?: string) => {
    page.drawRectangle({ x, y: top - 50, width, height: 50, color: SURFACE })
    page.drawRectangle({ x, y: top - 50, width: 2.5, height: 50, color: GOLD })
    page.drawText(safe(label).toUpperCase(), { x: x + 11, y: top - 15, size: 6.8, font: bold, color: SLATE_LIGHT })
    page.drawText(fit(value, bold, 13, width - 20), { x: x + 11, y: top - 32, size: 13, font: bold, color: NAVY })
    if (hint) page.drawText(fit(hint, font, 6.8, width - 20), { x: x + 11, y: top - 44, size: 6.8, font, color: SLATE })
  }

  type Align = 'left' | 'right' | 'center'

  const table = (
    headers: string[],
    rows: string[][],
    widths: number[],
    aligns: Align[],
    options: { rowHeight?: number; colorForRow?: (rowIndex: number) => ReturnType<typeof rgb> | null } = {}
  ) => {
    const rowHeight = options.rowHeight ?? 15
    const headerHeight = 17

    const drawHead = () => {
      page.drawRectangle({ x: MARGIN, y: y - headerHeight, width: USABLE, height: headerHeight, color: NAVY })
      let x = MARGIN
      headers.forEach((header, index) => {
        const width = widths[index]
        const align = aligns[index]
        const label = fit(header, bold, 7.4, width - 8)
        const textWidth = bold.widthOfTextAtSize(label, 7.4)
        const tx = align === 'right' ? x + width - 5 - textWidth : align === 'center' ? x + (width - textWidth) / 2 : x + 5
        page.drawText(label, { x: tx, y: y - headerHeight + 5, size: 7.4, font: bold, color: WHITE })
        x += width
      })
      y -= headerHeight
    }

    drawHead()

    rows.forEach((row, rowIndex) => {
      if (y - rowHeight < MARGIN + 30) {
        newPage()
        drawHead()
      }
      if (rowIndex % 2 === 1) {
        page.drawRectangle({ x: MARGIN, y: y - rowHeight, width: USABLE, height: rowHeight, color: SURFACE })
      }
      let x = MARGIN
      row.forEach((cell, index) => {
        const width = widths[index]
        const align = aligns[index]
        const custom = options.colorForRow?.(rowIndex) ?? null
        const label = fit(cell, font, 7.4, width - 8)
        const textWidth = font.widthOfTextAtSize(label, 7.4)
        const tx = align === 'right' ? x + width - 5 - textWidth : align === 'center' ? x + (width - textWidth) / 2 : x + 5
        page.drawText(label, { x: tx, y: y - rowHeight + 4.5, size: 7.4, font, color: custom ?? NAVY_SOFT })
        x += width
      })
      page.drawLine({
        start: { x: MARGIN, y: y - rowHeight },
        end: { x: MARGIN + USABLE, y: y - rowHeight },
        thickness: 0.4,
        color: LINE,
      })
      y -= rowHeight
    })

    if (rows.length === 0) {
      page.drawRectangle({ x: MARGIN, y: y - 28, width: USABLE, height: 28, color: SURFACE })
      page.drawText('Tidak ada data pada periode ini.', {
        x: MARGIN + 8,
        y: y - 18,
        size: 8,
        font,
        color: SLATE,
      })
      y -= 28
    }

    y -= 16
  }

  /* ------------------------------------------------------------------ */
  /* Halaman 1: ringkasan                                               */
  /* ------------------------------------------------------------------ */

  drawHeader(true)

  const gap = 9
  const cardWidth = (USABLE - gap * 3) / 4
  const row1 = y
  kpi(MARGIN, row1, cardWidth, 'Total biaya operasional', money(report.totals.grandTotal), `${report.totals.budgetUsagePct}% dari anggaran`)
  kpi(MARGIN + cardWidth + gap, row1, cardWidth, 'Biaya BBM', money(report.totals.fuelCost), `${report.fuel.trips} transaksi`)
  kpi(MARGIN + (cardWidth + gap) * 2, row1, cardWidth, 'Servis & pemeliharaan', money(report.totals.serviceCost), `${report.service.count} pekerjaan`)
  kpi(MARGIN + (cardWidth + gap) * 3, row1, cardWidth, 'Klaim disetujui', money(report.totals.claimCost), `${report.claims.approved} dari ${report.claims.total} klaim`)
  y -= 60

  const row2 = y
  kpi(MARGIN, row2, cardWidth, 'Jarak tempuh', `${number(report.fuel.distanceKm)} KM`, `${number(report.fuel.liters, 2)} liter BBM`)
  kpi(MARGIN + cardWidth + gap, row2, cardWidth, 'Efisiensi rata-rata', `${number(report.fuel.avgKmL, 2)} KM/L`, 'Dihitung dari seluruh transaksi')
  kpi(MARGIN + (cardWidth + gap) * 2, row2, cardWidth, 'Transaksi perlu audit', `${report.fuel.anomalyCount}`, `${report.fuel.anomalyRatePct}% dari total transaksi`)
  kpi(MARGIN + (cardWidth + gap) * 3, row2, cardWidth, 'Kepatuhan inspeksi', `${report.inspections.coveragePct}%`, `${report.inspections.total} inspeksi harian`)
  y -= 74

  sectionTitle('Ringkasan konsumsi BBM dan kepatuhan')
  const summaryRows: string[][] = [
    ['Transaksi BBM', `${report.fuel.trips}`, 'Transaksi ditandai anomali', `${report.fuel.anomalyCount}`],
    ['Total liter', `${number(report.fuel.liters, 2)} L`, 'Transaksi status FLAGGED', `${report.fuel.flagged}`],
    ['Total jarak', `${number(report.fuel.distanceKm)} KM`, 'Transaksi status PENDING', `${report.fuel.pending}`],
    ['Inspeksi siap jalan', `${report.inspections.ready}`, 'Inspeksi perlu perhatian', `${report.inspections.needsAttention}`],
    ['Klaim menunggu verifikasi', `${report.claims.pending}`, 'Nilai klaim menunggu', money(report.claims.pendingAmount)],
    ['Klaim ditolak', `${report.claims.rejected}`, 'Anggaran bulanan armada', money(report.totals.budget)],
  ]
  const half = (USABLE - 18) / 2
  summaryRows.forEach((row, index) => {
    ensure(20)
    if (index % 2 === 0) {
      page.drawRectangle({ x: MARGIN, y: y - 17, width: USABLE, height: 17, color: SURFACE })
    }
    page.drawText(safe(row[0]), { x: MARGIN + 7, y: y - 12, size: 7.8, font, color: SLATE })
    page.drawText(safe(row[1]), {
      x: MARGIN + half - 12 - font.widthOfTextAtSize(safe(row[1]), 7.8),
      y: y - 12,
      size: 7.8,
      font: bold,
      color: NAVY,
    })
    page.drawText(safe(row[2]), { x: MARGIN + half + 14, y: y - 12, size: 7.8, font, color: SLATE })
    page.drawText(safe(row[3]), {
      x: MARGIN + USABLE - 7 - font.widthOfTextAtSize(safe(row[3]), 7.8),
      y: y - 12,
      size: 7.8,
      font: bold,
      color: NAVY,
    })
    y -= 17
  })
  y -= 22

  /* ------------------------------------------------------------------ */
  /* Tabel armada                                                       */
  /* ------------------------------------------------------------------ */

  sectionTitle('Rekapitulasi per armada', 'Biaya, efisiensi, dan penggunaan anggaran bulanan')

  const vehicleRows = report.vehicles.map((vehicle) => [
    vehicle.plate_number,
    vehicle.model,
    vehicle.drivers || '-',
    String(vehicle.trips),
    number(vehicle.distanceKm),
    number(vehicle.liters, 2),
    money(vehicle.fuelCost),
    money(vehicle.serviceCost),
    money(vehicle.totalCost),
    vehicle.avgKmL > 0 ? number(vehicle.avgKmL, 2) : '-',
    String(vehicle.anomalyCount),
  ])

  table(
    ['Nomor plat', 'Model', 'Driver', 'Trip', 'KM', 'Liter', 'Biaya BBM', 'Servis', 'Total', 'KM/L', 'Anomali'],
    vehicleRows,
    [70, 148, 118, 30, 48, 44, 64, 58, 68, 40, 41],
    ['left', 'left', 'left', 'right', 'right', 'right', 'right', 'right', 'right', 'right', 'center'],
    {
      colorForRow: (index) => {
        const vehicle = report.vehicles[index]
        if (!vehicle) return null
        if (vehicle.anomalyCount > 0) return ROSE
        if (vehicle.budget > 0 && vehicle.budgetUsagePct > 100) return AMBER
        return null
      },
    }
  )

  /* ------------------------------------------------------------------ */
  /* Tabel driver                                                       */
  /* ------------------------------------------------------------------ */

  sectionTitle('Rapor performa driver', 'Skor = 50 efisiensi + 30 kepatuhan inspeksi + 20 integritas transaksi')

  const driverRows = report.drivers.map((driver) => [
    driver.name,
    driver.assignedVehicle || '-',
    String(driver.trips),
    number(driver.distanceKm),
    driver.avgKmL > 0 ? number(driver.avgKmL, 2) : '-',
    number(driver.baseline, 1),
    `${driver.inspectionCount}/${driver.trips}`,
    String(driver.anomalyCount),
    String(driver.totalScore),
    driver.tier,
  ])

  table(
    ['Driver', 'Armada', 'Trip', 'KM', 'KM/L', 'Baseline', 'Inspeksi', 'Anomali', 'Skor', 'Predikat'],
    driverRows,
    [150, 118, 32, 50, 46, 52, 56, 48, 38, 100],
    ['left', 'left', 'right', 'right', 'right', 'right', 'center', 'center', 'center', 'left'],
    {
      colorForRow: (index) => {
        const driver = report.drivers[index]
        if (!driver) return null
        if (driver.tier === 'Perlu Bimbingan') return ROSE
        if (driver.tier === 'Platinum') return EMERALD
        return null
      },
    }
  )

  /* ------------------------------------------------------------------ */
  /* Catatan                                                            */
  /* ------------------------------------------------------------------ */

  ensure(90)
  sectionTitle('Catatan dan rekomendasi')
  report.insights.forEach((insight) => {
    ensure(24)
    page.drawCircle({ x: MARGIN + 4, y: y - 5.5, size: 1.8, color: GOLD })
    const words = safe(insight).split(' ')
    let line = ''
    const lines: string[] = []
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word
      if (font.widthOfTextAtSize(candidate, 8.2) > USABLE - 24) {
        if (line) lines.push(line)
        line = word
      } else {
        line = candidate
      }
    }
    if (line) lines.push(line)
    lines.forEach((part, index) => {
      ensure(14)
      page.drawText(part, { x: MARGIN + 12, y: y - 11 - index * 11, size: 8.2, font, color: SLATE })
    })
    y -= lines.length * 11 + 8
  })

  ensure(70)
  y -= 6
  page.drawRectangle({ x: MARGIN, y: y - 42, width: USABLE, height: 42, color: SURFACE })
  page.drawRectangle({ x: MARGIN, y: y - 42, width: 3, height: 42, color: NAVY })
  page.drawText('Dokumen internal perusahaan', {
    x: MARGIN + 12,
    y: y - 15,
    size: 8.5,
    font: bold,
    color: NAVY,
  })
  page.drawText(
    safe(
      'Laporan dihasilkan otomatis oleh FleetOps 360 dari transaksi BBM, servis, inspeksi, dan klaim yang tercatat. Gunakan bersama berita acara dan bukti transaksi untuk keperluan audit.'
    ),
    { x: MARGIN + 12, y: y - 27, size: 7.4, font, color: SLATE }
  )

  /* ------------------------------------------------------------------ */
  /* Footer                                                             */
  /* ------------------------------------------------------------------ */

  const pages = doc.getPages()
  pages.forEach((current, index) => {
    current.drawLine({
      start: { x: MARGIN, y: MARGIN + 16 },
      end: { x: PAGE_W - MARGIN, y: MARGIN + 16 },
      thickness: 0.5,
      color: LINE,
    })
    current.drawText(safe(`FleetOps 360 - ${report.company.name} - Laporan ${report.period.label}`), {
      x: MARGIN,
      y: MARGIN + 5,
      size: 7,
      font,
      color: SLATE_LIGHT,
    })
    const label = `Halaman ${index + 1} dari ${pages.length}`
    current.drawText(label, {
      x: PAGE_W - MARGIN - font.widthOfTextAtSize(label, 7),
      y: MARGIN + 5,
      size: 7,
      font,
      color: SLATE_LIGHT,
    })
  })

  return doc.save()
}
