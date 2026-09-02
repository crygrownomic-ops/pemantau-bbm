'use client'

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
}: any) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm space-y-0">
      <div className="p-4 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
        <h2 className="text-xs font-extrabold text-slate-900 tracking-wider uppercase flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          Rincian Transaksi Pengisian BBM Armada
        </h2>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
            <span className="text-slate-500 font-medium text-[11px]">Dari:</span>
            <input
              type="date"
              className="bg-transparent font-medium text-slate-800 outline-none text-xs"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <span className="text-slate-500 font-medium text-[11px]">s/d</span>
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
                className="text-slate-400 hover:text-slate-700 font-bold ml-1"
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
            {safeVehicles.map((v: any) => (
              <option key={v.plate_number} value={v.plate_number}>
                {v.plate_number} - {v.model}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-900 text-white font-bold sticky top-0 z-10">
            <tr>
              <th className="p-3">Tanggal</th>
              <th className="p-3">Kendaraan</th>
              <th className="p-3">Pengemudi</th>
              <th className="p-3">Jenis BBM & Lokasi</th>
              <th className="p-3">Odometer</th>
              <th className="p-3">Volume</th>
              <th className="p-3 text-right">Total Biaya</th>
              <th className="p-3 text-center">Status Audit</th>
              <th className="p-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredLogs.map((log: any) => (
              <tr key={log.id} className="hover:bg-slate-50 transition">
                <td className="p-3 font-mono">{log.date}</td>
                <td className="p-3 font-bold text-slate-900">{log.plate_number}</td>
                <td className="p-3 font-medium">{log.driver_name || '-'}</td>
                <td className="p-3">
                  <div className="font-semibold">{log.fuel_type}</div>
                  {log.fill_location === 'ECERAN' ? (
                    <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-bold">
                      ⚠️ Eceran Darurat
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">SPBU Resmi</span>
                  )}
                </td>
                <td className="p-3 font-mono">{log.initial_km} → {log.final_km} KM</td>
                <td className="p-3 font-mono">{log.liters} L</td>
                <td className="p-3 text-right font-mono font-bold text-slate-900">
                  Rp {(Number(log.total_cost) || 0).toLocaleString('id-ID')}
                </td>
                <td className="p-3 text-center">
                  {log.status === 'VERIFIED' ? (
                    <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      ✓ Diverifikasi
                    </span>
                  ) : log.status === 'FLAGGED' ? (
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      ⚠️ Anomali
                    </span>
                  ) : (
                    <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Menunggu
                    </span>
                  )}
                </td>
                <td className="p-3 text-center space-x-2">
                  <button
                    onClick={() => setPreviewReceipt(log)}
                    className="text-indigo-600 hover:text-indigo-900 font-bold text-[11px] inline-flex items-center gap-1"
                  >
                    <Icons.Eye className="w-3.5 h-3.5" /> Struk
                  </button>
                  <button
                    onClick={() => handleDeleteLog(log.id)}
                    className="text-rose-600 hover:underline font-bold text-[11px]"
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
            {filteredLogs.length === 0 && (
              <tr>
                <td colSpan={9} className="p-6 text-center text-slate-400 italic">
                  Tidak ada catatan transaksi BBM yang cocok dengan filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}