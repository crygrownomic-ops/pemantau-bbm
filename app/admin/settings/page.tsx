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
  { id: '1', plate_number: 'B 1234 ABC', model: 'Toyota Avanza', monthly_budget: 1500000, last_km: 45320, is_active: true },
  { id: '2', plate_number: 'B 5678 XYZ', model: 'Daihatsu Gran Max', monthly_budget: 2000000, last_km: 32000, is_active: true },
  { id: '3', plate_number: 'B 9012 DEF', model: 'Isuzu Traga', monthly_budget: 2500000, last_km: 18500, is_active: true },
]

const DEFAULT_DRIVERS = [
  {
    id: '1',
    name: 'Budi Santoso',
    nik: '3171012304850001',
    phone: '081234567890',
    address: 'Jl. Merdeka No. 45, Kebayoran Baru, Jakarta Selatan',
    sim_type: 'SIM A',
    sim_number: '9203-1284-0012',
    sim_expiry: '2027-12-31',
    employment_status: 'Karyawan Tetap',
    join_date: '2023-01-15',
    emergency_contact: 'Siti Rahma (Istri) - 081299887766',
    evaluation_notes: 'Pengemudi sangat disiplin, selalu merawat kendaraan dengan baik, rasio efisiensi BBM selalu konsisten irit.',
    is_active: true,
  },
  {
    id: '2',
    name: 'Ahmad Supardi',
    nik: '3172041208880003',
    phone: '082198765432',
    address: 'Jl. Mangga Dua Raya No. 12, Jakarta Barat',
    sim_type: 'SIM B1',
    sim_number: '8841-5520-9943',
    sim_expiry: '2026-09-15',
    employment_status: 'Karyawan Kontrak',
    join_date: '2024-03-01',
    emergency_contact: 'Bambang (Kakak) - 085711223344',
    evaluation_notes: 'Cukup baik dalam ketepatan waktu pengiriman. Perlu perhatian pada konsumsi BBM di rute tol.',
    is_active: true,
  },
  {
    id: '3',
    name: 'Dede Kurniawan',
    nik: '3275082511900005',
    phone: '085712344321',
    address: 'Jl. Raden Fatah No. 88, Ciledug, Tangerang',
    sim_type: 'SIM B2 Umum',
    sim_number: '7712-9001-4432',
    sim_expiry: '2026-08-10',
    employment_status: 'Harian / Borongan',
    join_date: '2025-06-10',
    emergency_contact: 'Dewi (Istri) - 081344556677',
    evaluation_notes: 'SIM kedaluwarsa perlu dibantu proses perpanjangan segera. Pengalaman mengemudi truk tronton sangat matang.',
    is_active: true,
  },
]

const DEFAULT_COMPANY = {
  name: 'PT. Transportasi Operasional Jaya',
  tagline: 'Solusi Logistik & Armada Terpercaya',
  address: 'Jl. Jendral Sudirman No. 123, Jakarta Selatan',
  phone: '(021) 555-0199',
}

function sanitizeVehicles(data: any) {
  if (!Array.isArray(data) || data.length === 0) return DEFAULT_VEHICLES
  return data.map((v, idx) => ({
    id: v?.id ? String(v.id) : String(idx + 1),
    plate_number: String(v?.plate_number || 'ARMADA').toUpperCase(),
    model: String(v?.model || 'Kendaraan'),
    monthly_budget: Number(v?.monthly_budget) || 0,
    last_km: Number(v?.last_km) || 0,
    is_active: v?.is_active !== undefined ? Boolean(v.is_active) : true,
  }))
}

function sanitizeDrivers(data: any) {
  if (!Array.isArray(data) || data.length === 0) return DEFAULT_DRIVERS
  return data.map((d, idx) => ({
    id: d?.id ? String(d.id) : String(idx + 1),
    name: String(d?.name || 'Driver'),
    nik: String(d?.nik || '-'),
    phone: String(d?.phone || '-'),
    address: String(d?.address || '-'),
    sim_type: String(d?.sim_type || 'SIM A'),
    sim_number: String(d?.sim_number || '-'),
    sim_expiry: String(d?.sim_expiry || '2026-12-31'),
    employment_status: String(d?.employment_status || 'Karyawan Tetap'),
    join_date: String(d?.join_date || '2024-01-01'),
    emergency_contact: String(d?.emergency_contact || '-'),
    evaluation_notes: String(d?.evaluation_notes || 'Belum ada catatan evaluasi.'),
    is_active: d?.is_active !== undefined ? Boolean(d.is_active) : true,
  }))
}

