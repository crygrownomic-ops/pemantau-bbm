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
  { id: '1', plate_number: 'B 1234 ABC', model: 'Toyota Avanza', monthly_budget: 1500000, last_km: 45000 },
  { id: '2', plate_number: 'B 5678 XYZ', model: 'Daihatsu Gran Max', monthly_budget: 2000000, last_km: 32000 },
  { id: '3', plate_number: 'B 9012 DEF', model: 'Isuzu Traga', monthly_budget: 2500000, last_km: 18500 },
]

export default function SettingsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState(false)

  const [prices, setPrices] = useState<Record<string, number>>(DEFAULT_PRICES)
  const [vehicles, setVehicles] = useState(DEFAULT_VEHICLES)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [vehicleForm, setVehicleForm] = useState({ plate_number: '', model: '', monthly_budget: '', last_km: '' })
  const [savedSuccess, setSavedSuccess] = useState(false)

  useEffect(() => {
    const localPrices = localStorage.getItem('fuel_prices')
    const localVehicles = localStorage.getItem('vehicle_budgets')
    if (localPrices) setPrices(JSON.parse(localPrices))
    if (localVehicles) setVehicles(JSON.parse(localVehicles))
  }, [])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (pinInput === '1234') {
      setIsAuthenticated(true)
      setPinError(false)
    } else {
      setPinError(true)
    }
  }

  const handlePriceChange = (fuelType: string, val: string) => {
    const num = Number(val.replace(/[^0-9]/g, ''))
    setPrices((prev) => ({ ...prev, [fuelType]: num }))
  }

  const handleSaveVehicle = (e: React.FormEvent) => {
    e.preventDefault()
    if (!vehicleForm.plate_number || !vehicleForm.model) return

    const upperPlate = vehicleForm.plate_number.trim().toUpperCase()
    const budgetNum = Number(vehicleForm.monthly_budget.replace(/[^0-9]/g, '')) || 0
    const kmNum = Number(vehicleForm.last_km.replace(/[^0-9]/g, '')) || 0

    let updated: any[]
    if (editingId) {
      updated = vehicles.map((v) =>
        v.id === editingId
          ? { ...v, plate_number: upperPlate, model: vehicleForm.model, monthly_budget: budgetNum, last_km: kmNum }
          : v
      )
      setEditingId(null)
    } else {
      const newVehicle = {
        id: Date.now().toString(),
        plate_number: upperPlate,
        model: vehicleForm.model,
        monthly_budget: budgetNum,
        last_km: kmNum,
      }
      updated = [...vehicles, newVehicle]
    }

    setVehicles(updated)
    localStorage.setItem('vehicle_budgets', JSON.stringify(updated))
    setVehicleForm({ plate_number: '', model: '', monthly_budget: '', last_km: '' })
    showSuccessNotification()
  }

  const handleEditClick = (v: any) => {
    setEditingId(v.id)
    setVehicleForm({
      plate_number: v.plate_number.toUpperCase(),
      model: v.model,
      monthly_budget: v.monthly_budget.toString(),
      last_km: v.last_km ? v.last_km.toString() : '0',
    })
  }

  // Hapus Armada Sekaligus Membersihkan Log Transaksinya
  const handleDeleteClick = (v: any) => {
    if (confirm(`Hapus armada ${v.plate_number}? Seluruh riwayat transaksi armada ini juga akan dibersihkan.`)) {
      const updatedVehicles = vehicles.filter((item) => item.id !== v.id)
      setVehicles(updatedVehicles)
      localStorage.setItem('vehicle_budgets', JSON.stringify(updatedVehicles))

      // Clean-up transaksi terikat
      const storedLogs = localStorage.getItem('fuel_logs')
      if (storedLogs) {
        const logs = JSON.parse(storedLogs)
        const cleanedLogs = logs.filter((l: any) => l.plate_number !== v.plate_number)
        localStorage.setItem('fuel_logs', JSON.stringify(cleanedLogs))
      }

      showSuccessNotification()
    }
  }

  const handleSavePrices = (e: React.FormEvent) => {
    e.preventDefault()
    localStorage.setItem('fuel_prices', JSON.stringify(prices))
    showSuccessNotification()
  }

  const showSuccessNotification = () => {
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 2500)
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-800">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 max-w-sm w-full space-y-5 text-center">
          <div className="w-10 h-10 bg-slate-100 border border-slate-200 text-slate-700 rounded-lg flex items-center justify-center mx-auto">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900">Autentikasi Pengaturan</h1>
            <p className="text-xs text-slate-500 mt-0.5">Masukkan PIN Administrator</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="password"
              maxLength={4}
              placeholder="••••"
              className="w-full text-center text-xl tracking-widest py-2.5 border rounded-lg border-slate-300 focus:ring-2 focus:ring-slate-900 outline-none font-mono font-bold"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
            />

            {pinError && (
              <p className="text-xs text-rose-600 font-medium">PIN tidak valid (Default: 1234)</p>
            )}

            <button
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 rounded-lg text-xs transition"
            >
              Verifikasi
            </button>
          </form>

          <Link href="/admin" className="inline-block text-xs text-slate-500 hover:text-slate-800 font-medium transition pt-1">
            ← Kembali ke Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 font-sans text-slate-800">
      <div className="max-w-3xl mx-auto space-y-6">
        
        <div className="flex justify-between items-center bg-white p-5 rounded-xl border border-slate-200">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Pengaturan Master Data</h1>
            <p className="text-xs text-slate-500 mt-0.5">Manajemen armada, patokan Odometer & tarif BBM</p>
          </div>
          <Link
            href="/admin"
            className="text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg transition border border-slate-200"
          >
            ← Ke Dashboard
          </Link>
        </div>

        {savedSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center justify-between">
            <span>Perubahan data berhasil disimpan!</span>
            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}

        {/* Form Pendaftaran / Edit Armada */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
          <h2 className="text-xs font-bold text-slate-900 tracking-wider uppercase">
            {editingId ? 'Edit Data Kendaraan' : 'Tambah Armada Kendaraan Baru'}
          </h2>

          <form onSubmit={handleSaveVehicle} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Plat Nomor</label>
              <input
                type="text"
                required
                placeholder="B 1234 ABC"
                className="w-full p-2 border rounded-lg text-xs border-slate-300 focus:ring-2 focus:ring-slate-900 outline-none font-bold uppercase"
                value={vehicleForm.plate_number}
                onChange={(e) => setVehicleForm({ ...vehicleForm, plate_number: e.target.value.toUpperCase() })}
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Model / Tipe</label>
              <input
                type="text"
                required
                placeholder="Toyota Avanza"
                className="w-full p-2 border rounded-lg text-xs border-slate-300 focus:ring-2 focus:ring-slate-900 outline-none"
                value={vehicleForm.model}
                onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Pagu Anggaran Bulanan (Rp)</label>
              <input
                type="text"
                required
                placeholder="1.500.000"
                className="w-full p-2 border rounded-lg text-xs border-slate-300 focus:ring-2 focus:ring-slate-900 outline-none font-mono font-semibold"
                value={vehicleForm.monthly_budget ? Number(vehicleForm.monthly_budget.replace(/[^0-9]/g, '')).toLocaleString('id-ID') : ''}
                onChange={(e) => setVehicleForm({ ...vehicleForm, monthly_budget: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Patokan KM Odometer Awal</label>
              <input
                type="text"
                required
                placeholder="45000"
                className="w-full p-2 border rounded-lg text-xs border-slate-300 focus:ring-2 focus:ring-slate-900 outline-none font-mono font-semibold"
                value={vehicleForm.last_km ? Number(vehicleForm.last_km.replace(/[^0-9]/g, '')).toLocaleString('id-ID') : ''}
                onChange={(e) => setVehicleForm({ ...vehicleForm, last_km: e.target.value })}
              />
            </div>

            <div className="sm:col-span-2 flex justify-end gap-2 pt-1">
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null)
                    setVehicleForm({ plate_number: '', model: '', monthly_budget: '', last_km: '' })
                  }}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded-lg font-medium"
                >
                  Batal
                </button>
              )}
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs rounded-lg font-medium transition"
              >
                {editingId ? 'Update Kendaraan' : '+ Tambah Armada'}
              </button>
            </div>
          </form>
        </div>

        {/* Tabel Daftar Armada */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h2 className="text-xs font-bold text-slate-900 tracking-wider uppercase">Daftar Armada Aktif ({vehicles.length})</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {vehicles.map((v) => (
              <div key={v.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition">
                <div>
                  <div className="text-xs font-bold text-slate-900 uppercase">
                    {v.plate_number.toUpperCase()} <span className="font-normal text-slate-600">({v.model})</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Pagu: <span className="font-mono font-semibold text-slate-700">Rp {Number(v.monthly_budget).toLocaleString('id-ID')}</span> • Position Odometer: <span className="font-mono font-bold text-slate-800">{v.last_km ? Number(v.last_km).toLocaleString('id-ID') : 0} KM</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditClick(v)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 bg-blue-50 rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteClick(v)}
                    className="text-xs text-rose-600 hover:text-rose-800 font-medium px-2 py-1 bg-rose-50 rounded"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Form Tarif BBM */}
        <form onSubmit={handleSavePrices} className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
          <h2 className="text-xs font-bold text-slate-900 tracking-wider uppercase">Tarif Bahan Bakar (Per Liter)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {Object.keys(prices).map((type) => (
              <div key={type} className="flex flex-col space-y-1">
                <label className="text-xs font-medium text-slate-600">{type}</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-medium">Rp</span>
                  <input
                    type="text"
                    required
                    className="w-full py-2 pl-9 pr-3 border rounded-lg text-xs border-slate-300 focus:ring-2 focus:ring-slate-900 outline-none font-semibold text-slate-900 font-mono"
                    value={prices[type] ? prices[type].toLocaleString('id-ID') : ''}
                    onChange={(e) => handlePriceChange(type, e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            type="submit"
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 rounded-lg text-xs transition shadow-sm mt-2"
          >
            Simpan Tarif BBM
          </button>
        </form>

      </div>
    </div>
  )
}