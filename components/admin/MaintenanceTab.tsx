'use client'

import { useState } from 'react'
import { Icons } from './Icons'

export function MaintenanceTab({ vehicleStats, serviceHistory, totalMaintenanceCost, onAddServiceRecord }: any) {
  const [selectedVehicle, setSelectedVehicle] = useState<any | null>(null)
  const [serviceTypeInput, setServiceTypeInput] = useState('Ganti Oli & Filter Mesin')
  const [partsReplacedInput, setPartsReplacedInput] = useState('')
  const [serviceCostInput, setServiceCostInput] = useState('')
  const [workshopInput, setWorkshopInput] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedVehicle) return
    onAddServiceRecord({
      plate_number: selectedVehicle.plate_number,
      service_type: serviceTypeInput,
      parts_replaced: partsReplacedInput.trim() || '-',
      cost: Number(serviceCostInput) || 0,
      workshop: workshopInput || 'Bengkel',
      km_done: selectedVehicle.last_km,
      date: new Date().toISOString().split('T')[0],
    })
    setSelectedVehicle(null)
    setPartsReplacedInput('')
    setServiceCostInput('')
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Icons.Wrench className="w-5 h-5 text-indigo-600" /> Modul Servis, Sparepart & Legalitas KIR
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Monitoring perbaikan berkala dan tenggat KIR</p>
        </div>
        <div className="text-xs font-bold text-indigo-900 bg-indigo-50 p-3 rounded-xl font-mono">
          Total: Rp {totalMaintenanceCost.toLocaleString('id-ID')}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {vehicleStats.map((v: any) => (
          <div key={v.plate_number} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="font-bold text-sm text-slate-900">{v.plate_number} - {v.model}</div>
            <div className="text-xs text-slate-500 font-mono">KM Odometer: {v.last_km.toLocaleString('id-ID')} KM</div>
            <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg font-mono">Exp KIR: {v.kir_expiry || '-'}</div>
            <button
              onClick={() => setSelectedVehicle(v)}
              className="w-full bg-slate-900 text-white font-bold text-xs py-2 rounded-xl shadow-md"
            >
              Catat Servis / Sparepart
            </button>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100">
          <h3 className="text-xs font-extrabold text-slate-900 uppercase">Riwayat Maintenance & Sparepart</h3>
        </div>
        <div className="overflow-x-auto max-h-[200px] overflow-y-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-900 text-white font-bold sticky top-0 z-10">
              <tr>
                <th className="p-3">Tanggal</th>
                <th className="p-3">Kendaraan</th>
                <th className="p-3">Jenis Pengerjaan</th>
                <th className="p-3">Sparepart Diganti</th>
                <th className="p-3">Bengkel</th>
                <th className="p-3 text-right">Biaya (Rp)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {serviceHistory.map((s: any) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="p-3 font-mono">{s.date}</td>
                  <td className="p-3 font-bold text-slate-900">{s.plate_number}</td>
                  <td className="p-3 font-medium">{s.service_type}</td>
                  <td className="p-3 font-medium text-indigo-900 bg-indigo-50/50">{s.parts_replaced || '-'}</td>
                  <td className="p-3">{s.workshop}</td>
                  <td className="p-3 text-right font-mono font-bold text-slate-900">
                    Rp {(Number(s.cost) || 0).toLocaleString('id-ID')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedVehicle && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-3 shadow-xl">
            <h3 className="text-xs font-bold text-slate-900">Catat Servis {selectedVehicle.plate_number}</h3>
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Kategori Pengerjaan</label>
                <select
                  className="w-full border p-2 rounded-xl bg-slate-50"
                  value={serviceTypeInput}
                  onChange={(e) => setServiceTypeInput(e.target.value)}
                >
                  <option value="Ganti Oli & Filter Mesin">🛢️ Ganti Oli & Filter Mesin</option>
                  <option value="Servis Berkala Mesin">🔧 Servis Berkala Mesin</option>
                  <option value="Pengujian Uji KIR Berkala">📜 Pengujian Uji KIR Berkala</option>
                  <option value="Perbaikan Darurat / Sparepart">🛠️ Perbaikan / Penggantian Sparepart Non-Rutin</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Rincian Sparepart Diganti</label>
                <input
                  type="text"
                  placeholder="Contoh: Aki GS Astra 45Ah, Kampas Rem"
                  className="w-full border p-2 rounded-xl"
                  value={partsReplacedInput}
                  onChange={(e) => setPartsReplacedInput(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Bengkel / Rekanan</label>
                <input
                  type="text"
                  placeholder="Nama Bengkel / Dishub"
                  className="w-full border p-2 rounded-xl"
                  value={workshopInput}
                  onChange={(e) => setWorkshopInput(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Total Biaya (Rp)</label>
                <input
                  type="number"
                  placeholder="450000"
                  className="w-full border p-2 rounded-xl font-mono font-bold"
                  value={serviceCostInput}
                  onChange={(e) => setServiceCostInput(e.target.value)}
                  required
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedVehicle(null)}
                  className="w-1/2 bg-slate-100 p-2 rounded-xl font-bold"
                >
                  Batal
                </button>
                <button type="submit" className="w-1/2 bg-slate-900 text-white p-2 rounded-xl font-bold">
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}