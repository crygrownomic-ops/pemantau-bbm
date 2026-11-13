import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { toCsv } from '@/lib/export'
import { buildMonthlyReport, resolvePeriod, type MonthlyReport } from '@/lib/reports'
import { buildMonthlyReportPdf } from '@/lib/server/report-pdf'
import { readDatabase } from '@/lib/server/store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function fail(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status })
}

function reportCsv(report: MonthlyReport): string {
  const rows: unknown[][] = [
    ['LAPORAN BULANAN OPERASIONAL ARMADA - FLEETOPS 360'],
    ['Perusahaan', report.company.name],
    ['Periode', report.period.label],
    ['Dibuat', new Date(report.generatedAt).toLocaleString('id-ID')],
    [],
    ['RINGKASAN'],
    ['Total biaya operasional', report.totals.grandTotal],
    ['Biaya BBM', report.totals.fuelCost],
    ['Biaya servis', report.totals.serviceCost],
    ['Klaim disetujui', report.totals.claimCost],
    ['Anggaran bulanan', report.totals.budget],
    ['Penggunaan anggaran (%)', report.totals.budgetUsagePct],
    ['Jarak tempuh (KM)', report.totals.distanceKm],
    ['Total liter', report.totals.liters],
    ['Efisiensi rata-rata (KM/L)', report.fuel.avgKmL],
    ['Transaksi BBM', report.fuel.trips],
    ['Transaksi anomali', report.fuel.anomalyCount],
    ['Inspeksi', report.inspections.total],
    ['Kepatuhan inspeksi (%)', report.inspections.coveragePct],
    [],
    ['REKAP PER ARMADA'],
    ['Nomor plat', 'Model', 'Driver', 'Trip', 'Jarak (KM)', 'Liter', 'Biaya BBM', 'Biaya servis', 'Total biaya', 'KM/L', 'Baseline', 'Anomali', 'Anggaran', 'Pemakaian anggaran (%)'],
    ...report.vehicles.map((vehicle) => [
      vehicle.plate_number,
      vehicle.model,
      vehicle.drivers,
      vehicle.trips,
      vehicle.distanceKm,
      vehicle.liters,
      vehicle.fuelCost,
      vehicle.serviceCost,
      vehicle.totalCost,
      vehicle.avgKmL,
      vehicle.baseline,
      vehicle.anomalyCount,
      vehicle.budget,
      vehicle.budgetUsagePct,
    ]),
    [],
    ['RAPOR DRIVER'],
    ['Driver', 'Armada', 'Trip', 'Jarak (KM)', 'Liter', 'KM/L', 'Baseline', 'Inspeksi', 'Anomali', 'Skor efisiensi', 'Skor kepatuhan', 'Skor integritas', 'Skor akhir', 'Predikat'],
    ...report.drivers.map((driver) => [
      driver.name,
      driver.assignedVehicle,
      driver.trips,
      driver.distanceKm,
      driver.liters,
      driver.avgKmL,
      driver.baseline,
      driver.inspectionCount,
      driver.anomalyCount,
      driver.efficiencyScore,
      driver.complianceScore,
      driver.integrityScore,
      driver.totalScore,
      driver.tier,
    ]),
    [],
    ['CATATAN'],
    ...report.insights.map((insight) => [insight]),
  ]
  return toCsv(rows)
}

export async function GET(request: Request) {
  const session = await getSession()
  if (!session || !session.tenantId) return fail('Sesi tidak valid. Silakan login ulang.', 401)
  if (session.role !== 'admin') return fail('Hanya admin yang dapat mengunduh laporan perusahaan.', 403)

  const url = new URL(request.url)
  const period = resolvePeriod(url.searchParams.get('year') || '', url.searchParams.get('month') || '')
  const format = (url.searchParams.get('format') || 'json').toLowerCase()

  try {
    const database = await readDatabase(session.tenantId)
    const report = buildMonthlyReport(database, period)
    const baseName = `Laporan-Bulanan-${period.year}-${String(period.month).padStart(2, '0')}`

    if (format === 'csv') {
      return new NextResponse(reportCsv(report), {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${baseName}.csv"`,
          'Cache-Control': 'no-store',
        },
      })
    }

    if (format === 'pdf') {
      const pdf = await buildMonthlyReportPdf(report)
      return new NextResponse(Buffer.from(pdf) as unknown as BodyInit, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${baseName}.pdf"`,
          'Cache-Control': 'no-store',
        },
      })
    }

    return NextResponse.json({ ok: true, report })
  } catch (error) {
    console.error('Failed to build monthly report', error)
    return fail('Gagal menyusun laporan bulanan.', 500)
  }
}
