'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function DriverPortal() {
  const [drivers, setDrivers] = useState<any[]>([])
  const [vehicles, setVehicles] = useState<any[]>([])
  const [fuels, setFuels] = useState<any[]>([])
  const [recentLogs, setRecentLogs] = useState<any[]>([])

  const [selectedDriver, setSelectedDriver] = useState('')
  const [selectedPlate, setSelectedPlate] = useState('')
  const [initialKm, setInitialKm] = useState<number | ''>('')
  const [finalKm, setFinalKm] = useState<number | ''>('')
  const [selectedFuel, setSelectedFuel] = useState('')
  const [liters, setLiters] = useState<number | ''>('')
  const [totalCost, setTotalCost] = useState<number | ''>('')
  const [fillLocation, setFillLocation] = useState<'SPBU' | 'ECERAN'>('SPBU')
  const [emergencyNote, setEmergencyNote] = useState('')
  const [receiptImage, setReceiptImage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState(false)

  // SINKRONISASI DATA DARI MASTER OPERASIONAL
  useEffect(() => {
    try {
      const storedDrivers = localStorage.getItem('master_drivers')
      const storedVehicles = localStorage.getItem('vehicle_budgets')
      const storedFuels = localStorage.getItem('master_fuel_prices')
      const storedLogs = localStorage.getItem('fuel_logs')

      if (storedDrivers) {
        const parsedD = JSON.parse(storedDrivers)
        setDrivers(parsedD)
        if (parsedD.length > 0) setSelectedDriver(parsedD[0].name)
      }

      if (storedVehicles) {
        const parsedV = JSON.parse(storedVehicles)
        setVehicles(parsedV)
        if (parsedV.length > 0) {
          setSelectedPlate(parsedV[0].plate_number)
          setInitialKm(parsedV[0].last_km || 0)
        }
      }

      if (storedFuels) {
        const parsedF = JSON.parse(storedFuels)
        setFuels(parsedF)
        if (parsedF.length > 0) setSelectedFuel(parsedF[0].name)
      }

      if (storedLogs) {
        setRecentLogs(JSON.parse(storedLogs))
      }
    } catch (e) {
      console.error(e)
    }
  }, [])

  const handleVehicleChange = (plate: string) => {
    setSelectedPlate(plate)
    const found = vehicles.find((v) => v.plate_number === plate)
    if (found) {
      setInitialKm(found.last_km || 0)
    }
  }

  // OTOMATIS HITUNG BIAYA SAAT LITER DIAJUKAN TERHADAP TARIF BBM
  const handleLitersChange = (val: number | '') => {
    setLiters(val)
    if (val && selectedFuel) {
      const fuelObj = fuels.find((f) => f.name === selectedFuel)
      if (fuelObj) {
        setTotalCost(Math.round(val * fuelObj.price))
      }
    }
  }

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
      driver_name: selectedDriver,
      initial_km: initKmNum,
      final_km: finalKmNum,
      distance_km: distanceKm,
      liters: litersNum,
      unit_price: unitPrice,
      km_per_liter: kmPerLiter,
      total_cost: costNum,
      fuel_type: selectedFuel,
      fill_location: fillLocation,
      emergency_note: fillLocation === 'ECERAN' ? emergencyNote : '',
      receipt_image: receiptImage,
      date: new Date().toISOString().split('T')[0],
      status: 'PENDING',
    }

    const updatedLogs = [newLog, ...recentLogs]
    localStorage.setItem('fuel_logs', JSON.stringify(updatedLogs))
    setRecentLogs(updatedLogs)

    const updatedVehicles = vehicles.map((v) =>
      v.plate_number === selectedPlate ? { ...v, last_km: finalKmNum } : v
    )
    localStorage.setItem('vehicle_budgets', JSON.stringify(updatedVehicles))
    setVehicles(updatedVehicles)

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
      <header className="bg-slate-950 border-b border-slate-800 px-4 py-3.5 sticky top-0 z-30 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 rounded-lg flex items-center justify-center font-extrabold shadow-sm">
            ⛽
          </div>
          <div>
            <h1 className="text-xs font-bold text-white tracking-wide uppercase">FleetOps 360</h1>
            <span className="text-[10px] text-amber-400 font-semibold block">Portal Laporan Driver</span>
          </div>
        </div>

        <Link
          href="/admin"
          className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold px-3 py-1.5 rounded-lg border border-slate-700 transition"
        >
          Akses Admin ➔
        </Link>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-5">
        {successMessage && (
          <div className="p-4 bg-emerald-500/20 border border-emerald-500/50 rounded-2xl text-emerald-300 text-xs text-center font-bold animate-bounce shadow-lg">
            ✓ Laporan Pengisian BBM Berhasil Terkirim ke Sistem!
          </div>
        )}

        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="border-b border-slate-700 pb-3">
            <h2 className="text-sm font-extrabold text-white tracking-wide uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              Form Laporan Pengisian BBM
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Pilih nama driver & armada yang terdaftar di Master Data</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Pilih Nama Pengemudi (Driver)</label>
              <select
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white font-bold outline-none focus:border-amber-400 transition"
                value={selectedDriver}
                onChange={(e) => setSelectedDriver(e.target.value)}
                required
              >
                {drivers.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name} — ({d.sim_type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Armada Kendaraan</label>
              <select
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white font-bold outline-none focus:border-amber-400 transition"
                value={selectedPlate}
                onChange={(e) => handleVehicleChange(e.target.value)}
                required
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={v.plate_number}>
                    {v.plate_number} — {v.model}
                  </option>
                ))}
              </select>
            </div>

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

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Jenis Bahan Bakar (Katalog Master)</label>
              <select
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white font-medium outline-none focus:border-amber-400 transition"
                value={selectedFuel}
                onChange={(e) => {
                  setSelectedFuel(e.target.value)
                  if (liters) handleLitersChange(Number(liters))
                }}
              >
                {fuels.map((f) => (
                  <option key={f.id} value={f.name}>
                    {f.name} — Rp {f.price.toLocaleString('id-ID')}/L
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Jumlah Liter *</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Contoh: 25.5"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white font-mono font-bold outline-none focus:border-amber-400 transition"
                  value={liters}
                  onChange={(e) => handleLitersChange(e.target.value ? Number(e.target.value) : '')}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Total Biaya (Rp) *</label>
                <input
                  type="number"
                  placeholder="Estimasi Otomatis"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white font-mono font-bold outline-none focus:border-amber-400 transition"
                  value={totalCost}
                  onChange={(e) => setTotalCost(e.target.value ? Number(e.target.value) : '')}
                  required
                />
              </div>
            </div>

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

            {fillLocation === 'ECERAN' && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/40 rounded-xl space-y-1">
                <label className="block text-[11px] font-bold text-rose-300">Alasan Pengisian Darurat *</label>
                <input
                  type="text"
                  placeholder="Contoh: SPBU terdekat kehabisan stok"
                  className="w-full bg-slate-900 border border-rose-500/50 rounded-lg p-2.5 text-xs text-white outline-none"
                  value={emergencyNote}
                  onChange={(e) => setEmergencyNote(e.target.value)}
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Unggah Foto Struk (Opsional)</label>
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

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:brightness-110 text-slate-950 font-extrabold text-xs py-3.5 rounded-xl shadow-lg transition transform active:scale-95 disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
            >
              {isSubmitting ? 'Mengirim Data...' : '🚀 Kirim Laporan Pengisian BBM'}
            </button>
          </form>
        </div>

        <div className="bg-slate-800/60 border border-slate-800 rounded-2xl p-4 space-y-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            📋 Riwayat Pengiriman Terakhir
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
          </div>
        </div>
      </main>
    </div>
  )
}