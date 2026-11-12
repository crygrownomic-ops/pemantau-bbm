'use client'

import { useMemo, useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { Modal } from '@/components/ui/Modal'
import { useFleet } from '@/components/providers/FleetProvider'
import { efficiencyOf, scoreFuelLog } from '@/lib/fuel'
import { downloadFile, fuelLogsCsv } from '@/lib/export'
import { formatCurrency, formatDate, formatNumber } from '@/lib/format'
import type { Driver, FuelLog, FuelLogStatus, Vehicle } from '@/lib/types'

const STATUS_META: Record<FuelLogStatus, { label: string; badge: string; dot: string }> = {
  VERIFIED: { label: 'Terverifikasi', badge: 'badge-green', dot: 'bg-emerald-500' },
  FLAGGED: { label: 'Anomali', badge: 'badge-red', dot: 'bg-rose-500' },
  PENDING: { label: 'Menunggu', badge: 'badge-amber', dot: 'bg-amber-400' },
}

type AuditAction = 'HOLD' | 'REJECT' | 'CLEAR'

export function FuelLogsTable({
  logs,
  vehicles,
  drivers,
}: {
  logs: FuelLog[]
  vehicles: Vehicle[]
  drivers: Driver[]
}) {
  const { update, remove, notify } = useFleet()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | FuelLogStatus>('ALL')
  const [locationFilter, setLocationFilter] = useState<'ALL' | 'SPBU Resmi' | 'ECERAN'>('ALL')
  const [receiptLog, setReceiptLog] = useState<FuelLog | null>(null)
  const [auditLog, setAuditLog] = useState<FuelLog | null>(null)
  const [auditAction, setAuditAction] = useState<AuditAction>('HOLD')
  const [auditNote, setAuditNote] = useState('')
  const [deleteLog, setDeleteLog] = useState<FuelLog | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const vehicleMap = useMemo(
    () => new Map(vehicles.map((vehicle) => [vehicle.plate_number, vehicle])),
    [vehicles]
  )

  const driverMap = useMemo(
    () => new Map(drivers.map((driver) => [driver.name.trim().toLowerCase(), driver])),
    [drivers]
  )

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    return logs.filter((log) => {
      const matchKeyword =
        !keyword ||
        [log.plate_number, log.driver_name, log.fuel_type, String(log.id)]
          .join(' ')
          .toLowerCase()
          .includes(keyword)
      const matchStatus = statusFilter === 'ALL' || log.status === statusFilter
      const matchLocation = locationFilter === 'ALL' || log.fill_location === locationFilter
      return matchKeyword && matchStatus && matchLocation
    })
  }, [logs, search, statusFilter, locationFilter])

  const totals = useMemo(() => {
    const liters = filtered.reduce((total, log) => total + (Number(log.liters) || 0), 0)
    const distance = filtered.reduce((total, log) => total + (Number(log.distance_km) || 0), 0)
    const cost = filtered.reduce((total, log) => total + (Number(log.total_cost) || 0), 0)
    const anomalies = filtered.filter((log) => log.status === 'FLAGGED' || log.fill_location === 'ECERAN').length
    return { liters, distance, cost, anomalies }
  }, [filtered])

  const handleStatusChange = async (log: FuelLog, status: FuelLogStatus) => {
    setBusyId(String(log.id))
    try {
      await update('fuelLogs', log.id, {
        status,
        audit_note:
          status === 'VERIFIED'
            ? log.audit_note || 'Transaksi diverifikasi admin.'
            : log.audit_note || '',
      })
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Status gagal diperbarui.', 'error')
    } finally {
      setBusyId(null)
    }
  }

  const openAudit = (log: FuelLog) => {
    setAuditLog(log)
    setAuditAction(log.status === 'VERIFIED' ? 'CLEAR' : 'HOLD')
    setAuditNote(
      log.audit_note ||
        'Rasio konsumsi BBM perlu dikonfirmasi. Mohon periksa ulang odometer dan bukti pengisian.'
    )
  }

  const submitAudit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!auditLog) return
    const status: FuelLogStatus = auditAction === 'CLEAR' ? 'VERIFIED' : 'FLAGGED'
    const note = auditNote.trim()
    if (!note) {
      notify('Catatan audit wajib diisi.', 'error')
      return
    }

    setBusyId(String(auditLog.id))
    try {
      await update('fuelLogs', auditLog.id, { status, audit_note: note })
      const driver = driverMap.get((auditLog.driver_name || '').trim().toLowerCase())
      const phone = (driver?.phone || '').replace(/\D/g, '').replace(/^0/, '62')
      const message = [
        '*PEMBERITAHUAN AUDIT BBM — FLEETOPS 360*',
        '',
        `Halo ${auditLog.driver_name},`,
        'Laporan pengisian BBM Anda memerlukan perhatian atau konfirmasi.',
        '',
        `Armada: ${auditLog.plate_number}`,
        `Tanggal: ${auditLog.date}`,
        `Volume: ${auditLog.liters} L (${formatCurrency(auditLog.total_cost)})`,
        `Rasio efisiensi: ${efficiencyOf(auditLog)} KM/L`,
        '',
        `Status audit: ${STATUS_META[status].label}`,
        `Catatan admin: "${note}"`,
        '',
        'Mohon hubungi admin atau lakukan pemeriksaan ulang odometer dan struk pengisian.',
      ].join('\n')

      if (phone) {
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank', 'noreferrer')
      } else {
        notify('Status audit tersimpan. Nomor WhatsApp driver tidak tersedia di master data.', 'info')
      }
      setAuditLog(null)
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Audit gagal disimpan.', 'error')
    } finally {
      setBusyId(null)
    }
  }

  const confirmDelete = async () => {
    if (!deleteLog) return
    setBusyId(String(deleteLog.id))
    try {
      await remove('fuelLogs', deleteLog.id)
      setDeleteLog(null)
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Transaksi gagal dihapus.', 'error')
    } finally {
      setBusyId(null)
    }
  }

  const exportCsv = () => {
    if (filtered.length === 0) {
      notify('Tidak ada transaksi pada filter ini untuk diekspor.', 'info')
      return
    }
    downloadFile(`Transaksi_BBM_${new Date().toISOString().slice(0, 10)}.csv`, fuelLogsCsv(filtered))
  }

  return (
    <section className="card overflow-hidden">
      <div className="card-header flex-col gap-3 lg:flex-row lg:items-center">
        <div>
          <h2 className="card-title flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-gold-400" />
            Rincian transaksi pengisian BBM
          </h2>
          <p className="card-subtitle">
            {filtered.length} dari {logs.length} transaksi · {formatNumber(Math.round(totals.liters))} liter ·{' '}
            {formatNumber(totals.distance)} KM
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari plat, driver, BBM…"
              className="input w-full py-2 pl-9 sm:w-56"
              aria-label="Cari transaksi BBM"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
            className="input w-auto py-2 font-semibold"
            aria-label="Filter status audit"
          >
            <option value="ALL">Semua status</option>
            <option value="VERIFIED">Terverifikasi</option>
            <option value="PENDING">Menunggu</option>
            <option value="FLAGGED">Anomali</option>
          </select>
          <select
            value={locationFilter}
            onChange={(event) => setLocationFilter(event.target.value as typeof locationFilter)}
            className="input w-auto py-2 font-semibold"
            aria-label="Filter lokasi pengisian"
          >
            <option value="ALL">Semua lokasi</option>
            <option value="SPBU Resmi">SPBU Resmi</option>
            <option value="ECERAN">Eceran</option>
          </select>
          <button type="button" onClick={exportCsv} className="btn btn-ghost">
            <Icon name="download" className="h-3.5 w-3.5" />
            Ekspor
          </button>
        </div>
      </div>

      <div className="scroll-thin max-h-[520px] overflow-auto">
        <table className="table-base min-w-[1020px]">
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Armada</th>
              <th>Driver</th>
              <th>BBM / Lokasi</th>
              <th>Odometer</th>
              <th>Volume</th>
              <th>Efisiensi</th>
              <th className="text-right">Total biaya</th>
              <th>Status</th>
              <th className="text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((log) => {
              const vehicle = vehicleMap.get(log.plate_number)
              const quality = scoreFuelLog(log, vehicle)
              const status = STATUS_META[log.status] || STATUS_META.PENDING
              const isBusy = busyId === String(log.id)
              return (
                <tr key={String(log.id)}>
                  <td className="whitespace-nowrap font-mono text-[11px] text-slate-500">{formatDate(log.date)}</td>
                  <td>
                    <p className="font-bold text-slate-900">{log.plate_number}</p>
                    <p className="text-[10px] text-slate-400">{log.vehicle_model}</p>
                  </td>
                  <td className="font-medium text-slate-700">{log.driver_name || '-'}</td>
                  <td>
                    <p className="font-semibold text-slate-800">{log.fuel_type}</p>
                    {log.fill_location === 'ECERAN' ? (
                      <span className="badge badge-red mt-1">Eceran non-SPBU</span>
                    ) : (
                      <p className="text-[10px] text-slate-400">SPBU Resmi</p>
                    )}
                  </td>
                  <td className="whitespace-nowrap font-mono text-[11px] text-slate-600">
                    {formatNumber(log.initial_km)} → {formatNumber(log.final_km)}
                    <span className="ml-1 text-[10px] text-slate-400">KM</span>
                  </td>
                  <td className="whitespace-nowrap font-mono text-slate-700">{log.liters} L</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-mono text-xs font-bold ${
                          quality.score >= 78 ? 'text-emerald-700' : quality.score >= 60 ? 'text-amber-700' : 'text-rose-700'
                        }`}
                      >
                        {efficiencyOf(log)} KM/L
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400">{quality.score}</span>
                    </div>
                    <div className="mt-1 h-1 w-16 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${
                          quality.score >= 78 ? 'bg-emerald-500' : quality.score >= 60 ? 'bg-gold-400' : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.max(4, Math.min(100, quality.score))}%` }}
                      />
                    </div>
                  </td>
                  <td className="whitespace-nowrap text-right font-mono font-bold text-slate-900">
                    {formatCurrency(log.total_cost)}
                  </td>
                  <td>
                    <select
                      value={log.status}
                      disabled={isBusy}
                      onChange={(event) => void handleStatusChange(log, event.target.value as FuelLogStatus)}
                      className={`rounded-lg border px-2 py-1 text-[10px] font-bold outline-none transition disabled:opacity-60 ${
                        log.status === 'VERIFIED'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : log.status === 'FLAGGED'
                            ? 'border-rose-200 bg-rose-50 text-rose-700'
                            : 'border-amber-200 bg-amber-50 text-amber-700'
                      }`}
                      aria-label={`Status audit ${log.plate_number}`}
                    >
                      <option value="VERIFIED">Terverifikasi</option>
                      <option value="PENDING">Menunggu</option>
                      <option value="FLAGGED">Anomali</option>
                    </select>
                  </td>
                  <td>
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => setReceiptLog(log)}
                        className="rounded-lg p-1.5 text-slate-500 transition hover:bg-navy-50 hover:text-navy-800"
                        title="Lihat bukti struk"
                        aria-label="Lihat bukti struk"
                      >
                        <Icon name="eye" className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openAudit(log)}
                        className="rounded-lg p-1.5 text-amber-600 transition hover:bg-amber-50"
                        title="Tinjau dan kirim WhatsApp"
                        aria-label="Tinjau transaksi"
                      >
                        <Icon name="shield" className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteLog(log)}
                        className="rounded-lg p-1.5 text-rose-500 transition hover:bg-rose-50"
                        title="Hapus transaksi"
                        aria-label="Hapus transaksi"
                      >
                        <Icon name="trash" className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={10} className="py-12 text-center">
                  <p className="text-xs font-bold text-slate-600">Tidak ada transaksi yang cocok</p>
                  <p className="mt-1 text-[11px] text-slate-400">Ubah kata kunci atau filter status/lokasi.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/60 px-4 py-3 text-[11px] font-semibold text-slate-500">
        <span>
          Total biaya filter: <span className="font-mono font-bold text-slate-800">{formatCurrency(totals.cost)}</span>
        </span>
        <span className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> {totals.anomalies} anomali
          </span>
          <span className="text-slate-400">Data tersimpan otomatis di server</span>
        </span>
      </div>

      <Modal
        open={Boolean(receiptLog)}
        onClose={() => setReceiptLog(null)}
        title="Bukti struk pengisian"
        description={receiptLog ? `${receiptLog.plate_number} · ${formatDate(receiptLog.date)} · ${receiptLog.fuel_type}` : undefined}
      >
        {receiptLog?.receipt_image ? (
          <div className="space-y-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={receiptLog.receipt_image}
              alt={`Struk ${receiptLog.plate_number}`}
              className="max-h-[60vh] w-full rounded-xl border border-slate-200 object-contain"
            />
            <p className="text-center text-[10px] text-slate-400">Bukti struk terunggah oleh driver.</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <Icon name="file" className="h-5 w-5" />
            </span>
            <p className="text-xs font-bold text-slate-700">Bukti struk belum diunggah</p>
            <p className="max-w-xs text-[11px] leading-relaxed text-slate-400">
              Transaksi tanpa bukti struk mendapat penalti skor. Minta driver melengkapi bukti melalui portal driver.
            </p>
          </div>
        )}
      </Modal>

      <Modal
        open={Boolean(auditLog)}
        onClose={() => setAuditLog(null)}
        title="Audit transaksi BBM"
        description="Tentukan tindakan manajemen dan kirim konfirmasi ke driver."
        size="lg"
      >
        {auditLog && (
          <form onSubmit={submitAudit} className="space-y-4">
            <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-[11px] sm:grid-cols-4">
              <div>
                <p className="stat-label">Armada</p>
                <p className="mt-0.5 font-bold text-slate-900">{auditLog.plate_number}</p>
              </div>
              <div>
                <p className="stat-label">Driver</p>
                <p className="mt-0.5 font-bold text-slate-900">{auditLog.driver_name}</p>
              </div>
              <div>
                <p className="stat-label">Efisiensi</p>
                <p className="mt-0.5 font-mono font-bold text-slate-900">{efficiencyOf(auditLog)} KM/L</p>
              </div>
              <div>
                <p className="stat-label">Biaya</p>
                <p className="mt-0.5 font-mono font-bold text-slate-900">{formatCurrency(auditLog.total_cost)}</p>
              </div>
            </div>

            <div>
              <span className="label">Tindakan manajemen</span>
              <div className="grid gap-2 sm:grid-cols-3">
                {(
                  [
                    { value: 'HOLD', title: 'Tangguhkan', detail: 'Minta klarifikasi driver' },
                    { value: 'REJECT', title: 'Tolak / anomali', detail: 'Tandai sebagai pelanggaran' },
                    { value: 'CLEAR', title: 'Verifikasi', detail: 'Abaikan peringatan rasio' },
                  ] as Array<{ value: AuditAction; title: string; detail: string }>
                ).map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setAuditAction(option.value)}
                    className={`rounded-xl border p-2.5 text-left transition ${
                      auditAction === option.value
                        ? 'border-navy-800 bg-navy-50 ring-2 ring-navy-800/15'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <span className="block text-[11px] font-extrabold text-slate-900">{option.title}</span>
                    <span className="mt-0.5 block text-[10px] text-slate-500">{option.detail}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="audit-note" className="label">
                Catatan audit untuk driver
              </label>
              <textarea
                id="audit-note"
                rows={3}
                value={auditNote}
                onChange={(event) => setAuditNote(event.target.value)}
                className="input resize-none"
                placeholder="Tuliskan catatan konfirmasi atau teguran…"
                required
              />
            </div>

            <div className="flex flex-col gap-2 border-t border-slate-100 pt-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setAuditLog(null)} className="btn btn-ghost">
                Batal
              </button>
              <button type="submit" disabled={busyId === String(auditLog.id)} className="btn btn-primary">
                <Icon name="external" className="h-3.5 w-3.5" />
                {busyId === String(auditLog.id) ? 'Menyimpan…' : 'Simpan & kirim WhatsApp'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        open={Boolean(deleteLog)}
        onClose={() => setDeleteLog(null)}
        title="Hapus transaksi BBM"
        description="Tindakan ini tidak dapat dibatalkan dan akan tercatat pada audit trail."
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-xs leading-relaxed text-slate-600">
            Hapus transaksi <span className="font-bold text-slate-900">{deleteLog?.plate_number}</span> tanggal{' '}
            <span className="font-bold text-slate-900">{deleteLog ? formatDate(deleteLog.date) : ''}</span> senilai{' '}
            <span className="font-bold text-slate-900">{deleteLog ? formatCurrency(deleteLog.total_cost) : ''}</span>?
          </p>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setDeleteLog(null)} className="btn btn-ghost">
              Batal
            </button>
            <button
              type="button"
              onClick={() => void confirmDelete()}
              disabled={Boolean(deleteLog && busyId === String(deleteLog.id))}
              className="btn btn-danger"
            >
              <Icon name="trash" className="h-3.5 w-3.5" />
              Hapus transaksi
            </button>
          </div>
        </div>
      </Modal>
    </section>
  )
}
