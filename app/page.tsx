'use client'

import { useState, useEffect } from 'react'

const DEFAULT_VEHICLES = [
  { id: '1', plate_number: 'B 1234 ABC', model: 'Toyota Avanza', last_km: 45000 },
  { id: '2', plate_number: 'B 5678 XYZ', model: 'Daihatsu Gran Max', last_km: 32000 },
  { id: '3', plate_number: 'B 9012 DEF', model: 'Isuzu Traga', last_km: 18500 },
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

const DEFAULT_DRIVERS = [
  { id: '1', name: 'Budi Santoso' },
  { id: '2', name: 'Ahmad Supardi' },
  { id: '3', name: 'Dede Kurniawan' },
]

export default function Home() {
  const [vehicles, setVehicles] = useState<any[]>(DEFAULT_VEHICLES)
  const [fuelPrices, setFuelPrices] = useState<Record<string, number>>(DEFAULT_PRICES)
  const [driverList, setDriverList] = useState<any[]>(DEFAULT_DRIVERS)

  const [selectedPlate, setSelectedPlate] = useState('')
  const [driverName, setDriverName] = useState('')
  const [fuelType, setFuelType] = useState('Pertalite')
  const [initialKm, setInitialKm] = useState<number | ''>('')
  const [finalKm, setFinalKm] = useState<number | ''>('')
  const [liters, setLiters] = useState<number | ''>('')
  const [receiptImage, setReceiptImage] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState(false)

  useEffect(() => {
    try {
      const storedVehicles = localStorage.getItem('vehicle_budgets')
      const storedPrices = localStorage.getItem('fuel_prices')
      const storedDrivers = localStorage.getItem('driver_list')

      if (storedVehicles) {
        const parsedV = JSON.parse(storedVehicles)
        setVehicles(parsedV)
        if (parsedV.length > 0) {
          setSelectedPlate(parsedV[0].plate_number)
          setInitialKm(parsedV[0].last_km || 0)
        }
      } else {
        setSelectedPlate(DEFAULT_VEHICLES[0].plate_number)
        setInitialKm(DEFAULT_VEHICLES[0].last_km)
      }

      if (storedPrices) setFuelPrices(JSON.parse(storedPrices))
      if (storedDrivers) {
        const parsedD = JSON.parse(storedDrivers)
        setDriverList(parsedD)
        if (parsedD.length > 0) setDriverName(parsedD[0].name)
      } else {
        setDriverName(DEFAULT_DRIVERS[0].name)
      }
    } catch (err) {
      console.error('Error loading initial data:', err)
    }
  }, [])

  const handleVehicleChange = (plate: string) => {
    setSelectedPlate(plate)
    const found = vehicles.find((v) => v.plate_number === plate)
    if (found && found.last_km !== undefined) {
      setInitialKm(found.last_km)
    } else {
      setInitialKm('')
    }
  }

  // Kompresi Gambar Kamera HP
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX_WIDTH = 800
        const scaleSize = MAX_WIDTH / img.width
        canvas.width = MAX_WIDTH
        canvas.height = img.height * scaleSize

        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height)
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6)
        setReceiptImage(compressedBase64)
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  const selectedVehicleObj = vehicles.find((v) => v.plate_number === selectedPlate)
  const unitPrice = fuelPrices[fuelType] || 10000

  const distance = Number(finalKm) && Number(initialKm) ? Math.max(0, Number(finalKm) - Number(initialKm)) : 0
  const totalCost = Number(liters) ? Math.round(Number(liters) * unitPrice) : 0
  const kmPerLiter = Number(liters) && Number(liters) > 0 ? (distance / Number(liters)).toFixed(2) : '0'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPlate || !driverName || !finalKm || !liters) {
      alert('Mohon lengkapi seluruh kolom formulir!')
      return
    }

    if (Number(finalKm) <= Number(initialKm)) {
      alert('KM Akhir Odometer harus lebih besar dari KM Awal!')
      return
    }

    setIsSubmitting(true)

    const newLog = {
      id: Date.now(),
      plate_number: selectedPlate,
      vehicle_model: selectedVehicleObj?.model || 'Kendaraan',
      driver_name: driverName,
      initial_km: Number(initialKm),
      final_km: Number(finalKm),
      distance_km: distance,
      liters: Number(liters),
      unit_price: unitPrice,
      km_per_liter: kmPerLiter,
      total_cost: totalCost,
      fuel_type: fuelType,
      receipt_image: receiptImage,
      date: new Date().toISOString().split('T')[0],
      status: 'PENDING',
    }

    try {
      const existingLogs = JSON.parse(localStorage.getItem('fuel_logs') || '[]')
      const updatedLogs = [newLog, ...existingLogs]
      localStorage.setItem('fuel_logs', JSON.stringify(updatedLogs))

      const updatedVehicles = vehicles.map((v) =>
        v.plate_number === selectedPlate ? { ...v, last_km: Number(finalKm) } : v
      )
      setVehicles(updatedVehicles)
      localStorage.setItem('vehicle_budgets', JSON.stringify(updatedVehicles))

      setSuccessMsg(true)
      setFinalKm('')
      setLiters('')
      setReceiptImage('')

      setTimeout(() => setSuccessMsg(false), 3000)
    } catch (err) {
      alert('Gagal menyimpan laporan!')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between font-sans text-slate-800 p-4">
      <div className="max-w-md w-full mx-auto space-y-4 my-auto">
        
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 text-center space-y-1">
          <div className="w-12 h-12 bg-amber-500 text-slate-900 rounded-2xl flex items-center justify-center mx-auto text-xl font-bold shadow-md">
            ⛽
          </div>
          <h1 className="text-base font-bold text-slate-900 pt-1">Form Pengisian BBM Operasional</h1>
          <p className="text-xs text-slate-500">Laporan pengisian BBM armada pengemudi</p>
        </div>

        {successMsg && (
          <div className="p-4 bg-emerald-600 text-white font-bold rounded-2xl text-xs text-center shadow-lg animate-bounce">
            ✓ Laporan BBM Berhasil Terkirim & Terdata!
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Armada Kendaraan</label>
            <select
              className="w-full p-3 border border-slate-300 rounded-xl text-xs font-bold bg-slate-50 outline-none focus:ring-2 focus:ring-slate-900"
              value={selectedPlate}
              onChange={(e) => handleVehicleChange(e.target.value)}
            >
              {vehicles.map((v) => (
                <option key={v.plate_number} value={v.plate_number}>
                  {v.plate_number} - {v.model}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nama Pengemudi (Driver)</label>
            <select
              className="w-full p-3 border border-slate-300 rounded-xl text-xs font-bold bg-slate-50 outline-none focus:ring-2 focus:ring-slate-900"
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
            >
              {driverList.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Jenis Bahan Bakar</label>
            <select
              className="w-full p-3 border border-slate-300 rounded-xl text-xs font-semibold bg-slate-50 outline-none focus:ring-2 focus:ring-slate-900"
              value={fuelType}
              onChange={(e) => setFuelType(e.target.value)}
            >
              {Object.keys(fuelPrices).map((type) => (
                <option key={type} value={type}>
                  {type} (Rp {fuelPrices[type].toLocaleString('id-ID')}/L)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">KM Odometer Awal</label>
              <input
                type="number"
                readOnly
                className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-500 cursor-not-allowed"
                value={initialKm}
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">KM Odometer Akhir</label>
              <input
                type="number"
                required
                placeholder="45320"
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-slate-900"
                value={finalKm}
                onChange={(e) => setFinalKm(e.target.value ? Number(e.target.value) : '')}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Volume Pengisian (Liter)</label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="35"
              className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-slate-900"
              value={liters}
              onChange={(e) => setLiters(e.target.value ? Number(e.target.value) : '')}
            />
          </div>

          {/* Kalkulasi Ringkas */}
          <div className="p-3.5 bg-slate-900 text-white rounded-xl space-y-1 font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400 font-sans">Jarak Tempuh:</span>
              <span className="font-bold">{distance} KM</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-sans">Rasio Efisiensi:</span>
              <span className="font-bold text-amber-400">{kmPerLiter} KM/L</span>
            </div>
            <div className="flex justify-between border-t border-slate-800 pt-1">
              <span className="text-slate-400 font-sans">Estimasi Biaya:</span>
              <span className="font-bold text-emerald-400">Rp {totalCost.toLocaleString('id-ID')}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Foto Struk SPBU (Kompresi Hemat Kuota)</label>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageUpload}
              className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-900 file:text-white cursor-pointer"
            />
            {receiptImage && (
              <div className="mt-2 relative">
                <img src={receiptImage} alt="Struk Preview" className="h-28 rounded-xl object-cover border w-full" />
                <span className="absolute top-2 right-2 bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow">✓ Foto Terkompresi</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3.5 rounded-xl text-xs transition shadow-md"
          >
            {isSubmitting ? 'Mengirim...' : 'Kirim Laporan BBM'}
          </button>
        </form>

      </div>

      <footer className="py-2 text-center text-[10px] text-slate-500 font-medium">
        Developed by <span className="font-bold text-slate-700">Urai Ikhsan Fadhilah</span>
      </footer>
    </div>
  )
}