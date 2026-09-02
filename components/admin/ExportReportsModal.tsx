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

  // FUNGSI EXPORT EXCEL (CSV DENGAN DELIMITER SEMICOLON JUGA SEP=; UNTUK EXCEL INDONESIA)
  const exportToCSV = () => {
    let csvContent = 'sep=;\n\uFEFF' // UTF-8 BOM & Explicit Separator for Excel

    if (reportType === 'fuel') {
      csvContent += 'No;Tanggal;Plat Nomor;Model Kendaraan;Pengemudi / Driver;KM Awal;KM Akhir;Jarak (KM);Volume (Liter);Harga/L (Rp);Total Biaya (Rp);Jenis BBM;Lokasi SPBU;Status Audit\n'
      let totalCost = 0
      let totalLiters = 0
      let totalKm = 0

      logs.forEach((l, idx) => {
        const cost = Number(l.total_cost) || 0
        const liters = Number(l.liters) || 0
        const km = Number(l.distance_km) || 0
        totalCost += cost
        totalLiters += liters
        totalKm += km

        csvContent += `${idx + 1};"${l.date || ''}";"${l.plate_number || ''}";"${l.vehicle_model || ''}";"${l.driver_name || ''}";${l.initial_km || 0};${l.final_km || 0};${km};${liters};${l.unit_price || 0};${cost};"${l.fuel_type || ''}";"${l.fill_location || ''}";"${l.status || ''}"\n`
      })

      csvContent += `;\n`
      csvContent += `TOTAL;;;;;;${totalKm};${totalLiters};;${totalCost};;;\n`
    } else if (reportType === 'service') {
      csvContent += 'No;Tanggal;Plat Nomor;Kategori Servis;Tipe Servis / Perbaikan;Komponen Diganti;Biaya (Rp);Bengkel / Vendor;Odometer Terkini (KM)\n'
      let totalServiceCost = 0

      serviceHistory.forEach((s, idx) => {
        const cost = Number(s.cost) || 0
        totalServiceCost += cost

        csvContent += `${idx + 1};"${s.date || ''}";"${s.plate_number || ''}";"${s.category || ''}";"${s.service_type || ''}";"${s.parts_replaced || ''}";${cost};"${s.workshop || ''}";${s.km_done || 0}\n`
      })

      csvContent += `;\n`
      csvContent += `TOTAL;;;;;${totalServiceCost};;\n`
    } else {
      csvContent += 'No;Plat Nomor;Model Kendaraan;Tahun;Odometer KM;Target KM Bulanan;Anggaran BBM Bulanan (Rp);Anggaran Servis Bulanan (Rp);Total Plafon (Rp);Exp KIR;Exp STNK\n'
      let totalFuelB = 0
      let totalServB = 0

      vehicles.forEach((v, idx) => {
        const fB = Number(v.monthly_budget) || 0
        const sB = Number(v.monthly_service_budget) || 500000
        totalFuelB += fB
        totalServB += sB

        csvContent += `${idx + 1};"${v.plate_number || ''}";"${v.model || ''}";${v.year || 2023};${v.last_km || 0};${v.target_km_monthly || 2000};${fB};${sB};${fB + sB};"${v.kir_expiry || ''}";"${v.stnk_expiry || ''}"\n`
      })

      csvContent += `;\n`
      csvContent += `TOTAL;;;;;;${totalFuelB};${totalServB};${totalFuelB + totalServB};;\n`
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `FleetOps360_Laporan_${reportType.toUpperCase()}_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // FUNGSI PRINT / GENERATE PDF PROFESIONAL LENGKAP
  const handlePrintPDF = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return alert('Mohon izinkan popup browser untuk mencetak PDF laporan!')

    const today = new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    let title = 'LAPORAN TRANSAKSI PENGISIAN BBM'
    let tableHeaderHtml = ''
    let tableRowsHtml = ''
    let summaryCardsHtml = ''

    if (reportType === 'fuel') {
      title = 'LAPORAN REKAPITULASI PENGISIAN BBM ARMADA'
      const totalCost = logs.reduce((acc, l) => acc + (Number(l.total_cost) || 0), 0)
      const totalLiters = logs.reduce((acc, l) => acc + (Number(l.liters) || 0), 0)
      const totalKm = logs.reduce((acc, l) => acc + (Number(l.distance_km) || 0), 0)

      summaryCardsHtml = `
        <div class="summary-grid">
          <div class="summary-card">
            <span>Total Pengeluaran BBM</span>
            <strong>Rp ${totalCost.toLocaleString('id-ID')}</strong>
          </div>
          <div class="summary-card">
            <span>Total Volume Bensin</span>
            <strong>${totalLiters.toLocaleString('id-ID')} Liter</strong>
          </div>
          <div class="summary-card">
            <span>Total Jarak Tempuh</span>
            <strong>${totalKm.toLocaleString('id-ID')} KM</strong>
          </div>
          <div class="summary-card">
            <span>Total Transaksi</span>
            <strong>${logs.length} Rekor</strong>
          </div>
        </div>
      `

      tableHeaderHtml = `
        <tr>
          <th style="width: 30px;">No</th>
          <th>Tanggal</th>
          <th>Plat Nomor</th>
          <th>Model</th>
          <th>Pengemudi</th>
          <th>Jarak</th>
          <th>Volume</th>
          <th>Tarif/L</th>
          <th style="text-align: right;">Total Biaya</th>
          <th>Status Audit</th>
        </tr>
      `

      tableRowsHtml = logs
        .map(
          (l, idx) => `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td>${l.date || '-'}</td>
          <td><strong>${l.plate_number}</strong></td>
          <td>${l.vehicle_model || '-'}</td>
          <td>${l.driver_name || '-'}</td>
          <td>${(l.distance_km || 0).toLocaleString('id-ID')} KM</td>
          <td>${l.liters || 0} L</td>
          <td>Rp ${(l.unit_price || 0).toLocaleString('id-ID')}</td>
          <td style="text-align: right; font-weight: bold; color: #b45309;">Rp ${(l.total_cost || 0).toLocaleString('id-ID')}</td>
          <td style="text-align: center;">${l.status === 'VERIFIED' ? '🟢 Terverifikasi' : '⏳ Pending'}</td>
        </tr>
      `
        )
        .join('')
    } else if (reportType === 'service') {
      title = 'LAPORAN REKAPITULASI SERVIS & PEMELIHARAAN BENGKEL'
      const totalServiceCost = serviceHistory.reduce((acc, s) => acc + (Number(s.cost) || 0), 0)

      summaryCardsHtml = `
        <div class="summary-grid">
          <div class="summary-card">
            <span>Total Biaya Perbaikan</span>
            <strong>Rp ${totalServiceCost.toLocaleString('id-ID')}</strong>
          </div>
          <div class="summary-card">
            <span>Total Riwayat Servis</span>
            <strong>${serviceHistory.length} Transaksi</strong>
          </div>
        </div>
      `

      tableHeaderHtml = `
        <tr>
          <th style="width: 30px;">No</th>
          <th>Tanggal</th>
          <th>Plat Nomor</th>
          <th>Kategori</th>
          <th>Tipe Servis</th>
          <th>Sparepart</th>
          <th>Bengkel Vendor</th>
          <th style="text-align: right;">Biaya</th>
        </tr>
      `

      tableRowsHtml = serviceHistory
        .map(
          (s, idx) => `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td>${s.date || '-'}</td>
          <td><strong>${s.plate_number}</strong></td>
          <td>${s.category || '-'}</td>
          <td>${s.service_type || '-'}</td>
          <td>${s.parts_replaced || '-'}</td>
          <td>${s.workshop || '-'}</td>
          <td style="text-align: right; font-weight: bold; color: #3730a3;">Rp ${(s.cost || 0).toLocaleString('id-ID')}</td>
        </tr>
      `
        )
        .join('')
    } else {
      title = 'LAPORAN MASTER DATA ARMADA & PLAFON ANGGARAN'
      const totalFuelB = vehicles.reduce((acc, v) => acc + (Number(v.monthly_budget) || 0), 0)
      const totalServB = vehicles.reduce((acc, v) => acc + (Number(v.monthly_service_budget) || 500000), 0)

      summaryCardsHtml = `
        <div class="summary-grid">
          <div class="summary-card">
            <span>Total Unit Armada</span>
            <strong>${vehicles.length} Unit</strong>
          </div>
          <div class="summary-card">
            <span>Plafon BBM Bulanan</span>
            <strong>Rp ${totalFuelB.toLocaleString('id-ID')}</strong>
          </div>
          <div class="summary-card">
            <span>Plafon Servis Bulanan</span>
            <strong>Rp ${totalServB.toLocaleString('id-ID')}</strong>
          </div>
          <div class="summary-card">
            <span>Total Anggaran Operasional</span>
            <strong>Rp ${(totalFuelB + totalServB).toLocaleString('id-ID')}</strong>
          </div>
        </div>
      `

      tableHeaderHtml = `
        <tr>
          <th style="width: 30px;">No</th>
          <th>Plat Nomor</th>
          <th>Model & Tahun</th>
          <th>Odometer KM</th>
          <th>Target KM</th>
          <th>Anggaran BBM</th>
          <th>Anggaran Servis</th>
          <th style="text-align: right;">Total Plafon</th>
          <th>Exp KIR</th>
          <th>Exp STNK</th>
        </tr>
      `

      tableRowsHtml = vehicles
        .map(
          (v, idx) => `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td><strong>${v.plate_number}</strong></td>
          <td>${v.model} (${v.year || 2023})</td>
          <td>${(v.last_km || 0).toLocaleString('id-ID')} KM</td>
          <td>${(v.target_km_monthly || 2000).toLocaleString('id-ID')} KM</td>
          <td>Rp ${(v.monthly_budget || 0).toLocaleString('id-ID')}</td>
          <td>Rp ${(v.monthly_service_budget || 0).toLocaleString('id-ID')}</td>
          <td style="text-align: right; font-weight: bold;">Rp ${((v.monthly_budget || 0) + (v.monthly_service_budget || 0)).toLocaleString('id-ID')}</td>
          <td>${v.kir_expiry || '-'}</td>
          <td>${v.stnk_expiry || '-'}</td>
        </tr>
      `
        )
        .join('')
    }

    const htmlDocument = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title} - FleetOps 360</title>
        <style>
          @page { size: A4 landscape; margin: 12mm; }
          body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1e293b; font-size: 11px; line-height: 1.4; margin: 0; padding: 15px; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #0f172a; padding-bottom: 12px; margin-bottom: 15px; }
          .brand { display: flex; align-items: center; gap: 10px; }
          .logo { width: 36px; height: 36px; background: #f59e0b; color: #0f172a; font-size: 20px; font-weight: 900; display: flex; align-items: center; justify-content: center; border-radius: 8px; }
          .brand-title { font-size: 16px; font-weight: 900; color: #0f172a; margin: 0; letter-spacing: 0.5px; }
          .brand-sub { font-size: 10px; color: #64748b; margin: 0; }
          .doc-info { text-align: right; font-size: 10px; color: #475569; }
          .doc-title { font-size: 14px; font-weight: 800; color: #0f172a; margin-top: 5px; text-transform: uppercase; }
          
          .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 15px; }
          .summary-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; }
          .summary-card span { font-size: 9px; color: #64748b; text-transform: uppercase; font-weight: 700; display: block; }
          .summary-card strong { font-size: 13px; color: #0f172a; font-family: monospace; display: block; margin-top: 2px; }

          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 10px; }
          th { background: #0f172a; color: #ffffff; text-align: left; padding: 8px 10px; font-weight: 700; text-transform: uppercase; font-size: 9px; }
          td { padding: 7px 10px; border-bottom: 1px solid #e2e8f0; color: #334155; }
          tr:nth-child(even) { background-color: #f8fafc; }

          .signatures { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 30px; text-align: center; }
          .sig-box { border-top: 1px solid #cbd5e1; padding-top: 8px; margin-top: 40px; }
          .sig-title { font-size: 10px; font-weight: 700; color: #475569; }
          .sig-name { font-size: 11px; font-weight: 800; color: #0f172a; margin-top: 35px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="brand">
            <div class="logo">⚡</div>
            <div>
              <h1 class="brand-title">FLEETOPS 360</h1>
              <p class="brand-sub">Enterprise Fleet & Logistics Management System</p>
            </div>
          </div>
          <div class="doc-info">
            <div>Tanggal Cetak: <strong>${today}</strong></div>
            <div class="doc-title">${title}</div>
          </div>
        </div>

        ${summaryCardsHtml}

        <table>
          <thead>
            ${tableHeaderHtml}
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>

        <div class="signatures">
          <div>
            <div class="sig-title">Dibuat Oleh (Admin Fleet)</div>
            <div class="sig-name">( ____________________ )</div>
          </div>
          <div>
            <div class="sig-title">Diverifikasi Oleh (Manager)</div>
            <div class="sig-name">( ____________________ )</div>
          </div>
          <div>
            <div class="sig-title">Disetujui Oleh (Direksi)</div>
            <div class="sig-name">( ____________________ )</div>
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          };
        </script>
      </body>
      </html>
    `

    printWindow.document.write(htmlDocument)
    printWindow.document.close()
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
            <p className="text-xs text-slate-500 mt-0.5">Unduh file Excel (.CSV terpisah kolom) atau Cetak PDF Laporan Siap Rapat</p>
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
          <span className="text-[11px] font-bold text-slate-700 block">Pilih Format Hasil Export:</span>
          <div className="flex gap-2">
            <button
              onClick={exportToCSV}
              className="w-1/2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs py-2.5 rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
            >
              📥 Export Excel (.CSV Terpisah Kolom)
            </button>
            <button
              onClick={handlePrintPDF}
              className="w-1/2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
            >
              🖨️ Cetak Laporan PDF Rapi
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