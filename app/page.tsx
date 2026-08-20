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
  { id: '1', plate_number: 'B 1234 ABC', model: 'Toyota Avanza' },
  { id: '2', plate_number: 'B 5678 XYZ', model: 'Daihatsu Gran Max' },
  { id: '3', plate_number: 'B 9012 DEF', model: 'Isuzu Traga' },
]

export default function Home() {
  const [logs, setLogs] = useState<any[]>([])
  const [fuelPrices, setFuelPrices] = useState<Record<string, number>>(DEFAULT_PRICES)
  const [vehicles, setVehicles] = useState(DEFAULT_VEHICLES)
  
  const [formData, setFormData] = useState({
    vehicle_id: '',
    driver_name: '',
    initial_km: '',
    final_km: '',
    liters: '',
    fuel_type: 'Pertalite',
  })

  useEffect(() => {
    const storedPrices = localStorage.getItem('fuel_prices')
    const storedVehicles = localStorage.getItem('vehicle_budgets')
    if (storedPrices) setFuelPrices(JSON.parse(storedPrices))
    if (storedVehicles) setVehicles(JSON.parse(storedVehicles))
  }, [])

  // Formula Kalkulasi Reaktif & Otomatis Total Biaya
  const unitPrice = fuelPrices[formData.fuel_type] || 0
  const numericLiters = parseFloat(formData.liters) || 0
  const calculatedTotalCost = numericLiters * unitPrice

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const distance = Number(formData.final_km) - Number(formData.initial_km)
    if (distance <= 0) {
      alert('KM Akhir Odometer harus lebih besar dari KM Awal!')
      return
    }

    const kmPerLiter = (distance / numericLiters).toFixed(2)
    const selectedVehicle = vehicles.find((v) => v.id === formData.vehicle_id)

    const newLog = {
      id: Date.now(),
      plate_number: selectedVehicle?.plate_number,
      driver_name: formData.driver_name,
      distance_km: distance,
      liters: numericLiters,
      km_per_liter: kmPerLiter,
      unit_price: unitPrice,
      total_cost: calculatedTotalCost,
      fuel_type: formData.fuel_type,
      created_at: new Date().toLocaleTimeString('id-ID'),
    }

    setLogs([newLog, ...logs])
    alert('Laporan pengisian BBM berhasil dikirim!')

    setFormData({
      vehicle_id: '',
      driver_name: '',
      initial_km: '',
      final_km: '',
      liters: '',
      fuel_type: 'Pertalite',
    })
  }

  return (
    <main className="max-w-xl mx-auto p-4 min-h-screen bg-slate-50 space-y-6 font-sans text-slate-800">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        
        <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
          <div>
            <h1 className="text-base font-bold text-slate-900">Laporan Pengisian BBM</h1>
            <p className="text-xs text-slate-500">Pencatatan penggunaan operasional harian</p>
          </div>
          <Link
            href="/admin"
            className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-3 py-1.5 rounded-lg border border-slate-200 transition"
          >
            Akses Admin →
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Pilih Kendaraan</label>
            <select
              required
              className="w-full p-2.5 border rounded-lg text-xs bg-white border-slate-300 focus:ring-2 focus:ring-slate-900 outline-none font-medium"
              value={formData.vehicle_id}
              onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
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
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Pengemudi</label>
            <input
              type="text"
              required
              placeholder="Contoh: Udin"
              className="w-full p-2.5 border rounded-lg text-xs border-slate-300 focus:ring-2 focus:ring-slate-900 outline-none"
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">KM Awal Odometer</label>
              <input
                type="number"
                required
                placeholder="45000"
                className="w-full p-2.5 border rounded-lg text-xs border-slate-300 focus:ring-2 focus:ring-slate-900 outline-none font-mono"
                value={formData.initial_km}
                onChange={(e) => setFormData({ ...formData, initial_km: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">KM Akhir Odometer</label>
              <input
                type="number"
                required
                placeholder="45420"
                className="w-full p-2.5 border rounded-lg text-xs border-slate-300 focus:ring-2 focus:ring-slate-900 outline-none font-mono"
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

          <button
            type="submit"
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 rounded-lg text-xs transition shadow-sm mt-2"
          >
            Kirim Laporan Pengisian
          </button>
        </form>
      </div>

      {logs.length > 0 && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="font-bold text-slate-900 mb-3 text-xs tracking-wider uppercase">Sesi Laporan Saat Ini</h2>
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                <div className="flex justify-between font-semibold text-slate-900">
                  <span>{log.plate_number} ({log.driver_name})</span>
                  <span className="font-mono">Rp {log.total_cost.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>{log.fuel_type} • {log.liters} L</span>
                  <span>Efisiensi: <strong className="text-slate-800 font-mono">{log.km_per_liter} KM/L</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}