'use client'

import { useState, type FormEvent } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Icon } from '@/components/ui/Icon'
import { useFleet } from '@/components/providers/FleetProvider'
import type { Vehicle } from '@/lib/types'

const CHECKLIST_ITEMS: Array<{ key: string; label: string; hint: string }> = [
  { key: 'brakes', label: 'Rem utama & handbrake', hint: 'Pakem, tidak ada kebocoran, pedal tidak dalam.' },
  { key: 'tires', label: 'Ban & tekanan angin', hint: 'Alur ban layak, tidak benjol, tekanan sesuai.' },
  { key: 'engine_oil', label: 'Oli mesin & air radiator', hint: 'Level oli dan coolant dalam batas normal.' },
  { key: 'lights', label: 'Lampu & klakson', hint: 'Lampu utama, sein, hazard, dan klakson berfungsi.' },
  { key: 'body_condition', label: 'Fisik body & kaca', hint: 'Tidak ada kerusakan baru, kaca dan spion utuh.' },
]

const EMPTY_ITEMS: Record<string, boolean> = {
  brakes: true,
  tires: true,
  engine_oil: true,
  lights: true,
  body_condition: true,
}

interface ChecklistProps {
  onClose: () => void
  vehicles: Vehicle[]
  driverName: string
  defaultPlate: string
}

export function PreTripChecklistModal({
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
    <ChecklistForm
      onClose={onClose}
      vehicles={vehicles}
      driverName={driverName}
      defaultPlate={defaultPlate}
    />
  )
}

function ChecklistForm({ onClose, vehicles, driverName, defaultPlate }: ChecklistProps) {
  const { create } = useFleet()
  const [selectedPlate, setSelectedPlate] = useState(defaultPlate || vehicles[0]?.plate_number || '')
  const [items, setItems] = useState<Record<string, boolean>>(EMPTY_ITEMS)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [failed, setFailed] = useState(false)

  const allOk = Object.values(items).every(Boolean)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (saving) return
    if (!selectedPlate) return
    setSaving(true)
    setFailed(false)
    try {
      await create('inspections', {
        plate_number: selectedPlate,
        driver_name: driverName,
        date: new Date().toISOString().slice(0, 10),
        details: items,
        notes: notes.trim(),
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
      title="Inspeksi siap jalan"
      description="Pemeriksaan fisik singkat sebelum armada keluar pool. Hasil masuk ke scorecard driver."
      size="md"
    >
      {submitted ? (
        <div className="flex flex-col items-center gap-3 px-2 py-8 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <Icon name="check" className="h-6 w-6" />
          </span>
          <div>
            <p className="text-sm font-extrabold text-slate-800">Checklist berhasil disimpan</p>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
              Terima kasih telah memastikan keamanan armada sebelum bertugas.
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

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-slate-500">Kondisi komponen</p>
              <span className={`badge ${allOk ? 'badge-green' : 'badge-amber'}`}>
                {allOk ? 'Semua layak' : 'Perlu perhatian'}
              </span>
            </div>
            <div className="space-y-1">
              {CHECKLIST_ITEMS.map((item) => (
                <label
                  key={item.key}
                  className="flex cursor-pointer items-start justify-between gap-3 rounded-lg bg-white px-3 py-2.5 transition hover:bg-slate-50"
                >
                  <span className="min-w-0">
                    <span className="block text-[11px] font-bold text-slate-700">{item.label}</span>
                    <span className="block text-[10px] leading-relaxed text-slate-400">{item.hint}</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={Boolean(items[item.key])}
                    onChange={(event) => setItems((current) => ({ ...current, [item.key]: event.target.checked }))}
                    className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-navy-900"
                  />
                </label>
              ))}
            </div>
          </div>

          <div>
            <span className="label">Catatan tambahan</span>
            <textarea
              className="input min-h-[64px] resize-y"
              placeholder="Contoh: ban belakang kurang angin sedikit."
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>

          {failed && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-[11px] font-semibold text-rose-700">
              <Icon name="alert" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Checklist gagal disimpan. Periksa koneksi lalu coba lagi.
            </div>
          )}

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
            <button type="button" onClick={onClose} className="btn btn-ghost">
              Batal
            </button>
            <button type="submit" disabled={saving || !selectedPlate} className="btn btn-primary">
              <Icon name="check" className="h-3.5 w-3.5" />
              {saving ? 'Menyimpan…' : 'Simpan checklist'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  )
}

export default PreTripChecklistModal
