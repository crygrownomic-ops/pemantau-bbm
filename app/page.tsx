'use client'

import { useState } from 'react'
import Link from 'next/link'

const MOCK_VEHICLES = [
  { id: '1', plate_number: 'B 1234 ABC', model: 'Toyota Avanza' },
  { id: '2', plate_number: 'B 5678 XYZ', model: 'Daihatsu Gran Max' },
  { id: '3', plate_number: 'B 9012 DEF', model: 'Isuzu Traga' },
]

const FUEL_TYPES = [
  'Pertalite',
  'Pertamax',
  'Pertamax Green 95',
  'Pertamax Turbo',
  'Biosolar / Solar',
  'Dexlite',
  'Pertamina Dex',
]

export default function Home() {
  const [logs, setLogs] = useState<any[]>([])
  const [rawCost, setRawCost] = useState<string>('')
  const [formattedCost, setFormattedCost] = useState<string>('')
  
  const [formData, setFormData] = useState({
    vehicle_id: '',
    driver_name: '',
    initial_km: '',
    final_km: '',
    liters: '',
    fuel_type: 'Pertalite',
  })

  // Format Angka Ribuan dengan Titik (cth: 350.000)
  const handleCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '')
    setRawCost(value)
    if (value) {
      setFormattedCost(Number(value).toLocaleString('id-ID'))
    } else {
      setFormattedCost('')
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const distance = Number(formData.final_km) - Number(formData.initial_km)
    if (distance <= 0) {
      alert('KM Akhir harus lebih besar dari KM Awal!')
      return
    }

    const kmPerLiter = (distance / Number(formData.liters)).toFixed(2)
    const selectedVehicle = MOCK_VEHICLES.find(v => v.id === formData.vehicle_id)

    const newLog = {
      id: Date.now(),
      plate_number: selectedVehicle?.plate_number,
      driver_name: formData.driver_name,
      distance_km: distance,
      liters: formData.liters,
      km_per_liter: kmPerLiter,
      total_cost: Number(rawCost),
      fuel_type: formData.fuel_type,
      created_at: new Date().toLocaleTimeString('id-ID'),
    }

    setLogs([newLog, ...logs])
    alert('Laporan BBM berhasil disimpan!')

    // Reset Form
    setFormData({
      vehicle_id: '',
      driver_name: '',
      initial_km: '',
      final_km: '',
      liters: '',
      fuel_type: 'Pertalite',
    })
    setRawCost('')
    setFormattedCost('')
  }

  return (
    <main className="max-w-xl mx-auto p-4 min-h-screen bg-gray-50 space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Form Laporan BBM</h1>
            <p className="text-xs text-gray-500">Input transaksi operasional pengisian BBM</p>
          </div>
          <Link
            href="/admin"
            className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold px-3 py-2 rounded-lg transition"
          >
            Akses Admin →
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Pilih Kendaraan</label>
            <select
              required
              className="w-full p-2.5 border rounded-lg text-sm bg-white border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.vehicle_id}
              onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
            >
              <option value="">-- Pilih Kendaraan Armada --</option>
              {MOCK_VEHICLES.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.plate_number} ({v.model})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Nama Pengemudi</label>
            <input
              type="text"
              required
              placeholder="Contoh: Budi Santoso"
              className="w-full p-2.5 border rounded-lg text-sm border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.driver_name}
              onChange={(e) => setFormData({ ...formData, driver_name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Jenis Bahan Bakar</label>
            <select
              className="w-full p-2.5 border rounded-lg text-sm bg-white border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.fuel_type}
              onChange={(e) => setFormData({ ...formData, fuel_type: e.target.value })}
            >
              {FUEL_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">KM Awal Odometer</label>
              <input
                type="number"
                required
                placeholder="45000"
                className="w-full p-2.5 border rounded-lg text-sm border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.initial_km}
                onChange={(e) => setFormData({ ...formData, initial_km: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">KM Akhir Odometer</label>
              <input
                type="number"
                required
                placeholder="45420"
                className="w-full p-2.5 border rounded-lg text-sm border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.final_km}
                onChange={(e) => setFormData({ ...formData, final_km: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Volume (Liter)</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="35.5"
                className="w-full p-2.5 border rounded-lg text-sm border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.liters}
                onChange={(e) => setFormData({ ...formData, liters: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Total Biaya (Rp)</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-sm text-gray-500 font-medium">Rp</span>
                <input
                  type="text"
                  required
                  placeholder="350.000"
                  className="w-full p-2.5 pl-9 border rounded-lg text-sm border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-gray-900"
                  value={formattedCost}
                  onChange={handleCostChange}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold text-sm hover:bg-blue-700 transition mt-2 shadow-sm"
          >
            Simpan Laporan BBM
          </button>
        </form>
      </div>

      {logs.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="font-bold text-gray-800 mb-3 text-sm">Riwayat Pengisian Sesi Ini</h2>
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="p-3 bg-gray-50 border border-gray-100 rounded-lg text-xs space-y-1">
                <div className="flex justify-between font-bold text-gray-800">
                  <span>{log.plate_number} ({log.driver_name})</span>
                  <span className="text-blue-600">Rp {log.total_cost.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>{log.fuel_type} • {log.liters} L</span>
                  <span>Efisiensi: <strong>{log.km_per_liter} KM/L</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}