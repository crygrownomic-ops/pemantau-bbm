'use client'

import { useState } from 'react'

export function ExportReportsModal({
  isOpen,
  onClose,
  logs = [],
  serviceHistory = [],
  vehicles = [],
}: {
  isOpen: boolean
  onClose: () => void
  logs: any[]
  serviceHistory: any[]
  vehicles: any[]
}) {
  const [reportType, setReportType] = useState<'fuel' | 'service' | 'summary'>('fuel')

  if (!isOpen) return null

  // Fungsi Export CSV Ber-BOM agar Excel otomatis rapi
  const exportToCSV = () => {
    let csvContent = '\uFEFF' // UTF-8 BOM

    if (reportType === 'fuel') {
      csvContent += 'Tanggal,Plat Nomor,Model Kendaraan,Driver,KM Awal,KM Akhir,Jarak (KM),Volume (L),Harga/L (Rp),Total Biaya (Rp),Jenis BBM,Lokasi,Status\n'
      logs.forEach((l) => {
        csvContent += `"${l.date || ''}","${l.plate_number || ''}","${l.vehicle_model || ''}","${l.driver_name || ''}",${l.initial_km || 0},${l.final_km || 0},${l.distance_km || 0},${l.liters || 0},${l.unit_price || 0},${l.total_cost || 0},"${l.fuel_type || ''}","${l.fill_location || ''}","${l.status || ''}"\n`
      })
    } else if (reportType === 'service') {
      csvContent += 'Tanggal,Plat Nomor,Kategori,Tipe Servis,Komponen Diganti,Biaya (Rp),Bengkel / Vendor,Odometer KM\n'
      serviceHistory.forEach((s) => {
        csvContent += `"${s.date || ''}","${s.plate_number || ''}","${s.category || ''}","${s.service_type || ''}","${s.parts_replaced || ''}",${s.cost || 0},"${s.workshop || ''}",${s.km_done || 0}\n`
      })
    } else {
      csvContent += 'Plat Nomor,Model,Tahun,Odometer Terkini (KM),Target KM Bulanan,Anggaran BBM Bulanan (Rp),Anggaran Servis Bulanan (Rp),Exp KIR,Exp STNK\n'
      vehicles.forEach((v) => {
        csvContent += `"${v.plate_number || ''}","${v.model || ''}",${v.year || 2023},${v.last_km || 0},${v.target_km_monthly || 2000},${v.monthly_budget || 0},${v.monthly_service_budget || 500000},"${v.kir_expiry || ''}","${v.stnk_expiry || ''}"\n`
      })
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `FleetOps360_Laporan_${reportType}_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handlePrintPDF = () => {
    window.print()
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100 font-sans">
        <div className="flex justify-between items-center border-b pb-3 border-slate-100">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <span className="p-1.5 bg-indigo-100 text-indigo-800 rounded-xl">📊</span>
              Export Laporan Operasional & Eksekutif
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Unduh file Excel (.CSV) atau Cetak PDF Laporan Siap Rapat</p>
          </div>
          <button onClick={onClose} className="text-slate-400 font-bold hover:text-slate-600">
            ✕
          </button>
        </div>

        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-700">Pilih Jenis Laporan:</label>
          <div className="grid grid-cols-3 gap-2 text-xs font-bold">
            <button
              onClick={() => setReportType('fuel')}
              className={`p-3 rounded-xl border text-left transition ${
                reportType === 'fuel' ? 'bg-slate-900 text-amber-400 border-slate-900 shadow-md' : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              ⛽ Transaksi BBM
              <span className="block text-[10px] font-normal text-slate-400 mt-1">{logs.length} Data Transaksi</span>
            </button>

            <button
              onClick={() => setReportType('service')}
              className={`p-3 rounded-xl border text-left transition ${
                reportType === 'service' ? 'bg-slate-900 text-amber-400 border-slate-900 shadow-md' : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              🛠️ Servis & KIR
              <span className="block text-[10px] font-normal text-slate-400 mt-1">{serviceHistory.length} Data Bengkel</span>
            </button>

            <button
              onClick={() => setReportType('summary')}
              className={`p-3 rounded-xl border text-left transition ${
                reportType === 'summary' ? 'bg-slate-900 text-amber-400 border-slate-900 shadow-md' : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              🚚 Master Armada
              <span className="block text-[10px] font-normal text-slate-400 mt-1">{vehicles.length} Unit Armada</span>
            </button>
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
          <span className="text-[11px] font-bold text-slate-700 block">Opsi Output:</span>
          <div className="flex gap-2">
            <button
              onClick={exportToCSV}
              className="w-1/2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs py-2.5 rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
            >
              📥 Download Excel (.CSV)
            </button>
            <button
              onClick={handlePrintPDF}
              className="w-1/2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
            >
              🖨️ Cetak / PDF Laporan
            </button>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button onClick={onClose} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2 rounded-xl">
            Selesai
          </button>
        </div>
      </div>
    </div>
  )
}

export default ExportReportsModal