export default function SettingsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState(false)

  // State Tab & Sidebar
  const [activeTab, setActiveTab] = useState<'drivers' | 'vehicles' | 'prices' | 'company'>('drivers')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [prices, setPrices] = useState<Record<string, number>>(DEFAULT_PRICES)
  const [vehicles, setVehicles] = useState(DEFAULT_VEHICLES)
  const [drivers, setDrivers] = useState(DEFAULT_DRIVERS)
  const [company, setCompany] = useState(DEFAULT_COMPANY)

  // Search Filter
  const [searchQuery, setSearchQuery] = useState('')

  // State Form Armada
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null)
  const [vehicleForm, setVehicleForm] = useState({ plate_number: '', model: '', monthly_budget: '', last_km: '', is_active: true })

  // State Form Driver Lengkap (Biodata)
  const [editingDriverId, setEditingDriverId] = useState<string | null>(null)
  const [driverForm, setDriverForm] = useState({
    name: '',
    nik: '',
    phone: '',
    address: '',
    sim_type: 'SIM A',
    sim_number: '',
    sim_expiry: '',
    employment_status: 'Karyawan Tetap',
    join_date: '',
    emergency_contact: '',
    evaluation_notes: '',
    is_active: true,
  })

  // State Modal Preview Biodata Driver
  const [selectedDriverProfile, setSelectedDriverProfile] = useState<any | null>(null)

  const [savedSuccess, setSavedSuccess] = useState(false)

  useEffect(() => {
    try {
      const localPrices = localStorage.getItem('fuel_prices')
      const localVehicles = localStorage.getItem('vehicle_budgets')
      const localDrivers = localStorage.getItem('driver_list')
      const localCompany = localStorage.getItem('company_profile')

      if (localPrices) setPrices(JSON.parse(localPrices))
      if (localVehicles) setVehicles(sanitizeVehicles(JSON.parse(localVehicles)))
      if (localDrivers) setDrivers(sanitizeDrivers(JSON.parse(localDrivers)))
      if (localCompany) setCompany(JSON.parse(localCompany))
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

  const showSuccessNotification = () => {
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 2500)
  }

  // HANDLERS ARMADA
  const handleSaveVehicle = (e: React.FormEvent) => {
    e.preventDefault()
    if (!vehicleForm.plate_number || !vehicleForm.model) return

    const upperPlate = vehicleForm.plate_number.trim().toUpperCase()
    const budgetNum = Number(vehicleForm.monthly_budget.replace(/[^0-9]/g, '')) || 0
    const kmNum = Number(vehicleForm.last_km.replace(/[^0-9]/g, '')) || 0

    let updated: any[]
    if (editingVehicleId) {
      updated = vehicles.map((v) =>
        String(v.id) === String(editingVehicleId)
          ? { ...v, plate_number: upperPlate, model: vehicleForm.model, monthly_budget: budgetNum, last_km: kmNum, is_active: vehicleForm.is_active }
          : v
      )
      setEditingVehicleId(null)
    } else {
      const newVehicle = {
        id: Date.now().toString(),
        plate_number: upperPlate,
        model: vehicleForm.model,
        monthly_budget: budgetNum,
        last_km: kmNum,
        is_active: true,
      }
      updated = [...vehicles, newVehicle]
    }

    setVehicles(updated)
    localStorage.setItem('vehicle_budgets', JSON.stringify(updated))
    setVehicleForm({ plate_number: '', model: '', monthly_budget: '', last_km: '', is_active: true })
    showSuccessNotification()
  }

  const handleEditVehicleClick = (v: any) => {
    setEditingVehicleId(String(v.id))
    setVehicleForm({
      plate_number: String(v.plate_number || '').toUpperCase(),
      model: String(v.model || ''),
      monthly_budget: (Number(v.monthly_budget) || 0).toString(),
      last_km: (Number(v.last_km) || 0).toString(),
      is_active: v.is_active !== undefined ? v.is_active : true,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleToggleVehicleStatus = (v: any) => {
    const updated = vehicles.map((item) =>
      String(item.id) === String(v.id) ? { ...item, is_active: !item.is_active } : item
    )
    setVehicles(updated)
    localStorage.setItem('vehicle_budgets', JSON.stringify(updated))
    showSuccessNotification()
  }

  const handleDeleteVehicleClick = (v: any) => {
    if (confirm(`Hapus armada ${v.plate_number}?`)) {
      const updatedVehicles = vehicles.filter((item) => String(item.id) !== String(v.id))
      setVehicles(updatedVehicles)
      localStorage.setItem('vehicle_budgets', JSON.stringify(updatedVehicles))
      showSuccessNotification()
    }
  }

  // HANDLERS DRIVER BIODATA LENGKAP
  const handleSaveDriver = (e: React.FormEvent) => {
    e.preventDefault()
    if (!driverForm.name) return

    let updated: any[]
    if (editingDriverId) {
      updated = drivers.map((d) =>
        String(d.id) === String(editingDriverId)
          ? {
              ...d,
              name: driverForm.name,
              nik: driverForm.nik || '-',
              phone: driverForm.phone || '-',
              address: driverForm.address || '-',
              sim_type: driverForm.sim_type,
              sim_number: driverForm.sim_number || '-',
              sim_expiry: driverForm.sim_expiry,
              employment_status: driverForm.employment_status,
              join_date: driverForm.join_date || new Date().toISOString().split('T')[0],
              emergency_contact: driverForm.emergency_contact || '-',
              evaluation_notes: driverForm.evaluation_notes || 'Belum ada catatan evaluasi.',
              is_active: driverForm.is_active,
            }
          : d
      )
      setEditingDriverId(null)
    } else {
      const newDriver = {
        id: Date.now().toString(),
        name: driverForm.name,
        nik: driverForm.nik || '-',
        phone: driverForm.phone || '-',
        address: driverForm.address || '-',
        sim_type: driverForm.sim_type || 'SIM A',
        sim_number: driverForm.sim_number || '-',
        sim_expiry: driverForm.sim_expiry || '2026-12-31',
        employment_status: driverForm.employment_status || 'Karyawan Tetap',
        join_date: driverForm.join_date || new Date().toISOString().split('T')[0],
        emergency_contact: driverForm.emergency_contact || '-',
        evaluation_notes: driverForm.evaluation_notes || 'Belum ada catatan evaluasi.',
        is_active: true,
      }
      updated = [...drivers, newDriver]
    }

    setDrivers(updated)
    localStorage.setItem('driver_list', JSON.stringify(updated))
    resetDriverForm()
    showSuccessNotification()
  }

  const resetDriverForm = () => {
    setDriverForm({
      name: '',
      nik: '',
      phone: '',
      address: '',
      sim_type: 'SIM A',
      sim_number: '',
      sim_expiry: '',
      employment_status: 'Karyawan Tetap',
      join_date: '',
      emergency_contact: '',
      evaluation_notes: '',
      is_active: true,
    })
    setEditingDriverId(null)
  }

  const handleEditDriverClick = (d: any) => {
    setEditingDriverId(String(d.id))
    setDriverForm({
      name: d.name || '',
      nik: d.nik || '',
      phone: d.phone || '',
      address: d.address || '',
      sim_type: d.sim_type || 'SIM A',
      sim_number: d.sim_number || '',
      sim_expiry: d.sim_expiry || '',
      employment_status: d.employment_status || 'Karyawan Tetap',
      join_date: d.join_date || '',
      emergency_contact: d.emergency_contact || '',
      evaluation_notes: d.evaluation_notes || '',
      is_active: d.is_active !== undefined ? d.is_active : true,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleToggleDriverStatus = (d: any) => {
    const updated = drivers.map((item) =>
      String(item.id) === String(d.id) ? { ...item, is_active: !item.is_active } : item
    )
    setDrivers(updated)
    localStorage.setItem('driver_list', JSON.stringify(updated))
    showSuccessNotification()
  }

  const handleDeleteDriverClick = (d: any) => {
    if (confirm(`Hapus seluruh biodata pengemudi ${d.name}?`)) {
      const updatedDrivers = drivers.filter((item) => String(item.id) !== String(d.id))
      setDrivers(updatedDrivers)
      localStorage.setItem('driver_list', JSON.stringify(updatedDrivers))
      showSuccessNotification()
    }
  }

  // TARIF BBM HANDLER
  const handlePriceChange = (fuelType: string, val: string) => {
    const num = Number(val.replace(/[^0-9]/g, ''))
    setPrices((prev) => ({ ...prev, [fuelType]: num }))
  }

  const handleSavePrices = (e: React.FormEvent) => {
    e.preventDefault()
    localStorage.setItem('fuel_prices', JSON.stringify(prices))
    showSuccessNotification()
  }

  // PROFIL PERUSAHAAN HANDLER
  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault()
    localStorage.setItem('company_profile', JSON.stringify(company))
    showSuccessNotification()
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
              Verifikasi Akses
            </button>
          </form>

          <Link href="/admin" className="inline-block text-xs text-slate-500 hover:text-slate-800 font-medium transition pt-1">
            ← Kembali ke Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const todayStr = new Date().toISOString().split('T')[0]
  const expiredSimCount = drivers.filter((d) => d.sim_expiry < todayStr).length

  const filteredVehicles = vehicles.filter((v) =>
    v.plate_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.model.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredDrivers = drivers.filter((d) =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.phone.includes(searchQuery) ||
    d.sim_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.nik && d.nik.includes(searchQuery))
  )

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans text-slate-800">
      
      {/* SIDEBAR NAVIGATION KIRI */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static flex flex-col justify-between ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div>
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-amber-500 text-slate-900 rounded-xl flex items-center justify-center font-bold text-lg shadow-md">
                ⚙️
              </div>
              <div>
                <h2 className="text-sm font-bold text-white tracking-wide">PEMANTAU BBM</h2>
                <span className="text-[10px] text-amber-400 font-semibold tracking-wider uppercase">Enterprise Edition</span>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
              ✕
            </button>
          </div>

          <nav className="p-4 space-y-1">
            <Link
              href="/admin"
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition"
            >
              <span className="text-base">📊</span> Dashboard Utama
            </Link>

            {/* MAIN MENU NAME: Pusat Kelola Operasional */}
            <div className="pt-2 pb-1 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Pusat Kelola Operasional
            </div>

            <button
              onClick={() => { setActiveTab('drivers'); setSidebarOpen(false); }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${activeTab === 'drivers' ? 'bg-amber-500 text-slate-950 shadow-md font-bold' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-base">👨‍✈️</span> Master & Biodata Driver
              </div>
              {expiredSimCount > 0 ? (
                <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  ! {expiredSimCount}
                </span>
              ) : (
                <span className="bg-slate-800 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {drivers.length}
                </span>
              )}
            </button>

            <button
              onClick={() => { setActiveTab('vehicles'); setSidebarOpen(false); }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${activeTab === 'vehicles' ? 'bg-amber-500 text-slate-950 shadow-md font-bold' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-base">🚚</span> Armada Kendaraan
              </div>
              <span className="bg-slate-800 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {vehicles.length}
              </span>
            </button>

            <button
              onClick={() => { setActiveTab('prices'); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${activeTab === 'prices' ? 'bg-amber-500 text-slate-950 shadow-md font-bold' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}
            >
              <span className="text-base">⛽</span> Tarif Bahan Bakar
            </button>

            <button
              onClick={() => { setActiveTab('company'); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${activeTab === 'company' ? 'bg-amber-500 text-slate-950 shadow-md font-bold' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}
            >
              <span className="text-base">🏢</span> Profil Perusahaan
            </button>

            <Link
              href="/admin/backup"
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition pt-3 border-t border-slate-800 mt-2"
            >
              <span className="text-base">💾</span> Pusat Backup (.JSON)
            </Link>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800">
          <div className="text-[10px] text-slate-500 text-center">
            Dev by <span className="font-bold text-slate-400">Urai Ikhsan Fadhilah</span>
          </div>
        </div>
      </aside>

      {/* KONTEN UTAMA */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* HEADER TOP BAR */}
        <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3.5 flex justify-between items-center sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-700 text-xl p-1">
              ☰
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900">Pusat Kelola Operasional</h1>
              <p className="text-[11px] text-slate-500">
                {activeTab === 'drivers' ? 'Database Biodata & Evaluasi Pengemudi' : activeTab === 'vehicles' ? 'Manajemen Armada Kendaraan' : activeTab === 'prices' ? 'Pengaturan Tarif Bahan Bakar' : 'Profil & Identitas Perusahaan'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admin"
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition shadow-sm"
            >
              ← Ke Dashboard
            </Link>
          </div>
        </header>

        {/* MAIN BODY CONTENT */}
        <main className="p-4 sm:p-6 space-y-6 overflow-y-auto">

          {savedSuccess && (
            <div className="p-3 bg-emerald-600 text-white rounded-2xl text-xs font-bold flex items-center justify-between shadow-md animate-bounce">
              <span>✓ Perubahan Data Operasional Berhasil Disimpan!</span>
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}

          {/* TAB 1: MASTER DATA & BIODATA PENGEMUDI (DRIVER EVALUATION ENGINE) */}
          {activeTab === 'drivers' && (
            <div className="space-y-6">

              {/* Form Input / Edit Biodata Driver */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
                <div className="flex justify-between items-center border-b pb-3">
                  <h2 className="text-xs font-bold text-slate-900 tracking-wider uppercase flex items-center gap-2">
                    <span>👨‍✈️</span> {editingDriverId ? 'Edit Biodata & Evaluasi Driver' : 'Form Input Biodata Driver Baru'}
                  </h2>
                  {editingDriverId && (
                    <button
                      type="button"
                      onClick={resetDriverForm}
                      className="text-[11px] text-rose-600 font-semibold hover:underline"
                    >
                      ✕ Batal Edit
                    </button>
                  )}
                </div>

                <form onSubmit={handleSaveDriver} className="space-y-4">
                  
                  {/* Bagian 1: Identitas Pribadi */}
                  <div className="space-y-3">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">1. Identitas Pribadi & Kontak</span>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nama Lengkap Driver *</label>
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
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nomor NIK / KTP</label>
                        <input
                          type="text"
                          placeholder="3171012304850001"
                          maxLength={16}
                          className="w-full p-2.5 border rounded-xl text-xs border-slate-300 focus:ring-2 focus:ring-slate-900 outline-none font-mono"
                          value={driverForm.nik}
                          onChange={(e) => setDriverForm({ ...driverForm, nik: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">No. Kontak / WhatsApp</label>
                        <input
                          type="text"
                          placeholder="081234567890"
                          className="w-full p-2.5 border rounded-xl text-xs border-slate-300 focus:ring-2 focus:ring-slate-900 outline-none font-mono"
                          value={driverForm.phone}
                          onChange={(e) => setDriverForm({ ...driverForm, phone: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Alamat Domisili Lengkap</label>
                      <input
                        type="text"
                        placeholder="Jl. Merdeka No. 45, Kebayoran Baru, Jakarta Selatan"
                        className="w-full p-2.5 border rounded-xl text-xs border-slate-300 focus:ring-2 focus:ring-slate-900 outline-none font-medium"
                        value={driverForm.address}
                        onChange={(e) => setDriverForm({ ...driverForm, address: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Bagian 2: Lisensi Mengemudi (SIM) */}
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">2. Dokumen Legalitas (SIM)</span>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nomor Seri SIM</label>
                        <input
                          type="text"
                          placeholder="9203-1284-0012"
                          className="w-full p-2.5 border rounded-xl text-xs border-slate-300 focus:ring-2 focus:ring-slate-900 outline-none font-mono font-semibold"
                          value={driverForm.sim_number}
                          onChange={(e) => setDriverForm({ ...driverForm, sim_number: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Masa Berlaku SIM *</label>
                        <input
                          type="date"
                          required
                          className="w-full p-2.5 border rounded-xl text-xs border-slate-300 focus:ring-2 focus:ring-slate-900 outline-none font-medium"
                          value={driverForm.sim_expiry}
                          onChange={(e) => setDriverForm({ ...driverForm, sim_expiry: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bagian 3: Kepegawaian & Darurat */}
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">3. Kepegawaian & Kontak Darurat</span>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Status Kepegawaian</label>
                        <select
                          className="w-full p-2.5 border rounded-xl text-xs border-slate-300 focus:ring-2 focus:ring-slate-900 outline-none font-semibold bg-white"
                          value={driverForm.employment_status}
                          onChange={(e) => setDriverForm({ ...driverForm, employment_status: e.target.value })}
                        >
                          <option value="Karyawan Tetap">Karyawan Tetap</option>
                          <option value="Karyawan Kontrak">Karyawan Kontrak</option>
                          <option value="Harian / Borongan">Harian / Borongan</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Tanggal Masuk Kerja</label>
                        <input
                          type="date"
                          className="w-full p-2.5 border rounded-xl text-xs border-slate-300 focus:ring-2 focus:ring-slate-900 outline-none font-medium"
                          value={driverForm.join_date}
                          onChange={(e) => setDriverForm({ ...driverForm, join_date: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Kontak Darurat (Nama & Telp)</label>
                        <input
                          type="text"
                          placeholder="Siti (Istri) - 081299887766"
                          className="w-full p-2.5 border rounded-xl text-xs border-slate-300 focus:ring-2 focus:ring-slate-900 outline-none font-medium"
                          value={driverForm.emergency_contact}
                          onChange={(e) => setDriverForm({ ...driverForm, emergency_contact: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bagian 4: Evaluasi & Catatan Rekam Jejak Driver */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <label className="block text-[11px] font-semibold text-slate-600">Catatan Evaluasi Rekam Jejak & Kinerja Driver</label>
                    <textarea
                      rows={2}
                      placeholder="Masukkan catatan kedisiplinan, penanganan armada, kecelakaan/insiden, atau apresiasi..."
                      className="w-full p-2.5 border rounded-xl text-xs border-slate-300 focus:ring-2 focus:ring-slate-900 outline-none font-medium leading-relaxed"
                      value={driverForm.evaluation_notes}
                      onChange={(e) => setDriverForm({ ...driverForm, evaluation_notes: e.target.value })}
                    ></textarea>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    {editingDriverId && (
                      <button
                        type="button"
                        onClick={resetDriverForm}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded-xl font-medium"
                      >
                        Batal
                      </button>
                    )}
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs rounded-xl font-bold transition shadow-md"
                    >
                      {editingDriverId ? 'Simpan Perubahan Biodata' : '+ Tambah Driver Baru'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Tabel & Card Daftar Pengemudi */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center gap-3">
                  <h2 className="text-xs font-bold text-slate-900 tracking-wider uppercase">Database Pengemudi Resmi ({filteredDrivers.length})</h2>
                  <input
                    type="text"
                    placeholder="Cari Nama / NIK / SIM / HP..."
                    className="p-2 border rounded-xl text-xs border-slate-300 outline-none focus:ring-2 focus:ring-slate-900 w-52"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="divide-y divide-slate-100">
                  {filteredDrivers.map((d) => {
                    const isExpired = d.sim_expiry < todayStr

                    return (
                      <div key={d.id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-slate-50 transition">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">{d.name}</span>
                            <span className="text-[10px] bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-full">{d.employment_status}</span>
                            {d.is_active ? (
                              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Aktif</span>
                            ) : (
                              <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">Non-Aktif</span>
                            )}
                          </div>

                          <div className="text-[11px] text-slate-500">
                            NIK: <span className="font-mono text-slate-700">{d.nik || '-'}</span> • Kontak: <span className="font-mono text-slate-700">{d.phone}</span>
                          </div>

                          <div className="text-[11px] text-slate-500">
                            {d.sim_type} ({d.sim_number || '-'}) • Masa Berlaku SIM: <span className={`font-mono font-bold ${isExpired ? 'text-rose-600' : 'text-slate-800'}`}>{d.sim_expiry}</span>
                            {isExpired && <span className="ml-2 bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">SIM EXPIRED</span>}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 self-end sm:self-center">
                          <button
                            onClick={() => setSelectedDriverProfile(d)}
                            className="text-xs bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-xl shadow-sm transition flex items-center gap-1"
                          >
                            👁️ Biodata & Evaluasi
                          </button>
                          <button
                            onClick={() => handleToggleDriverStatus(d)}
                            className={`text-[10px] font-bold px-2.5 py-1.5 rounded-xl border transition ${d.is_active ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'}`}
                            title="Ubah Status Tugas"
                          >
                            {d.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                          </button>
                          <button
                            onClick={() => handleEditDriverClick(d)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-bold px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 rounded-xl transition"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteDriverClick(d)}
                            className="text-xs text-rose-600 hover:text-rose-800 font-bold px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 rounded-xl transition"
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: MASTER ARMADA KENDARAAN */}
          {activeTab === 'vehicles' && (
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
                <h2 className="text-xs font-bold text-slate-900 tracking-wider uppercase flex items-center gap-2">
                  <span>🚚</span> {editingVehicleId ? 'Edit Data Kendaraan' : 'Tambah Armada Kendaraan Baru'}
                </h2>

                <form onSubmit={handleSaveVehicle} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Plat Nomor Kendaraan</label>
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
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Model / Tipe Kendaraan</label>
                    <input
                      type="text"
                      required
                      placeholder="Toyota Avanza Veloz"
                      className="w-full p-2.5 border rounded-xl text-xs border-slate-300 focus:ring-2 focus:ring-slate-900 outline-none font-medium"
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
                    {editingVehicleId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingVehicleId(null)
                          setVehicleForm({ plate_number: '', model: '', monthly_budget: '', last_km: '', is_active: true })
                        }}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded-xl font-medium"
                      >
                        Batal
                      </button>
                    )}
                    <button
                      type="submit"
                      className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs rounded-xl font-bold transition shadow-md"
                    >
                      {editingVehicleId ? 'Update Kendaraan' : '+ Tambah Armada'}
                    </button>
                  </div>
                </form>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center gap-3">
                  <h2 className="text-xs font-bold text-slate-900 tracking-wider uppercase">Daftar Armada Aktif ({filteredVehicles.length})</h2>
                  <input
                    type="text"
                    placeholder="Cari Plat / Tipe..."
                    className="p-2 border rounded-xl text-xs border-slate-300 outline-none focus:ring-2 focus:ring-slate-900 w-44"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="divide-y divide-slate-100">
                  {filteredVehicles.map((v) => (
                    <div key={v.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 uppercase">{v.plate_number}</span>
                          <span className="text-xs text-slate-600 font-medium">({v.model})</span>
                          {v.is_active ? (
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Aktif</span>
                          ) : (
                            <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">Non-Aktif</span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          Pagu Bulanan: <span className="font-semibold text-slate-800">Rp {(Number(v.monthly_budget) || 0).toLocaleString('id-ID')}</span> • Odometer Terkini: <span className="font-bold text-slate-900">{(Number(v.last_km) || 0).toLocaleString('id-ID')} KM</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleVehicleStatus(v)}
                          className={`text-[10px] font-bold px-2.5 py-1.5 rounded-xl border transition ${v.is_active ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'}`}
                          title="Ubah Status Operasional"
                        >
                          {v.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                        </button>
                        <button
                          onClick={() => handleEditVehicleClick(v)}
                          className="text-xs text-blue-600 hover:text-blue-800 font-bold px-3 py-1.5 bg-blue-50 hover:bg-blue-100 rounded-xl transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteVehicleClick(v)}
                          className="text-xs text-rose-600 hover:text-rose-800 font-bold px-3 py-1.5 bg-rose-50 hover:bg-rose-100 rounded-xl transition"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: TARIF BBM */}
          {activeTab === 'prices' && (
            <form onSubmit={handleSavePrices} className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
              <h2 className="text-xs font-bold text-slate-900 tracking-wider uppercase flex items-center gap-2">
                <span>⛽</span> Tarif Bahan Bakar Per Liter Terkini
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {Object.keys(prices).map((type) => (
                  <div key={type} className="flex flex-col space-y-1">
                    <label className="text-xs font-semibold text-slate-700">{type}</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-xs text-slate-400 font-bold">Rp</span>
                      <input
                        type="text"
                        required
                        className="w-full py-2.5 pl-10 pr-3 border rounded-xl text-xs border-slate-300 focus:ring-2 focus:ring-slate-900 outline-none font-semibold text-slate-900 font-mono bg-slate-50"
                        value={prices[type] ? prices[type].toLocaleString('id-ID') : ''}
                        onChange={(e) => handlePriceChange(type, e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3.5 rounded-xl text-xs transition shadow-md mt-2"
              >
                Simpan Penyesuaian Tarif BBM
              </button>
            </form>
          )}

          {/* TAB 4: PROFIL PERUSAHAAN */}
          {activeTab === 'company' && (
            <form onSubmit={handleSaveCompany} className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
              <div>
                <h2 className="text-xs font-bold text-slate-900 tracking-wider uppercase flex items-center gap-2">
                  <span>🏢</span> Identitas & Branding Perusahaan
                </h2>
                <p className="text-xs text-slate-500 mt-1">Data profil ini akan otomatis tercetak pada Kop Laporan Eksekutif PDF & Berkas Ekspor Excel</p>
              </div>

              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Perusahaan Resmi</label>
                  <input
                    type="text"
                    required
                    placeholder="PT. Transportasi Logistik Jaya"
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-slate-900"
                    value={company.name}
                    onChange={(e) => setCompany({ ...company, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tagline / Sub-Judul Perusahaan</label>
                  <input
                    type="text"
                    placeholder="Solusi Logistik & Pengangkutan Terpercaya"
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-slate-900"
                    value={company.tagline}
                    onChange={(e) => setCompany({ ...company, tagline: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Alamat Kantor Perusahaan</label>
                    <input
                      type="text"
                      placeholder="Jl. Sudirman No. 123, Jakarta"
                      className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-slate-900"
                      value={company.address}
                      onChange={(e) => setCompany({ ...company, address: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Telepon / WhatsApp Layanan</label>
                    <input
                      type="text"
                      placeholder="(021) 555-0199"
                      className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-slate-900 font-mono"
                      value={company.phone}
                      onChange={(e) => setCompany({ ...company, phone: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3.5 rounded-xl text-xs transition shadow-md mt-2"
              >
                Simpan Profil Perusahaan
              </button>
            </form>
          )}

        </main>
      </div>

      {/* MODAL PREVIEW BIODATA DRIVER (CARD DIGITAL EKSEKUTIF) */}
      {selectedDriverProfile && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            
            {/* Header Card Profile */}
            <div className="flex justify-between items-start border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-slate-900 text-amber-400 rounded-2xl flex items-center justify-center font-bold text-xl shadow-md">
                  👨‍✈️
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{selectedDriverProfile.name}</h3>
                  <p className="text-xs text-slate-500 font-mono">NIK: {selectedDriverProfile.nik || '-'}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDriverProfile(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Grid Informasi Biodata Detail */}
            <div className="space-y-4 text-xs">
              
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 uppercase text-[10px] tracking-wider block">Legalitas Mengemudi</span>
                <div className="grid grid-cols-2 gap-2 font-mono">
                  <div>
                    <span className="text-slate-400 font-sans block text-[10px]">Golongan SIM:</span>
                    <span className="font-bold text-slate-800">{selectedDriverProfile.sim_type}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-sans block text-[10px]">Nomor Seri SIM:</span>
                    <span className="font-bold text-slate-800">{selectedDriverProfile.sim_number || '-'}</span>
                  </div>
                  <div className="col-span-2 pt-1">
                    <span className="text-slate-400 font-sans block text-[10px]">Masa Berlaku SIM:</span>
                    <span className={`font-bold ${selectedDriverProfile.sim_expiry < todayStr ? 'text-rose-600 font-extrabold' : 'text-slate-800'}`}>
                      {selectedDriverProfile.sim_expiry} {selectedDriverProfile.sim_expiry < todayStr ? '(KADALUARSA / EXPIRED)' : ''}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 uppercase text-[10px] tracking-wider block">Kontak & Pekerjaan</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 block text-[10px]">No. Telepon / WA:</span>
                    <span className="font-bold font-mono text-slate-800">{selectedDriverProfile.phone}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Status Karyawan:</span>
                    <span className="font-bold text-slate-800">{selectedDriverProfile.employment_status}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block text-[10px]">Tanggal Bergabung:</span>
                    <span className="font-semibold text-slate-800">{selectedDriverProfile.join_date || '-'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block text-[10px]">Alamat Domisili:</span>
                    <span className="font-medium text-slate-800 leading-relaxed">{selectedDriverProfile.address || '-'}</span>
                  </div>
                  <div className="col-span-2 pt-1">
                    <span className="text-slate-400 block text-[10px]">Kontak Darurat:</span>
                    <span className="font-bold text-rose-700">{selectedDriverProfile.emergency_contact || '-'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 space-y-1">
                <span className="font-bold text-amber-900 uppercase text-[10px] tracking-wider block">Catatan Rekam Jejak & Evaluasi</span>
                <p className="text-amber-950 font-medium leading-relaxed italic">
                  "{selectedDriverProfile.evaluation_notes || 'Belum ada catatan evaluasi khusus untuk pengemudi ini.'}"
                </p>
              </div>

            </div>

            {/* Footer Modal Action */}
            <div className="flex justify-between items-center pt-2 border-t">
              <button
                onClick={() => {
                  handleEditDriverClick(selectedDriverProfile)
                  setSelectedDriverProfile(null)
                }}
                className="text-xs text-blue-600 hover:text-blue-800 font-bold underline"
              >
                ✏️ Edit Biodata Ini
              </button>
              <button
                onClick={() => setSelectedDriverProfile(null)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-xl shadow"
              >
                Tutup Kartu Profil
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}