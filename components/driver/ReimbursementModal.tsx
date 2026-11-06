'use client'

import { useEffect, useState } from 'react'

type Vehicle = {
  plate_number: string
  model?: string
}

type Category = 'Tol' | 'Parkir' | 'Retribusi' | 'Timbangan' | 'Lainnya'

const MAX_RECEIPT_BYTES = 2 * 1024 * 1024

const formatNumberDots = (value: string) => {
  const digits = value.replace(/\D/g, '')
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

const parseDotsToNum = (value: string) => Number(value.replace(/\./g, '')) || 0

function localDate() {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10)
}

export function ReimbursementModal({
  isOpen,
  onClose,
  vehicles = [],
  driverName = '',
}: {
  isOpen: boolean
  onClose: () => void
  vehicles: Vehicle[]
  driverName: string
}) {
  const [selectedPlate, setSelectedPlate] = useState(vehicles[0]?.plate_number || '')
  const [category, setCategory] = useState<Category>('Tol')
  const [amountInput, setAmountInput] = useState('')
  const [notes, setNotes] = useState('')
  const [receiptPhoto, setReceiptPhoto] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!selectedPlate && vehicles[0]) setSelectedPlate(vehicles[0].plate_number)
  }, [selectedPlate, vehicles])

  if (!isOpen) return null

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    setError('')
    setReceiptPhoto('')
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Gunakan gambar JPG, PNG, atau WebP.')
      event.target.value = ''
      return
    }
    if (file.size > MAX_RECEIPT_BYTES) {
      setError('Ukuran foto maksimal 2 MB. Kompres foto sebelum mengunggah.')
      event.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') setReceiptPhoto(reader.result)
      else setError('Foto tidak dapat dibaca. Silakan pilih ulang.')
    }
    reader.onerror = () => setError('Foto tidak dapat dibaca. Silakan pilih ulang.')
    reader.readAsDataURL(file)
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    const numericAmount = parseDotsToNum(amountInput)
    if (!selectedPlate || !vehicles.some((vehicle) => vehicle.plate_number === selectedPlate)) {
      setError('Pilih kendaraan yang terdaftar sebelum mengirim klaim.')
      return
    }
    if (numericAmount <= 0) {
      setError('Nominal klaim harus lebih dari Rp 0.')
      return
    }
    if (notes.trim().length > 300) {
      setError('Keterangan maksimal 300 karakter.')
      return
    }

    setIsSaving(true)
    const newClaim = {
      id: `CLM-${Date.now()}`,
      date: localDate(),
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      driver_name: driverName.trim() || 'Supir Ops',
      plate_number: selectedPlate,
      category,
      amount: numericAmount,
      notes: notes.trim(),
      receipt_photo: receiptPhoto,
      status: 'PENDING',
    }

    try {
      const stored = localStorage.getItem('reimbursement_claims')
      const parsed: unknown = stored ? JSON.parse(stored) : []
      if (!Array.isArray(parsed)) throw new Error('Data klaim tersimpan tidak valid.')
      localStorage.setItem('reimbursement_claims', JSON.stringify([newClaim, ...parsed]))
      setIsSubmitted(true)
      window.setTimeout(() => {
        setIsSubmitted(false)
        setAmountInput('')
        setNotes('')
        setReceiptPhoto('')
        setError('')
        onClose()
      }, 1200)
    } catch (saveError) {
      console.error('Gagal menyimpan klaim reimbursement:', saveError)
      setError('Klaim tidak dapat disimpan. Periksa ruang penyimpanan browser lalu coba lagi.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 font-sans backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section role="dialog" aria-modal="true" aria-labelledby="reimbursement-title" className="max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-3xl border border-slate-200 bg-white p-5 text-slate-900 shadow-2xl sm:p-6">
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-700">Klaim operasional</p>
            <h2 id="reimbursement-title" className="mt-1 text-base font-extrabold">Klaim tol & biaya perjalanan</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">Lampirkan bukti agar admin dapat memverifikasi klaim lebih cepat.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Tutup formulir klaim" className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">✕</button>
        </header>

        {isSubmitted ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center" role="status">
            <span className="text-3xl" aria-hidden="true">✓</span>
            <strong className="mt-2 block text-sm text-emerald-900">Klaim berhasil dikirim</strong>
            <p className="mt-1 text-xs text-emerald-800">Klaim menunggu verifikasi admin.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="claim-vehicle" className="mb-1 block text-xs font-bold">Kendaraan</label>
              <select id="claim-vehicle" value={selectedPlate} onChange={(event) => setSelectedPlate(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm" required disabled={vehicles.length === 0}>
                <option value="" disabled>Pilih kendaraan</option>
                {vehicles.map((vehicle) => <option key={vehicle.plate_number} value={vehicle.plate_number}>{vehicle.plate_number} — {vehicle.model || 'Kendaraan'}</option>)}
              </select>
              {vehicles.length === 0 && <p className="mt-1 text-xs text-rose-700">Belum ada kendaraan terdaftar. Hubungi admin.</p>}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="claim-category" className="mb-1 block text-xs font-bold">Kategori</label>
                <select id="claim-category" value={category} onChange={(event) => setCategory(event.target.value as Category)} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                  <option value="Tol">Tol</option>
                  <option value="Parkir">Parkir</option>
                  <option value="Timbangan">Timbangan</option>
                  <option value="Retribusi">Retribusi</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
              <div>
                <label htmlFor="claim-amount" className="mb-1 block text-xs font-bold">Nominal (Rp)</label>
                <input id="claim-amount" type="text" inputMode="numeric" placeholder="50.000" className="w-full rounded-xl border border-slate-200 p-3 font-mono text-sm font-bold outline-none focus:border-amber-400" value={amountInput} onChange={(event) => setAmountInput(formatNumberDots(event.target.value))} required />
              </div>
            </div>

            <div>
              <label htmlFor="claim-notes" className="mb-1 block text-xs font-bold">Rute / keterangan</label>
              <textarea id="claim-notes" rows={2} maxLength={300} placeholder="Contoh: Tol Cikampek Utama, perjalanan ke Bandung" className="w-full resize-y rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-amber-400" value={notes} onChange={(event) => setNotes(event.target.value)} />
              <p className="mt-1 text-right text-[10px] text-slate-400">{notes.length}/300</p>
            </div>

            <div>
              <label htmlFor="claim-receipt" className="mb-1 block text-xs font-bold">Bukti pembayaran (opsional)</label>
              <input id="claim-receipt" type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoUpload} className="w-full rounded-xl border border-slate-200 p-2 text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:font-bold file:text-white" />
              <p className="mt-1 text-[10px] text-slate-500">JPG, PNG, WebP · maksimal 2 MB.</p>
              {receiptPhoto && <p className="mt-1 text-xs font-semibold text-emerald-700">Bukti siap dilampirkan.</p>}
            </div>

            {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-800">{error}</p>}
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="w-1/2 rounded-xl bg-slate-100 py-3 text-sm font-bold text-slate-700">Batal</button>
              <button type="submit" disabled={isSaving || vehicles.length === 0} className="w-1/2 rounded-xl bg-slate-950 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">
                {isSaving ? 'Mengirim…' : 'Kirim klaim'}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  )
}

export default ReimbursementModal
