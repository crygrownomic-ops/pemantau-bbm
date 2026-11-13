'use client'

import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Icon } from '@/components/ui/Icon'
import { useFleet } from '@/components/providers/FleetProvider'
import { formatNumberInput, parseNumberInput } from '@/lib/format'
import type { Vehicle } from '@/lib/types'

const CATEGORIES = ['Tol', 'Parkir', 'Retribusi', 'Timbangan', 'Lainnya'] as const

const MAX_RECEIPT_BYTES = 1_500_000

interface ClaimProps {
  onClose: () => void
  vehicles: Vehicle[]
  driverName: string
  defaultPlate: string
}

export function ReimbursementModal({
  open,
  onClose,
  vehicles = [],
  driverName = '',
  defaultPlate = '',
}: {
  open: boolean
  onClose: () => void
  vehicles: Vehicle[]
  driverName: string
  defaultPlate?: string
}) {
  if (!open) return null
  return (
    <ClaimForm
      onClose={onClose}
      vehicles={vehicles}
      driverName={driverName}
      defaultPlate={defaultPlate}
    />
  )
}

function ClaimForm({ onClose, vehicles, driverName, defaultPlate }: ClaimProps) {
  const { create, notify } = useFleet()
  const [selectedPlate, setSelectedPlate] = useState(defaultPlate || vehicles[0]?.plate_number || '')
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('Tol')
  const [amountInput, setAmountInput] = useState('')
  const [notes, setNotes] = useState('')
  const [receiptPhoto, setReceiptPhoto] = useState('')
  const [saving, setSaving] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [failed, setFailed] = useState(false)

  const amount = parseNumberInput(amountInput)

  const handlePhotoUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > MAX_RECEIPT_BYTES) {
      notify('Ukuran foto nota terlalu besar. Maksimal 1,5 MB.', 'error')
      event.target.value = ''
      return
    }
    const reader = new FileReader()
    reader.onloadend = () => setReceiptPhoto(String(reader.result || ''))
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (saving) return
    if (!selectedPlate) return
    if (amount <= 0) {
      notify('Nominal klaim harus lebih dari 0.', 'error')
      return
    }
    setSaving(true)
    setFailed(false)
    try {
      await create('reimbursementClaims', {
        plate_number: selectedPlate,
        driver_name: driverName,
        category,
        amount,
        notes: notes.trim(),
        receipt_photo: receiptPhoto,
        date: new Date().toISOString().slice(0, 10),
      })
      setSubmitted(true)
      window.setTimeout(() => onClose(), 1400)
    } catch {
      setFailed(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Klaim biaya jalan"
      description="Catat pengeluaran tol, parkir, retribusi, atau biaya operasional lain untuk diverifikasi admin."
      size="md"
    >
      {submitted ? (
        <div className="flex flex-col items-center gap-3 px-2 py-8 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <Icon name="check" className="h-6 w-6" />
          </span>
          <div>
            <p className="text-sm font-extrabold text-slate-800">Klaim berhasil dikirim</p>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
              Klaim terdaftar dan menunggu verifikasi admin.
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <span className="label">Armada</span>
            <select
              value={selectedPlate}
              onChange={(event) => setSelectedPlate(event.target.value)}
              className="input font-semibold"
              required
            >
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.plate_number}>
                  {vehicle.plate_number} — {vehicle.model}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <span className="label">Kategori</span>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value as (typeof CATEGORIES)[number])}
                className="input font-semibold"
              >
                {CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <span className="label">Nominal</span>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">
                  Rp
                </span>
                <input
                  className="input pl-9 font-mono font-bold"
                  inputMode="numeric"
                  placeholder="50.000"
                  value={amountInput}
                  onChange={(event) => setAmountInput(formatNumberInput(event.target.value))}
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <span className="label">Keterangan</span>
            <input
              className="input"
              placeholder="Contoh: Tol Cikampek Utama / parkir rest area KM 57"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>

          <div>
            <span className="label">Foto nota (opsional)</span>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label className="btn btn-ghost cursor-pointer">
                <Icon name="camera" className="h-3.5 w-3.5" />
                {receiptPhoto ? 'Ganti foto' : 'Unggah foto'}
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </label>
              {receiptPhoto ? (
                <div className="flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={receiptPhoto}
                    alt="Pratinjau nota"
                    className="h-10 w-10 rounded-lg border border-slate-200 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setReceiptPhoto('')}
                    className="text-[10px] font-bold text-rose-600 hover:underline"
                  >
                    Hapus foto
                  </button>
                </div>
              ) : (
                <p className="text-[10px] leading-relaxed text-slate-400">
                  Nota mempercepat proses verifikasi klaim.
                </p>
              )}
            </div>
          </div>

          {failed && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-[11px] font-semibold text-rose-700">
              <Icon name="alert" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Klaim gagal dikirim. Periksa koneksi lalu coba lagi.
            </div>
          )}

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
            <button type="button" onClick={onClose} className="btn btn-ghost">
              Batal
            </button>
            <button type="submit" disabled={saving || !selectedPlate || amount <= 0} className="btn btn-primary">
              <Icon name="receipt" className="h-3.5 w-3.5" />
              {saving ? 'Mengirim…' : 'Kirim klaim'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  )
}

export default ReimbursementModal
