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

const DEFAULT_DRIVERS = [
  { id: '1', name: 'Budi Santoso', phone: '081234567890', sim_type: 'SIM A', sim_expiry: '2027-12-31' },
  { id: '2', name: 'Ahmad Supardi', phone: '082198765432', sim_type: 'SIM B1', sim_expiry: '2026-09-15' },
  { id: '3', name: 'Dede Kurniawan', phone: '085712344321', sim_type: 'SIM B2 Umum', sim_expiry: '2026-08-10' },
]

function sanitizeVehicles(data: any) {
  if (!Array.isArray(data) || data.length === 0) return DEFAULT_VEHICLES
  return data.map((v, idx) => ({
    id: v?.id ? String(v.id) : String(idx + 1),
    plate_number: String(v?.plate_number || 'ARMADA').toUpperCase(),
    model: String(v?.model || 'Kendaraan'),
    monthly_budget: Number(v?.monthly_budget) || 0,
    last_km: Number(v?.last_km) || 0,
  }))
}

function sanitizeDrivers(data: any) {
  if (!Array.isArray(data) || data.length === 0) return DEFAULT_DRIVERS
  return data.map((d, idx) => ({
    id: d?.id ? String(d.id) : String(idx + 1),
    name: String(d?.name || 'Driver'),
    phone: String(d?.phone || '-'),
    sim_type: String(d?.sim_type || 'SIM A'),
    sim_expiry: String(d?.sim_expiry || '2026-12-31'),
  }))
}

