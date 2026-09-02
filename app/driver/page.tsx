'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const INITIAL_DRIVERS = [
  { id: 'D1', name: 'Ahmad Supardi', sim_type: 'SIM B1 Umum' },
  { id: 'D2', name: 'Budi Santoso', sim_type: 'SIM A' },
]

const INITIAL_VEHICLES = [
  { id: 'V1', plate_number: 'B 1234 ABC', model: 'Toyota Avanza', last_km: 45750 },
  { id: 'V2', plate_number: 'B 5678 XYZ', model: 'Daihatsu Gran Max', last_km: 32000 },
  { id: 'V3', plate_number: 'B 9012 DEF', model: 'Isuzu Traga', last_km: 18500 },
]

const INITIAL_FUELS = [
  { id: 'F1', name: 'Pertalite', price: 10000 },
  { id: 'F2', name: 'Pertamax', price: 12950 },
  { id: 'F3', name: 'Pertamax Turbo', price: 14400 },
  { id: 'F4', name: 'Dexlite', price: 14550 },
  { id: 'F5', name: 'Bio Solar', price: 6800 },
]

const DEFAULT_LOGS = [
  {
    id: 1,
    plate_number: 'B 1234 ABC',
    vehicle_model: 'Toyota Avanza',
    driver_name: 'Ahmad Supardi',
    initial_km: 45250,
    final_km: 45750,
    distance_km: 500,
    liters: 15,
    unit_price: 10000,
    km_per_liter: 33.33,
    total_cost: 150000,
    fuel_type: 'Pertalite',
    fill_location: 'SPBU Resmi',
    date: '2026-08-31',
    status: 'VERIFIED',
  },
]

