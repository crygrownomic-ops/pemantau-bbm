'use client'

import { useState } from 'react'

export function WhatsAppReminderModal({
  isOpen,
  onClose,
  vehicles = [],
  drivers = [],
}: {
  isOpen: boolean
  onClose: () => void
  vehicles: any[]
  drivers: any[]
}) {
  const [selectedTab, setSelectedTab] = useState<'all' | 'kir' | 'stnk' | 'sim'>('all')

  if (!isOpen) return null

  const todayStr = new Date().toISOString().split('T')[0]
  const today = new Date(todayStr)

  const getDaysDiff = (dateStr: string) => {
    if (!dateStr) return 999
    const target = new Date(dateStr)
    const diffTime = target.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 3600 * 24))
  }

  // Scan KIR & STNK Armada
  const vehicleAlerts: any[] = []
  vehicles.forEach((v) => {
    if (v.kir_expiry) {
      const days = getDaysDiff(v.kir_expiry)
      if (days <= 30) {
        vehicleAlerts.push({
          id: `kir-${v.id}`,
          type: 'KIR',
          targetName: `Armada ${v.plate_number} (${v.model})`,
          date: v.kir_expiry,
          days,
          phone: '',
          plateNumber: v.plate_number,
        })
      }
    }
    if (v.stnk_expiry) {
      const days = getDaysDiff(v.stnk_expiry)
      if (days <= 30) {
        vehicleAlerts.push({
          id: `stnk-${v.id}`,
          type: 'STNK',
          targetName: `Armada ${v.plate_number} (${v.model})`,
          date: v.stnk_expiry,
          days,
          phone: '',
          plateNumber: v.plate_number,
        })
      }
    }
  })

  // Scan SIM Driver
  const driverAlerts: any[] = []
  drivers.forEach((d) => {
    if (d.sim_expiry) {
      const days = getDaysDiff(d.sim_expiry)
      if (days <= 30) {
        driverAlerts.push({
          id: `sim-${d.id}`,
          type: 'SIM',
          targetName: `${d.name} (${d.sim_type || 'SIM'})`,
          date: d.sim_expiry,
          days,
          phone: d.phone || d.emergency_phone || '',
          driverName: d.name,
          simType: d.sim_type || 'SIM',
          simNumber: d.sim_number || '-',
        })
      }
    }
  })

  const allAlerts = [...vehicleAlerts, ...driverAlerts].sort((a, b) => a.days - b.days)

  const filteredAlerts = allAlerts.filter((item) => {
    if (selectedTab === 'kir') return item.type === 'KIR'
    if (selectedTab === 'stnk') return item.type === 'STNK'
    if (selectedTab === 'sim') return item.type === 'SIM'
    return true
  })

  const generateWaLink = (item: any) => {
    let msg = ''
    let phoneNum = (item.phone || '').replace(/\D/g, '')

    if (item.type === 'SIM') {
      msg = `*PERINGATAN LEGALITAS SIM DRIVER - FLEETOPS 360*\n\nYth. Bpk/Sdr. *${item.driverName}*,\n\nInformasi bahwa lisensi *${item.simType}* Anda (*No: ${item.simNumber}*) akan kadaluarsa pada tanggal *${item.date}* (${item.days < 0 ? 'SUDAH KADALUARSA ' + Math.abs(item.days) + ' HARI' : 'Sisa ' + item.days + ' hari lagi'}).\n\nMohon untuk segera melakukan proses perpanjangan SIM ke Satpas terdekat demi kelancaran operasional armada.\n\nTerima kasih,\n_Tim Manajemen Operasional FleetOps 360_`
    } else {
      msg = `*PEMBERITAHUAN MASA BERLAKU ${item.type} ARMADA*\n\nInformasi Legalitas Kendaraan:\n- Plat Nomor: *${item.plateNumber}*\n- Jenis Dokumen: *Uji ${item.type}*\n- Tenggat Expired: *${item.date}* (${item.days < 0 ? 'TERLAMBAT ' + Math.abs(item.days) + ' HARI' : 'Sisa ' + item.days + ' hari'}).\n\nMohon tim operasional/bengkel segera menjadwalkan perpanjangan dokumen ke Dishub/Samsat.\n\nTerima kasih,\n_System Alert FleetOps 360_`
    }

    const encoded = encodeURIComponent(msg)
    return phoneNum ? `https://wa.me/${phoneNum}?text=${encoded}` : `https://wa.me/?text=${encoded}`
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto font-sans">
        <div className="flex justify-between items-start border-b pb-3 border-slate-100">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-xl">📱</span>
              Pusat Notifikasi WhatsApp Legalitas Armada & SIM Driver
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Peringatan dini otomatis untuk dokumen KIR, STNK, dan SIM yang mendekati tenggat kadaluarsa
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 font-bold hover:text-slate-600">
            ✕
          </button>
        </div>

        {/* TAB FILTER MODAL */}
        <div className="flex gap-2 border-b border-slate-100 pb-2 text-xs font-bold">
          <button
            onClick={() => setSelectedTab('all')}
            className={`px-3 py-1.5 rounded-xl transition ${selectedTab === 'all' ? 'bg-slate-900 text-amber-400' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            Semua ({allAlerts.length})
          </button>
          <button
            onClick={() => setSelectedTab('kir')}
            className={`px-3 py-1.5 rounded-xl transition ${selectedTab === 'kir' ? 'bg-slate-900 text-amber-400' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            Uji KIR ({vehicleAlerts.filter((a) => a.type === 'KIR').length})
          </button>
          <button
            onClick={() => setSelectedTab('stnk')}
            className={`px-3 py-1.5 rounded-xl transition ${selectedTab === 'stnk' ? 'bg-slate-900 text-amber-400' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            STNK ({vehicleAlerts.filter((a) => a.type === 'STNK').length})
          </button>
          <button
            onClick={() => setSelectedTab('sim')}
            className={`px-3 py-1.5 rounded-xl transition ${selectedTab === 'sim' ? 'bg-slate-900 text-amber-400' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            SIM Driver ({driverAlerts.length})
          </button>
        </div>

        {/* LIST ALERT */}
        <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
          {filteredAlerts.length > 0 ? (
            filteredAlerts.map((item) => {
              const isExpired = item.days < 0
              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs ${
                    isExpired
                      ? 'bg-rose-50/80 border-rose-200'
                      : 'bg-amber-50/60 border-amber-200'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.type === 'SIM'
                            ? 'bg-indigo-100 text-indigo-800'
                            : item.type === 'KIR'
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-slate-200 text-slate-800'
                        }`}
                      >
                        {item.type}
                      </span>
                      <strong className="text-slate-900 text-xs">{item.targetName}</strong>
                    </div>

                    <div className="text-[11px] text-slate-600 font-mono">
                      <span>Masa Berlaku S.D: <strong>{item.date}</strong></span>
                      <span className="mx-2">•</span>
                      <strong className={isExpired ? 'text-rose-700 font-bold' : 'text-amber-800'}>
                        {isExpired
                          ? `⚠️ KADALUARSA (${Math.abs(item.days)} hari lalu)`
                          : `⏳ Sisa ${item.days} hari lagi`}
                      </strong>
                    </div>
                  </div>

                  <a
                    href={generateWaLink(item)}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-2 rounded-xl shadow-sm transition flex items-center gap-1.5 shrink-0"
                  >
                    💬 Kirim WA
                  </a>
                </div>
              )
            })
          ) : (
            <div className="text-center py-8 text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
              🟢 Semua dokumen legalitas armada dan SIM driver dalam masa berlaku aman (&gt; 30 hari).
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2 rounded-xl"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}

export default WhatsAppReminderModal