export default function SettingsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState(false)

  const [prices, setPrices] = useState<Record<string, number>>(DEFAULT_PRICES)
  const [vehicles, setVehicles] = useState(DEFAULT_VEHICLES)
  const [drivers, setDrivers] = useState(DEFAULT_DRIVERS)

  // State Form Armada
  const [editingId, setEditingId] = useState<string | null>(null)
  const [vehicleForm, setVehicleForm] = useState({ plate_number: '', model: '', monthly_budget: '', last_km: '' })

  // State Form Driver
  const [editingDriverId, setEditingDriverId] = useState<string | null>(null)
  const [driverForm, setDriverForm] = useState({ name: '', phone: '', sim_type: 'SIM A', sim_expiry: '' })

  const [savedSuccess, setSavedSuccess] = useState(false)

  useEffect(() => {
    try {
      const localPrices = localStorage.getItem('fuel_prices')
      const localVehicles = localStorage.getItem('vehicle_budgets')
      const localDrivers = localStorage.getItem('driver_list')

      if (localPrices) setPrices(JSON.parse(localPrices))
      if (localVehicles) setVehicles(sanitizeVehicles(JSON.parse(localVehicles)))
      if (localDrivers) setDrivers(sanitizeDrivers(JSON.parse(localDrivers)))
    } catch (err) {
      console.error('Error parsing settings localstorage:', err)
    }
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

  // Simpan / Edit Armada
  const handleSaveVehicle = (e: React.FormEvent) => {
    e.preventDefault()
    if (!vehicleForm.plate_number || !vehicleForm.model) return

    const upperPlate = vehicleForm.plate_number.trim().toUpperCase()
    const budgetNum = Number(vehicleForm.monthly_budget.replace(/[^0-9]/g, '')) || 0
    const kmNum = Number(vehicleForm.last_km.replace(/[^0-9]/g, '')) || 0

    let updated: any[]
    if (editingId) {
      updated = vehicles.map((v) =>
        String(v.id) === String(editingId)
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

  // Simpan / Edit Driver
  const handleSaveDriver = (e: React.FormEvent) => {
    e.preventDefault()
    if (!driverForm.name) return

    let updated: any[]
    if (editingDriverId) {
      updated = drivers.map((d) =>
        String(d.id) === String(editingDriverId)
          ? { ...d, name: driverForm.name, phone: driverForm.phone, sim_type: driverForm.sim_type, sim_expiry: driverForm.sim_expiry }
          : d
      )
      setEditingDriverId(null)
    } else {
      const newDriver = {
        id: Date.now().toString(),
        name: driverForm.name,
        phone: driverForm.phone || '-',
        sim_type: driverForm.sim_type || 'SIM A',
        sim_expiry: driverForm.sim_expiry || '2026-12-31',
      }
      updated = [...drivers, newDriver]
    }

    setDrivers(updated)
    localStorage.setItem('driver_list', JSON.stringify(updated))
    setDriverForm({ name: '', phone: '', sim_type: 'SIM A', sim_expiry: '' })
    showSuccessNotification()
  }

  const handleEditVehicleClick = (v: any) => {
    setEditingId(String(v.id))
    setVehicleForm({
      plate_number: String(v.plate_number || '').toUpperCase(),
      model: String(v.model || ''),
      monthly_budget: (Number(v.monthly_budget) || 0).toString(),
      last_km: (Number(v.last_km) || 0).toString(),
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDeleteVehicleClick = (v: any) => {
    if (confirm(`Hapus armada ${v.plate_number}?`)) {
      const updatedVehicles = vehicles.filter((item) => String(item.id) !== String(v.id))
      setVehicles(updatedVehicles)
      localStorage.setItem('vehicle_budgets', JSON.stringify(updatedVehicles))
      showSuccessNotification()
    }
  }

  const handleEditDriverClick = (d: any) => {
    setEditingDriverId(String(d.id))
    setDriverForm({
      name: d.name,
      phone: d.phone,
      sim_type: d.sim_type,
      sim_expiry: d.sim_expiry,
    })
  }

  const handleDeleteDriverClick = (d: any) => {
    if (confirm(`Hapus data driver ${d.name}?`)) {
      const updatedDrivers = drivers.filter((item) => String(item.id) !== String(d.id))
      setDrivers(updatedDrivers)
      localStorage.setItem('driver_list', JSON.stringify(updatedDrivers))
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
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
        <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm w-full space-y-5 text-center">
          <div className="w-12 h-12 bg-slate-900 text-amber-400 rounded-xl flex items-center justify-center mx-auto text-xl font-bold">
            ⚙️
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900">Autentikasi Master Data</h1>
            <p className="text-xs text-slate-500 mt-0.5">Masukkan PIN Administrator</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="password"
              maxLength={4}
              placeholder="••••"
              className="w-full text-center text-2xl tracking-widest py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none font-mono font-bold bg-slate-50"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
            />

            {pinError && (
              <p className="text-xs text-rose-600 font-semibold">PIN tidak valid (Default: 1234)</p>
            )}

            <button
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl text-xs transition shadow-md"
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
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between font-sans text-slate-800">
      <div className="max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-6">
        
        <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Pengaturan Master Data Perusahaan</h1>
            <p className="text-xs text-slate-500 mt-0.5">Manajemen armada, master pengemudi & tarif BBM</p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/admin/backup"
              className="text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl transition shadow-sm"
            >
              💾 Pusat Backup
            </Link>
            <Link
              href="/admin"
              className="text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl transition border border-slate-200"
            >
              ← Dashboard
            </Link>
          </div>
        </div>

        {savedSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between shadow-sm">
            <span>Perubahan data berhasil disimpan!</span>
            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}

        {/* 1. MASTER ARMADA KENDARAAN */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
          <h2 className="text-xs font-bold text-slate-900 tracking-wider uppercase flex items-center gap-2">
            <span>🚚</span> {editingId ? 'Edit Data Kendaraan' : 'Tambah Armada Kendaraan Baru'}
          </h2>

          <form onSubmit={handleSaveVehicle} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Plat Nomor</label>
              <input
                type="text"
                required
                placeholder="B 1234 ABC"
                className="w-full p-2.5 border rounded-xl text-xs border-slate-300 focus:ring-2 focus:ring-slate-900 outline-none font-bold uppercase"
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
                className="w-full p-2.5 border rounded-xl text-xs border-slate-300 focus:ring-2 focus:ring-slate-900 outline-none"
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
                className="w-full p-2.5 border rounded-xl text-xs border-slate-300 focus:ring-2 focus:ring-slate-900 outline-none font-mono font-semibold"
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
                className="w-full p-2.5 border rounded-xl text-xs border-slate-300 focus:ring-2 focus:ring-slate-900 outline-none font-mono font-semibold"
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
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded-xl font-medium"
                >
                  Batal
                </button>
              )}
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs rounded-xl font-bold transition shadow-sm"
              >
                {editingId ? 'Update Kendaraan' : '+ Tambah Armada'}
              </button>
            </div>
          </form>

          <div className="divide-y divide-slate-100 pt-3 border-t">
            {vehicles.map((v) => (
              <div key={v.id} className="py-3 flex items-center justify-between hover:bg-slate-50 transition px-1 rounded-lg">
                <div>
                  <div className="text-xs font-bold text-slate-900 uppercase">
                    {v.plate_number.toUpperCase()} <span className="font-normal text-slate-600">({v.model})</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Pagu: <span className="font-mono font-semibold text-slate-700">Rp {(Number(v.monthly_budget) || 0).toLocaleString('id-ID')}</span> • Position Odometer: <span className="font-mono font-bold text-slate-800">{(Number(v.last_km) || 0).toLocaleString('id-ID')} KM</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditVehicleClick(v)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-bold px-2.5 py-1 bg-blue-50 rounded-lg"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteVehicleClick(v)}
                    className="text-xs text-rose-600 hover:text-rose-800 font-bold px-2.5 py-1 bg-rose-50 rounded-lg"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. MASTER DATA PENGEMUDI (DRIVER MANAGEMENT) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
          <h2 className="text-xs font-bold text-slate-900 tracking-wider uppercase flex items-center gap-2">
            <span>👨‍✈️</span> {editingDriverId ? 'Edit Data Pengemudi' : 'Tambah Master Pengemudi (Driver)'}
          </h2>

          <form onSubmit={handleSaveDriver} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nama Lengkap Driver</label>
              <input
                type="text"
                required
                placeholder="Budi Santoso"
                className="w-full p-2.5 border rounded-xl text-xs border-slate-300 focus:ring-2 focus:ring-slate-900 outline-none font-bold"
                value={driverForm.name}
                onChange={(e) => setDriverForm({ ...driverForm, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nomor Kontak / WhatsApp</label>
              <input
                type="text"
                placeholder="081234567890"
                className="w-full p-2.5 border rounded-xl text-xs border-slate-300 focus:ring-2 focus:ring-slate-900 outline-none font-mono"
                value={driverForm.phone}
                onChange={(e) => setDriverForm({ ...driverForm, phone: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Golongan SIM</label>
              <select
                className="w-full p-2.5 border rounded-xl text-xs border-slate-300 focus:ring-2 focus:ring-slate-900 outline-none font-semibold bg-white"
                value={driverForm.sim_type}
                onChange={(e) => setDriverForm({ ...driverForm, sim_type: e.target.value })}
              >
                <option value="SIM A">SIM A (Mobil Penumpang/Barang ringan)</option>
                <option value="SIM B1">SIM B1 (Bus / Truk Sedang)</option>
                <option value="SIM B1 Umum">SIM B1 Umum</option>
                <option value="SIM B2">SIM B2 (Truk Tronton/Alat Berat)</option>
                <option value="SIM B2 Umum">SIM B2 Umum (Truk Gandeng/Kontainer)</option>
                <option value="SIM C">SIM C (Sepeda Motor)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Masa Berlaku SIM</label>
              <input
                type="date"
                required
                className="w-full p-2.5 border rounded-xl text-xs border-slate-300 focus:ring-2 focus:ring-slate-900 outline-none font-medium"
                value={driverForm.sim_expiry}
                onChange={(e) => setDriverForm({ ...driverForm, sim_expiry: e.target.value })}
              />
            </div>

            <div className="sm:col-span-2 flex justify-end gap-2 pt-1">
              {editingDriverId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingDriverId(null)
                    setDriverForm({ name: '', phone: '', sim_type: 'SIM A', sim_expiry: '' })
                  }}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded-xl font-medium"
                >
                  Batal
                </button>
              )}
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs rounded-xl font-bold transition shadow-sm"
              >
                {editingDriverId ? 'Update Driver' : '+ Tambah Driver'}
              </button>
            </div>
          </form>

          {/* Tabel Pengemudi */}
          <div className="divide-y divide-slate-100 pt-3 border-t">
            {drivers.map((d) => {
              const todayStr = new Date().toISOString().split('T')[0]
              const isExpired = d.sim_expiry < todayStr

              return (
                <div key={d.id} className="py-3 flex items-center justify-between hover:bg-slate-50 transition px-1 rounded-lg">
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      {d.name} <span className="font-semibold text-slate-500">({d.phone})</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {d.sim_type} • Masa Berlaku SIM: <span className={`font-mono font-bold ${isExpired ? 'text-rose-600' : 'text-slate-800'}`}>{d.sim_expiry}</span>
                      {isExpired && <span className="ml-2 bg-rose-100 text-rose-700 text-[10px] font-bold px-1.5 py-0.5 rounded">EXPIRED</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditDriverClick(d)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-bold px-2.5 py-1 bg-blue-50 rounded-lg"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteDriverClick(d)}
                      className="text-xs text-rose-600 hover:text-rose-800 font-bold px-2.5 py-1 bg-rose-50 rounded-lg"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 3. TARIF BBM */}
        <form onSubmit={handleSavePrices} className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
          <h2 className="text-xs font-bold text-slate-900 tracking-wider uppercase flex items-center gap-2">
            <span>⛽</span> Tarif Bahan Bakar (Per Liter)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {Object.keys(prices).map((type) => (
              <div key={type} className="flex flex-col space-y-1">
                <label className="text-xs font-medium text-slate-600">{type}</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-medium">Rp</span>
                  <input
                    type="text"
                    required
                    className="w-full py-2.5 pl-9 pr-3 border rounded-xl text-xs border-slate-300 focus:ring-2 focus:ring-slate-900 outline-none font-semibold text-slate-900 font-mono"
                    value={prices[type] ? prices[type].toLocaleString('id-ID') : ''}
                    onChange={(e) => handlePriceChange(type, e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            type="submit"
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl text-xs transition shadow-sm mt-2"
          >
            Simpan Tarif BBM
          </button>
        </form>

      </div>

      <footer className="py-4 text-center border-t border-slate-200 bg-white text-[11px] text-slate-500 font-medium mt-8">
        Developed by <span className="font-bold text-slate-800">Urai Ikhsan Fadhilah</span>
      </footer>
    </div>
  )
}