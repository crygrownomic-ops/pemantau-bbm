'use client'

import { useState } from 'react'
import { Icons } from './Icons'

// Helper Format Titik Ribuan Otomatis
const formatNumberDots = (val: number | string) => {
  if (!val && val !== 0) return ''
  const numStr = String(val).replace(/\D/g, '')
  return numStr.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

const parseDotsToNum = (val: string) => {
  return Number(String(val).replace(/\./g, '')) || 0
}

const MONTH_OPTIONS = [
  { value: 'ALL', label: 'Semua Bulan' },
  { value: '01', label: 'Januari' },
  { value: '02', label: 'Februari' },
  { value: '03', label: 'Maret' },
  { value: '04', label: 'April' },
  { value: '05', label: 'Mei' },
  { value: '06', label: 'Juni' },
  { value: '07', label: 'Juli' },
  { value: '08', label: 'Agustus' },
  { value: '09', label: 'September' },
  { value: '10', label: 'Oktober' },
  { value: '11', label: 'November' },
  { value: '12', label: 'Desember' },
]

export function MaintenanceTab({
  vehicleStats,
  serviceHistory,
  totalMaintenanceCost,
  onAddServiceRecord,
}: any) {
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedPlate, setSelectedPlate] = useState('')
  const [serviceCategory, setServiceCategory] = useState('Servis Rutin & Oli')
  const [serviceType, setServiceType] = useState('')
  const [partsReplaced, setPartsReplaced] = useState('')
  const [costFormatted, setCostFormatted] = useState('')
  const [workshop, setWorkshop] = useState('')
  const [kmDone, setKmDone] = useState('')
  const [serviceDate, setServiceDate] = useState(new Date().toISOString().split('T')[0])

  // STATE FILTER CUT-OFF DINAMIS (BULAN & TAHUN TERPISAH)
  const currentYear = new Date().getFullYear().toString()
  const [selectedMonth, setSelectedMonth] = useState('ALL')
  const [selectedYear, setSelectedYear] = useState(currentYear)

  const [filterVehicle, setFilterVehicle] = useState('ALL')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Opsi Tahun Dinamis (Otomatis menyesuaikan data & jangka panjang)
  const yearSet = new Set<string>()
  yearSet.add('2024')
  yearSet.add('2025')
  yearSet.add('2026')
  yearSet.add('2027')
  yearSet.add('2028')
  serviceHistory.forEach((s: any) => {
    if (s.date) {
      const yr = s.date.split('-')[0]
      if (yr) yearSet.add(yr)
    }
  })
  const YEAR_OPTIONS = ['ALL', ...Array.from(yearSet).sort()]

  // Open modal dengan prapilih kendaraan
  const handleOpenModal = (plateNumber?: string) => {
    const matchedVehicle = vehicleStats.find((v: any) => v.plate_number === plateNumber)
    setSelectedPlate(plateNumber || (vehicleStats[0]?.plate_number || ''))
    setKmDone(matchedVehicle ? String(matchedVehicle.last_km || 0) : '0')
    setServiceCategory('Servis Rutin & Oli')
    setServiceType('Ganti Oli Mesin & Filter')
    setPartsReplaced('')
    setCostFormatted('')
    setWorkshop('')
    setShowAddModal(true)
  }

  const handleSubmitService = (e: React.FormEvent) => {
    e.preventDefault()
    const numericCost = parseDotsToNum(costFormatted)
    const numericKm = Number(kmDone.replace(/\D/g, '')) || 0

    if (!selectedPlate) {
      alert('⚠️ Silakan pilih kendaraan!')
      return
    }

    const newRecord = {
      plate_number: selectedPlate,
      category: serviceCategory,
      service_type: serviceType,
      parts_replaced: partsReplaced || '-',
      cost: numericCost,
      workshop: workshop || 'Bengkel Rekanan',
      km_done: numericKm,
      date: serviceDate,
    }

    onAddServiceRecord(newRecord)
    alert(`✅ Catatan servis untuk kendaraan ${selectedPlate} berhasil disimpan!`)
    setShowAddModal(false)
  }

  // 1. FILTERING DATA BERDASARKAN CUT-OFF BULAN & TAHUN
  const monthlyServiceHistory = serviceHistory.filter((s: any) => {
    if (!s.date) return false
    const [sYear, sMonth] = s.date.split('-')
    const matchMonth = selectedMonth === 'ALL' || sMonth === selectedMonth
    const matchYear = selectedYear === 'ALL' || sYear === selectedYear
    return matchMonth && matchYear
  })

  // 2. FILTERING TABEL TAMBAHAN (RANGE TANGGAL & VEHICLE)
  const filteredServiceHistory = monthlyServiceHistory.filter((s: any) => {
    const matchVehicle = filterVehicle === 'ALL' || s.plate_number === filterVehicle
    const matchStart = !startDate || s.date >= startDate
    const matchEnd = !endDate || s.date <= endDate
    return matchVehicle && matchStart && matchEnd
  })

  // 3. KALKULASI RINGKASAN DINAMIS PER PERIODE
  const currentTotalMaintenanceCost = monthlyServiceHistory.reduce(
    (acc: number, s: any) => acc + (Number(s.cost) || 0),
    0
  )
  const totalVehicles = vehicleStats.length
  const avgCostPerVehicle = totalVehicles > 0 ? Math.round(currentTotalMaintenanceCost / totalVehicles) : 0

  // EXPORT DATA PER PERIODE KE EXCEL
  const handleExportMaintenanceToExcel = () => {
    if (!filteredServiceHistory || filteredServiceHistory.length === 0) {
      alert('⚠️ Tidak ada data riwayat maintenance untuk diexport!')
      return
    }

    const monthLabel = MONTH_OPTIONS.find((m) => m.value === selectedMonth)?.label || selectedMonth
    let csvContent = '\uFEFF'
    csvContent += 'LAPORAN EVALUASI SERVIS & MAINTENANCE ARMADA — FLEETOPS 360\n'
    csvContent += `Cut-Off Periode;${monthLabel} ${selectedYear === 'ALL' ? 'Semua Tahun' : selectedYear}\n`
    csvContent += `Tanggal Cetak;${new Date().toLocaleDateString('id-ID')}\n\n`
    csvContent += 'Tanggal;Plat Nomor;Kategori;Jenis Pengerjaan;Sparepart Diganti;Odometer KM;Bengkel / Workshop;Biaya Perbaikan (Rp)\n'

    filteredServiceHistory.forEach((s: any) => {
      csvContent += `"${s.date}";"${s.plate_number}";"${s.category || 'Servis Rutin'}";"${s.service_type}";"${s.parts_replaced || '-'}";"${(Number(s.km_done) || 0).toLocaleString('id-ID')} KM";"${s.workshop || '-'}";"${(Number(s.cost) || 0).toLocaleString('id-ID')}"\n`
    })

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const fileName = `Laporan_Maintenance_${selectedMonth}_${selectedYear}_${new Date().toISOString().split('T')[0]}.csv`

    link.setAttribute('href', url)
    link.setAttribute('download', fileName)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      {/* TOOLBAR CUT-OFF BULAN & TAHUN DINAMIS (JANGKA PANJANG) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h2 className="text-xs font-extrabold text-slate-900 tracking-wider uppercase flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            Cut-Off Analisa Evaluasi Maintenance Bulanan & Tahunan
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Pilih kombinasi Bulan dan Tahun secara bebas untuk analisa jangka panjang
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* DROPDOWN BULAN */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-bold text-slate-700">Bulan:</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="text-xs font-bold bg-slate-900 text-amber-400 border border-slate-800 rounded-xl px-3 py-2 outline-none shadow-sm cursor-pointer"
            >
              {MONTH_OPTIONS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* DROPDOWN TAHUN */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-bold text-slate-700">Tahun:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="text-xs font-bold bg-slate-900 text-amber-400 border border-slate-800 rounded-xl px-3 py-2 outline-none shadow-sm cursor-pointer"
            >
              {YEAR_OPTIONS.map((y) => (
                <option key={y} value={y}>
                  {y === 'ALL' ? 'Semua Tahun' : y}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 1. CARDS REKAPITULASI BIAYA & STATUS MAINTENANCE DINAMIS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-slate-500 text-[11px] font-semibold block uppercase tracking-wider">
              Total Biaya Maintenance (
              {selectedMonth === 'ALL'
                ? 'Semua Bulan'
                : MONTH_OPTIONS.find((m) => m.value === selectedMonth)?.label}{' '}
              {selectedYear === 'ALL' ? '' : selectedYear})
            </span>
            <strong className="text-xl font-extrabold font-mono text-slate-900 mt-1 block">
              Rp {(currentTotalMaintenanceCost || 0).toLocaleString('id-ID')}
            </strong>
          </div>
          <div className="w-10 h-10 bg-amber-100 text-amber-800 rounded-xl flex items-center justify-center font-bold">
            <Icons.Wrench className="w-5 h-5 text-amber-700" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-slate-500 text-[11px] font-semibold block uppercase tracking-wider">
              Rata-rata Biaya Per Armada
            </span>
            <strong className="text-xl font-extrabold font-mono text-indigo-900 mt-1 block">
              Rp {avgCostPerVehicle.toLocaleString('id-ID')}
            </strong>
          </div>
          <div className="w-10 h-10 bg-indigo-100 text-indigo-800 rounded-xl flex items-center justify-center font-bold">
            <Icons.Truck className="w-5 h-5 text-indigo-700" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-slate-500 text-[11px] font-semibold block uppercase tracking-wider">
              Pengerjaan Periode Ini
            </span>
            <strong className="text-xl font-extrabold font-mono text-slate-900 mt-1 block">
              {monthlyServiceHistory.length} Kali Perbaikan
            </strong>
          </div>
          <div className="w-10 h-10 bg-emerald-100 text-emerald-800 rounded-xl flex items-center justify-center font-bold">
            <Icons.Dashboard className="w-5 h-5 text-emerald-700" />
          </div>
        </div>
      </div>

      {/* 2. CARD ARMADA, SMART REMINDER & TOTAL OPERATIONAL COST */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b pb-3">
          <div>
            <h2 className="text-xs font-extrabold text-slate-900 tracking-wider uppercase flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              Status Kesehatan Armada & Rekap Total Biaya (BBM + Servis)
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Monitoring interval ganti oli berbasis Odometer KM serta perbandingan biaya operasional gabungan
            </p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-md transition flex items-center gap-1.5"
          >
            <Icons.Plus className="w-4 h-4" /> Catat Perbaikan Baru
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicleStats.map((v: any) => {
            const vServices = monthlyServiceHistory.filter((s: any) => s.plate_number === v.plate_number)
            const lastService = vServices[0]
            const lastServiceKm = lastService ? Number(lastService.km_done) || 0 : 0
            const nextOilChangeKm = lastServiceKm > 0 ? lastServiceKm + 5000 : (v.last_km || 0) + 5000

            const kmSinceLastService = (v.last_km || 0) - lastServiceKm
            const isDueForOil = kmSinceLastService >= 5000 || lastServiceKm === 0

            const monthServiceCost = vServices.reduce((acc: number, s: any) => acc + (Number(s.cost) || 0), 0)
            const totalOperationalCombined = (v.spentCost || 0) + monthServiceCost

            return (
              <div
                key={v.id || v.plate_number}
                className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900">{v.plate_number}</h3>
                      <p className="text-[11px] text-slate-500">{v.model}</p>
                    </div>
                    {isDueForOil ? (
                      <span className="text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-bold">
                        ⚠️ Waktunya Ganti Oli
                      </span>
                    ) : (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                        ✓ Kondisi Prima
                      </span>
                    )}
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200/60 space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Odometer Terkini:</span>
                      <strong className="text-slate-900">{(v.last_km || 0).toLocaleString('id-ID')} KM</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Target Oli Berikutnya:</span>
                      <strong className={isDueForOil ? 'text-rose-600 font-bold' : 'text-indigo-900'}>
                        {nextOilChangeKm.toLocaleString('id-ID')} KM
                      </strong>
                    </div>
                    <div className="flex justify-between border-t pt-1 border-slate-100">
                      <span className="text-slate-500">Biaya Servis Periode Ini:</span>
                      <strong className="text-amber-700">Rp {monthServiceCost.toLocaleString('id-ID')}</strong>
                    </div>
                    <div className="flex justify-between font-sans pt-0.5">
                      <span className="text-slate-500 text-[10px]">Total Operasional (BBM+Servis):</span>
                      <strong className="text-slate-900 font-mono text-xs">
                        Rp {totalOperationalCombined.toLocaleString('id-ID')}
                      </strong>
                    </div>
                  </div>

                  <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                    <span>Exp KIR: <strong className="text-slate-800 font-mono">{v.kir_expiry || '-'}</strong></span>
                    <span>Exp STNK: <strong className="text-slate-800 font-mono">{v.stnk_expiry || '-'}</strong></span>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenModal(v.plate_number)}
                  className="w-full bg-white hover:bg-slate-100 text-slate-900 font-bold py-2 rounded-xl border border-slate-300 text-xs shadow-xs transition"
                >
                  + Input Servis Kendaraan Ini
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* 3. TABEL RIWAYAT PERBAIKAN DENGAN SCROLL & EXPORT */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm space-y-0">
        <div className="p-4 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <h2 className="text-xs font-extrabold text-slate-900 tracking-wider uppercase flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
              Riwayat Maintenance, Sparepart & Perbaikan Armada
            </h2>

            <button
              onClick={handleExportMaintenanceToExcel}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-sm transition flex items-center gap-1.5"
              title="Export Laporan Maintenance ke Excel (.csv)"
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
              className="text-xs border border-slate-300 rounded-xl p-2 bg-white font-semibold text-slate-700 outline-none shadow-sm focus:ring-2 focus:ring-indigo-600"
              value={filterVehicle}
              onChange={(e) => setFilterVehicle(e.target.value)}
            >
              <option value="ALL">Semua Armada / KB</option>
              {vehicleStats.map((v: any) => (
                <option key={v.plate_number} value={v.plate_number}>
                  {v.plate_number} - {v.model}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* CONTAINER TABEL SCROLLING MAX 3 BARIS VISIBEL */}
        <div className="overflow-x-auto max-h-[220px] overflow-y-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-900 text-white font-bold sticky top-0 z-10">
              <tr>
                <th className="p-3.5">Tanggal</th>
                <th className="p-3.5">Kendaraan</th>
                <th className="p-3.5">Kategori & Jenis Pengerjaan</th>
                <th className="p-3.5">Sparepart Diganti</th>
                <th className="p-3.5">Odometer KM</th>
                <th className="p-3.5">Bengkel / Workshop</th>
                <th className="p-3.5 text-right">Biaya Perbaikan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredServiceHistory.map((s: any) => (
                <tr key={s.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-3.5 font-mono text-slate-500">{s.date}</td>
                  <td className="p-3.5 font-bold text-slate-900">{s.plate_number}</td>
                  <td className="p-3.5">
                    <div className="font-bold text-slate-800">{s.service_type}</div>
                    <span className="text-[10px] text-slate-400">{s.category || 'Maintenance Rutin'}</span>
                  </td>
                  <td className="p-3.5 font-medium text-slate-700">{s.parts_replaced || '-'}</td>
                  <td className="p-3.5 font-mono font-semibold text-indigo-900">
                    {(Number(s.km_done) || 0).toLocaleString('id-ID')} KM
                  </td>
                  <td className="p-3.5 text-slate-600">{s.workshop || 'Bengkel Rekanan'}</td>
                  <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                    Rp {(Number(s.cost) || 0).toLocaleString('id-ID')}
                  </td>
                </tr>
              ))}

              {filteredServiceHistory.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                    Tidak ada riwayat perbaikan yang cocok dengan pencarian filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL INPUT SERVIS BARU */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-bold text-slate-900">Catat Servis & Sparepart Baru</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitService} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Pilih Armada Kendaraan *</label>
                <select
                  className="w-full border border-slate-300 p-2.5 rounded-xl bg-slate-50 font-bold text-slate-900 outline-none"
                  value={selectedPlate}
                  onChange={(e) => {
                    setSelectedPlate(e.target.value)
                    const matched = vehicleStats.find((v: any) => v.plate_number === e.target.value)
                    if (matched) setKmDone(String(matched.last_km || 0))
                  }}
                  required
                >
                  {vehicleStats.map((v: any) => (
                    <option key={v.plate_number} value={v.plate_number}>
                      {v.plate_number} — {v.model}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Kategori Pengerjaan</label>
                  <select
                    className="w-full border border-slate-300 p-2.5 rounded-xl bg-slate-50 font-medium outline-none"
                    value={serviceCategory}
                    onChange={(e) => setServiceCategory(e.target.value)}
                  >
                    <option value="Servis Rutin & Oli">Servis Rutin & Oli</option>
                    <option value="Ganti Sparepart / Ban">Ganti Sparepart / Ban</option>
                    <option value="Perbaikan Mesin & AC">Perbaikan Mesin & AC</option>
                    <option value="Perpanjangan KIR / STNK">Perpanjangan KIR / STNK</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Tanggal Perbaikan</label>
                  <input
                    type="date"
                    className="w-full border border-slate-300 p-2 rounded-xl outline-none"
                    value={serviceDate}
                    onChange={(e) => setServiceDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Jenis Pengerjaan / Servis *</label>
                <input
                  type="text"
                  placeholder="Misal: Ganti Oli Mesin Shell 4L & Filter Oli"
                  className="w-full border border-slate-300 p-2.5 rounded-xl outline-none font-medium"
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">KM Odometer Servis *</label>
                  <input
                    type="text"
                    placeholder="45860"
                    className="w-full border border-slate-300 p-2.5 rounded-xl font-mono text-slate-900 font-bold outline-none"
                    value={kmDone}
                    onChange={(e) => setKmDone(e.target.value.replace(/\D/g, ''))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Total Biaya (Rp) *</label>
                  <input
                    type="text"
                    placeholder="450.000"
                    className="w-full border border-slate-300 p-2.5 rounded-xl font-mono font-bold text-indigo-900 outline-none"
                    value={costFormatted}
                    onChange={(e) => setCostFormatted(formatNumberDots(e.target.value))}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Detail Sparepart Diganti</label>
                <input
                  type="text"
                  placeholder="Misal: Kampas Rem Depan, Oli Shell Helix 10W-40"
                  className="w-full border border-slate-300 p-2.5 rounded-xl outline-none"
                  value={partsReplaced}
                  onChange={(e) => setPartsReplaced(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Nama Bengkel / Workshop</label>
                <input
                  type="text"
                  placeholder="Misal: Auto2000 / Bengkel Jaya Mandiri"
                  className="w-full border border-slate-300 p-2.5 rounded-xl outline-none"
                  value={workshop}
                  onChange={(e) => setWorkshop(e.target.value)}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-1/2 bg-slate-100 text-slate-700 font-bold py-2.5 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-slate-900 text-white font-bold py-2.5 rounded-xl shadow-md"
                >
                  Simpan Catatan Servis
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}