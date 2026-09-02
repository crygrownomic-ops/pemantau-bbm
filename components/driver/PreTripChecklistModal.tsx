'use client'

import { useState } from 'react'

export function PreTripChecklistModal({
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
  const [items, setItems] = useState({
    brakes: true,
    tires: true,
    engine_oil: true,
    lights: true,
    body_condition: true,
  })
  const [notes, setNotes] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const isAllOk = Object.values(items).every(Boolean)

    const record = {
      id: `CHK-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      driver_name: driverName || 'Supir Ops',
      plate_number: selectedPlate,
      status: isAllOk ? 'READY' : 'NEEDS_ATTENTION',
      details: items,
      notes: notes,
    }

    try {
      const stored = localStorage.getItem('pre_trip_inspections')
      const existing = stored ? JSON.parse(stored) : []
      const updated = [record, ...existing]
      localStorage.setItem('pre_trip_inspections', JSON.stringify(updated))
    } catch (err) {
      console.error(err)
    }

    setIsSubmitted(true)
    setTimeout(() => {
      setIsSubmitted(false)
      onClose()
    }, 1200)
  }

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl border border-slate-100">
        <div className="flex justify-between items-center border-b pb-3 border-slate-100">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
              <span>📋</span> Inspection Checklist Siap Jalan
            </h3>
            <p className="text-[11px] text-slate-500">Pemeriksaan fisik singkat kendaraan sebelum armada keluar pool</p>
          </div>
          <button onClick={onClose} className="text-slate-400 font-bold hover:text-slate-600">✕</button>
        </div>

        {isSubmitted ? (
          <div className="bg-emerald-50 text-emerald-800 p-6 rounded-2xl text-center space-y-2 border border-emerald-200">
            <span className="text-3xl">✅</span>
            <strong className="block text-sm font-bold">Checklist Berhasil Disimpan!</strong>
            <p className="text-xs text-emerald-700">Terima kasih telah memastikan keamanan armada sebelum bertugas.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Pilih Armada Kendaraan</label>
              <select
                value={selectedPlate}
                onChange={(e) => setSelectedPlate(e.target.value)}
                className="w-full border p-2.5 rounded-xl font-bold bg-slate-50 outline-none text-slate-900"
              >
                {vehicles.map((v: any) => (
                  <option key={v.plate_number} value={v.plate_number}>
                    {v.plate_number} — {v.model}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-700 block mb-1">Centang Kondisi Komponen:</span>

              <label className="flex items-center justify-between cursor-pointer p-1.5 hover:bg-white rounded-lg transition">
                <span className="text-slate-700">🛑 Rem Utama & Handbrake Pakem</span>
                <input
                  type="checkbox"
                  checked={items.brakes}
                  onChange={(e) => setItems({ ...items, brakes: e.target.checked })}
                  className="w-4 h-4 accent-slate-900 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer p-1.5 hover:bg-white rounded-lg transition">
                <span className="text-slate-700">🛞 Tekanan Angin Ban & Alur Layak</span>
                <input
                  type="checkbox"
                  checked={items.tires}
                  onChange={(e) => setItems({ ...items, tires: e.target.checked })}
                  className="w-4 h-4 accent-slate-900 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer p-1.5 hover:bg-white rounded-lg transition">
                <span className="text-slate-700">🛢️ Level Oli Mesin & Air Radiator Cukup</span>
                <input
                  type="checkbox"
                  checked={items.engine_oil}
                  onChange={(e) => setItems({ ...items, engine_oil: e.target.checked })}
                  className="w-4 h-4 accent-slate-900 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer p-1.5 hover:bg-white rounded-lg transition">
                <span className="text-slate-700">💡 Lampu Utama, Sein, & Hazard Nyala</span>
                <input
                  type="checkbox"
                  checked={items.lights}
                  onChange={(e) => setItems({ ...items, lights: e.target.checked })}
                  className="w-4 h-4 accent-slate-900 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer p-1.5 hover:bg-white rounded-lg transition">
                <span className="text-slate-700">🚗 Fisik Body & Kaca Bebas Kerusakan Baru</span>
                <input
                  type="checkbox"
                  checked={items.body_condition}
                  onChange={(e) => setItems({ ...items, body_condition: e.target.checked })}
                  className="w-4 h-4 accent-slate-900 cursor-pointer"
                />
              </label>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Catatan Tambahan (Opsional)</label>
              <input
                type="text"
                placeholder="Contoh: Ban belakang agak kurang angin sedikit..."
                className="w-full border p-2.5 rounded-xl outline-none"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
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
                Simpan & Konfirmasi
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default PreTripChecklistModal