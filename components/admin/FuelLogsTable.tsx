'use client'

import { useState } from 'react'
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

  const handleOpenFraudModal = (log: any) => {
    setFraudAuditLog(log)
    setAuditNote(log.audit_note || 'Rasio konsumsi BBM terdeteksi boros / tidak efisien. Mohon konfirmasi ulang odometer dan bukti pengisian.')
  }

  const handleSubmitFraudAudit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!fraudAuditLog) return

    const newStatus = auditAction === 'CLEAR' ? 'VERIFIED' : 'FLAGGED'
    handleUpdateStatus(fraudAuditLog.id, newStatus, auditNote)
    alert(`Status transaksi #${fraudAuditLog.id} diperbarui menjadi ${newStatus}. Catatan audit telah dikirim ke catatan driver.`)
    setFraudAuditLog(null)
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm space-y-0">
      {/* HEADER TABEL & FILTER */}
      <div className="p-4 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 bg-slate-50/50">
        <h2 className="text-xs font-extrabold text-slate-900 tracking-wider uppercase flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          Rincian Transaksi Pengisian BBM Armada
        </h2>

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
      <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
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
              <th className="p-3.5 text-center">Aksi Manajemen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredLogs.map((log: any) => {
              const kmPerLiter = log.km_per_liter || (log.liters > 0 ? (log.distance_km / log.liters).toFixed(1) : 0)
              const isLowEfficiency = Number(kmPerLiter) < 10 && Number(kmPerLiter) > 0
              const isEceran = log.fill_location === 'ECERAN'

              return (
                <tr key={log.id} className="hover:bg-slate-50/80 transition">
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

                  {/* DROPDOWN STATUS AUDIT DIRECT IN TABLE */}
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

                  {/* TOMBOL AKSI DENGAN STYLE RAPI */}
                  <td className="p-3.5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => setPreviewReceipt(log)}
                        className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[11px] font-bold transition flex items-center gap-1 border border-indigo-200/60"
                        title="Lihat Bukti Struk"
                      >
                        <Icons.Eye className="w-3.5 h-3.5" /> Struk
                      </button>

                      {(isLowEfficiency || isEceran || log.status === 'FLAGGED') && (
                        <button
                          onClick={() => handleOpenFraudModal(log)}
                          className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-[11px] font-bold transition flex items-center gap-1 border border-amber-300"
                          title="Tinjau Indikasi Keborosan / Fraud"
                        >
                          <Icons.Wrench className="w-3.5 h-3.5 text-amber-600" /> Tinjau
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteLog(log.id)}
                        className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-[11px] font-bold transition border border-rose-200/60"
                        title="Hapus Log Transaksi"
                      >
                        <Icons.Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
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

      {/* MODAL AUDIT FRAUD & KONFIRMASI KE DRIVER */}
      {fraudAuditLog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  ⚠️
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Audit Keborosan & Fraud Transaksi</h3>
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
                  className="w-1/2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl shadow-md transition"
                >
                  Kirim Audit & Perbarui Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}