// Helper Format Titik Ribuan Otomatis
const formatNumberDots = (val: number | string) => {
  if (!val && val !== 0) return ''
  const numStr = String(val).replace(/\D/g, '')
  return numStr.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

const parseDotsToNum = (val: string) => {
  return Number(String(val).replace(/\./g, '')) || 0
}

export default function DriverPortalPage() {
  const [drivers, setDrivers] = useState<any[]>(INITIAL_DRIVERS)
  const [vehicles, setVehicles] = useState<any[]>(INITIAL_VEHICLES)
  const [fuels, setFuels] = useState<any[]>(INITIAL_FUELS)
  const [logs, setLogs] = useState<any[]>(DEFAULT_LOGS)

  const [selectedDriver, setSelectedDriver] = useState('')
  const [selectedVehiclePlate, setSelectedVehiclePlate] = useState('')
  const [selectedFuelName, setSelectedFuelName] = useState('')

  const [initialKm, setInitialKm] = useState(0)
  const [finalKmInput, setFinalKmInput] = useState('')
  const [litersInput, setLitersInput] = useState('')
  const [totalCostFormatted, setTotalCostFormatted] = useState('')
  const [fillLocation, setFillLocation] = useState<'SPBU Resmi' | 'ECERAN'>('SPBU Resmi')
  const [receiptImage, setReceiptImage] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Muat data terintegrasi dari LocalStorage
  const loadData = () => {
    try {
      const storedDrivers = localStorage.getItem('master_drivers')
      const storedVehicles = localStorage.getItem('vehicle_budgets')
      const storedFuels = localStorage.getItem('master_fuel_prices')
      const storedLogs = localStorage.getItem('fuel_logs')

      if (storedDrivers) setDrivers(JSON.parse(storedDrivers))
      if (storedVehicles) setVehicles(JSON.parse(storedVehicles))
      if (storedFuels) setFuels(JSON.parse(storedFuels))

      if (storedLogs) {
        setLogs(JSON.parse(storedLogs))
      } else {
        localStorage.setItem('fuel_logs', JSON.stringify(DEFAULT_LOGS))
        setLogs(DEFAULT_LOGS)
      }
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Inisialisasi default dropdown
  useEffect(() => {
    if (drivers.length > 0 && !selectedDriver) {
      setSelectedDriver(drivers[0].name)
    }
    if (vehicles.length > 0 && !selectedVehiclePlate) {
      setSelectedVehiclePlate(vehicles[0].plate_number)
      setInitialKm(vehicles[0].last_km || 0)
    }
    if (fuels.length > 0 && !selectedFuelName) {
      setSelectedFuelName(fuels[0].name)
    }
  }, [drivers, vehicles, fuels])

  // Update KM Awal otomatis saat ganti armada
  const handleVehicleChange = (plate: string) => {
    setSelectedVehiclePlate(plate)
    const matched = vehicles.find((v) => v.plate_number === plate)
    if (matched) {
      setInitialKm(matched.last_km || 0)
    }
  }

  // Hitung Estimasi Total Biaya Otomatis saat Liter diisi
  const handleLitersChange = (val: string) => {
    setLitersInput(val)
    const numericLiters = parseFloat(val) || 0
    const matchedFuel = fuels.find((f) => f.name === selectedFuelName)
    const unitPrice = matchedFuel ? Number(matchedFuel.price) || 0 : 0

    if (numericLiters > 0 && unitPrice > 0) {
      const calculatedCost = Math.round(numericLiters * unitPrice)
      setTotalCostFormatted(formatNumberDots(calculatedCost))
    }
  }

  // Unggah Foto Struk
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setReceiptImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Kirim Laporan Pengisian BBM (Anti-Overwrite Memori)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const numericFinalKm = Number(finalKmInput.replace(/\D/g, '')) || 0
    const numericLiters = parseFloat(litersInput) || 0
    const numericTotalCost = parseDotsToNum(totalCostFormatted)

    if (numericFinalKm <= initialKm) {
      alert(`⚠️ KM Odometer Akhir (${numericFinalKm}) harus lebih besar dari KM Awal (${initialKm})!`)
      setIsSubmitting(false)
      return
    }

    if (numericLiters <= 0) {
      alert('⚠️ Jumlah liter BBM harus lebih dari 0!')
      setIsSubmitting(false)
      return
    }

    const distanceKm = numericFinalKm - initialKm
    const kmPerLiter = numericLiters > 0 ? Number((distanceKm / numericLiters).toFixed(2)) : 0

    // BACA ULANG MEMORI DARI LOCALSTORAGE AGAR SELALU UP-TO-DATE
    let latestVehicles = vehicles
    try {
      const storedV = localStorage.getItem('vehicle_budgets')
      if (storedV) latestVehicles = JSON.parse(storedV)
    } catch (err) {
      console.error(err)
    }

    const matchedVehicle = latestVehicles.find((v: any) => v.plate_number === selectedVehiclePlate)

    const newLog = {
      id: Date.now(),
      plate_number: selectedVehiclePlate,
      vehicle_model: matchedVehicle ? matchedVehicle.model : 'Armada Operational',
      driver_name: selectedDriver,
      initial_km: initialKm,
      final_km: numericFinalKm,
      distance_km: distanceKm,
      liters: numericLiters,
      unit_price: numericLiters > 0 ? Math.round(numericTotalCost / numericLiters) : 0,
      km_per_liter: kmPerLiter,
      total_cost: numericTotalCost,
      fuel_type: selectedFuelName,
      fill_location: fillLocation,
      date: new Date().toISOString().split('T')[0],
      status: 'PENDING',
      receipt_image: receiptImage,
      audit_note: '',
    }

    let latestLogs = logs
    try {
      const storedL = localStorage.getItem('fuel_logs')
      if (storedL) latestLogs = JSON.parse(storedL)
    } catch (err) {
      console.error(err)
    }

    // 1. Simpan Log Baru ke LocalStorage
    const updatedLogs = [newLog, ...latestLogs]
    setLogs(updatedLogs)
    localStorage.setItem('fuel_logs', JSON.stringify(updatedLogs))

    // 2. Update Odometer KM Terakhir Kendaraan di Master Data
    const updatedVehicles = latestVehicles.map((v: any) =>
      v.plate_number === selectedVehiclePlate ? { ...v, last_km: numericFinalKm } : v
    )
    setVehicles(updatedVehicles)
    localStorage.setItem('vehicle_budgets', JSON.stringify(updatedVehicles))

    alert('✅ Laporan Pengisian BBM berhasil dikirim ke Admin!')

    // Reset Form
    setInitialKm(numericFinalKm)
    setFinalKmInput('')
    setLitersInput('')
    setTotalCostFormatted('')
    setReceiptImage('')
    setIsSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full space-y-4">
        {/* HEADER BRANDING */}
        <div className="flex justify-between items-center bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-lg">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-amber-500 text-slate-950 rounded-xl flex items-center justify-center font-black">
              ⛽
            </div>
            <div>
              <h1 className="text-sm font-extrabold text-white tracking-wide">PORTAL DRIVER</h1>
              <p className="text-[10px] text-slate-400">FleetOps 360 BBM Monitoring</p>
            </div>
          </div>
          <Link
            href="/admin"
            className="text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-amber-400 px-3 py-1.5 rounded-xl border border-slate-700 transition"
          >
            Akses Admin ➔
          </Link>
        </div>

        {/* FORM LAPORAN PENGISIAN BBM */}
        <div className="bg-slate-900/90 backdrop-blur-md p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4">
          <div className="border-b border-slate-800 pb-2">
            <h2 className="text-xs font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span> Form Laporan Pengisian BBM
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Pilih nama driver & armada yang terdaftar di Master Data</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            {/* PILIH DRIVER */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Pilih Nama Pengemudi (Driver)</label>
              <select
                className="w-full bg-slate-950 border border-slate-800 text-white p-2.5 rounded-xl outline-none font-medium focus:ring-2 focus:ring-amber-500"
                value={selectedDriver}
                onChange={(e) => setSelectedDriver(e.target.value)}
              >
                {drivers.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name} — ({d.sim_type || 'SIM Driver'})
                  </option>
                ))}
              </select>
            </div>

            {/* PILIH ARMADA */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Armada Kendaraan</label>
              <select
                className="w-full bg-slate-950 border border-slate-800 text-white p-2.5 rounded-xl outline-none font-bold focus:ring-2 focus:ring-amber-500"
                value={selectedVehiclePlate}
                onChange={(e) => handleVehicleChange(e.target.value)}
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={v.plate_number}>
                    {v.plate_number} — {v.model}
                  </option>
                ))}
              </select>
            </div>

            {/* KM ODOMETER (INPUT BERSIH TANPA BUTTON SCROLL) */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">KM Awal (Terakhir)</label>
                <input
                  type="text"
                  className="w-full bg-slate-950/60 border border-slate-800 text-slate-400 p-2.5 rounded-xl font-mono text-xs font-bold outline-none cursor-not-allowed"
                  value={initialKm}
                  disabled
                />
              </div>
              <div>
                <label className="block text-[10px] text-amber-400 font-bold mb-1">KM Odometer Akhir *</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Contoh: 45750"
                  className="w-full bg-slate-950 border border-amber-500/80 text-amber-300 p-2.5 rounded-xl font-mono text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500"
                  value={finalKmInput}
                  onChange={(e) => setFinalKmInput(e.target.value.replace(/\D/g, ''))}
                  required
                />
              </div>
            </div>

            {/* KATALOG JENIS BBM */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Jenis Bahan Bakar (Katalog Master)</label>
              <select
                className="w-full bg-slate-950 border border-slate-800 text-white p-2.5 rounded-xl outline-none font-medium focus:ring-2 focus:ring-amber-500"
                value={selectedFuelName}
                onChange={(e) => setSelectedFuelName(e.target.value)}
              >
                {fuels.map((f) => (
                  <option key={f.id} value={f.name}>
                    {f.name} — Rp {(f.price || 0).toLocaleString('id-ID')}/L
                  </option>
                ))}
              </select>
            </div>

            {/* JUMLAH LITER & TOTAL BIAYA DENGAN TITIK OTOMATIS */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] text-slate-300 font-semibold mb-1">Jumlah Liter *</label>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="Contoh: 25.5"
                  className="w-full bg-slate-950 border border-slate-800 text-white p-2.5 rounded-xl font-mono text-xs outline-none focus:ring-2 focus:ring-amber-500"
                  value={litersInput}
                  onChange={(e) => handleLitersChange(e.target.value.replace(/[^0-9.]/g, ''))}
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-300 font-semibold mb-1">Total Biaya (Rp) *</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Estimasi Otomatis"
                  className="w-full bg-slate-950 border border-slate-800 text-amber-400 p-2.5 rounded-xl font-mono text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500"
                  value={totalCostFormatted}
                  onChange={(e) => setTotalCostFormatted(formatNumberDots(e.target.value))}
                  required
                />
              </div>
            </div>

            {/* LOKASI PENGISIAN */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Lokasi Pengisian</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFillLocation('SPBU Resmi')}
                  className={`p-2 rounded-xl font-bold text-xs transition border ${
                    fillLocation === 'SPBU Resmi'
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  ⛽ SPBU Resmi
                </button>
                <button
                  type="button"
                  onClick={() => setFillLocation('ECERAN')}
                  className={`p-2 rounded-xl font-bold text-xs transition border ${
                    fillLocation === 'ECERAN'
                      ? 'bg-rose-600 text-white border-rose-500 shadow-md'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  ⚠️ Darurat / Eceran
                </button>
              </div>
            </div>

            {/* UNGGAH STRUK */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Unggah Foto Struk (Opsional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:bg-slate-800 file:text-amber-400 font-bold cursor-pointer"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold py-3 rounded-xl shadow-lg transition text-xs mt-2"
            >
              🚀 Kirim Laporan Pengisian BBM
            </button>
          </form>
        </div>

        {/* RIWAYAT PENGIRIMAN TERAKHIR DRIVER */}
        <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow-md space-y-2.5">
          <h3 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            📋 RIWAYAT PENGIRIMAN TERAKHIR
          </h3>

          <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
            {logs.slice(0, 5).map((log: any) => (
              <div
                key={log.id}
                className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 flex justify-between items-center text-xs"
              >
                <div>
                  <div className="font-bold text-amber-400">{log.plate_number}</div>
                  <div className="text-[10px] text-slate-400">Driver: {log.driver_name}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-500 font-mono">{log.date}</div>
                  <div className="font-mono font-bold text-slate-200">
                    Rp {(Number(log.total_cost) || 0).toLocaleString('id-ID')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}