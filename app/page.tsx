'use client'

import { useState } from 'react'
import Link from 'next/link'

// Data tiruan master kendaraan
const MOCK_VEHICLES = [
  { id: '1', plate_number: 'B 1234 ABC', model: 'Toyota Avanza' },
  { id: '2', plate_number: 'B 5678 XYZ', model: 'Daihatsu Gran Max' },
  { id: '3', plate_number: 'B 9012 DEF', model: 'Isuzu Traga' },
]

export default function Home() {
  const [logs, setLogs] = useState<any[]>([])
  const [formData, setFormData] = useState({
    vehicle_id: '',
    driver_name: '',
    initial_km: '',
    final_km: '',
    liters: '',
    total_cost: '',
    fuel_type: 'Pertalite',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Kalkulasi lokal
    const distance = Number(formData.final_km) - Number(formData.initial_km)
    const kmPerLiter = (distance / Number(formData.liters)).toFixed(2)
    const selectedVehicle = MOCK_VEHICLES.find(v => v.id === formData.vehicle_id)

    const newLog = {
      id: Date.now(),
      plate_number: selectedVehicle?.plate_number,
      driver_name: formData.driver_name,
      distance_km: distance,
      km_per_liter: kmPerLiter,
      total_cost: formData.total_cost,
      fuel_type: formData.fuel_type,
      created_at: new Date().toLocaleTimeString(),
    }

    setLogs([newLog, ...logs])
    alert('Log berhasil ditambahkan ke memori lokal!')
  }

  return (
    <main className="max-w-xl mx-auto p-4 min-h-screen bg-gray-50 space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        
        {/* Header Form & Tombol Navigasi Admin */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold text-gray-800">Input BBM (Versi Preview)</h1>
          <Link
            href="/admin"
            className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium px-3 py-1.5 rounded-lg transition"
          >
            Dashboard Admin →
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Kendaraan</label>
            <select
              required
              className="w-full p-2.5 border rounded-lg text-sm mt-1 bg-white"
              value={formData.vehicle_id}
              onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
            >
              <option value="">-- Pilih Kendaraan --</option>
              {MOCK_VEHICLES.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.plate_number} ({v.model})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Nama Pengemudi</label>
            <input
              type="text"
              required
              className="w-full p-2.5 border rounded-lg text-sm mt-1"
              onChange={(e) => setFormData({ ...formData, driver_name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">KM Awal</label>
              <input
                type="number"
                required
                className="w-full p-2.5 border rounded-lg text-sm mt-1"
                onChange={(e) => setFormData({ ...formData, initial_km: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">KM Akhir</label>
              <input
                type="number"
                required
                className="w-full p-2.5 border rounded-lg text-sm mt-1"
                onChange={(e) => setFormData({ ...formData, final_km: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Liter</label>
              <input
                type="number"
                step="0.1"
                required
                className="w-full p-2.5 border rounded-lg text-sm mt-1"
                onChange={(e) => setFormData({ ...formData, liters: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Total Biaya (Rp)</label>
              <input
                type="number"
                required
                className="w-full p-2.5 border rounded-lg text-sm mt-1"
                onChange={(e) => setFormData({ ...formData, total_cost: e.target.value })}
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-blue-700 transition mt-2"
          >
            Simpan Laporan
          </button>
        </form>
      </div>

      {/* Tabel Preview Hasil Input */}
      {logs.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="font-bold text-gray-800 mb-3 text-sm">Riwayat Sesi Ini</h2>
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="p-3 bg-gray-50 border rounded-lg text-xs space-y-1">
                <div className="flex justify-between font-bold text-gray-700">
                  <span>{log.plate_number} ({log.driver_name})</span>
                  <span>Rp {Number(log.total_cost).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Efisiensi: {log.km_per_liter} KM/L</span>
                  <span>Jarak: {log.distance_km} KM</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}