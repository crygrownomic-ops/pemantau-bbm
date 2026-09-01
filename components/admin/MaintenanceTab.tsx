'use client'

import { useState } from 'react'
import { Icons } from '@/components/ui/Icons'

interface Vehicle {
  id: string
  plate_number: string
  model: string
  last_km: number
  kir_expiry: string
  maintenance: {
    nextOilKm: number
    remainingOilKm: number
    nextServiceKm: number
    remainingServiceKm: number
    daysToKir: number
    isKirCritical: boolean
    status: 'CRITICAL' | 'WARNING' | 'OK'
  }
}

interface ServiceRecord {
  id: number
  plate_number: string
  service_type: string
  parts_replaced: string
  cost: number
  workshop: string
  km_done: number
  date: string
}

interface MaintenanceTabProps {
  vehicleStats: Vehicle[]
  serviceHistory: ServiceRecord[]
  totalMaintenanceCost: number
  onAddServiceRecord: (record: Omit<ServiceRecord, 'id'>, newKirExpiry?: string) => void
}

export default function MaintenanceTab({
  vehicleStats,
  serviceHistory,
  totalMaintenanceCost,
  onAddServiceRecord,
}: MaintenanceTabProps) {
  // FILTER STATES
  const [serviceStartDate, setServiceStartDate] = useState('')
  const [serviceEndDate, setServiceEndDate] = useState('')
  const [serviceSelectedVehicle, setServiceSelectedVehicle] = useState('ALL')

  // MODAL STATES
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [serviceTypeInput, setServiceTypeInput] = useState('Ganti Oli & Filter Mesin')
  const [partsReplacedInput, setPartsReplacedInput] = useState('')
  const [serviceCostInput, setServiceCostInput] = useState('')
  const [workshopInput, setWorkshopInput] = useState('')
  const [newKirExpiryInput, setNewKirExpiryInput] = useState('')

  // FILTERED HISTORY
  const filteredHistory = serviceHistory.filter((s) => {
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
      {/* HEADER INFO */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Icons.Wrench className="w-5 h-5 text-indigo-600" /> Modul Pengawas Servis, Legalitas KIR & Perbaikan
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitoring jatuh tempo Uji KIR berkala, rincian penggantian sparepart, serta estimasi sisa KM servis berkala.
          </p>
        </div>

        <div className="bg-indigo-50 border border-indigo-200/80 p-3 rounded-xl text-xs font-mono text-indigo-900 flex items-center gap-3">
          <div>
            <span className="text-[10px] text-indigo-500 block font-sans">Total Biaya Perawatan & Legalitas:</span>
            <strong className="text-sm font-bold text-indigo-950">Rp {totalMaintenanceCost.toLocaleString('id-ID')}</strong>
          </div>
        </div>
      </div>

      {/* CARDS JADWAL SERVIS & UJI KIR PER VEHICLE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {vehicleStats.map((v) => (
          <div key={v.plate_number} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start border-b pb-3">
                <div>
                  <div className="font-bold text-sm text-slate-900">{v.plate_number}</div>
                  <div className="text-xs text-slate-500">{v.model}</div>
                </div>
                {v.maintenance.status === 'CRITICAL' ? (
                  <span className="bg-rose-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full animate-pulse shadow-sm">
                    🚨 BUTUH TINDAKAN
                  </span>
                ) : v.maintenance.status === 'WARNING' ? (
                  <span className="bg-amber-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                    ⚠️ PERLU DIKONTROL
                  </span>
                ) : (
                  <span className="bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                    ✓ KONDISI PRIMA
                  </span>
                )}
              </div>

              <div className="space-y-3 pt-3">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-medium">Odometer Terkini:</span>
                  <span className="font-mono font-bold text-slate-900">{v.last_km.toLocaleString('id-ID')} KM</span>
                </div>

                <div className="space-y-2">
                  {/* UJI KIR */}
                  <div className={`p-2.5 rounded-xl border flex justify-between items-center text-xs ${v.maintenance.isKirCritical ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-100'}`}>
                    <div>
                      <span className="font-bold text-slate-800 block text-[11px] flex items-center gap-1">
                        <Icons.DocumentCheck className="w-3.5 h-3.5 text-slate-600" /> Legalitas Uji KIR
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">Exp: {v.kir_expiry}</span>
                    </div>
                    <span className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded-md ${v.maintenance.isKirCritical ? 'bg-rose-600 text-white animate-pulse' : 'bg-slate-200 text-slate-700'}`}>
                      {v.maintenance.daysToKir} Hari Lagi
                    </span>
                  </div>

                  {/* OLI */}
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-slate-800 block text-[11px]">🛢️ Ganti Oli Mesin</span>
                      <span className="text-[10px] text-slate-500 font-mono">Target: {v.maintenance.nextOilKm.toLocaleString('id-ID')} KM</span>
                    </div>
                    <span className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded-md ${v.maintenance.remainingOilKm <= 300 ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-700'}`}>
                      {v.maintenance.remainingOilKm.toLocaleString('id-ID')} KM
                    </span>
                  </div>

                  {/* SERVIS BERKALA */}
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-slate-800 block text-[11px]">🔧 Servis Berkala Mesin</span>
                      <span className="text-[10px] text-slate-500 font-mono">Target: {v.maintenance.nextServiceKm.toLocaleString('id-ID')} KM</span>
                    </div>
                    <span className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded-md ${v.maintenance.remainingServiceKm <= 300 ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-700'}`}>
                      {v.maintenance.remainingServiceKm.toLocaleString('id-ID')} KM
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedVehicle(v)}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 rounded-xl transition shadow-md flex items-center justify-center gap-1.5 mt-2"
            >
              <Icons.Wrench className="w-4 h-4" /> Catat Servis / Perbaikan / Uji KIR
            </button>
          </div>
        ))}
      </div>

      {/* TABEL HISTORI PERBAIKAN BENGKEL & SPAREPART */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
          <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
            Riwayat Pengerjaan Servis, Uji KIR & Perbaikan Bengkel
          </h3>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
              <span className="text-slate-500 font-medium">Dari:</span>
              <input
                type="date"
                className="bg-transparent font-medium text-slate-800 outline-none"
                value={serviceStartDate}
                onChange={(e) => setServiceStartDate(e.target.value)}
              />
              <span className="text-slate-500 font-medium">s/d</span>
              <input
                type="date"
                className="bg-transparent font-medium text-slate-800 outline-none"
                value={serviceEndDate}
                onChange={(e) => setServiceEndDate(e.target.value)}
              />
              {(serviceStartDate || serviceEndDate) && (
                <button
                  onClick={() => {
                    setServiceStartDate('')
                    setServiceEndDate('')
                  }}
                  className="text-slate-400 hover:text-slate-700 ml-1 font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            <select
              className="text-xs border border-slate-300 rounded-xl p-2 bg-white font-medium text-slate-700 outline-none"
              value={serviceSelectedVehicle}
              onChange={(e) => setServiceSelectedVehicle(e.target.value)}
            >
              <option value="ALL">Semua Armada</option>
              {vehicleStats.map((v) => (
                <option key={v.plate_number} value={v.plate_number}>
                  {v.plate_number} - {v.model}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto max-h-[190px] overflow-y-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-900 text-white font-bold border-b border-slate-800 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="p-3">Tanggal</th>
                <th className="p-3">Kendaraan</th>
                <th className="p-3">Jenis Pengerjaan</th>
                <th className="p-3">Komponen / Sparepart Diganti</th>
                <th className="p-3">Bengkel / Rekanan</th>
                <th className="p-3">KM Pengerjaan</th>
                <th className="p-3 text-right">Biaya (Rp)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredHistory.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 transition">
                  <td className="p-3 font-mono whitespace-nowrap">{s.date}</td>
                  <td className="p-3 font-bold text-slate-900 whitespace-nowrap">{s.plate_number}</td>
                  <td className="p-3 font-medium text-slate-800 whitespace-nowrap">{s.service_type}</td>
                  <td className="p-3 font-medium text-indigo-900 bg-indigo-50/50">
                    {s.parts_replaced || '-'}
                  </td>
                  <td className="p-3 whitespace-nowrap">{s.workshop}</td>
                  <td className="p-3 font-mono whitespace-nowrap">{s.km_done.toLocaleString('id-ID')} KM</td>
                  <td className="p-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                    Rp {(Number(s.cost) || 0).toLocaleString('id-ID')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-3 border-t border-slate-100 bg-slate-50 flex justify-between items-center text-xs">
          <span className="text-slate-500 font-mono text-[11px]">
            Menampilkan total <strong className="text-slate-900">{filteredHistory.length}</strong> catatan pengerjaan
          </span>
          <span className="text-[11px] text-slate-400 font-medium italic">
            💡 Gulung (scroll) ke bawah pada tabel untuk melihat data lainnya
          </span>
        </div>
      </div>

      {/* MODAL INPUT SERVIS & SPAREPART */}
      {selectedVehicle && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Catat Perawatan & Sparepart Armada</h3>
                <p className="text-xs text-slate-500">{selectedVehicle.plate_number} • {selectedVehicle.model}</p>
              </div>
              <button onClick={() => setSelectedVehicle(null)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Kategori Pengerjaan / Biaya</label>
                <select
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-slate-50 font-medium text-slate-800 outline-none"
                  value={serviceTypeInput}
                  onChange={(e) => setServiceTypeInput(e.target.value)}
                >
                  <option value="Ganti Oli & Filter Mesin">🛢️ Ganti Oli & Filter Mesin (Interval 5.000 KM)</option>
                  <option value="Servis Berkala Mesin">🔧 Servis Berkala Mesin (Interval 10.000 KM)</option>
                  <option value="Pengujian Uji KIR Berkala">📜 Pengujian Uji KIR Berkala (Legalitas Dishub)</option>
                  <option value="Perbaikan Darurat / Sparepart">🛠️ Perbaikan / Penggantian Sparepart Non-Rutin</option>
                  <option value="Penggantian Kampas Rem">🛑 Penggantian Kampas Rem (Interval 20.000 KM)</option>
                  <option value="Rotasi / Ganti Ban">🛞 Rotasi / Ganti Ban (Interval 25.000 KM)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Rincian Komponen / Sparepart yang Diganti</label>
                <input
                  type="text"
                  placeholder="Contoh: Aki GS Astra 45Ah, Kampas Rem Depan, V-Belt"
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-slate-50 font-medium text-slate-800 outline-none"
                  value={partsReplacedInput}
                  onChange={(e) => setPartsReplacedInput(e.target.value)}
                  required
                />
              </div>

              {serviceTypeInput === 'Pengujian Uji KIR Berkala' && (
                <div>
                  <label className="block text-xs font-semibold text-amber-800 mb-1">Tanggal Kadaluarsa Uji KIR Baru</label>
                  <input
                    type="date"
                    className="w-full text-xs border border-amber-300 rounded-xl p-2.5 bg-amber-50 font-medium text-slate-900 outline-none"
                    value={newKirExpiryInput}
                    onChange={(e) => setNewKirExpiryInput(e.target.value)}
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Bengkel / Penyedia Jasa</label>
                <input
                  type="text"
                  placeholder="Contoh: Bengkel Rekanan / Dinas Perhub"
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-slate-50 font-medium text-slate-800 outline-none"
                  value={workshopInput}
                  onChange={(e) => setWorkshopInput(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Total Biaya (Rp)</label>
                <input
                  type="number"
                  placeholder="Contoh: 450000"
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-slate-50 font-mono font-bold text-slate-800 outline-none"
                  value={serviceCostInput}
                  onChange={(e) => setServiceCostInput(e.target.value)}
                  required
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedVehicle(null)}
                  className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2.5 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 rounded-xl shadow-md"
                >
                  Simpan Catatan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}