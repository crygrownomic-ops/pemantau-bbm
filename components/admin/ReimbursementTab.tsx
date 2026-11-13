'use client'

import { useMemo, useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { Modal } from '@/components/ui/Modal'
import { useFleet } from '@/components/providers/FleetProvider'
import { downloadFile, toCsv } from '@/lib/export'
import {
  formatCurrency,
  formatDate,
  formatNumberInput,
  parseNumberInput,
} from '@/lib/format'
import type { CashAdvance, ReimbursementClaim } from '@/lib/types'

const CLAIM_STATUS: Record<ReimbursementClaim['status'], { label: string; badge: string }> = {
  PENDING: { label: 'Menunggu', badge: 'badge-amber' },
  APPROVED: { label: 'Disetujui', badge: 'badge-green' },
  REJECTED: { label: 'Ditolak', badge: 'badge-red' },
}

export function ReimbursementTab() {
  const { data, create, update, remove, notify } = useFleet()
  const [statusFilter, setStatusFilter] = useState<'ALL' | ReimbursementClaim['status']>('ALL')
  const [search, setSearch] = useState('')
  const [advanceOpen, setAdvanceOpen] = useState(false)
  const [receiptClaim, setReceiptClaim] = useState<ReimbursementClaim | null>(null)
  const [deleteAdvance, setDeleteAdvance] = useState<CashAdvance | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const [formDriver, setFormDriver] = useState('')
  const [formPlate, setFormPlate] = useState('')
  const [formAmount, setFormAmount] = useState('')
  const [formNotes, setFormNotes] = useState('')

  const claims = useMemo(() => data?.reimbursementClaims ?? [], [data])
  const advances = useMemo(() => data?.cashAdvances ?? [], [data])
  const drivers = useMemo(() => data?.drivers ?? [], [data])
  const vehicles = useMemo(() => data?.vehicles ?? [], [data])
  const logs = useMemo(() => data?.fuelLogs ?? [], [data])

  const filteredClaims = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    return claims.filter((claim) => {
      const matchStatus = statusFilter === 'ALL' || claim.status === statusFilter
      const matchKeyword =
        !keyword ||
        [claim.driver_name, claim.plate_number, claim.category, claim.notes, claim.id]
          .join(' ')
          .toLowerCase()
          .includes(keyword)
      return matchStatus && matchKeyword
    })
  }, [claims, statusFilter, search])

  const totals = useMemo(() => {
    const totalAdvances = advances.reduce((total, advance) => total + (Number(advance.amount) || 0), 0)
    const approvedClaims = claims.filter((claim) => claim.status === 'APPROVED')
    const totalClaims = approvedClaims.reduce((total, claim) => total + (Number(claim.amount) || 0), 0)
    const totalFuel = logs.reduce((total, log) => total + (Number(log.total_cost) || 0), 0)
    const pending = claims.filter((claim) => claim.status === 'PENDING')
    const pendingAmount = pending.reduce((total, claim) => total + (Number(claim.amount) || 0), 0)
    return {
      totalAdvances,
      totalClaims,
      totalFuel,
      approvedCount: approvedClaims.length,
      pendingCount: pending.length,
      pendingAmount,
      balance: totalAdvances - totalFuel - totalClaims,
    }
  }, [advances, claims, logs])

  const openAdvance = () => {
    setFormDriver(drivers[0]?.name || '')
    setFormPlate(vehicles[0]?.plate_number || '')
    setFormAmount('')
    setFormNotes('')
    setAdvanceOpen(true)
  }

  const submitAdvance = async (event: React.FormEvent) => {
    event.preventDefault()
    const amount = parseNumberInput(formAmount)
    if (!formDriver || !formPlate) {
      notify('Driver dan armada wajib dipilih.', 'error')
      return
    }
    if (amount <= 0) {
      notify('Nominal kasbon harus lebih dari 0.', 'error')
      return
    }
    try {
      await create('cashAdvances', {
        driver_name: formDriver,
        plate_number: formPlate,
        amount,
        date: new Date().toISOString().slice(0, 10),
        notes: formNotes.trim(),
      })
      setAdvanceOpen(false)
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Kasbon gagal disimpan.', 'error')
    }
  }

  const reviewClaim = async (claim: ReimbursementClaim, status: 'APPROVED' | 'REJECTED') => {
    setBusyId(String(claim.id))
    try {
      await update('reimbursementClaims', claim.id, { status })
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Klaim gagal diproses.', 'error')
    } finally {
      setBusyId(null)
    }
  }

  const confirmDeleteAdvance = async () => {
    if (!deleteAdvance) return
    setBusyId(String(deleteAdvance.id))
    try {
      await remove('cashAdvances', deleteAdvance.id)
      setDeleteAdvance(null)
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Kasbon gagal dihapus.', 'error')
    } finally {
      setBusyId(null)
    }
  }

  const exportClaims = () => {
    if (filteredClaims.length === 0) {
      notify('Tidak ada klaim pada filter ini untuk diekspor.', 'info')
      return
    }
    const rows: unknown[][] = [
      ['LAPORAN KLAIM REIMBURSEMENT — FLEETOPS 360'],
      ['Dicetak', new Date().toLocaleString('id-ID')],
      [],
      ['ID', 'Tanggal', 'Driver', 'Armada', 'Kategori', 'Nominal', 'Catatan', 'Status', 'Diverifikasi oleh', 'Waktu verifikasi'],
      ...filteredClaims.map((claim) => [
        claim.id,
        claim.date,
        claim.driver_name,
        claim.plate_number,
        claim.category,
        claim.amount,
        claim.notes || '',
        CLAIM_STATUS[claim.status].label,
        claim.reviewed_by || '',
        claim.reviewed_at || '',
      ]),
    ]
    downloadFile(`Klaim_Reimbursement_${new Date().toISOString().slice(0, 10)}.csv`, toCsv(rows))
  }

  if (!data) return null

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1.5 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-gold-600">
            <span className="h-1.5 w-1.5 rounded-full bg-gold-400" />
            Cash & Claim Control
          </p>
          <h1 className="text-xl font-extrabold tracking-tight text-navy-950 sm:text-2xl">Uang Jalan &amp; Reimbursement</h1>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-500">
            Rekonsiliasi kasbon driver, verifikasi klaim tol/parkir, dan sisa kas operasional dalam satu modul.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={exportClaims} className="btn btn-ghost">
            <Icon name="download" className="h-3.5 w-3.5" />
            Ekspor klaim
          </button>
          <button type="button" onClick={openAdvance} className="btn btn-primary">
            <Icon name="plus" className="h-3.5 w-3.5" />
            Berikan kasbon
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="card p-4">
          <div className="flex items-start justify-between">
            <p className="stat-label">Total kasbon</p>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-navy-50 text-navy-800">
              <Icon name="receipt" className="h-3.5 w-3.5" />
            </span>
          </div>
          <p className="stat-value mt-2">{formatCurrency(totals.totalAdvances)}</p>
          <p className="mt-1 text-[10px] font-medium text-slate-500">{advances.length} penyerahan uang jalan</p>
        </div>
        <div className="card p-4">
          <div className="flex items-start justify-between">
            <p className="stat-label">Klaim disetujui</p>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <Icon name="check" className="h-3.5 w-3.5" />
            </span>
          </div>
          <p className="stat-value mt-2">{formatCurrency(totals.totalClaims)}</p>
          <p className="mt-1 text-[10px] font-medium text-slate-500">{totals.approvedCount} nota disetujui</p>
        </div>
        <div className="card p-4">
          <div className="flex items-start justify-between">
            <p className="stat-label">Biaya BBM</p>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gold-50 text-gold-700">
              <Icon name="fuel" className="h-3.5 w-3.5" />
            </span>
          </div>
          <p className="stat-value mt-2">{formatCurrency(totals.totalFuel)}</p>
          <p className="mt-1 text-[10px] font-medium text-slate-500">Pemakaian bahan bakar tercatat</p>
        </div>
        <div className="card p-4">
          <div className="flex items-start justify-between">
            <p className="stat-label">Sisa kas jalan</p>
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                totals.balance >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
              }`}
            >
              <Icon name="database" className="h-3.5 w-3.5" />
            </span>
          </div>
          <p className={`stat-value mt-2 ${totals.balance < 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
            {formatCurrency(totals.balance)}
          </p>
          <p className="mt-1 text-[10px] font-medium text-slate-500">
            {totals.balance >= 0 ? 'Sisa kas di driver' : 'Driver menalangi biaya'}
          </p>
        </div>
      </div>

      {totals.pendingCount > 0 && (
        <div className="flex flex-col gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <Icon name="alert" className="h-3.5 w-3.5" />
            </span>
            <div>
              <p className="text-[11px] font-extrabold text-amber-900">
                {totals.pendingCount} klaim menunggu verifikasi
              </p>
              <p className="text-[10px] text-amber-700">
                Total nominal {formatCurrency(totals.pendingAmount)} perlu ditinjau sebelum tutup buku.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setStatusFilter('PENDING')}
            className="btn btn-ghost border-amber-200 bg-white/70 px-3 py-2 text-[10px] text-amber-900"
          >
            Tampilkan klaim pending
          </button>
        </div>
      )}

      <section className="card overflow-hidden">
        <div className="card-header flex-col gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="card-title">Pengajuan klaim driver</h2>
            <p className="card-subtitle">Verifikasi nota tol, parkir, retribusi, dan biaya perjalanan lainnya.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari driver, armada, kategori…"
                className="input w-full py-2 pl-9 sm:w-56"
                aria-label="Cari klaim"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
              className="input w-auto py-2 font-semibold"
              aria-label="Filter status klaim"
            >
              <option value="ALL">Semua status</option>
              <option value="PENDING">Menunggu</option>
              <option value="APPROVED">Disetujui</option>
              <option value="REJECTED">Ditolak</option>
            </select>
            <span className="badge badge-slate">{filteredClaims.length} klaim</span>
          </div>
        </div>

        <div className="scroll-thin max-h-[440px] overflow-auto">
          <table className="table-base min-w-[880px]">
            <thead>
              <tr>
                <th>Tanggal &amp; driver</th>
                <th>Armada</th>
                <th>Kategori</th>
                <th>Keterangan</th>
                <th className="text-right">Nominal</th>
                <th>Status</th>
                <th className="text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredClaims.map((claim) => {
                const meta = CLAIM_STATUS[claim.status] || CLAIM_STATUS.PENDING
                const busy = busyId === String(claim.id)
                return (
                  <tr key={claim.id}>
                    <td>
                      <p className="font-bold text-slate-900">{claim.driver_name}</p>
                      <p className="font-mono text-[10px] text-slate-400">
                        {formatDate(claim.date)} {claim.time ? `· ${claim.time}` : ''}
                      </p>
                    </td>
                    <td className="font-mono font-bold text-slate-800">{claim.plate_number}</td>
                    <td>
                      <span className="badge badge-blue">{claim.category}</span>
                    </td>
                    <td className="max-w-[220px] text-slate-600">
                      <span className="line-clamp-2">{claim.notes || '-'}</span>
                    </td>
                    <td className="whitespace-nowrap text-right font-mono font-bold text-slate-900">
                      {formatCurrency(claim.amount)}
                    </td>
                    <td>
                      <span className={`badge ${meta.badge}`}>{meta.label}</span>
                    </td>
                    <td>
                      <div className="flex items-center justify-center gap-1">
                        {claim.receipt_photo && (
                          <button
                            type="button"
                            onClick={() => setReceiptClaim(claim)}
                            className="rounded-lg p-1.5 text-slate-500 transition hover:bg-navy-50 hover:text-navy-800"
                            title="Lihat bukti nota"
                            aria-label="Lihat bukti nota"
                          >
                            <Icon name="eye" className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {claim.status === 'PENDING' ? (
                          <>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void reviewClaim(claim, 'APPROVED')}
                              className="rounded-lg bg-emerald-600 px-2 py-1 text-[10px] font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                            >
                              Setujui
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void reviewClaim(claim, 'REJECTED')}
                              className="rounded-lg bg-rose-600 px-2 py-1 text-[10px] font-bold text-white transition hover:bg-rose-700 disabled:opacity-60"
                            >
                              Tolak
                            </button>
                          </>
                        ) : (
                          <span className="text-[10px] font-semibold text-slate-400">
                            {claim.reviewed_by ? `oleh ${claim.reviewed_by}` : 'Selesai'}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filteredClaims.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <p className="text-xs font-bold text-slate-600">Belum ada klaim pada filter ini</p>
                    <p className="mt-1 text-[11px] text-slate-400">Klaim baru dari driver akan muncul otomatis.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="card-header">
          <div>
            <h2 className="card-title">Riwayat kasbon / uang jalan</h2>
            <p className="card-subtitle">Catatan penyerahan dana operasional kepada driver.</p>
          </div>
          <span className="badge badge-slate">{formatCurrency(totals.totalAdvances)}</span>
        </div>
        <div className="scroll-thin max-h-[300px] overflow-auto">
          <table className="table-base min-w-[720px]">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Driver</th>
                <th>Armada</th>
                <th>Keperluan</th>
                <th className="text-right">Nominal</th>
                <th className="text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {advances.map((advance) => (
                <tr key={advance.id}>
                  <td className="whitespace-nowrap font-mono text-[11px] text-slate-500">{formatDate(advance.date)}</td>
                  <td className="font-bold text-slate-900">{advance.driver_name}</td>
                  <td className="font-mono text-slate-700">{advance.plate_number}</td>
                  <td className="max-w-[260px] text-slate-600">{advance.notes || '-'}</td>
                  <td className="whitespace-nowrap text-right font-mono font-bold text-slate-900">
                    {formatCurrency(advance.amount)}
                  </td>
                  <td className="text-center">
                    <button
                      type="button"
                      onClick={() => setDeleteAdvance(advance)}
                      className="rounded-lg p-1.5 text-rose-500 transition hover:bg-rose-50"
                      title="Hapus kasbon"
                      aria-label="Hapus kasbon"
                    >
                      <Icon name="trash" className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {advances.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-[11px] text-slate-400">
                    Belum ada kasbon tercatat.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Modal
        open={advanceOpen}
        onClose={() => setAdvanceOpen(false)}
        title="Penyerahan uang jalan"
        description="Catat dana operasional yang diberikan kepada driver."
      >
        <form onSubmit={submitAdvance} className="space-y-3.5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="advance-driver" className="label">
                Driver
              </label>
              <select
                id="advance-driver"
                value={formDriver}
                onChange={(event) => setFormDriver(event.target.value)}
                className="input"
                required
              >
                <option value="">Pilih driver</option>
                {drivers.map((driver) => (
                  <option key={driver.id} value={driver.name}>
                    {driver.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="advance-plate" className="label">
                Armada
              </label>
              <select
                id="advance-plate"
                value={formPlate}
                onChange={(event) => setFormPlate(event.target.value)}
                className="input"
                required
              >
                <option value="">Pilih armada</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.plate_number}>
                    {vehicle.plate_number} — {vehicle.model}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="advance-amount" className="label">
              Nominal kasbon
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                Rp
              </span>
              <input
                id="advance-amount"
                type="text"
                inputMode="numeric"
                value={formAmount}
                onChange={(event) => setFormAmount(formatNumberInput(event.target.value))}
                className="input pl-9 font-mono font-bold"
                placeholder="500.000"
                required
              />
            </div>
          </div>
          <div>
            <label htmlFor="advance-notes" className="label">
              Keperluan jalan
            </label>
            <input
              id="advance-notes"
              type="text"
              value={formNotes}
              onChange={(event) => setFormNotes(event.target.value)}
              className="input"
              placeholder="Contoh: uang jalan pengiriman Jakarta – Bandung"
            />
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
            <button type="button" onClick={() => setAdvanceOpen(false)} className="btn btn-ghost">
              Batal
            </button>
            <button type="submit" className="btn btn-primary">
              <Icon name="check" className="h-3.5 w-3.5" />
              Simpan kasbon
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(receiptClaim)}
        onClose={() => setReceiptClaim(null)}
        title="Bukti nota klaim"
        description={
          receiptClaim ? `${receiptClaim.driver_name} · ${receiptClaim.category} · ${formatCurrency(receiptClaim.amount)}` : undefined
        }
      >
        {receiptClaim?.receipt_photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={receiptClaim.receipt_photo}
            alt={`Nota ${receiptClaim.driver_name}`}
            className="max-h-[60vh] w-full rounded-xl border border-slate-200 object-contain"
          />
        ) : (
          <p className="py-8 text-center text-xs text-slate-400">Bukti nota tidak tersedia.</p>
        )}
      </Modal>

      <Modal
        open={Boolean(deleteAdvance)}
        onClose={() => setDeleteAdvance(null)}
        title="Hapus kasbon"
        description="Kasbon yang dihapus tidak dapat dikembalikan."
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-xs leading-relaxed text-slate-600">
            Hapus kasbon <span className="font-bold text-slate-900">{deleteAdvance?.driver_name}</span> senilai{' '}
            <span className="font-bold text-slate-900">{deleteAdvance ? formatCurrency(deleteAdvance.amount) : ''}</span>?
          </p>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setDeleteAdvance(null)} className="btn btn-ghost">
              Batal
            </button>
            <button type="button" onClick={() => void confirmDeleteAdvance()} className="btn btn-danger">
              Hapus
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default ReimbursementTab
