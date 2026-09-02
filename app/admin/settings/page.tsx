'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { Icons } from '@/components/admin/Icons'

const INITIAL_DRIVERS = [
  {
    id: 'D1',
    name: 'Ahmad Supardi',
    nik: '3171012304850001',
    phone: '081234567890',
    address: 'Jl. Merdeka No. 12, Jakarta Barat',
    sim_type: 'SIM B1 Umum',
    sim_number: '9283-1928-0001',
    sim_expiry: '2027-05-20',
    emergency_name: 'Siti Aminah',
    emergency_relation: 'Istri',
    emergency_phone: '081298765432',
    emergency_contact_name: 'Siti Aminah (Istri)',
    emergency_contact_phone: '081298765432',
    assigned_vehicle: 'KB 1234 YK',
    photo: '',
    status: 'ACTIVE',
  },
  {
    id: 'D2',
    name: 'Budi Santoso',
    nik: '3171011508900002',
    phone: '085678901234',
    address: 'Jl. Anggrek Raya No. 45, Tangerang',
    sim_type: 'SIM A',
    sim_number: '8123-4567-0002',
    sim_expiry: '2026-11-10',
    emergency_name: 'Rudi Santoso',
    emergency_relation: 'Adik',
    emergency_phone: '085611223344',
    emergency_contact_name: 'Rudi Santoso (Adik)',
    emergency_contact_phone: '085611223344',
    assigned_vehicle: 'B 1234 ABC',
    photo: '',
    status: 'ACTIVE',
  },
  {
    id: 'D3',
    name: 'Udin Kamarudin',
    nik: '3171012011880003',
    phone: '082254127596',
    address: 'Jl. Melati IV No. 8, Jakarta Selatan',
    sim_type: 'SIM A',
    sim_number: '83585451',
    sim_expiry: '2028-11-10',
    emergency_name: 'Jamila',
    emergency_relation: 'Istri',
    emergency_phone: '082254127596',
    emergency_contact_name: 'Jamila (Istri)',
    emergency_contact_phone: '082254127596',
    assigned_vehicle: 'B 5678 XYZ',
    photo: '',
    status: 'ACTIVE',
  },
]

const INITIAL_VEHICLES = [
  { id: 'V1', plate_number: 'B 1234 ABC', model: 'Toyota Avanza 1.5 G', year: 2022, monthly_budget: 1500000, monthly_service_budget: 500000, target_km_monthly: 1500, last_km: 45860, kir_expiry: '2026-10-15', stnk_expiry: '2027-08-20' },
  { id: 'V2', plate_number: 'B 5678 XYZ', model: 'Daihatsu Gran Max Blind Van', year: 2021, monthly_budget: 2000000, monthly_service_budget: 750000, target_km_monthly: 2500, last_km: 32000, kir_expiry: '2026-09-10', stnk_expiry: '2026-12-05' },
  { id: 'V3', plate_number: 'B 9012 DEF', model: 'Isuzu Traga Pick Up', year: 2023, monthly_budget: 2500000, monthly_service_budget: 1000000, target_km_monthly: 3500, last_km: 18500, kir_expiry: '2026-12-01', stnk_expiry: '2028-01-15' },
  { id: 'V4', plate_number: 'KB 1234 YK', model: 'Toyota Innova Zenix', year: 2024, monthly_budget: 2500000, monthly_service_budget: 800000, target_km_monthly: 2000, last_km: 47905, kir_expiry: '2027-02-15', stnk_expiry: '2027-11-11' },
]

const INITIAL_FUELS = [
  { id: 'F1', name: 'Pertalite', price: 10000, category: 'Subsidi' },
  { id: 'F2', name: 'Pertamax', price: 12950, category: 'Non-Subsidi' },
  { id: 'F3', name: 'Pertamax Turbo', price: 14400, category: 'Non-Subsidi' },
  { id: 'F4', name: 'Dexlite', price: 14550, category: 'Non-Subsidi' },
  { id: 'F5', name: 'Bio Solar', price: 6800, category: 'Subsidi' },
]

