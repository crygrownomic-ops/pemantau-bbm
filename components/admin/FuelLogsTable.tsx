'use client'

import { useState, useEffect, useRef } from 'react'
import { Icons } from './Icons'

export function FuelLogsTable({
  filteredLogs,
  safeVehicles,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  selectedVehicle,
  setSelectedVehicle,
  setPreviewReceipt,
  handleDeleteLog,
  handleUpdateStatus,
}: any) {
  const [fraudAuditLog, setFraudAuditLog] = useState<any | null>(null)
  const [auditNote, setAuditNote] = useState('')
  const [auditAction, setAuditAction] = useState<'HOLD' | 'REJECT' | 'CLEAR'>('HOLD')
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null)

  const menuRef = useRef<HTMLDivElement>(null)

  // Tutup dropdown jika mengklik di luar area menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleOpenFraudModal = (log: any) => {
    setFraudAuditLog(log)
    setAuditNote(
      log.audit_note ||
        'Rasio konsumsi BBM terdeteksi boros / tidak efisien. Mohon konfirmasi ulang odometer dan bukti pengisian.'
    )
    setActiveMenuId(null)
  }

  // FUNGSI EXPORT DATA LANGSUNG KE EXCEL (CSV UTF-8 BOM)
  const handleExportToExcel = () => {
    if (!filteredLogs || filteredLogs.length === 0) {
      alert('⚠️ Tidak ada data transaksi untuk diexport!')
      return
    }

    // Header UTF-8 BOM agar Microsoft Excel langsung membaca pemisah kolom & format bahasa Indonesia
    let csvContent = '\uFEFF'

    // SESI 1: HEADER LAPORAN
    csvContent += 'LAPORAN EVALUASI OPERASIONAL & BIAYA BBM ARMADA — FLEETOPS 360\n'
    csvContent += `Tanggal Cetak;${new Date().toLocaleDateString('id-ID')}\n\n`

    // SESI 2: REKAPITULASI ARMADA
    csvContent += 'REKAPITULASI BIAYA & ANGGARAN ARMADA\n'
    csvContent += 'Plat Nomor;Model Kendaraan;Batas Anggaran Bulanan (Rp);Odometer KM Terakhir;Exp. Uji KIR;Exp. STNK\n'

    safeVehicles.forEach((v: any) => {
      csvContent += `"${v.plate_number}";"${v.model || '-'}";"${(v.monthly_budget || 0).toLocaleString('id-ID')}";"${(v.last_km || 0).toLocaleString('id-ID')} KM";"${v.kir_expiry || '-'}";"${v.stnk_expiry || '-'}"\n`
    })

    csvContent += '\n\n'

    // SESI 3: RINCIAN LOG TRANSAKSI PENGISIAN BBM
    csvContent += 'RINCIAN LOG TRANSAKSI PENGISIAN BBM\n'
    csvContent += 'ID Transaksi;Tanggal;Plat Nomor;Pengemudi (Driver);Jenis BBM;Lokasi Pengisian;KM Awal;KM Akhir;Jarak Tempuh (KM);Volume (Liter);Total Biaya (Rp);Rasio Efisiensi (KM/L);Status Audit;Catatan Audit Admin\n'

    filteredLogs.forEach((log: any) => {
      const kmPerLiter = log.km_per_liter || (log.liters > 0 ? (log.distance_km / log.liters).toFixed(2) : '0')
      const statusLabel =
        log.status === 'VERIFIED'
          ? 'Diverifikasi'
          : log.status === 'FLAGGED'
          ? 'Anomali / Boros'
          : 'Menunggu'

      csvContent += `"${log.id}";"${log.date}";"${log.plate_number}";"${log.driver_name || '-'}";"${log.fuel_type}";"${log.fill_location}";"${log.initial_km}";"${log.final_km}";"${log.distance_km || 0}";"${log.liters}";"${(Number(log.total_cost) || 0).toLocaleString('id-ID')}";"${kmPerLiter}";"${statusLabel}";"${(log.audit_note || '').replace(/"/g, '""')}"\n`
    })

    // UNDUH BERKAS SECARA OTOMATIS
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const fileName = `Laporan_FleetOps360_${new Date().toISOString().split('T')[0]}.csv`

    link.setAttribute('href', url)
    link.setAttribute('download', fileName)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Fungsi Kirim Audit + Notifikasi Otomatis ke WhatsApp Driver
  const handleSubmitFraudAudit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!fraudAuditLog) return

    const newStatus = auditAction === 'CLEAR' ? 'VERIFIED' : 'FLAGGED'
    handleUpdateStatus(fraudAuditLog.id, newStatus, auditNote)

    // Cari Nomor HP Driver dari Master Data di LocalStorage
    let driverPhone = ''
    try {
      const storedDrivers = localStorage.getItem('master_drivers')
      if (storedDrivers) {
        const parsedDrivers = JSON.parse(storedDrivers)
        const matched = parsedDrivers.find(
          (d: any) => d.name.trim().toLowerCase() === fraudAuditLog.driver_name.trim().toLowerCase()
        )
        if (matched && matched.phone) {
          driverPhone = matched.phone.replace(/\D/g, '')
          if (driverPhone.startsWith('0')) {
            driverPhone = '62' + driverPhone.slice(1)
          }
        }
      }
    } catch (err) {
      console.error('Gagal mengambil kontak driver:', err)
    }

    const statusLabel =
      auditAction === 'HOLD'
        ? '⚠️ DITANGGUHKAN (KLARIFIKASI)'
        : auditAction === 'REJECT'
        ? '❌ DITOLAK / ANOMALI'
        : '✓ DIVERIFIKASI'

    const kmPerLiter =
      fraudAuditLog.km_per_liter ||
      (fraudAuditLog.liters > 0 ? (fraudAuditLog.distance_km / fraudAuditLog.liters).toFixed(1) : 0)

    const waMessage = 
