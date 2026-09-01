'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Icons } from '@/components/ui/Icons'

const DEFAULT_VEHICLES = [
  { id: '1', plate_number: 'B 1234 ABC', model: 'Toyota Avanza', last_km: 45320 },
  { id: '2', plate_number: 'B 5678 XYZ', model: 'Daihatsu Gran Max', last_km: 32000 },
  { id: '3', plate_number: 'B 9012 DEF', model: 'Isuzu Traga', last_km: 18500 },
]

export default function DriverPortal() {
  const [vehicles, setVehicles] = useState(DEFAULT_VEHICLES)
  const [recentLogs, setRecentLogs] = useState<any[]>([])

  // FORM STATES
  const [selectedPlate, setSelectedPlate] = useState('')
  const [driverName, setDriverName] = useState('')
  const [initialKm, setInitialKm] = useState<number | ''>('')
  const [finalKm, setFinalKm] = useState<number | ''>('')
  const [fuelType, setFuelType] = useState('Pertalite')
  const [liters, setLiters] = useState<number | ''>('')
  const [totalCost, setTotalCost] = useState<number | ''>('')
  const [fillLocation, setFillLocation] = useState<'SPBU' | 'ECERAN'>('SPBU')
  const [emergencyNote, setEmergencyNote] = useState('')
  const [receiptImage, setReceiptImage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState(false)

  // LOAD DATA KENDARAAN & HISTORY
  useEffect(() => {
    try {
      const storedVehicles = localStorage.getItem('vehicle_budgets')
      if (storedVehicles) {
        const parsed = JSON.parse(storedVehicles)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setVehicles(parsed)
          setSelectedPlate(parsed[0].plate_number)
          setInitialKm(parsed[0].last_km || 0)
        }
      } else {
        setSelectedPlate(DEFAULT_VEHICLES[0].plate_number)
        setInitialKm(DEFAULT_VEHICLES[0].last_km)
      }

      const storedLogs = localStorage.getItem('fuel_logs')
      if (storedLogs) {
        setRecentLogs(JSON.parse(storedLogs))
      }
    } catch (e) {
      console.error('Error loading initial data for driver portal', e)
    }
  }, [])

  // HANDLER GANTI KENDARAAN (AUTO SET KM AWAL)
  const handleVehicleChange = (plate: string) => {
    setSelectedPlate(plate)
    const found = vehicles.find((v) => v.plate_number === plate)
    if (found) {
      setInitialKm(found.last_km || 0)
    }
  }

  // UPLOAD FOTO STRUK
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setReceiptImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // SUBMIT FORM B B M
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const initKmNum = Number(initialKm) || 0
    const finalKmNum = Number(finalKm) || 0
    const litersNum = Number(liters) || 0
    const costNum = Number(totalCost) || 0

    if (finalKmNum <= initKmNum) {
      alert('KM Odometer Akhir harus lebih besar dari KM Odometer Awal!')
      return
    }

    if (litersNum <= 0 || costNum <= 0) {
      alert('Jumlah Liter dan Total Biaya harus lebih besar dari 0!')
      return
    }

    setIsSubmitting(true)

    const distanceKm = finalKmNum - initKmNum
    const kmPerLiter = (distanceKm / litersNum).toFixed(2)
    const unitPrice = Math.round(costNum / litersNum)
    const targetVehicle = vehicles.find((v) => v.plate_number === selectedPlate)

    const newLog = {
      id: Date.now(),
      plate_number: selectedPlate,
      vehicle_model: targetVehicle?.model || 'Kendaraan',
      driver_name: driverName.trim(),
      initial_km: initKmNum,
      final_km: finalKmNum,
      distance_km: distanceKm,
      liters: litersNum,
      unit_price: unitPrice,
      km_per_liter: kmPerLiter,
      total_cost: costNum,
      fuel_type: fuelType,
      fill_location: fillLocation,
      emergency_note: fillLocation === 'ECERAN' ? emergencyNote : '',
      receipt_image: receiptImage,
      date: new Date().toISOString().split('T')[0],
      status: 'PENDING',
    }

    // SIMPAN KE LOCALSTORAGE LOGS
    const updatedLogs = [newLog, ...recentLogs]
    localStorage.setItem('fuel_logs', JSON.stringify(updatedLogs))
    setRecentLogs(updatedLogs)

    // UPDATE ODOMETER TERKINI KENDARAAN
    const updatedVehicles = vehicles.map((v) =>
      v.plate_number === selectedPlate ? { ...v, last_km: finalKmNum } : v
    )
    localStorage.setItem('vehicle_budgets', JSON.stringify(updatedVehicles))
    setVehicles(updatedVehicles)

    // RESET FORM
    setTimeout(() => {
      setIsSubmitting(false)
      setSuccessMessage(true)
      setFinalKm('')
      setLiters('')
      setTotalCost('')
      setEmergencyNote('')
      setReceiptImage('')
      setInitialKm(finalKmNum)

      setTimeout(() => setSuccessMessage(false), 4000)
    }, 500)
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans pb-12">
      {/* HEADER TOP BAR */}
      <header className="bg-slate-950 border-b border-slate-800 px-4 py-3.5 sticky top-0 z-30 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 rounded-lg flex items-center justify-center font-extrabold shadow-sm">
            <Icons.Fuel className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xs font-bold text-white tracking-wide uppercase">FleetOps 360</h1>
            <span className="text-[10px] text-amber-400 font-semibold block">Portal Laporan Driver</span>
          </div>
        </div>

        <Link
          href="/admin"
          className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold px-3 py-1.5 rounded-lg border border-slate-700 transition flex items-center gap-1"
        >
          Akses Admin ➔
        </Link>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-5">
        {/* NOTIFIKASI SUKSES */}
        {successMessage && (
          <div className="p-4 bg-emerald-500/20 border border-emerald-500/50 rounded-2xl text-emerald-300 text-xs text-center font-bold animate-bounce shadow-lg">
            ✓ Laporan Pengisian BBM Berhasil Terkirim ke Sistem!
          </div>
        )}

        {/* FORM INPUT UTAMA */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="border-b border-slate-700 pb-3">
            <h2 className="text-sm font-extrabold text-white tracking-wide uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              Form Laporan Pengisian BBM
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Isi data pengisian sesuai struk / odometer kendaraan</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* PILIH ARMADA */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Armada Kendaraan</label>
              <select
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white font-bold outline-none focus:border-amber-400 transition"
                value={selectedPlate}
                onChange={(e) => handleVehicleChange(e.target.value)}
                required
              >
                {vehicles.map((v) => (
                  <option key={v.plate_number} value={v.plate_number}>
                    {v.plate_number} — {v.model}
                  </option>
                ))}
              </select>
            </div>

            {/* NAMA DRIVER */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Nama Pengemudi (Driver)</label>
              <input
                type="text"
                placeholder="Contoh: Budi Santoso"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white font-medium outline-none focus:border-amber-400 transition"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                required
              />
            </div>

            {/* ODOMETER KM AWAL & AKHIR */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">KM Awal (Terakhir)</label>
                <input
                  type="number"
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-xs text-slate-400 font-mono font-bold cursor-not-allowed"
                  value={initialKm}
                  readOnly
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-amber-400 mb-1">KM Odometer Akhir *</label>
                <input
                  type="number"
                  placeholder="Contoh: 45750"
                  className="w-full bg-slate-900 border border-amber-500/50 rounded-xl p-3 text-xs text-white font-mono font-bold outline-none focus:ring-2 focus:ring-amber-400 transition"
                  value={finalKm}
                  onChange={(e) => setFinalKm(e.target.value ? Number(e.target.value) : '')}
                  required
                />
              </div>
            </div>

            {/* JENIS BBM */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Jenis Bahan Bakar</label>
              <select
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white font-medium outline-none focus:border-amber-400 transition"
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value)}
              >
                <option value="Pertalite">Pertalite (Subsidi)</option>
                <option value="Pertamax">Pertamax</option>
                <option value="Pertamax Turbo">Pertamax Turbo</option>
                <option value="Dexlite">Dexlite</option>
                <option value="Solar / Bio Solar">Solar / Bio Solar</option>
              </select>
            </div>

            {/* LITER & BIAYA */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Jumlah Liter *</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Contoh: 25.5"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white font-mono font-bold outline-none focus:border-amber-400 transition"
                  value={liters}
                  onChange={(e) => setLiters(e.target.value ? Number(e.target.value) : '')}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Total Biaya (Rp) *</label>
                <input
                  type="number"
                  placeholder="Contoh: 250000"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white font-mono font-bold outline-none focus:border-amber-400 transition"
                  value={totalCost}
                  onChange={(e) => setTotalCost(e.target.value ? Number(e.target.value) : '')}
                  required
                />
              </div>
            </div>

            {/* LOKASI PENGISIAN */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">Lokasi Pengisian</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFillLocation('SPBU')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                    fillLocation === 'SPBU'
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                      : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  ⛽ SPBU Resmi
                </button>
                <button
                  type="button"
                  onClick={() => setFillLocation('ECERAN')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                    fillLocation === 'ECERAN'
                      ? 'bg-rose-600 text-white border-rose-500 shadow-md'
                      : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  ⚠️ Darurat / Eceran
                </button>
              </div>
            </div>

            {/* ALASAN JIKA ECERAN */}
            {fillLocation === 'ECERAN' && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/40 rounded-xl space-y-1">
                <label className="block text-[11px] font-bold text-rose-300">Alasan Pengisian Darurat *</label>
                <input
                  type="text"
                  placeholder="Contoh: SPBU terdekat kehabisan stok / mogok"
                  className="w-full bg-slate-900 border border-rose-500/50 rounded-lg p-2.5 text-xs text-white outline-none"
                  value={emergencyNote}
                  onChange={(e) => setEmergencyNote(e.target.value)}
                  required
                />
              </div>
            )}

            {/* UPLOAD STRUK / NOTA */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Unggah Foto Struk / Nota (Opsional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-700 file:text-amber-400 hover:file:bg-slate-600 cursor-pointer"
              />
              {receiptImage && (
                <div className="mt-2 relative rounded-xl overflow-hidden border border-slate-700 max-h-36">
                  <img src={receiptImage} alt="Preview Struk" className="w-full object-cover" />
                </div>
              )}
            </div>

            {/* TOMBOL SUBMIT */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:brightness-110 text-slate-950 font-extrabold text-xs py-3.5 rounded-xl shadow-lg transition transform active:scale-95 disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
            >
              {isSubmitting ? 'Mengirim Data...' : '🚀 Kirim Laporan Pengisian BBM'}
            </button>
          </form>
        </div>

        {/* HISTORI SINGKAT INPUT DRIVER */}
        <div className="bg-slate-800/60 border border-slate-800 rounded-2xl p-4 space-y-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Icons.Clipboard className="w-4 h-4 text-amber-400" /> Riwayat Pengiriman Terakhir
          </h3>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {recentLogs.slice(0, 3).map((log) => (
              <div key={log.id} className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-xs space-y-1">
                <div className="flex justify-between items-center font-bold">
                  <span className="text-amber-400">{log.plate_number}</span>
                  <span className="text-[10px] font-mono text-slate-400">{log.date}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-300">
                  <span>Driver: {log.driver_name || '-'}</span>
                  <span className="font-mono font-bold text-white">Rp {(Number(log.total_cost) || 0).toLocaleString('id-ID')}</span>
                </div>
              </div>
            ))}
            {recentLogs.length === 0 && (
              <p className="text-[11px] text-slate-500 text-center py-3 italic">Belum ada riwayat pengiriman BBM.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}