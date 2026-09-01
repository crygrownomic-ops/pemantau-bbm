'use client'

import { useState } from 'react'
import { Icons } from '@/components/ui/Icons'

export default function MaintenanceTab({ vehicleStats, serviceHistory, totalMaintenanceCost, onAddServiceRecord }: any) {
  const [serviceStartDate, setServiceStartDate] = useState('')
  const [serviceEndDate, setServiceEndDate] = useState('')
  const [serviceSelectedVehicle, setServiceSelectedVehicle] = useState('ALL')
  const [selectedVehicle, setSelectedVehicle] = useState<any | null>(null)
  const [serviceTypeInput, setServiceTypeInput] = useState('Ganti Oli & Filter Mesin')
  const [partsReplacedInput, setPartsReplacedInput] = useState('')
  const [serviceCostInput, setServiceCostInput] = useState('')
  const [workshopInput, setWorkshopInput] = useState('')
  const [newKirExpiryInput, setNewKirExpiryInput] = useState('')

  const filteredHistory = serviceHistory.filter((s: any) => {
    const matchVehicle = serviceSelectedVehicle === 'ALL' || s.plate_number === serviceSelectedVehicle
    const matchStart = !serviceStartDate || s.date >= serviceStartDate
    const matchEnd = !serviceEndDate || s.date <= serviceEndDate
    return matchVehicle && matchStart && matchEnd
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedVehicle) return
    onAddServiceRecord(
      {
        plate_number: selectedVehicle.plate_number,
        service_type: serviceTypeInput,
        parts_replaced: partsReplacedInput.trim() || '-',
        cost: Number(serviceCostInput) || 0,
        workshop: workshopInput || 'Bengkel / Dishub',
        km_done: selectedVehicle.last_km,
        date: new Date().toISOString().split('T')[0],
      },
      serviceTypeInput === 'Pengujian Uji KIR Berkala' ? newKirExpiryInput : undefined
    )
    setSelectedVehicle(null)
    setPartsReplacedInput('')
    setServiceCostInput('')
    setWorkshopInput('')
    setNewKirExpiryInput('')
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Icons.Wrench className="w-5 h-5 text-indigo-600" /> Modul Pengawas Servis, Legalitas KIR & Perbaikan
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Monitoring Uji KIR berkala, penggantian sparepart, dan estimasi servis.</p>
        </div>
        <div className="bg-indigo-50 border border-indigo-200/80 p-3 rounded-xl text-xs font-mono text-indigo-900">
          <span className="text-[10px] text-indigo-500 block font-sans">Total Biaya Perawatan:</span>
          <strong className="text-sm font-bold">Rp {totalMaintenanceCost.toLocaleString('id-ID')}</strong>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {vehicleStats.map((v: any) => (
          <div key={v.plate_number} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start border-b pb-3">
                <div>
                  <div className="font-bold text-sm text-slate-900">{v.plate_number}</div>
                  <div className="text-xs text-slate-500">{v.model}</div>
                </div>
                {v.maintenance.status === 'CRITICAL' ? (
                  <span className="bg-rose-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full animate-pulse">🚨 BUTUH TINDAKAN</span>
                ) : (
                  <span className="bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">✓ KONDISI PRIMA</span>
                )}
              </div>
              <div className="space-y-3 pt-3">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Odometer Terkini:</span>
                  <span className="font-mono font-bold">{v.last_km.toLocaleString('id-ID')} KM</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold block text-[11px]">📜 Legalitas Uji KIR</span>
                    <span className="text-[10px] text-slate-500 font-mono">Exp: {v.kir_expiry}</span>
                  </div>
                  <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">{v.maintenance.daysToKir} Hari</span>
                </div>
              </div>
            </div>
            <button onClick={() => setSelectedVehicle(v)} className="w-full bg-slate-900 text-white font-bold text-xs py-2.5 rounded-xl shadow-md flex items-center justify-center gap-1.5 mt-2">
              <Icons.Wrench className="w-4 h-4" /> Catat Servis / Perbaikan / Uji KIR
            </button>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xs font-extrabold text-slate-900 uppercase">Riwayat Pengerjaan Servis & Sparepart</h3>
        </div>
        <div className="overflow-x-auto max-h-[190px] overflow-y-auto">
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
              {filteredHistory.map((s: any) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="p-3 font-mono">{s.date}</td>
                  <td className="p-3 font-bold text-slate-900">{s.plate_number}</td>
                  <td className="p-3 font-medium">{s.service_type}</td>
                  <td className="p-3 font-medium text-indigo-900 bg-indigo-50/50">{s.parts_replaced || '-'}</td>
                  <td className="p-3">{s.workshop}</td>
                  <td className="p-3 text-right font-mono font-bold text-slate-900">Rp {(Number(s.cost) || 0).toLocaleString('id-ID')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedVehicle && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-bold text-slate-900">Catat Perawatan Armada</h3>
              <button onClick={() => setSelectedVehicle(null)} className="text-slate-400 font-bold">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Kategori Pengerjaan</label>
                <select className="w-full text-xs border rounded-xl p-2.5 bg-slate-50" value={serviceTypeInput} onChange={(e) => setServiceTypeInput(e.target.value)}>
                  <option value="Ganti Oli & Filter Mesin">🛢️ Ganti Oli & Filter Mesin</option>
                  <option value="Servis Berkala Mesin">🔧 Servis Berkala Mesin</option>
                  <option value="Pengujian Uji KIR Berkala">📜 Pengujian Uji KIR Berkala</option>
                  <option value="Perbaikan Darurat / Sparepart">🛠️ Perbaikan / Penggantian Sparepart Non-Rutin</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Sparepart / Komponen Diganti</label>
                <input type="text" placeholder="Contoh: Aki GS Astra 45Ah" className="w-full text-xs border rounded-xl p-2.5 bg-slate-50" value={partsReplacedInput} onChange={(e) => setPartsReplacedInput(e.target.value)} required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Bengkel / Rekanan</label>
                <input type="text" placeholder="Nama Bengkel" className="w-full text-xs border rounded-xl p-2.5 bg-slate-50" value={workshopInput} onChange={(e) => setWorkshopInput(e.target.value)} required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Total Biaya (Rp)</label>
                <input type="number" placeholder="450000" className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-mono font-bold" value={serviceCostInput} onChange={(e) => setServiceCostInput(e.target.value)} required />
              </div>
              <div className="pt-2 flex gap-2">
                <button type="button" onClick={() => setSelectedVehicle(null)} className="w-1/2 bg-slate-100 text-slate-700 text-xs font-bold py-2.5 rounded-xl">Batal</button>
                <button type="submit" className="w-1/2 bg-slate-900 text-white text-xs font-bold py-2.5 rounded-xl">Simpan Catatan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}