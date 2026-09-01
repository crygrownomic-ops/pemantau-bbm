'use client'

import React from 'react'

interface FuelLog {
  id: number
  date: string
  plate_number: string
  vehicle_model: string
  driver_name: string
  fill_location: string
  emergency_note?: string
  fuel_type: string
  initial_km: number
  final_km: number
  distance_km: number
  liters: number
  km_per_liter: string | number
  receipt_image?: string
  status: string
  total_cost: number
}

interface Vehicle {
  plate_number: string
  model: string
}

interface FuelLogsTableProps {
  filteredLogs: FuelLog[]
  safeVehicles: Vehicle[]
  startDate: string
  setStartDate: (val: string) => void
  endDate: string
  setEndDate: (val: string) => void
  selectedVehicle: string
  setSelectedVehicle: (val: string) => void
  setPreviewReceipt: (log: FuelLog) => void
  handleUpdateStatus: (id: number, status: 'VERIFIED' | 'FLAGGED') => void
  handleDeleteLog: (id: number) => void
  handleDownloadReceipt: (receiptBase64: string, plateNumber: string, date: string, finalKm: number) => void
}

export default function FuelLogsTable({
  filteredLogs,
  safeVehicles,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  selectedVehicle,
  setSelectedVehicle,
  setPreviewReceipt,
  handleUpdateStatus,
  handleDeleteLog,
  handleDownloadReceipt,
}: FuelLogsTableProps) {
  const renderEfficiencyBadge = (kmPerLiterVal: any) => {
    const val = Number(kmPerLiterVal) || 0
    if (val < 8) {
      return (
        <span className="bg-rose-500/10 text-rose-600 border border-rose-300 font-bold px-2.5 py-1 rounded-full text-[10px] inline-flex items-center gap-1.5 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse"></span>
          {val} KM/L (Boros)
        </span>
      )
    } else if (val < 12) {
      return (
        <span className="bg-amber-500/10 text-amber-700 border border-amber-300 font-bold px-2.5 py-1 rounded-full text-[10px] inline-flex items-center gap-1.5 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          {val} KM/L (Normal)
        </span>
      )
    } else {
      return (
        <span className="bg-emerald-500/10 text-emerald-700 border border-emerald-300 font-bold px-2.5 py-1 rounded-full text-[10px] inline-flex items-center gap-1.5 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          {val} KM/L (Irit)
        </span>
      )
    }
  }

  const renderStatusBadge = (status?: string) => {
    if (status === 'VERIFIED') {
      return <span className="bg-emerald-500 text-white font-bold px-2.5 py-0.5 rounded-full text-[10px] shadow-sm">VERIFIED</span>
    } else if (status === 'FLAGGED') {
      return <span className="bg-rose-500 text-white font-bold px-2.5 py-0.5 rounded-full text-[10px] shadow-sm">ANOMALI</span>
    } else {
      return <span className="bg-amber-500 text-white font-bold px-2.5 py-0.5 rounded-full text-[10px] shadow-sm">PENDING</span>
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="p-4 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
        <h2 className="text-xs font-extrabold text-slate-900 tracking-wider uppercase flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          Rincian Transaksi Pengisian BBM
        </h2>
        
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
            <span className="text-slate-500 font-medium">Dari:</span>
            <input
              type="date"
              className="bg-transparent font-medium text-slate-800 outline-none"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <span className="text-slate-500 font-medium">s/d</span>
            <input
              type="date"
              className="bg-transparent font-medium text-slate-800 outline-none"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate('')
                  setEndDate('')
                }}
                className="text-slate-400 hover:text-slate-700 ml-1 font-bold"
              >
                ✕
              </button>
            )}
          </div>

          <select
            className="text-xs border border-slate-300 rounded-xl p-2 bg-white font-medium text-slate-700 outline-none"
            value={selectedVehicle}
            onChange={(e) => setSelectedVehicle(e.target.value)}
          >
            <option value="ALL">Semua Armada</option>
            {safeVehicles.map((v) => (
              <option key={v.plate_number} value={v.plate_number}>
                {v.plate_number} - {v.model}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto max-h-[210px] overflow-y-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-900 text-white font-bold border-b border-slate-800 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="p-3.5">Tanggal</th>
              <th className="p-3.5">Kendaraan</th>
              <th className="p-3.5">Pengemudi</th>
              <th className="p-3.5">Tempat Pengisian</th>
              <th className="p-3.5">Jenis BBM</th>
              <th className="p-3.5">KM Odometer</th>
              <th className="p-3.5">Volume</th>
              <th className="p-3.5">Efisiensi</th>
              <th className="p-3.5">Audit Struk</th>
              <th className="p-3.5">Status Admin</th>
              <th className="p-3.5 text-right">Total Biaya</th>
              <th className="p-3.5 text-center">Aksi Verifikasi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredLogs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50/80 transition">
                <td className="p-3.5 font-medium whitespace-nowrap">{log.date}</td>
                <td className="p-3.5 font-bold text-slate-900 whitespace-nowrap">{log.plate_number}</td>
                <td className="p-3.5 whitespace-nowrap font-medium text-slate-800">{log.driver_name}</td>
                
                <td className="p-3.5 whitespace-nowrap">
                  {log.fill_location === 'ECERAN' ? (
                    <span className="bg-amber-500/10 text-amber-900 border border-amber-300 font-extrabold px-2.5 py-0.5 rounded-full text-[10px] inline-flex items-center gap-1 shadow-xs">
                      ⚠️ DARURAT (ECERAN)
                    </span>
                  ) : (
                    <span className="bg-slate-100 text-slate-700 font-semibold px-2.5 py-0.5 rounded-full text-[10px]">
                      ⛽ SPBU RESMI
                    </span>
                  )}
                </td>

                <td className="p-3.5 whitespace-nowrap">
                  <span className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg font-medium text-[11px]">
                    {log.fuel_type}
                  </span>
                </td>
                <td className="p-3.5 font-mono whitespace-nowrap">
                  {(Number(log.initial_km) || 0).toLocaleString('id-ID')} → {(Number(log.final_km) || 0).toLocaleString('id-ID')} ({log.distance_km || 0} KM)
                </td>
                <td className="p-3.5 font-mono whitespace-nowrap">{log.liters || 0} L</td>
                <td className="p-3.5 font-mono whitespace-nowrap">
                  {renderEfficiencyBadge(log.km_per_liter)}
                </td>
                <td className="p-3.5 whitespace-nowrap">
                  {log.receipt_image ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setPreviewReceipt(log)}
                        className="text-[11px] text-blue-600 hover:text-blue-800 font-bold underline"
                      >
                        Lihat
                      </button>
                      <button
                        onClick={() => handleDownloadReceipt(log.receipt_image!, log.plate_number, log.date, log.final_km)}
                        className="text-[10px] text-slate-700 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded border border-slate-200 font-mono"
                        title="Unduh Struk"
                      >
                        📥
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setPreviewReceipt(log)}
                      className="text-slate-400 hover:text-slate-600 text-[11px] underline"
                    >
                      Detail
                    </button>
                  )}
                </td>
                <td className="p-3.5 whitespace-nowrap">
                  {renderStatusBadge(log.status)}
                </td>
                <td className="p-3.5 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                  Rp {(Number(log.total_cost) || 0).toLocaleString('id-ID')}
                </td>

                <td className="p-3.5 text-center whitespace-nowrap">
                  <select
                    className="text-[11px] font-bold border border-slate-300 rounded-lg px-2.5 py-1 bg-white text-slate-700 hover:bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer transition shadow-xs"
                    value=""
                    onChange={(e) => {
                      const val = e.target.value
                      if (val === 'VERIFIED') handleUpdateStatus(log.id, 'VERIFIED')
                      if (val === 'FLAGGED') handleUpdateStatus(log.id, 'FLAGGED')
                      if (val === 'DELETE') handleDeleteLog(log.id)
                    }}
                  >
                    <option value="" disabled>⚡ Pilih Aksi</option>
                    <option value="VERIFIED">✓ Setujui (Verified)</option>
                    <option value="FLAGGED">⚠ Tandai Anomali</option>
                    <option value="DELETE">🗑 Hapus Transaksi</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-3.5 border-t border-slate-100 bg-slate-50 flex justify-between items-center text-xs">
        <span className="text-slate-500 font-mono text-[11px]">
          Menampilkan total <strong className="text-slate-900">{filteredLogs.length}</strong> transaksi
        </span>
        <span className="text-[11px] text-slate-400 font-medium italic">
          💡 Gulung (scroll) ke bawah pada tabel untuk melihat data lainnya
        </span>
      </div>
    </div>
  )
}