`*PEMBERITAHUAN AUDIT BBM — FLEETOPS 360*

Halo *${fraudAuditLog.driver_name}*,
Laporan pengisian BBM Anda memerlukan perhatian/konfirmasi.

🚘 *Armada:* ${fraudAuditLog.plate_number}
📅 *Tanggal:* ${fraudAuditLog.date}
⛽ *Volume:* ${fraudAuditLog.liters} L (Rp ${(Number(fraudAuditLog.total_cost) || 0).toLocaleString('id-ID')})
📊 *Rasio Efisiensi:* ${kmPerLiter} KM/L

📌 *Status Audit:* ${statusLabel}
📝 *Catatan Admin:*
"${auditNote}"

Mohon segera hubungi Admin atau lakukan pemeriksaan ulang odometer/struk pengisian. Terima kasih.`

    if (driverPhone) {
      const encodedMsg = encodeURIComponent(waMessage)
      const waUrl = `https://wa.me/${driverPhone}?text=${encodedMsg}`
      window.open(waUrl, '_blank')
    } else {
      alert(
        `Status transaksi #${fraudAuditLog.id} berhasil diperbarui!\n\n(Catatan: Nomor WA Driver ${fraudAuditLog.driver_name} tidak ditemukan di Master Data).`
      )
    }

    setFraudAuditLog(null)
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm space-y-0">
      {/* HEADER TABEL & FILTER */}
      <div className="p-4 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <h2 className="text-xs font-extrabold text-slate-900 tracking-wider uppercase flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            Rincian Transaksi Pengisian BBM Armada
          </h2>

          {/* TOMBOL EXPORT EXCEL LANGSUNG DARI APLIKASI */}
          <button
            onClick={handleExportToExcel}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-sm transition flex items-center gap-1.5"
            title="Unduh laporan transaksi dalam bentuk file Excel (.csv)"
          >
            <span>📊</span> Export Excel
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-slate-400 font-medium text-[11px]">Dari:</span>
            <input
              type="date"
              className="bg-transparent font-medium text-slate-800 outline-none text-xs"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <span className="text-slate-400 font-medium text-[11px]">s/d</span>
            <input
              type="date"
              className="bg-transparent font-medium text-slate-800 outline-none text-xs"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate('')
                  setEndDate('')
                }}
                className="text-slate-400 hover:text-slate-700 font-bold ml-1 px-1"
              >
                ✕
              </button>
            )}
          </div>

          <select
            className="text-xs border border-slate-300 rounded-xl p-2 bg-white font-semibold text-slate-700 outline-none shadow-sm focus:ring-2 focus:ring-amber-500"
            value={selectedVehicle}
            onChange={(e) => setSelectedVehicle(e.target.value)}
          >
            <option value="ALL">Semua Armada</option>
            {safeVehicles.map((v: any) => (
              <option key={v.plate_number} value={v.plate_number}>
                {v.plate_number} - {v.model}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* BODY TABEL */}
      <div className="overflow-x-auto min-h-[350px] max-h-[420px] overflow-y-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-900 text-white font-bold sticky top-0 z-10">
            <tr>
              <th className="p-3.5">Tanggal</th>
              <th className="p-3.5">Kendaraan</th>
              <th className="p-3.5">Pengemudi</th>
              <th className="p-3.5">Jenis BBM & Lokasi</th>
              <th className="p-3.5">Odometer & Efisiensi</th>
              <th className="p-3.5">Volume</th>
              <th className="p-3.5 text-right">Total Biaya</th>
              <th className="p-3.5 text-center">Status Audit</th>
              <th className="p-3.5 text-center w-28">Aksi Manajemen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredLogs.map((log: any) => {
              const kmPerLiter = log.km_per_liter || (log.liters > 0 ? (log.distance_km / log.liters).toFixed(1) : 0)
              const isLowEfficiency = Number(kmPerLiter) < 10 && Number(kmPerLiter) > 0
              const isEceran = log.fill_location === 'ECERAN'
              const isNeedsAudit = isLowEfficiency || isEceran || log.status === 'FLAGGED'

              return (
                <tr key={log.id} className="hover:bg-slate-50/80 transition relative">
                  <td className="p-3.5 font-mono text-slate-500">{log.date}</td>
                  <td className="p-3.5 font-bold text-slate-900">{log.plate_number}</td>
                  <td className="p-3.5 font-medium">{log.driver_name || '-'}</td>
                  <td className="p-3.5">
                    <div className="font-semibold text-slate-800">{log.fuel_type}</div>
                    {isEceran ? (
                      <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-md font-bold inline-block mt-0.5">
                        ⚠️ Eceran Darurat
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">SPBU Resmi</span>
                    )}
                  </td>
                  <td className="p-3.5">
                    <div className="font-mono text-slate-700">{log.initial_km} → {log.final_km} KM</div>
                    <div className="text-[10px] mt-0.5">
                      Rasio: <strong className={isLowEfficiency ? 'text-rose-600 font-bold' : 'text-emerald-700'}>{kmPerLiter} KM/L</strong>
                      {isLowEfficiency && <span className="ml-1 text-rose-600 font-bold">(Boros)</span>}
                    </div>
                  </td>
                  <td className="p-3.5 font-mono">{log.liters} L</td>
                  <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                    Rp {(Number(log.total_cost) || 0).toLocaleString('id-ID')}
                  </td>

                  {/* DROPDOWN STATUS AUDIT */}
                  <td className="p-3.5 text-center">
                    <select
                      value={log.status || 'PENDING'}
                      onChange={(e) => handleUpdateStatus(log.id, e.target.value)}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-xl outline-none cursor-pointer border transition-all ${
                        log.status === 'VERIFIED'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : log.status === 'FLAGGED'
                          ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                          : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      <option value="VERIFIED">✓ Diverifikasi</option>
                      <option value="FLAGGED">⚠️ Anomali / Boros</option>
                      <option value="PENDING">⏳ Menunggu</option>
                    </select>
                  </td>

                  {/* TOMBOL AKSI TERSTRUKTUR (DROPDOWN MENU) */}
                  <td className="p-3.5 text-center relative">
                    <button
                      onClick={() => setActiveMenuId(activeMenuId === log.id ? null : log.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 mx-auto border shadow-xs ${
                        isNeedsAudit
                          ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 ring-2 ring-amber-400/30'
                          : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      <Icons.Settings className="w-3.5 h-3.5 text-slate-600" />
                      <span>Kelola</span>
                      <span className="text-[9px] text-slate-400">▼</span>
                    </button>

                    {/* MENU POPOVER MELAYANG */}
                    {activeMenuId === log.id && (
                      <div
                        ref={menuRef}
                        className="absolute right-4 top-12 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 p-1.5 z-30 space-y-1 text-left animate-in fade-in zoom-in-95 duration-100"
                      >
                        <button
                          onClick={() => {
                            setPreviewReceipt(log)
                            setActiveMenuId(null)
                          }}
                          className="w-full px-3 py-2 text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-xl transition flex items-center gap-2"
                        >
                          <Icons.Eye className="w-4 h-4 text-indigo-600" />
                          <span>Lihat Struk BBM</span>
                        </button>

                        <button
                          onClick={() => handleOpenFraudModal(log)}
                          className={`w-full px-3 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
                            isNeedsAudit
                              ? 'bg-amber-50 text-amber-900 hover:bg-amber-100'
                              : 'text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <Icons.Wrench className="w-4 h-4 text-amber-600" />
                          <div className="flex flex-col text-left">
                            <span>Tinjau & Send WA</span>
                            {isNeedsAudit && (
                              <span className="text-[9px] text-rose-600 font-semibold">⚠️ Terdeteksi Anomali</span>
                            )}
                          </div>
                        </button>

                        <div className="border-t border-slate-100 my-1"></div>

                        <button
                          onClick={() => {
                            handleDeleteLog(log.id)
                            setActiveMenuId(null)
                          }}
                          className="w-full px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition flex items-center gap-2"
                        >
                          <Icons.Trash className="w-4 h-4 text-rose-600" />
                          <span>Hapus Transaksi</span>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}

            {filteredLogs.length === 0 && (
              <tr>
                <td colSpan={9} className="p-8 text-center text-slate-400 italic">
                  Tidak ada catatan transaksi BBM yang cocok dengan filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL AUDIT FRAUD & KONFIRMASI WA KE DRIVER */}
      {fraudAuditLog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  ⚠️
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Audit Keborosan & Send WA Driver</h3>
                  <p className="text-[11px] text-slate-500">Konfirmasi pengisian BBM ke Driver {fraudAuditLog.driver_name}</p>
                </div>
              </div>
              <button onClick={() => setFraudAuditLog(null)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Kendaraan / Plat:</span>
                <strong className="text-slate-900">{fraudAuditLog.plate_number}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Jarak Odometer:</span>
                <strong className="text-slate-900">{fraudAuditLog.initial_km} → {fraudAuditLog.final_km} KM ({fraudAuditLog.distance_km || 0} KM)</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Volume & Total Biaya:</span>
                <strong className="text-indigo-900">{fraudAuditLog.liters} Liter • Rp {(Number(fraudAuditLog.total_cost) || 0).toLocaleString('id-ID')}</strong>
              </div>
              <div className="flex justify-between border-t pt-1.5 mt-1 border-slate-200">
                <span className="text-slate-500">Indikasi Masalah:</span>
                <strong className="text-rose-600 font-bold">
                  {fraudAuditLog.fill_location === 'ECERAN' ? 'Pengisian Eceran Non-SPBU' : 'Rasio BBM Sangat Boros (<10 KM/L)'}
                </strong>
              </div>
            </div>

            <form onSubmit={handleSubmitFraudAudit} className="space-y-3 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tindakan Manajemen Admin</label>
                <select
                  className="w-full border border-slate-300 p-2.5 rounded-xl bg-slate-50 font-semibold text-slate-800 outline-none"
                  value={auditAction}
                  onChange={(e: any) => setAuditAction(e.target.value)}
                >
                  <option value="HOLD">⚠️ Tangguhkan & Minta Klarifikasi Driver</option>
                  <option value="REJECT">❌ Tandai Sebagai Transaksi Ditolak / Fraud</option>
                  <option value="CLEAR">✓ Verifikasi (Abaikan Peringatan Boros)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Teguran / Konfirmasi ke Driver</label>
                <textarea
                  rows={3}
                  className="w-full border border-slate-300 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 text-xs font-medium text-slate-800"
                  value={auditNote}
                  onChange={(e) => setAuditNote(e.target.value)}
                  placeholder="Tuliskan catatan konfirmasi..."
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setFraudAuditLog(null)}
                  className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
                >
                  📲 Simpan & Kirim WA Driver
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}