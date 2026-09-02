'use client'

import { useState } from 'react'

const formatNumberDots = (val: number | string) => {
  if (!val && val !== 0) return ''
  const numStr = String(val).replace(/\D/g, '')
  if (!numStr) return ''
  return numStr.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

const parseDotsToNum = (val: string) => {
  return Number(String(val).replace(/\./g, '')) || 0
}

export function ReimbursementModal({
  isOpen,
  onClose,
  vehicles = [],
  driverName = '',
}: {
  isOpen: boolean
  onClose: () => void
  vehicles: any[]
  driverName: string
}) {
  const [selectedPlate, setSelectedPlate] = useState(vehicles[0]?.plate_number || 'B 1234 ABC')
  const [category, setCategory] = useState<'Tol' | 'Parkir' | 'Retribusi' | 'Timbangan' | 'Lainnya'>('Tol')
  const [amountInput, setAmountInput] = useState('')
  const [notes, setNotes] = useState('')
  const [receiptPhoto, setReceiptPhoto] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)

  if (!isOpen) return null

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setReceiptPhoto(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const numericAmount = parseDotsToNum(amountInput)

    if (numericAmount <= 0) {
      alert('⚠️ Nominal klaim reimbursement harus lebih dari 0!')
      return
    }

    const newClaim = {
      id: `CLM-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      driver_name: driverName || 'Supir Ops',
      plate_number: selectedPlate,
      category,
      amount: numericAmount,
      notes,
      receipt_photo: receiptPhoto,
      status: 'PENDING',
    }

    try {
      const stored = localStorage.getItem('reimbursement_claims')
      const existing = stored ? JSON.parse(stored) : []
      const updated = [newClaim, ...existing]
      localStorage.setItem('reimbursement_claims', JSON.stringify(updated))
    } catch (err) {
      console.error(err)
    }

    setIsSubmitted(true)
    setTimeout(() => {
      setIsSubmitted(false)
      setAmountInput('')
      setNotes('')
      setReceiptPhoto('')
      onClose()
    }, 1200)
  }

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl border border-slate-100 text-slate-900">
        <div className="flex justify-between items-center border-b pb-3 border-slate-100">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
              <span>🧾</span> Klaim Biaya Operasional (Reimbursement)
            </h3>
            <p className="text-[11px] text-slate-500">Input nota Tol, Parkir, Retribusi, atau Biaya Jalan lainnya</p>
          </div>
          <button onClick={onClose} className="text-slate-400 font-bold hover:text-slate-600">✕</button>
        </div>

        {isSubmitted ? (
          <div className="bg-emerald-50 text-emerald-800 p-6 rounded-2xl text-center space-y-2 border border-emerald-200">
            <span className="text-3xl">✅</span>
            <strong className="block text-sm font-bold">Klaim Berhasil Dikirim!</strong>
            <p className="text-xs text-emerald-700">Data klaim telah terdaftar dan menunggu konfirmasi Admin.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Armada Kendaraan</label>
              <select
                value={selectedPlate}
                onChange={(e) => setSelectedPlate(e.target.value)}
                className="w-full border p-2.5 rounded-xl font-bold bg-slate-50 outline-none"
              >
                {vehicles.map((v: any) => (
                  <option key={v.plate_number} value={v.plate_number}>
                    {v.plate_number} — {v.model}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Kategori Pengeluaran</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full border p-2.5 rounded-xl font-bold bg-slate-50 outline-none"
                >
                  <option value="Tol">🛣️ E-Toll / Tol</option>
                  <option value="Parkir">🅿️ Parkir</option>
                  <option value="Timbangan">⚖️ Timbangan</option>
                  <option value="Retribusi">🎟️ Retribusi Jalan</option>
                  <option value="Lainnya">📦 Lain-lain</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Nominal (Rp) *</label>
                <div className="relative flex items-center">
                  <span className="absolute left-2.5 font-bold text-slate-400">Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="50.000"
                    className="w-full border p-2.5 pl-8 rounded-xl font-mono font-bold text-slate-900 outline-none focus:ring-2 focus:ring-amber-500"
                    value={amountInput}
                    onChange={(e) => setAmountInput(formatNumberDots(e.target.value))}
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Keterangan / Catatan</label>
              <input
                type="text"
                placeholder="Contoh: Tol Cikampek Utama / Parkir Rest Area KM 57"
                className="w-full border p-2.5 rounded-xl outline-none"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Unggah Foto Nota / Struk (Opsional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:bg-slate-900 file:text-white font-bold cursor-pointer"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="w-1/2 bg-slate-100 text-slate-700 font-bold py-2.5 rounded-xl"
              >
                Batal
              </button>
              <button
                type="submit"
                className="w-1/2 bg-slate-900 text-white font-bold py-2.5 rounded-xl shadow-md hover:bg-slate-800 transition"
              >
                Kirim Klaim
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default ReimbursementModal