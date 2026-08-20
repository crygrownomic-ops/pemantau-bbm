'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const DEFAULT_PRICES: Record<string, number> = {
  'Pertalite': 10000,
  'Pertamax': 12950,
  'Pertamax Green 95': 13600,
  'Pertamax Turbo': 14400,
  'Biosolar / Solar': 6800,
  'Dexlite': 14550,
  'Pertamina Dex': 15100,
}

const DEFAULT_VEHICLES = [
  { id: '1', plate_number: 'B 1234 ABC', model: 'Toyota Avanza', last_km: 45000 },
  { id: '2', plate_number: 'B 5678 XYZ', model: 'Daihatsu Gran Max', last_km: 32000 },
  { id: '3', plate_number: 'B 9012 DEF', model: 'Isuzu Traga', last_km: 18500 },
]

export default function Home() {
  const [logs, setLogs] = useState<any[]>([])
  const [fuelPrices, setFuelPrices] = useState<Record<string, number>>(DEFAULT_PRICES)
  const [vehicles, setVehicles] = useState(DEFAULT_VEHICLES)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 3

  const [receiptBase64, setReceiptBase64] = useState<string>('')
  const [isCompressing, setIsCompressing] = useState(false)

  const todayStr = new Date().toISOString().split('T')[0]

  const [formData, setFormData] = useState({
    vehicle_id: '',
    driver_name: '',
    fill_date: todayStr,
    initial_km: 0,
    final_km: '',
    liters: '',
    fuel_type: 'Pertalite',
  })

  useEffect(() => {
    const storedPrices = localStorage.getItem('fuel_prices')
    const storedVehicles = localStorage.getItem('vehicle_budgets')
    const storedLogs = localStorage.getItem('fuel_logs')

    if (storedPrices) setFuelPrices(JSON.parse(storedPrices))
    if (storedVehicles) setVehicles(JSON.parse(storedVehicles))
    if (storedLogs) setLogs(JSON.parse(storedLogs))
  }, [])

  const handleVehicleSelect = (vehicleId: string) => {
    const selected = vehicles.find((v) => v.id === vehicleId)
    setFormData((prev) => ({
      ...prev,
      vehicle_id: vehicleId,
      initial_km: selected ? (selected.last_km || 0) : 0,
    }))
  }

  const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsCompressing(true)
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX_WIDTH = 800
        const scale = MAX_WIDTH / img.width
        const width = img.width > MAX_WIDTH ? MAX_WIDTH : img.width
        const height = img.width > MAX_WIDTH ? img.height * scale : img.height

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)

        const compressedData = canvas.toDataURL('image/jpeg', 0.7)
        setReceiptBase64(compressedData)
        setIsCompressing(false)
      }
    }
  }

  const unitPrice = fuelPrices[formData.fuel_type] || 0
  const numericLiters = parseFloat(formData.liters) || 0
  const calculatedTotalCost = numericLiters * unitPrice

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.driver_name.trim()) {
      alert('Nama pengemudi wajib diisi!')
      return
    }

    const finalKmNum = Number(formData.final_km)
    const distance = finalKmNum - formData.initial_km

    if (distance <= 0) {
      alert(`KM Akhir harus lebih besar dari KM Awal (${formData.initial_km.toLocaleString('id-ID')} KM)!`)
      return
    }

    const kmPerLiter = (distance / numericLiters).toFixed(2)
    const selectedVehicle = vehicles.find((v) => v.id === formData.vehicle_id)

    const newLog = {
      id: Date.now(),
      plate_number: selectedVehicle?.plate_number,
      vehicle_model: selectedVehicle?.model,
      driver_name: formData.driver_name,
      initial_km: formData.initial_km,
      final_km: finalKmNum,
      distance_km: distance,
      liters: numericLiters,
      unit_price: unitPrice,
      km_per_liter: kmPerLiter,
      total_cost: calculatedTotalCost,
      fuel_type: formData.fuel_type,
      receipt_image: receiptBase64,
      date: formData.fill_date,
    }

    const updatedLogs = [newLog, ...logs]
    setLogs(updatedLogs)
    localStorage.setItem('fuel_logs', JSON.stringify(updatedLogs))

    const updatedVehicles = vehicles.map((v) =>
      v.id === formData.vehicle_id ? { ...v, last_km: finalKmNum } : v
    )
    setVehicles(updatedVehicles)
    localStorage.setItem('vehicle_budgets', JSON.stringify(updatedVehicles))

    setCurrentPage(1)
    alert('Laporan pengisian BBM & foto struk berhasil dikirim!')

    setFormData({
      vehicle_id: '',
      driver_name: '',
      fill_date: todayStr,
      initial_km: 0,
      final_km: '',
      liters: '',
      fuel_type: 'Pertalite',
    })
    setReceiptBase64('')
  }

  const totalPages = Math.ceil(logs.length / itemsPerPage)
  const paginatedLogs = logs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans text-slate-800">
      <main className="max-w-xl w-full mx-auto p-4 space-y-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          
          <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
            <div>
              <h1 className="text-base font-bold text-slate-900">Form Laporan BBM</h1>
              <p className="text-xs text-slate-500">Input transaksi operasional pengisian BBM</p>
            </div>
            <Link
              href="/admin"
              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-3 py-1.5 rounded-lg border border-slate-200 transition"
            >
              Akses Admin →
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pilih Kendaraan</label>
                <select
                  required
                  className="w-full p-2.5 border rounded-lg text-xs bg-white border-slate-300 focus:ring-2 focus:ring-slate-900 outline-none font-medium"
                  value={formData.vehicle_id}
                  onChange={(e) => handleVehicleSelect(e.target.value)}
                >
                  <option value="">-- Pilih Armada --</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.plate_number} ({v.model})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Pengisian</label>
                <input
                  type="date"
                  required
                  className="w-full p-2.5 border rounded-lg text-xs border-slate-300 focus:ring-2 focus:ring-slate-900 outline-none font-medium bg-white"
                  value={formData.fill_date}
                  onChange={(e) => setFormData({ ...formData, fill_date: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Pengemudi <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Udin"
                className="w-full p-2.5 border rounded-lg text-xs border-slate-300 focus:ring-2 focus:ring-slate-900 outline-none font-medium"
                value={formData.driver_name}
                onChange={(e) => setFormData({ ...formData, driver_name: e.target.value })}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-slate-700">Jenis Bahan Bakar</label>
                <span className="text-[11px] font-mono text-slate-500">
                  Rp {unitPrice.toLocaleString('id-ID')} / Liter
                </span>
              </div>
              <select
                className="w-full p-2.5 border rounded-lg text-xs bg-white border-slate-300 focus:ring-2 focus:ring-slate-900 outline-none font-medium"
                value={formData.fuel_type}
                onChange={(e) => setFormData({ ...formData, fuel_type: e.target.value })}
              >
                {Object.keys(fuelPrices).map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold text-slate-700">KM Awal Odometer</label>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">Otomatis</span>
                </div>
                <input
                  type="text"
                  readOnly
                  disabled
                  className="w-full p-2.5 border rounded-lg text-xs bg-slate-100 border-slate-200 text-slate-700 font-mono font-bold cursor-not-allowed"
                  value={`${formData.initial_km.toLocaleString('id-ID')} KM`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">KM Akhir Odometer</label>
                <input
                  type="number"
                  required
                  placeholder="45420"
                  className="w-full p-2.5 border rounded-lg text-xs border-slate-300 focus:ring-2 focus:ring-slate-900 outline-none font-mono font-bold"
                  value={formData.final_km}
                  onChange={(e) => setFormData({ ...formData, final_km: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Volume (Liter)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="30"
                  className="w-full p-2.5 border rounded-lg text-xs border-slate-300 focus:ring-2 focus:ring-slate-900 outline-none font-mono"
                  value={formData.liters}
                  onChange={(e) => setFormData({ ...formData, liters: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Total Biaya (Terhitung)</label>
                <div className="p-2.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 flex justify-between items-center">
                  <span>Rp</span>
                  <span>{calculatedTotalCost.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Foto Bukti Struk Pembelian</label>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageCapture}
                className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
              />
              {isCompressing && (
                <p className="text-[11px] text-blue-600 font-medium mt-1">Mengompres ukuran foto...</p>
              )}
              {receiptBase64 && (
                <div className="mt-2 relative w-24 h-24 border rounded-lg overflow-hidden bg-slate-100">
                  <img src={receiptBase64} alt="Struk Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setReceiptBase64('')}
                    className="absolute top-1 right-1 bg-rose-600 text-white rounded-full w-4 h-4 text-[10px] flex items-center justify-center"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 rounded-lg text-xs transition shadow-sm mt-2"
            >
              Kirim Laporan Pengisian
            </button>
          </form>
        </div>

        {logs.length > 0 && (
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-slate-900 text-xs tracking-wider uppercase">SESI LAPORAN SAAT INI</h2>
              <span className="text-[11px] text-slate-400 font-mono">
                Total: {logs.length} Laporan
              </span>
            </div>

            <div className="space-y-2">
              {paginatedLogs.map((log) => (
                <div key={log.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>{log.plate_number} ({log.driver_name})</span>
                    <span className="font-mono">Rp {log.total_cost.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>{log.date} • {log.fuel_type} • {log.liters} L</span>
                    <span>Efisiensi: <strong className="text-slate-800 font-mono">{log.km_per_liter} KM/L</strong></span>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-xs">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => prev - 1)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded font-medium transition"
                >
                  ← Sebelumnya
                </button>
                <span className="font-mono text-[11px] text-slate-500">
                  Halaman {currentPage} dari {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded font-medium transition"
                >
                  Berikutnya →
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer Credit */}
      <footer className="py-4 text-center border-t border-slate-200 bg-white text-[11px] text-slate-500 font-medium mt-8">
        Developed by <span className="font-bold text-slate-800">Urai Ikhsan Fadhilah</span>
      </footer>
    </div>
  )
}