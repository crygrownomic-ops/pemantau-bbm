'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const DEFAULT_VEHICLES = [
  { id: '1', plate_number: 'B 1234 ABC', model: 'Toyota Avanza', last_km: 45320, is_active: true },
  { id: '2', plate_number: 'B 5678 XYZ', model: 'Daihatsu Gran Max', last_km: 32000, is_active: true },
  { id: '3', plate_number: 'B 9012 DEF', model: 'Isuzu Traga', last_km: 18500, is_active: true },
]

const DEFAULT_DRIVERS = [
  { id: '1', name: 'Budi Santoso', is_active: true },
  { id: '2', name: 'Ahmad Supardi', is_active: true },
  { id: '3', name: 'Dede Kurniawan', is_active: true },
]

const DEFAULT_PRICES: Record<string, number> = {
  'Pertalite': 10000,
  'Pertamax': 12950,
  'Pertamax Green 95': 13600,
  'Pertamax Turbo': 14400,
  'Biosolar / Solar': 6800,
  'Dexlite': 14550,
  'Pertamina Dex': 15100,
}

export default function DriverFormPage() {
  const [vehicles, setVehicles] = useState<any[]>(DEFAULT_VEHICLES)
  const [drivers, setDrivers] = useState<any[]>(DEFAULT_DRIVERS)
  const [prices, setPrices] = useState<Record<string, number>>(DEFAULT_PRICES)
  const [company, setCompany] = useState<any>({ name: 'PT. Transportasi Operasional Jaya', tagline: 'Solusi Logistik & Armada Terpercaya' })

  // Form States
  const [selectedPlate, setSelectedPlate] = useState('')
  const [selectedDriver, setSelectedDriver] = useState('')
  const [fuelType, setFuelType] = useState('Pertalite')
  
  // OPSI PENGISIAN DARURAT / ECERAN
  const [fillLocation, setFillLocation] = useState<'SPBU' | 'ECERAN'>('SPBU')
  const [customUnitPrice, setCustomUnitPrice] = useState<number | string>('')
  const [emergencyNote, setEmergencyNote] = useState('')

  const [initialKm, setInitialKm] = useState<number | string>('')
  const [finalKm, setFinalKm] = useState<number | string>('')
  const [liters, setLiters] = useState<number | string>('')
  const [receiptImage, setReceiptImage] = useState<string>('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [submittedData, setSubmittedData] = useState<any>(null)

  useEffect(() => {
    try {
      const storedVehicles = localStorage.getItem('vehicle_budgets')
      const storedDrivers = localStorage.getItem('driver_list')
      const storedPrices = localStorage.getItem('fuel_prices')
      const storedCompany = localStorage.getItem('company_profile')

      if (storedVehicles) {
        const parsedV = JSON.parse(storedVehicles)
        if (Array.isArray(parsedV) && parsedV.length > 0) {
          setVehicles(parsedV.filter((v: any) => v.is_active !== false))
        }
      }

      if (storedDrivers) {
        const parsedD = JSON.parse(storedDrivers)
        if (Array.isArray(parsedD) && parsedD.length > 0) {
          setDrivers(parsedD.filter((d: any) => d.is_active !== false))
        }
      }

      if (storedPrices) {
        setPrices(JSON.parse(storedPrices))
      }

      if (storedCompany) {
        setCompany(JSON.parse(storedCompany))
      }
    } catch (err) {
      console.error('Error loading config:', err)
    }
  }, [])

  // Auto Select Initial KM saat armada dipilih
  useEffect(() => {
    if (selectedPlate) {
      const v = vehicles.find((item) => item.plate_number === selectedPlate)
      if (v && v.last_km) {
        setInitialKm(v.last_km)
      } else {
        setInitialKm(0)
      }
    }
  }, [selectedPlate, vehicles])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Ukuran foto terlalu besar! Maksimal 5MB.')
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        setReceiptImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Kalkulasi Otomatis
  const numInitialKm = Number(initialKm) || 0
  const numFinalKm = Number(finalKm) || 0
  const numLiters = Number(liters) || 0

  const distanceKm = Math.max(0, numFinalKm - numInitialKm)
  
  // Penentuan Harga per Liter: SPBU vs ECERAN
  const defaultPrice = prices[fuelType] || 10000
  const unitPrice = fillLocation === 'SPBU' ? defaultPrice : (Number(customUnitPrice) || 0)
  
  const totalCost = Math.round(numLiters * unitPrice)
  const kmPerLiter = numLiters > 0 ? (distanceKm / numLiters).toFixed(2) : '0'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedPlate || !selectedDriver) {
      alert('Harap pilih Armada Kendaraan dan Nama Driver!')
      return
    }

    if (numFinalKm <= numInitialKm) {
      alert('Odometer Akhir harus lebih besar dari Odometer Awal!')
      return
    }

    if (numLiters <= 0) {
      alert('Jumlah liter BBM harus lebih dari 0!')
      return
    }

    if (fillLocation === 'ECERAN' && unitPrice <= 0) {
      alert('Untuk Pengisian Eceran/Darurat, harap masukkan Harga per Liter!')
      return
    }

    setIsSubmitting(true)

    const vehicleObj = vehicles.find((v) => v.plate_number === selectedPlate)

    const newLog = {
      id: Date.now(),
      plate_number: selectedPlate,
      vehicle_model: vehicleObj?.model || 'Kendaraan',
      driver_name: selectedDriver,
      initial_km: numInitialKm,
      final_km: numFinalKm,
      distance_km: distanceKm,
      liters: numLiters,
      unit_price: unitPrice,
      km_per_liter: kmPerLiter,
      total_cost: totalCost,
      fuel_type: fuelType,
      fill_location: fillLocation, // 'SPBU' | 'ECERAN'
      emergency_note: fillLocation === 'ECERAN' ? emergencyNote : '',
      receipt_image: receiptImage,
      date: date,
      status: 'PENDING',
    }

    try {
      const existingLogs = JSON.parse(localStorage.getItem('fuel_logs') || '[]')
      const updatedLogs = [newLog, ...existingLogs]
      localStorage.setItem('fuel_logs', JSON.stringify(updatedLogs))

      const existingVehicles = JSON.parse(localStorage.getItem('vehicle_budgets') || '[]')
      if (Array.isArray(existingVehicles) && existingVehicles.length > 0) {
        const updatedVehicles = existingVehicles.map((v: any) =>
          v.plate_number === selectedPlate ? { ...v, last_km: numFinalKm } : v
        )
        localStorage.setItem('vehicle_budgets', JSON.stringify(updatedVehicles))
      }

      setSubmittedData(newLog)
      setShowSuccess(true)
      setIsSubmitting(false)

      // Reset Form Input
      setSelectedPlate('')
      setSelectedDriver('')
      setFinalKm('')
      setLiters('')
      setCustomUnitPrice('')
      setEmergencyNote('')
      setFillLocation('SPBU')
      setReceiptImage('')
    } catch (err) {
      console.error('Error saving fuel log:', err)
      alert('Gagal menyimpan laporan. Memori lokal penuh!')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-between p-4 sm:p-6 font-sans text-slate-100">
      
      {/* HEADER FORM DRIVER */}
      <header className="max-w-md w-full mx-auto flex justify-between items-center border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500 text-slate-950 rounded-2xl flex items-center justify-center font-bold text-xl shadow-lg">
            ⛽
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-wide">{company.name}</h1>
            <p className="text-[11px] text-amber-400 font-semibold">{company.tagline || 'Form Pengisian BBM Driver'}</p>
          </div>
        </div>

        <Link
          href="/admin"
          className="text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold px-3 py-2 rounded-xl border border-slate-700 transition"
        >
          🔑 Mode Admin
        </Link>
      </header>

      {/* BODY FORM DRIVER */}
      <main className="max-w-md w-full mx-auto my-6 space-y-5">

        {showSuccess && submittedData ? (
          <div className="bg-slate-800 border border-emerald-500/50 rounded-2xl p-5 space-y-4 text-center shadow-2xl animate-fade-in">
            <div className="w-12 h-12 bg-emerald-500 text-slate-950 rounded-full flex items-center justify-center text-2xl mx-auto font-bold shadow-lg">
              ✓
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Laporan BBM Berhasil Terkirim!</h2>
              <p className="text-xs text-slate-400 mt-1">Data telah dicatat dan menunggu verifikasi admin.</p>
            </div>

            <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 text-xs text-left space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Armada:</span>
                <span className="font-bold text-white">{submittedData.plate_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Driver:</span>
                <span className="text-white">{submittedData.driver_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Sumber BBM:</span>
                <span className={submittedData.fill_location === 'ECERAN' ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                  {submittedData.fill_location === 'ECERAN' ? '⚠️ ECERAN / DARURAT' : '⛽ SPBU RESMI'}
                </span>
              </div>
              {submittedData.emergency_note && (
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Alasan Darurat:</span>
                  <span className="text-slate-300 italic">{submittedData.emergency_note}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Jarak Tempuh:</span>
                <span className="text-emerald-400 font-bold">{submittedData.distance_km} KM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Total Biaya:</span>
                <span className="text-amber-400 font-bold">Rp {submittedData.total_cost.toLocaleString('id-ID')}</span>
              </div>
            </div>

            <button
              onClick={() => setShowSuccess(false)}
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 rounded-xl text-xs transition shadow-lg"
            >
              + Input Pengisian BBM Lagi
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 space-y-4 shadow-xl backdrop-blur-md">
            
            <div className="border-b border-slate-700 pb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>📱</span> Form Laporan BBM Driver
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Isi data pengisian bahan bakar kendaraan operasional</p>
            </div>

            {/* OPSI SUMBER PENGISIAN BBM (SPBU VS ECERAN) */}
            <div className="space-y-1.5 p-3 bg-slate-900/90 rounded-xl border border-slate-700">
              <label className="block text-[11px] font-bold text-amber-400 uppercase tracking-wider">Sumber / Lokasi Pengisian BBM *</label>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setFillLocation('SPBU')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                    fillLocation === 'SPBU'
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  <span>⛽</span> SPBU Resmi
                </button>

                <button
                  type="button"
                  onClick={() => setFillLocation('ECERAN')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                    fillLocation === 'ECERAN'
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  <span>⚠️</span> Emperan / Darurat
                </button>
              </div>
            </div>

            {/* Tanggal & Jenis BBM */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Tanggal Pengisian</label>
                <input
                  type="date"
                  required
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-amber-400 font-medium"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Jenis BBM</label>
                <select
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-amber-400 font-semibold"
                  value={fuelType}
                  onChange={(e) => setFuelType(e.target.value)}
                >
                  {Object.keys(prices).map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* FIELD TAMBAHAN JIKA ISI DI ECERAN / EMPERAN */}
            {fillLocation === 'ECERAN' && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/40 rounded-xl space-y-3 animate-fade-in">
                <div>
                  <label className="block text-[11px] font-bold text-amber-300 mb-1">Harga per Liter (BBM Eceran/Pertamini) *</label>
                  <input
                    type="number"
                    required
                    placeholder="Misal: 12500"
                    className="w-full p-2.5 bg-slate-900 border border-amber-500/50 rounded-xl text-xs text-amber-300 font-mono font-bold outline-none focus:ring-1 focus:ring-amber-400"
                    value={customUnitPrice}
                    onChange={(e) => setCustomUnitPrice(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-amber-300 mb-1">Lokasi & Alasan Pengisian Darurat</label>
                  <input
                    type="text"
                    placeholder="Misal: Kec. Tayan - SPBU Terdekat Habis / 40 KM Lagi"
                    className="w-full p-2.5 bg-slate-900 border border-amber-500/50 rounded-xl text-xs text-white font-medium outline-none focus:ring-1 focus:ring-amber-400"
                    value={emergencyNote}
                    onChange={(e) => setEmergencyNote(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Pilih Armada & Driver */}
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Pilih Armada Kendaraan *</label>
                <select
                  required
                  className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-amber-400 font-bold outline-none focus:border-amber-400"
                  value={selectedPlate}
                  onChange={(e) => setSelectedPlate(e.target.value)}
                >
                  <option value="">-- Pilih Plat Kendaraan --</option>
                  {vehicles.map((v) => (
                    <option key={v.plate_number} value={v.plate_number}>
                      {v.plate_number} - {v.model}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Nama Driver Pengemudi *</label>
                <select
                  required
                  className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-semibold outline-none focus:border-amber-400"
                  value={selectedDriver}
                  onChange={(e) => setSelectedDriver(e.target.value)}
                >
                  <option value="">-- Pilih Nama Pengemudi --</option>
                  {drivers.map((d) => (
                    <option key={d.name} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Odometer KM Awal & Akhir */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-700/60">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Odometer Awal (KM)</label>
                <input
                  type="number"
                  readOnly
                  placeholder="0"
                  className="w-full p-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-xs text-slate-400 font-mono font-bold outline-none cursor-not-allowed"
                  value={initialKm}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Odometer Akhir (KM) *</label>
                <input
                  type="number"
                  required
                  placeholder="Misal: 45320"
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono font-bold outline-none focus:border-amber-400"
                  value={finalKm}
                  onChange={(e) => setFinalKm(e.target.value)}
                />
              </div>
            </div>

            {/* Volume BBM & Preview Kalkulasi */}
            <div className="space-y-3 pt-2 border-t border-slate-700/60">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Jumlah Liter Diisi *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="Misal: 35.5"
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono font-bold outline-none focus:border-amber-400"
                  value={liters}
                  onChange={(e) => setLiters(e.target.value)}
                />
              </div>

              {/* Kalkulasi Otomatis Card */}
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-700 space-y-1.5 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans text-[11px]">Tarif per Liter:</span>
                  <span className="font-bold text-white">Rp {unitPrice.toLocaleString('id-ID')} {fillLocation === 'ECERAN' ? '(Eceran)' : '(SPBU)'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans text-[11px]">Estimasi Jarak Tempuh:</span>
                  <span className="font-bold text-emerald-400">{distanceKm} KM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans text-[11px]">Estimasi Biaya Transaksi:</span>
                  <span className="font-bold text-amber-400">Rp {totalCost.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans text-[11px]">Rasio Efisiensi BBM:</span>
                  <span className="font-bold text-indigo-400">{kmPerLiter} KM/L</span>
                </div>
              </div>
            </div>

            {/* Upload Struk / Nota Manual Foto */}
            <div className="space-y-2 pt-2 border-t border-slate-700/60">
              <label className="block text-[11px] font-semibold text-slate-300">
                {fillLocation === 'ECERAN' ? 'Foto Nota Manual / Botol BBM / Struk (Opsional)' : 'Foto Struk Pengisian BBM (Opsional)'}
              </label>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-700 file:text-white hover:file:bg-slate-600"
                onChange={handleImageUpload}
              />
              {receiptImage && (
                <div className="mt-2 rounded-xl border border-slate-700 p-2 bg-slate-900 flex items-center justify-between">
                  <span className="text-[11px] text-emerald-400 font-semibold">✓ Foto Bukti Siap Diunggah</span>
                  <button type="button" onClick={() => setReceiptImage('')} className="text-rose-400 text-xs font-bold">✕ Hapus</button>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold py-3.5 rounded-xl text-xs transition shadow-lg disabled:opacity-50 mt-2"
            >
              {isSubmitting ? 'Mengirim Data...' : '🚀 KIRIM LAPORAN PENGISIAN BBM'}
            </button>

          </form>
        )}

      </main>

      {/* FOOTER */}
      <footer className="max-w-md w-full mx-auto text-center text-[10px] text-slate-500 border-t border-slate-800/80 pt-3">
        Dev by <span className="font-bold text-slate-400">Urai Ikhsan Fadhilah</span> • Pemantau BBM Enterprise Edition
      </footer>

    </div>
  )
}