const formatNumberDots = (val: number | string) => {
  if (!val && val !== 0) return ''
  const numStr = String(val).replace(/\D/g, '')
  return numStr.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

const parseDotsToNum = (val: string) => {
  return Number(String(val).replace(/\./g, '')) || 0
}

function SettingsContent() {
  const searchParams = useSearchParams()
  const tabParam = (searchParams.get('tab') as 'drivers' | 'vehicles' | 'prices') || 'drivers'

  const [activeTab, setActiveTab] = useState<'drivers' | 'vehicles' | 'prices'>(tabParam)

  const [drivers, setDrivers] = useState<any[]>(INITIAL_DRIVERS)
  const [vehicles, setVehicles] = useState<any[]>(INITIAL_VEHICLES)
  const [fuels, setFuels] = useState<any[]>(INITIAL_FUELS)

  // State Modal Driver
  const [showDriverModal, setShowDriverModal] = useState(false)
  const [editingDriverId, setEditingDriverId] = useState<string | null>(null)
  const [driverForm, setDriverForm] = useState({
    name: '',
    nik: '',
    phone: '',
    address: '',
    sim_type: 'SIM B1 Umum',
    sim_number: '',
    sim_expiry: '',
    emergency_name: '',
    emergency_relation: 'Istri',
    emergency_phone: '',
    assigned_vehicle: 'B 1234 ABC',
    status: 'ACTIVE',
    photo: '',
  })

  // State Modal Armada
  const [showVehicleModal, setShowVehicleModal] = useState(false)
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null)
  const [vehicleForm, setVehicleForm] = useState({
    plate_number: '',
    model: '',
    year: 2023,
    monthly_budget_formatted: '1.500.000',
    monthly_service_budget_formatted: '500.000',
    target_km_monthly: 2000,
    last_km: 0,
    kir_expiry: '',
    stnk_expiry: '',
  })

  // State Adjust Anggaran
  const [adjustingVehicle, setAdjustingVehicle] = useState<any | null>(null)
  const [quickFuelBudgetFormatted, setQuickFuelBudgetFormatted] = useState('')
  const [quickServiceBudgetFormatted, setQuickServiceBudgetFormatted] = useState('')
  const [quickTargetKm, setQuickTargetKm] = useState(2000)

  // State Modal BBM
  const [showFuelModal, setShowFuelModal] = useState(false)
  const [editingFuelId, setEditingFuelId] = useState<string | null>(null)
  const [fuelForm, setFuelForm] = useState({
    name: '',
    price_formatted: '10.000',
    category: 'Non-Subsidi',
  })

  useEffect(() => {
    setActiveTab(tabParam)
  }, [tabParam])

  // AUTO MIGRATION & SINKRONISASI DATA LOCALSTORAGE
  const loadMasterData = () => {
    try {
      const storedDrivers = localStorage.getItem('master_drivers')
      const storedVehicles = localStorage.getItem('vehicle_budgets')
      const storedFuels = localStorage.getItem('master_fuel_prices')

      if (storedDrivers) {
        const parsedD = JSON.parse(storedDrivers)
        if (Array.isArray(parsedD) && parsedD.length > 0) setDrivers(parsedD)
        else localStorage.setItem('master_drivers', JSON.stringify(INITIAL_DRIVERS))
      } else {
        localStorage.setItem('master_drivers', JSON.stringify(INITIAL_DRIVERS))
      }

      if (storedVehicles) {
        let parsedV = JSON.parse(storedVehicles)
        if (Array.isArray(parsedV) && parsedV.length > 0) {
          // AUTO MIGRATION: Update otomatis struktur armada jika belum ada properti rincian baru
          parsedV = parsedV.map((v: any) => ({
            ...v,
            monthly_service_budget: v.monthly_service_budget !== undefined ? v.monthly_service_budget : 500000,
            target_km_monthly: v.target_km_monthly !== undefined ? v.target_km_monthly : 2000,
          }))
          setVehicles(parsedV)
          localStorage.setItem('vehicle_budgets', JSON.stringify(parsedV))
        } else {
          localStorage.setItem('vehicle_budgets', JSON.stringify(INITIAL_VEHICLES))
          setVehicles(INITIAL_VEHICLES)
        }
      } else {
        localStorage.setItem('vehicle_budgets', JSON.stringify(INITIAL_VEHICLES))
        setVehicles(INITIAL_VEHICLES)
      }

      if (storedFuels) {
        const parsedF = JSON.parse(storedFuels)
        if (Array.isArray(parsedF) && parsedF.length > 0) setFuels(parsedF)
        else localStorage.setItem('master_fuel_prices', JSON.stringify(INITIAL_FUELS))
      } else {
        localStorage.setItem('master_fuel_prices', JSON.stringify(INITIAL_FUELS))
      }
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadMasterData()
  }, [])

  // MENGURANGI RESIKO TAMPILAN LAMA: TOMBOL RESET MANUALLY
  const handleResetMasterData = () => {
    localStorage.setItem('vehicle_budgets', JSON.stringify(INITIAL_VEHICLES))
    localStorage.setItem('master_drivers', JSON.stringify(INITIAL_DRIVERS))
    localStorage.setItem('master_fuel_prices', JSON.stringify(INITIAL_FUELS))
    setVehicles(INITIAL_VEHICLES)
    setDrivers(INITIAL_DRIVERS)
    setFuels(INITIAL_FUELS)
    alert('✅ Data Master Armada & Rincian Anggaran berhasil diperbarui ke versi terbaru!')
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setDriverForm((prev) => ({ ...prev, photo: reader.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  // Driver Handlers
  const handleOpenAddDriver = () => {
    setEditingDriverId(null)
    setDriverForm({
      name: '',
      nik: '',
      phone: '',
      address: '',
      sim_type: 'SIM B1 Umum',
      sim_number: '',
      sim_expiry: '',
      emergency_name: '',
      emergency_relation: 'Istri',
      emergency_phone: '',
      assigned_vehicle: vehicles[0]?.plate_number || 'B 1234 ABC',
      status: 'ACTIVE',
      photo: '',
    })
    setShowDriverModal(true)
  }

  const handleOpenEditDriver = (driver: any) => {
    setEditingDriverId(driver.id)
    setDriverForm({
      name: driver.name || '',
      nik: driver.nik || '',
      phone: driver.phone || '',
      address: driver.address || '',
      sim_type: driver.sim_type || 'SIM B1 Umum',
      sim_number: driver.sim_number || '',
      sim_expiry: driver.sim_expiry || '',
      emergency_name: driver.emergency_name || driver.emergency_contact_name?.split('(')[0]?.trim() || '',
      emergency_relation: driver.emergency_relation || 'Istri',
      emergency_phone: driver.emergency_phone || driver.emergency_contact_phone || '',
      assigned_vehicle: driver.assigned_vehicle || vehicles[0]?.plate_number || 'B 1234 ABC',
      status: driver.status || 'ACTIVE',
      photo: driver.photo || driver.photo_url || '',
    })
    setShowDriverModal(true)
  }

  const handleSaveDriver = (e: React.FormEvent) => {
    e.preventDefault()
    let updated: any[]
    const emName = driverForm.emergency_name ? `${driverForm.emergency_name} (${driverForm.emergency_relation || 'Keluarga'})` : ''

    const payload = {
      ...driverForm,
      emergency_contact_name: emName,
      emergency_contact_phone: driverForm.emergency_phone,
      photo_url: driverForm.photo,
    }

    if (editingDriverId) {
      updated = drivers.map((d) => (d.id === editingDriverId ? { ...d, ...payload } : d))
    } else {
      const newDriver = { ...payload, id: `D${Date.now()}` }
      updated = [newDriver, ...drivers]
    }
    setDrivers(updated)
    localStorage.setItem('master_drivers', JSON.stringify(updated))
    setShowDriverModal(false)
  }

  const handleDeleteDriver = (id: string, name?: string) => {
    if (confirm(`Hapus driver ${name || ''} ini dari Master Data?`)) {
      const updated = drivers.filter((d) => d.id !== id)
      setDrivers(updated)
      localStorage.setItem('master_drivers', JSON.stringify(updated))
    }
  }

  // Vehicle Handlers
  const handleOpenAddVehicle = () => {
    setEditingVehicleId(null)
    setVehicleForm({
      plate_number: '',
      model: '',
      year: 2023,
      monthly_budget_formatted: '1.500.000',
      monthly_service_budget_formatted: '500.000',
      target_km_monthly: 2000,
      last_km: 0,
      kir_expiry: '',
      stnk_expiry: '',
    })
    setShowVehicleModal(true)
  }

  const handleOpenEditVehicle = (v: any) => {
    setEditingVehicleId(v.id)
    setVehicleForm({
      plate_number: v.plate_number || '',
      model: v.model || '',
      year: v.year || 2023,
      monthly_budget_formatted: formatNumberDots(v.monthly_budget || 0),
      monthly_service_budget_formatted: formatNumberDots(v.monthly_service_budget || 0),
      target_km_monthly: v.target_km_monthly || 2000,
      last_km: v.last_km || 0,
      kir_expiry: v.kir_expiry || '',
      stnk_expiry: v.stnk_expiry || '',
    })
    setShowVehicleModal(true)
  }

  const handleSaveVehicle = (e: React.FormEvent) => {
    e.preventDefault()
    const numericFuelBudget = parseDotsToNum(vehicleForm.monthly_budget_formatted)
    const numericServiceBudget = parseDotsToNum(vehicleForm.monthly_service_budget_formatted)

    const payload = {
      plate_number: vehicleForm.plate_number,
      model: vehicleForm.model,
      year: Number(vehicleForm.year),
      monthly_budget: numericFuelBudget,
      monthly_service_budget: numericServiceBudget,
      target_km_monthly: Number(vehicleForm.target_km_monthly) || 2000,
      last_km: Number(vehicleForm.last_km),
      kir_expiry: vehicleForm.kir_expiry,
      stnk_expiry: vehicleForm.stnk_expiry,
    }

    let updated: any[]
    if (editingVehicleId) {
      updated = vehicles.map((v) => (v.id === editingVehicleId ? { ...v, ...payload } : v))
    } else {
      updated = [{ ...payload, id: `V${Date.now()}` }, ...vehicles]
    }

    setVehicles(updated)
    localStorage.setItem('vehicle_budgets', JSON.stringify(updated))
    setShowVehicleModal(false)
  }

  const handleOpenAdjustBudget = (vehicle: any) => {
    setAdjustingVehicle(vehicle)
    setQuickFuelBudgetFormatted(formatNumberDots(vehicle.monthly_budget || 0))
    setQuickServiceBudgetFormatted(formatNumberDots(vehicle.monthly_service_budget || 500000))
    setQuickTargetKm(vehicle.target_km_monthly || 2000)
  }

  const handleSaveQuickBudget = (e: React.FormEvent) => {
    e.preventDefault()
    if (!adjustingVehicle) return
    const newFuelBudget = parseDotsToNum(quickFuelBudgetFormatted)
    const newServiceBudget = parseDotsToNum(quickServiceBudgetFormatted)

    const updated = vehicles.map((v) =>
      v.id === adjustingVehicle.id
        ? {
            ...v,
            monthly_budget: newFuelBudget,
            monthly_service_budget: newServiceBudget,
            target_km_monthly: Number(quickTargetKm) || 2000,
          }
        : v
    )
    setVehicles(updated)
    localStorage.setItem('vehicle_budgets', JSON.stringify(updated))
    setAdjustingVehicle(null)
  }

  const handleDeleteVehicle = (id: string) => {
    if (confirm('Hapus kendaraan ini dari Master Data?')) {
      const updated = vehicles.filter((v) => v.id !== id)
      setVehicles(updated)
      localStorage.setItem('vehicle_budgets', JSON.stringify(updated))
    }
  }

  // Fuel Handlers
  const handleOpenAddFuel = () => {
    setEditingFuelId(null)
    setFuelForm({ name: '', price_formatted: '10.000', category: 'Non-Subsidi' })
    setShowFuelModal(true)
  }

  const handleOpenEditFuel = (f: any) => {
    setEditingFuelId(f.id)
    setFuelForm({
      name: f.name || '',
      price_formatted: formatNumberDots(f.price || 0),
      category: f.category || 'Non-Subsidi',
    })
    setShowFuelModal(true)
  }

  const handleSaveFuel = (e: React.FormEvent) => {
    e.preventDefault()
    const numericPrice = parseDotsToNum(fuelForm.price_formatted)
    const payload = { name: fuelForm.name, price: numericPrice, category: fuelForm.category }

    let updated: any[]
    if (editingFuelId) {
      updated = fuels.map((f) => (f.id === editingFuelId ? { ...f, ...payload } : f))
    } else {
      updated = [...fuels, { ...payload, id: `F${Date.now()}` }]
    }

    setFuels(updated)
    localStorage.setItem('master_fuel_prices', JSON.stringify(updated))
    setShowFuelModal(false)
  }

  const handleDeleteFuel = (id: string) => {
    if (confirm('Hapus jenis BBM ini dari Master Data?')) {
      const updated = fuels.filter((f) => f.id !== id)
      setFuels(updated)
      localStorage.setItem('master_fuel_prices', JSON.stringify(updated))
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans text-slate-800">
      <AdminSidebar />

      <main className="flex-1 p-6 space-y-6 overflow-y-auto">
        {/* HEADER MODUL */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-sm font-bold text-slate-900 tracking-wider uppercase flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              {activeTab === 'drivers'
                ? 'Master Data Driver & Pengemudi'
                : activeTab === 'vehicles'
                ? 'Master Data Armada & Kendaraan Operasional'
                : 'Katalog Jenis & Tarif Harga BBM'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {activeTab === 'drivers'
                ? 'Kelola biodata, foto profil, lisensi SIM, kontak darurat, serta penugasan armada driver'
                : activeTab === 'vehicles'
                ? 'Atur rincian Anggaran BBM, Anggaran Servis/KIR, Jam Terbang (Target KM), serta legalitas KIR & STNK'
                : 'Atur daftar pilihan bahan bakar dan penyesuaian harga per liter'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetMasterData}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-300 transition flex items-center gap-1.5"
              title="Perbarui struktur data ke versi terbaru"
            >
              🔄 Reset / Update Data
            </button>

            {activeTab === 'drivers' && (
              <button
                onClick={handleOpenAddDriver}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition flex items-center gap-1.5"
              >
                <Icons.Plus className="w-4 h-4" /> Tambah Driver
              </button>
            )}

            {activeTab === 'vehicles' && (
              <button
                onClick={handleOpenAddVehicle}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition flex items-center gap-1.5"
              >
                <Icons.Plus className="w-4 h-4" /> Tambah Armada
              </button>
            )}

            {activeTab === 'prices' && (
              <button
                onClick={handleOpenAddFuel}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition flex items-center gap-1.5"
              >
                <Icons.Plus className="w-4 h-4" /> Tambah Jenis BBM
              </button>
            )}
          </div>
        </div>

        {/* ================= TAB 1: MASTER DRIVER ================= */}
        {activeTab === 'drivers' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {drivers.map((d) => {
              const today = new Date().toISOString().split('T')[0]
              const isSimExpiringSoon = d.sim_expiry && d.sim_expiry <= today
              const photoSrc = d.photo || d.photo_url

              return (
                <div
                  key={d.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between hover:shadow-md transition"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          {photoSrc ? (
                            <img
                              src={photoSrc}
                              alt={d.name}
                              className="w-12 h-12 rounded-2xl object-cover border-2 border-amber-400 shadow-sm"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-amber-400 font-extrabold text-lg flex items-center justify-center border-2 border-slate-800 shadow-sm">
                              {d.name ? d.name.slice(0, 1).toUpperCase() : 'D'}
                            </div>
                          )}
                          <span
                            className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
                              d.status === 'ACTIVE' || d.status === 'Aktif' ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                            title={`Status: ${d.status}`}
                          ></span>
                        </div>

                        <div>
                          <h3 className="font-extrabold text-slate-900 text-sm leading-snug">{d.name}</h3>
                          <a
                            href={`https://wa.me/${(d.phone || '').replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] font-mono text-emerald-700 hover:underline flex items-center gap-1 mt-0.5"
                          >
                            📱 {d.phone || 'Belum ada HP'}
                          </a>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditDriver(d)}
                          className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition border border-indigo-200"
                          title="Edit Driver"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDeleteDriver(d.id, d.name)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold transition border border-rose-200"
                          title="Hapus Driver"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1.5 text-xs font-mono">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Lisensi SIM:</span>
                        <strong className="text-slate-900">{d.sim_type || 'SIM B1'}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Nomor SIM:</span>
                        <span className="text-slate-800">{d.sim_number || '-'}</span>
                      </div>
                      <div className="flex justify-between border-t pt-1 border-slate-200">
                        <span className="text-slate-500">Masa Berlaku SIM:</span>
                        <strong className={isSimExpiringSoon ? 'text-rose-600 font-bold' : 'text-slate-900'}>
                          {d.sim_expiry || '-'}
                        </strong>
                      </div>
                      {isSimExpiringSoon && (
                        <div className="text-[10px] bg-rose-100 text-rose-700 p-1 rounded font-bold text-center">
                          ⚠️ SIM Kadaluarsa / Segera Perpanjang
                        </div>
                      )}
                    </div>

                    <div className="space-y-1 text-[11px]">
                      <div className="flex justify-between text-slate-600">
                        <span>Armada Utama:</span>
                        <strong className="text-indigo-900 font-mono font-bold">{d.assigned_vehicle || '-'}</strong>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Kontak Darurat:</span>
                        <strong className="text-slate-900">
                          {d.emergency_name
                            ? `${d.emergency_name} (${d.emergency_relation || 'Keluarga'})`
                            : d.emergency_contact_name || '-'}
                        </strong>
                      </div>
                      {(d.emergency_phone || d.emergency_contact_phone) && (
                        <div className="flex justify-between text-slate-500 text-[10px]">
                          <span>No. Darurat:</span>
                          <span className="font-mono">{d.emergency_phone || d.emergency_contact_phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ================= TAB 2: MASTER ARMADA & RINCIAN ANGGARAN ================= */}
        {activeTab === 'vehicles' && (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-900 text-white font-bold">
                  <tr>
                    <th className="p-3.5">Plat Nomor & Model</th>
                    <th className="p-3.5">Odometer Terkini</th>
                    <th className="p-3.5">Jam Terbang (Target KM)</th>
                    <th className="p-3.5">Anggaran BBM</th>
                    <th className="p-3.5">Anggaran Servis & KIR</th>
                    <th className="p-3.5">Total Budget Operasional</th>
                    <th className="p-3.5">Exp. KIR / STNK</th>
                    <th className="p-3.5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vehicles.map((v) => {
                    const fuelB = Number(v.monthly_budget) || 0
                    const serviceB = Number(v.monthly_service_budget) || 500000
                    const totalB = fuelB + serviceB
                    const targetKm = Number(v.target_km_monthly) || 2000

                    return (
                      <tr key={v.id} className="hover:bg-slate-50 transition">
                        <td className="p-3.5">
                          <div className="font-bold text-slate-900">{v.plate_number}</div>
                          <div className="text-[11px] text-slate-500">{v.model} ({v.year || 2023})</div>
                        </td>
                        <td className="p-3.5 font-mono font-bold text-slate-800">
                          {(v.last_km || 0).toLocaleString('id-ID')} KM
                        </td>
                        <td className="p-3.5 font-mono">
                          <span className="bg-indigo-50 text-indigo-900 font-bold px-2 py-1 rounded-lg border border-indigo-100">
                            🎯 {targetKm.toLocaleString('id-ID')} KM / Bln
                          </span>
                        </td>
                        <td className="p-3.5 font-mono font-bold text-amber-700">
                          Rp {fuelB.toLocaleString('id-ID')}
                        </td>
                        <td className="p-3.5 font-mono font-bold text-indigo-700">
                          Rp {serviceB.toLocaleString('id-ID')}
                        </td>
                        <td className="p-3.5">
                          <div className="font-mono font-extrabold text-slate-900">
                            Rp {totalB.toLocaleString('id-ID')}
                          </div>
                          <button
                            onClick={() => handleOpenAdjustBudget(v)}
                            className="text-[10px] text-amber-600 hover:underline font-bold inline-flex items-center gap-0.5 mt-0.5"
                          >
                            <Icons.Edit className="w-3 h-3" /> Adjust Rincian Anggaran
                          </button>
                        </td>
                        <td className="p-3.5 font-mono text-[11px] space-y-0.5">
                          <div>KIR: <strong className="text-slate-800">{v.kir_expiry || '-'}</strong></div>
                          <div>STNK: <strong className="text-slate-800">{v.stnk_expiry || '-'}</strong></div>
                        </td>
                        <td className="p-3.5 text-center space-x-2">
                          <button
                            onClick={() => handleOpenEditVehicle(v)}
                            className="text-indigo-600 hover:underline font-bold"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteVehicle(v.id)}
                            className="text-rose-600 hover:underline font-bold"
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= TAB 3: TARIF BBM ================= */}
        {activeTab === 'prices' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {fuels.map((f) => (
                <div key={f.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">{f.name}</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${f.category === 'Subsidi' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'}`}>
                        {f.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleOpenEditFuel(f)} className="text-indigo-600 hover:underline text-xs font-bold">
                        Edit
                      </button>
                      <button onClick={() => handleDeleteFuel(f.id)} className="text-rose-600 hover:underline text-xs font-bold">
                        Hapus
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">Tarif Per Liter:</span>
                      <strong className="text-base font-extrabold font-mono text-slate-900">
                        Rp {(f.price || 0).toLocaleString('id-ID')}
                      </strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* MODAL QUICK ADJUST ANGGARAN & JAM TERBANG */}
      {adjustingVehicle && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-xs font-bold text-slate-900">Adjust Rincian Anggaran & Jam Terbang ({adjustingVehicle.plate_number})</h3>
              <button onClick={() => setAdjustingVehicle(null)} className="text-slate-400 font-bold">✕</button>
            </div>
            <form onSubmit={handleSaveQuickBudget} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Target Jam Terbang / KM Per Bulan</label>
                <input
                  type="number"
                  className="w-full border p-2.5 rounded-xl font-mono text-xs font-bold text-slate-900 outline-none"
                  value={quickTargetKm}
                  onChange={(e) => setQuickTargetKm(Number(e.target.value))}
                  placeholder="2000"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Anggaran BBM Bulanan (Rp) *</label>
                <input
                  type="text"
                  className="w-full border p-2.5 rounded-xl font-mono text-sm font-bold text-amber-700 outline-none"
                  value={quickFuelBudgetFormatted}
                  onChange={(e) => setQuickFuelBudgetFormatted(formatNumberDots(e.target.value))}
                  placeholder="1.500.000"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Anggaran Maintenance & KIR Bulanan (Rp) *</label>
                <input
                  type="text"
                  className="w-full border p-2.5 rounded-xl font-mono text-sm font-bold text-indigo-900 outline-none"
                  value={quickServiceBudgetFormatted}
                  onChange={(e) => setQuickServiceBudgetFormatted(formatNumberDots(e.target.value))}
                  placeholder="500.000"
                  required
                />
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs font-mono flex justify-between">
                <span>Total Budget Operasional:</span>
                <strong className="text-slate-900">
                  Rp {(parseDotsToNum(quickFuelBudgetFormatted) + parseDotsToNum(quickServiceBudgetFormatted)).toLocaleString('id-ID')}
                </strong>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setAdjustingVehicle(null)} className="w-1/2 bg-slate-100 text-slate-700 font-bold py-2 rounded-xl">Batal</button>
                <button type="submit" className="w-1/2 bg-slate-900 text-white font-bold py-2 rounded-xl shadow-md">Simpan Anggaran</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH / EDIT DRIVER */}
      {showDriverModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-bold text-slate-900">{editingDriverId ? 'Edit Biodata Driver' : 'Tambah Driver Baru'}</h3>
              <button onClick={() => setShowDriverModal(false)} className="text-slate-400 font-bold">✕</button>
            </div>

            <form onSubmit={handleSaveDriver} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Foto Profil Driver</label>
                <div className="flex items-center gap-3">
                  {driverForm.photo ? (
                    <img src={driverForm.photo} alt="Preview" className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-400 shadow-sm" />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 font-bold text-xs flex items-center justify-center border border-slate-300">
                      Foto
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:bg-slate-900 file:text-white font-bold cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Nama Lengkap *</label>
                  <input
                    type="text"
                    placeholder="Contoh: Ahmad Supardi"
                    className="w-full border border-slate-300 p-2.5 rounded-xl outline-none font-bold text-slate-900"
                    value={driverForm.name}
                    onChange={(e) => setDriverForm({ ...driverForm, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">No. HP / WhatsApp *</label>
                  <input
                    type="text"
                    placeholder="081234567890"
                    className="w-full border border-slate-300 p-2.5 rounded-xl outline-none font-mono font-bold"
                    value={driverForm.phone}
                    onChange={(e) => setDriverForm({ ...driverForm, phone: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">NIK KTP (Opsional)</label>
                  <input
                    type="text"
                    placeholder="3171012304850001"
                    className="w-full border border-slate-300 p-2.5 rounded-xl outline-none font-mono"
                    value={driverForm.nik}
                    onChange={(e) => setDriverForm({ ...driverForm, nik: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Status Kepegawaian</label>
                  <select
                    className="w-full border border-slate-300 p-2.5 rounded-xl bg-slate-50 font-bold outline-none"
                    value={driverForm.status}
                    onChange={(e) => setDriverForm({ ...driverForm, status: e.target.value })}
                  >
                    <option value="ACTIVE">🟢 Aktif</option>
                    <option value="INACTIVE">⚪ Non-Aktif</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Alamat Domisili</label>
                <input
                  type="text"
                  placeholder="Alamat tempat tinggal lengkap..."
                  className="w-full border border-slate-300 p-2.5 rounded-xl outline-none"
                  value={driverForm.address}
                  onChange={(e) => setDriverForm({ ...driverForm, address: e.target.value })}
                />
              </div>

              <div className="border-t border-slate-100 pt-2 grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-700 mb-1">Jenis SIM *</label>
                  <select
                    className="w-full border border-slate-300 p-2 rounded-xl bg-slate-50 font-bold text-xs outline-none"
                    value={driverForm.sim_type}
                    onChange={(e) => setDriverForm({ ...driverForm, sim_type: e.target.value })}
                  >
                    <option value="SIM A">SIM A</option>
                    <option value="SIM B1">SIM B1</option>
                    <option value="SIM B1 Umum">SIM B1 Umum</option>
                    <option value="SIM B2 Umum">SIM B2 Umum</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-700 mb-1">Nomor SIM *</label>
                  <input
                    type="text"
                    placeholder="9283-1928-0001"
                    className="w-full border border-slate-300 p-2 rounded-xl outline-none font-mono text-xs"
                    value={driverForm.sim_number}
                    onChange={(e) => setDriverForm({ ...driverForm, sim_number: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-700 mb-1">Masa Berlaku SIM *</label>
                  <input
                    type="date"
                    className="w-full border border-slate-300 p-1.5 rounded-xl outline-none font-mono text-xs bg-slate-50"
                    value={driverForm.sim_expiry}
                    onChange={(e) => setDriverForm({ ...driverForm, sim_expiry: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-2 grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-700 mb-1">Nama Kontak Darurat</label>
                  <input
                    type="text"
                    placeholder="Nama Istri/Kerabat"
                    className="w-full border border-slate-300 p-2 rounded-xl outline-none text-xs"
                    value={driverForm.emergency_name}
                    onChange={(e) => setDriverForm({ ...driverForm, emergency_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-700 mb-1">Hubungan</label>
                  <input
                    type="text"
                    placeholder="Istri / Adik / Ortu"
                    className="w-full border border-slate-300 p-2 rounded-xl outline-none text-xs"
                    value={driverForm.emergency_relation}
                    onChange={(e) => setDriverForm({ ...driverForm, emergency_relation: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-700 mb-1">No. HP Darurat</label>
                  <input
                    type="text"
                    placeholder="0812xxxx"
                    className="w-full border border-slate-300 p-2 rounded-xl outline-none font-mono text-xs"
                    value={driverForm.emergency_phone}
                    onChange={(e) => setDriverForm({ ...driverForm, emergency_phone: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Prapilih Armada Utama Kendaraan</label>
                <select
                  className="w-full border border-slate-300 p-2.5 rounded-xl bg-slate-50 font-bold text-indigo-900 outline-none"
                  value={driverForm.assigned_vehicle}
                  onChange={(e) => setDriverForm({ ...driverForm, assigned_vehicle: e.target.value })}
                >
                  {vehicles.map((v) => (
                    <option key={v.plate_number} value={v.plate_number}>
                      {v.plate_number} — {v.model}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDriverModal(false)}
                  className="w-1/2 bg-slate-100 text-slate-700 font-bold py-2.5 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-slate-900 text-white font-bold py-2.5 rounded-xl shadow-md"
                >
                  Simpan Data Driver
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH / EDIT ARMADA */}
      {showVehicleModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-bold text-slate-900">{editingVehicleId ? 'Edit Data Armada' : 'Tambah Armada Baru'}</h3>
              <button onClick={() => setShowVehicleModal(false)} className="text-slate-400 font-bold">✕</button>
            </div>
            <form onSubmit={handleSaveVehicle} className="space-y-3 text-xs">
              <input type="text" placeholder="Plat Nomor (Contoh: B 1234 ABC) *" className="w-full border p-2.5 rounded-xl font-bold uppercase" value={vehicleForm.plate_number} onChange={(e) => setVehicleForm({ ...vehicleForm, plate_number: e.target.value })} required />
              <input type="text" placeholder="Model / Tipe Kendaraan *" className="w-full border p-2.5 rounded-xl" value={vehicleForm.model} onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })} required />
              <div className="grid grid-cols-2 gap-2">
                <input type="number" placeholder="Tahun *" className="border p-2.5 rounded-xl font-mono" value={vehicleForm.year} onChange={(e) => setVehicleForm({ ...vehicleForm, year: Number(e.target.value) })} required />
                <input type="number" placeholder="KM Odometer Terkini *" className="border p-2.5 rounded-xl font-mono" value={vehicleForm.last_km} onChange={(e) => setVehicleForm({ ...vehicleForm, last_km: Number(e.target.value) })} required />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Anggaran BBM (Rp) *</label>
                  <input
                    type="text"
                    placeholder="1.500.000"
                    className="w-full border p-2.5 rounded-xl font-mono font-bold text-amber-700"
                    value={vehicleForm.monthly_budget_formatted}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, monthly_budget_formatted: formatNumberDots(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Anggaran Servis (Rp) *</label>
                  <input
                    type="text"
                    placeholder="500.000"
                    className="w-full border p-2.5 rounded-xl font-mono font-bold text-indigo-900"
                    value={vehicleForm.monthly_service_budget_formatted}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, monthly_service_budget_formatted: formatNumberDots(e.target.value) })}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Target Jam Terbang (KM / Bulan) *</label>
                <input
                  type="number"
                  placeholder="2000"
                  className="w-full border p-2.5 rounded-xl font-mono font-bold text-slate-900"
                  value={vehicleForm.target_km_monthly}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, target_km_monthly: Number(e.target.value) })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">Tanggal Expired KIR</label>
                  <input type="date" className="w-full border p-2 rounded-xl" value={vehicleForm.kir_expiry} onChange={(e) => setVehicleForm({ ...vehicleForm, kir_expiry: e.target.value })} />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">Tanggal Expired STNK</label>
                  <input type="date" className="w-full border p-2 rounded-xl" value={vehicleForm.stnk_expiry} onChange={(e) => setVehicleForm({ ...vehicleForm, stnk_expiry: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowVehicleModal(false)} className="w-1/2 bg-slate-100 text-slate-700 font-bold py-2.5 rounded-xl">Batal</button>
                <button type="submit" className="w-1/2 bg-slate-900 text-white font-bold py-2.5 rounded-xl shadow-md">Simpan Armada</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH / EDIT BBM */}
      {showFuelModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-bold text-slate-900">{editingFuelId ? 'Edit Tarif BBM' : 'Tambah Jenis BBM Baru'}</h3>
              <button onClick={() => setShowFuelModal(false)} className="text-slate-400 font-bold">✕</button>
            </div>
            <form onSubmit={handleSaveFuel} className="space-y-3 text-xs">
              <input type="text" placeholder="Nama BBM (Misal: Pertamax Green 95) *" className="w-full border p-2.5 rounded-xl font-bold" value={fuelForm.name} onChange={(e) => setFuelForm({ ...fuelForm, name: e.target.value })} required />
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Harga Per Liter (Rp) *</label>
                <input
                  type="text"
                  placeholder="10.000"
                  className="w-full border p-2.5 rounded-xl font-mono font-bold"
                  value={fuelForm.price_formatted}
                  onChange={(e) => setFuelForm({ ...fuelForm, price_formatted: formatNumberDots(e.target.value) })}
                  required
                />
              </div>
              <select className="w-full border p-2.5 rounded-xl bg-slate-50 font-bold" value={fuelForm.category} onChange={(e) => setFuelForm({ ...fuelForm, category: e.target.value })}>
                <option value="Non-Subsidi">Non-Subsidi</option>
                <option value="Subsidi">Subsidi</option>
              </select>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowFuelModal(false)} className="w-1/2 bg-slate-100 text-slate-700 font-bold py-2.5 rounded-xl">Batal</button>
                <button type="submit" className="w-1/2 bg-slate-900 text-white font-bold py-2.5 rounded-xl shadow-md">Simpan BBM</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 text-white p-6">Memuat Master Data...</div>}>
      <SettingsContent />
    </Suspense>
  )
}