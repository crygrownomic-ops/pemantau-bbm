'use client'

import { useEffect, useState } from 'react'

type ChecklistItems = {
  brakes: boolean
  tires: boolean
  engine_oil: boolean
  lights: boolean
  body_condition: boolean
}

type Vehicle = {
  plate_number: string
  model?: string
}

const CHECKLIST = [
  { key: 'brakes', label: 'Rem utama & handbrake', detail: 'Pastikan rem bekerja normal dan tidak terasa blong.' },
  { key: 'tires', label: 'Ban dan tekanan angin', detail: 'Periksa tekanan, alur, dan kondisi ban.' },
  { key: 'engine_oil', label: 'Oli mesin & cairan pendingin', detail: 'Pastikan level oli dan air radiator cukup.' },
  { key: 'lights', label: 'Lampu dan sinyal', detail: 'Uji lampu utama, sein, rem, dan hazard.' },
  { key: 'body_condition', label: 'Kondisi bodi dan kaca', detail: 'Catat kerusakan yang terlihat sebelum perjalanan.' },
] as const

const EMPTY_ITEMS: ChecklistItems = {
  brakes: false,
  tires: false,
  engine_oil: false,
  lights: false,
  body_condition: false,
}

function localDate() {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60_000
  return new Date(now.getTime() - offset).toISOString().slice(0, 10)
}

export function PreTripChecklistModal({
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
  const [items, setItems] = useState<ChecklistItems>(EMPTY_ITEMS)
  const [notes, setNotes] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!selectedPlate && vehicles[0]) setSelectedPlate(vehicles[0].plate_number)
  }, [selectedPlate, vehicles])

  if (!isOpen) return null

  const allItemsChecked = Object.values(items).every(Boolean)

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (!selectedPlate || !vehicles.some((vehicle) => vehicle.plate_number === selectedPlate)) {
      setError('Pilih kendaraan yang terdaftar sebelum menyimpan checklist.')
      return
    }

    if (!allItemsChecked && notes.trim().length < 8) {
      setError('Jelaskan temuan minimal 8 karakter jika ada komponen yang perlu perhatian.')
      return
    }

    setIsSaving(true)
    const record = {
      id: `CHK-${Date.now()}`,
      date: localDate(),
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      driver_name: driverName.trim() || 'Supir Ops',
      plate_number: selectedPlate,
      status: allItemsChecked ? 'READY' : 'NEEDS_ATTENTION',
      details: items,
      notes: notes.trim(),
    }

    try {
      const stored = localStorage.getItem('pre_trip_inspections')
      const parsed: unknown = stored ? JSON.parse(stored) : []
      if (!Array.isArray(parsed)) throw new Error('Data checklist tersimpan tidak valid.')
      localStorage.setItem('pre_trip_inspections', JSON.stringify([record, ...parsed]))
      setIsSubmitted(true)
      window.setTimeout(() => {
        setIsSubmitted(false)
        setItems(EMPTY_ITEMS)
        setNotes('')
        setError('')
        onClose()
      }, 1200)
    } catch (saveError) {
      console.error('Gagal menyimpan checklist pra-perjalanan:', saveError)
      setError('Checklist tidak dapat disimpan. Periksa ruang penyimpanan browser lalu coba lagi.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 font-sans backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section role="dialog" aria-modal="true" aria-labelledby="pre-trip-title" className="max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-3xl border border-slate-200 bg-white p-5 text-slate-900 shadow-2xl sm:p-6">
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-700">Keselamatan perjalanan</p>
            <h2 id="pre-trip-title" className="mt-1 text-base font-extrabold">Checklist pra-perjalanan</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">Periksa setiap komponen sebelum kendaraan meninggalkan pool.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Tutup checklist" className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">✕</button>
        </header>

        {isSubmitted ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center" role="status">
            <span className="text-3xl" aria-hidden="true">✓</span>
            <strong className="mt-2 block text-sm text-emerald-900">Checklist tersimpan</strong>
            <p className="mt-1 text-xs text-emerald-800">Status kendaraan: {allItemsChecked ? 'siap jalan' : 'perlu perhatian'}.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="inspection-vehicle" className="mb-1 block text-xs font-bold">Kendaraan</label>
              <select id="inspection-vehicle" value={selectedPlate} onChange={(event) => setSelectedPlate(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm" required disabled={vehicles.length === 0}>
                <option value="" disabled>Pilih kendaraan</option>
                {vehicles.map((vehicle) => <option key={vehicle.plate_number} value={vehicle.plate_number}>{vehicle.plate_number} — {vehicle.model || 'Kendaraan'}</option>)}
              </select>
              {vehicles.length === 0 && <p className="mt-1 text-xs text-rose-700">Belum ada kendaraan terdaftar. Hubungi admin.</p>}
            </div>

            <fieldset className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <legend className="px-1 text-xs font-bold">Pemeriksaan komponen</legend>
              {CHECKLIST.map(({ key, label, detail }) => (
                <label key={key} className="flex cursor-pointer items-start gap-3 rounded-xl bg-white p-3 transition hover:border-amber-300">
                  <input
                    type="checkbox"
                    checked={items[key]}
                    onChange={(event) => setItems((current) => ({ ...current, [key]: event.target.checked }))}
                    className="mt-0.5 h-4 w-4 accent-amber-500"
                  />
                  <span>
                    <span className="block text-xs font-bold">{label}</span>
                    <span className="mt-0.5 block text-[11px] leading-4 text-slate-500">{detail}</span>
                  </span>
                </label>
              ))}
            </fieldset>

            <div>
              <label htmlFor="inspection-notes" className="mb-1 block text-xs font-bold">Catatan pemeriksaan</label>
              <textarea
                id="inspection-notes"
                rows={3}
                maxLength={500}
                placeholder={allItemsChecked ? 'Catatan tambahan (opsional)' : 'Wajib jelaskan komponen yang perlu diperiksa/perbaiki'}
                className="w-full resize-y rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-amber-400"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                required={!allItemsChecked}
              />
              <p className="mt-1 text-right text-[10px] text-slate-400">{notes.length}/500</p>
            </div>

            {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-800">{error}</p>}
            {!allItemsChecked && <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">Ada komponen yang belum dinyatakan aman. Checklist akan ditandai perlu perhatian dan catatan wajib diisi.</p>}

            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="w-1/2 rounded-xl bg-slate-100 py-3 text-sm font-bold text-slate-700">Batal</button>
              <button type="submit" disabled={isSaving || vehicles.length === 0} className="w-1/2 rounded-xl bg-slate-950 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">
                {isSaving ? 'Menyimpan…' : 'Simpan checklist'}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  )
}

export default PreTripChecklistModal
