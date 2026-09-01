'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { AdminSidebar } from '@/components/admin/AdminSidebar'

const INITIAL_DRIVERS = [
  {
    id: 'D1',
    name: 'Ahmad Supardi',
    phone: '081234567890',
    sim_type: 'SIM B1 Umum',
    sim_number: '9283-1928-0001',
    sim_expiry: '2027-05-20',
    emergency_contact_name: 'Siti Aminah (Istri)',
    emergency_contact_phone: '081298765432',
    photo: '',
    status: 'ACTIVE',
  },
  {
    id: 'D2',
    name: 'Budi Santoso',
    phone: '085678901234',
    sim_type: 'SIM A',
    sim_number: '8123-4567-0002',
    sim_expiry: '2026-11-10',
    emergency_contact_name: 'Rudi Santoso (Adik)',
    emergency_contact_phone: '085611223344',
    photo: '',
    status: 'ACTIVE',
  },
]

const INITIAL_VEHICLES = [
  { id: 'V1', plate_number: 'B 1234 ABC', model: 'Toyota Avanza 1.5 G', year: 2022, monthly_budget: 1500000, last_km: 45320, kir_expiry: '2026-10-15', stnk_expiry: '2027-08-20' },
  { id: 'V2', plate_number: 'B 5678 XYZ', model: 'Daihatsu Gran Max Blind Van', year: 2021, monthly_budget: 2000000, last_km: 32000, kir_expiry: '2026-09-10', stnk_expiry: '2026-12-05' },
  { id: 'V3', plate_number: 'B 9012 DEF', model: 'Isuzu Traga Pick Up', year: 2023, monthly_budget: 2500000, last_km: 18500, kir_expiry: '2026-12-01', stnk_expiry: '2028-01-15' },
]

const INITIAL_FUELS = [
  { id: 'F1', name: 'Pertalite', price: 10000, category: 'Subsidi' },
  { id: 'F2', name: 'Pertamax', price: 12950, category: 'Non-Subsidi' },
  { id: 'F3', name: 'Pertamax Turbo', price: 14400, category: 'Non-Subsidi' },
  { id: 'F4', name: 'Dexlite', price: 14550, category: 'Non-Subsidi' },
  { id: 'F5', name: 'Bio Solar', price: 6800, category: 'Subsidi' },
]

function SettingsContent() {
  const searchParams = useSearchParams()
  const tabParam = (searchParams.get('tab') as 'drivers' | 'vehicles' | 'prices') || 'drivers'

  const [activeTab, setActiveTab] = useState<'drivers' | 'vehicles' | 'prices'>(tabParam)

  const [drivers, setDrivers] = useState<any[]>(INITIAL_DRIVERS)
  const [vehicles, setVehicles] = useState<any[]>(INITIAL_VEHICLES)
  const [fuels, setFuels] = useState<any[]>(INITIAL_FUELS)

  const [showDriverModal, setShowDriverModal] = useState(false)
  const [showVehicleModal, setShowVehicleModal] = useState(false)
  const [showFuelModal, setShowFuelModal] = useState(false)

  const [driverForm, setDriverForm] = useState({
    name: '',
    phone: '',
    sim_type: 'SIM A',
    sim_number: '',
    sim_expiry: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    photo: '',
  })

  const [vehicleForm, setVehicleForm] = useState({
    plate_number: '',
    model: '',
    year: 2023,
    monthly_budget: 1500000,
    last_km: 0,
    kir_expiry: '',
    stnk_expiry: '',
  })

  const [fuelForm, setFuelForm] = useState({
    name: '',
    price: 10000,
    category: 'Non-Subsidi',
  })

  useEffect(() => {
    setActiveTab(tabParam)
  }, [tabParam])

  useEffect(() => {
    try {
      const storedDrivers = localStorage.getItem('master_drivers')
      const storedVehicles = localStorage.getItem('vehicle_budgets')
      const storedFuels = localStorage.getItem('master_fuel_prices')

      if (storedDrivers) setDrivers(JSON.parse(storedDrivers))
      else localStorage.setItem('master_drivers', JSON.stringify(INITIAL_DRIVERS))

      if (storedVehicles) setVehicles(JSON.parse(storedVehicles))
      else localStorage.setItem('vehicle_budgets', JSON.stringify(INITIAL_VEHICLES))

      if (storedFuels) setFuels(JSON.parse(storedFuels))
      else localStorage.setItem('master_fuel_prices', JSON.stringify(INITIAL_FUELS))
    } catch (e) {
      console.error(e)
    }
  }, [])

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setDriverForm({ ...driverForm, photo: reader.result as string })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSaveDriver = (e: React.FormEvent) => {
    e.preventDefault()
    const newDriver = { ...driverForm, id: `D${Date.now()}`, status: 'ACTIVE' }
    const updated = [newDriver, ...drivers]
    setDrivers(updated)
    localStorage.setItem('master_drivers', JSON.stringify(updated))
    setShowDriverModal(false)
    setDriverForm({
      name: '',
      phone: '',
      sim_type: 'SIM A',
      sim_number: '',
      sim_expiry: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      photo: '',
    })
  }

  const handleDeleteDriver = (id: string) => {
    if (confirm('Hapus driver ini dari Master Data?')) {
      const updated = drivers.filter((d) => d.id !== id)
      setDrivers(updated)
      localStorage.setItem('master_drivers', JSON.stringify(updated))
    }
  }

  const handleSaveVehicle = (e: React.FormEvent) => {
    e.preventDefault()
    const newVehicle = { ...vehicleForm, id: `V${Date.now()}` }
    const updated = [newVehicle, ...vehicles]
    setVehicles(updated)
    localStorage.setItem('vehicle_budgets', JSON.stringify(updated))
    setShowVehicleModal(false)
    setVehicleForm({ plate_number: '', model: '', year: 2023, monthly_budget: 1500000, last_km: 0, kir_expiry: '', stnk_expiry: '' })
  }

  const handleAdjustBudget = (id: string, currentBudget: number) => {
    const input = prompt('Masukkan nominal Anggaran Bulanan BBM baru (Rp):', currentBudget.toString())
    if (input !== null) {
      const newBudget = Number(input) || 0
      const updated = vehicles.map((v) => (v.id === id ? { ...v, monthly_budget: newBudget } : v))
      setVehicles(updated)
      localStorage.setItem('vehicle_budgets', JSON.stringify(updated))
    }
  }

  const handleDeleteVehicle = (id: string) => {
    if (confirm('Hapus kendaraan ini dari Master Data?')) {
      const updated = vehicles.filter((v) => v.id !== id)
      setVehicles(updated)
      localStorage.setItem('vehicle_budgets', JSON.stringify(updated))
    }
  }

  const handleSaveFuel = (e: React.FormEvent) => {
    e.preventDefault()
    const newFuel = { ...fuelForm, id: `F${Date.now()}` }
    const updated = [...fuels, newFuel]
    setFuels(updated)
    localStorage.setItem('master_fuel_prices', JSON.stringify(updated))
    setShowFuelModal(false)
    setFuelForm({ name: '', price: 10000, category: 'Non-Subsidi' })
  }

  const handleUpdateFuelPrice = (id: string, currentPrice: number) => {
    const input = prompt('Masukkan tarif harga baru per liter (Rp):', currentPrice.toString())
    if (input !== null) {
      const newPrice = Number(input) || 0
      const updated = fuels.map((f) => (f.id === id ? { ...f, price: newPrice } : f))
      setFuels(updated)
      localStorage.setItem('master_fuel_prices', JSON.stringify(updated))
    }
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
      {/* SEKARANG MENGGUNAKAN KOMPONEN ADMINSIDEBAR DARI FOLDER COMPONENTS */}
      <AdminSidebar currentRoute="/admin/settings" activeTab={activeTab} />

      <main className="flex-1 p-6 space-y-6 overflow-y-auto">
        {activeTab === 'drivers' && (
          <div className="space-y-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Master Data Driver & Pengemudi</h2>
                <p className="text-xs text-slate-500 mt-0.5">Kelola biodata, foto profil, lisensi SIM, dan kontak darurat driver</p>
              </div>
              <button
                onClick={() => setShowDriverModal(true)}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition"
              >
                + Tambah Driver Baru
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {drivers.map((d) => (
                <div key={d.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {d.photo ? (
                      <img src={d.photo} alt={d.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl font-bold text-slate-400">{d.name.charAt(0)}</span>
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-sm text-slate-900">{d.name}</h3>
                        <span className="text-xs font-mono text-slate-500">{d.phone}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteDriver(d.id)}
                        className="text-rose-600 hover:underline text-[11px] font-bold"
                      >
                        Hapus
                      </button>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Lisensi SIM:</span>
                        <strong className="text-slate-800">{d.sim_type} • {d.sim_number}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Masa Berlaku SIM:</span>
                        <strong className="font-mono text-amber-700">{d.sim_expiry}</strong>
                      </div>
                      <div className="flex justify-between border-t border-slate-200/60 pt-1 mt-1">
                        <span className="text-slate-500">Kontak Darurat:</span>
                        <span className="font-medium text-slate-800">{d.emergency_contact_name} ({d.emergency_contact_phone})</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'vehicles' && (
          <div className="space-y-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Master Data Armada & Kendaraan</h2>
                <p className="text-xs text-slate-500 mt-0.5">Atur batasan anggaran bulanan BBM, Odometer KM, dan tenggat KIR/STNK</p>
              </div>
              <button
                onClick={() => setShowVehicleModal(true)}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition"
              >
                + Tambah Armada Baru
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-900 text-white font-bold">
                  <tr>
                    <th className="p-3.5">Plat Nomor & Model</th>
                    <th className="p-3.5">Odometer KM</th>
                    <th className="p-3.5">Batas Anggaran BBM (Bulanan)</th>
                    <th className="p-3.5">Exp. Uji KIR</th>
                    <th className="p-3.5">Exp. STNK</th>
                    <th className="p-3.5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vehicles.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50 transition">
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{v.plate_number}</div>
                        <div className="text-[11px] text-slate-500">{v.model} ({v.year})</div>
                      </td>
                      <td className="p-3.5 font-mono font-bold text-slate-800">
                        {v.last_km.toLocaleString('id-ID')} KM
                      </td>
                      <td className="p-3.5">
                        <div className="font-mono font-bold text-indigo-900">
                          Rp {(v.monthly_budget || 0).toLocaleString('id-ID')}
                        </div>
                        <button
                          onClick={() => handleAdjustBudget(v.id, v.monthly_budget)}
                          className="text-[10px] text-amber-600 hover:underline font-bold"
                        >
                          ✏️ Adjust Anggaran
                        </button>
                      </td>
                      <td className="p-3.5 font-mono text-slate-700">{v.kir_expiry || '-'}</td>
                      <td className="p-3.5 font-mono text-slate-700">{v.stnk_expiry || '-'}</td>
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => handleDeleteVehicle(v.id)}
                          className="text-rose-600 hover:underline font-bold"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'prices' && (
          <div className="space-y-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Katalog Jenis & Tarif Harga BBM</h2>
                <p className="text-xs text-slate-500 mt-0.5">Atur daftar pilihan bahan bakar dan penyesuaian harga per liter yang terhubung ke Driver Portal</p>
              </div>
              <button
                onClick={() => setShowFuelModal(true)}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition"
              >
                + Tambah Jenis BBM Baru
              </button>
            </div>

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
                    <button onClick={() => handleDeleteFuel(f.id)} className="text-rose-600 hover:underline text-[11px] font-bold">
                      Hapus
                    </button>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">Tarif Per Liter:</span>
                      <strong className="text-base font-extrabold font-mono text-slate-900">
                        Rp {f.price.toLocaleString('id-ID')}
                      </strong>
                    </div>
                    <button
                      onClick={() => handleUpdateFuelPrice(f.id, f.price)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-xl transition"
                    >
                      Ubah Harga
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {showDriverModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-bold text-slate-900">Tambah Driver Baru</h3>
              <button onClick={() => setShowDriverModal(false)} className="text-slate-400 font-bold">✕</button>
            </div>
            <form onSubmit={handleSaveDriver} className="space-y-3 text-xs">
              <input type="text" placeholder="Nama Lengkap Pengemudi *" className="w-full border p-2.5 rounded-xl outline-none" value={driverForm.name} onChange={(e) => setDriverForm({ ...driverForm, name: e.target.value })} required />
              <input type="text" placeholder="Nomor HP / WhatsApp *" className="w-full border p-2.5 rounded-xl outline-none" value={driverForm.phone} onChange={(e) => setDriverForm({ ...driverForm, phone: e.target.value })} required />
              <div className="grid grid-cols-2 gap-2">
                <select className="border p-2.5 rounded-xl bg-slate-50 font-bold" value={driverForm.sim_type} onChange={(e) => setDriverForm({ ...driverForm, sim_type: e.target.value })}>
                  <option value="SIM A">SIM A</option>
                  <option value="SIM B1">SIM B1</option>
                  <option value="SIM B1 Umum">SIM B1 Umum</option>
                  <option value="SIM B2 Umum">SIM B2 Umum</option>
                </select>
                <input type="text" placeholder="Nomor SIM *" className="border p-2.5 rounded-xl outline-none" value={driverForm.sim_number} onChange={(e) => setDriverForm({ ...driverForm, sim_number: e.target.value })} required />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Masa Berlaku SIM *</label>
                <input type="date" className="w-full border p-2.5 rounded-xl outline-none bg-slate-50" value={driverForm.sim_expiry} onChange={(e) => setDriverForm({ ...driverForm, sim_expiry: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input type="text" placeholder="Kontak Darurat (Nama) *" className="border p-2.5 rounded-xl outline-none" value={driverForm.emergency_contact_name} onChange={(e) => setDriverForm({ ...driverForm, emergency_contact_name: e.target.value })} required />
                <input type="text" placeholder="No. HP Darurat *" className="border p-2.5 rounded-xl outline-none" value={driverForm.emergency_contact_phone} onChange={(e) => setDriverForm({ ...driverForm, emergency_contact_phone: e.target.value })} required />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Unggah Foto Profile Driver</label>
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:bg-slate-100 file:text-slate-700 font-bold" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowDriverModal(false)} className="w-1/2 bg-slate-100 text-slate-700 font-bold py-2.5 rounded-xl">Batal</button>
                <button type="submit" className="w-1/2 bg-slate-900 text-white font-bold py-2.5 rounded-xl shadow-md">Simpan Driver</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showVehicleModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-bold text-slate-900">Tambah Armada Kendaraan Baru</h3>
              <button onClick={() => setShowVehicleModal(false)} className="text-slate-400 font-bold">✕</button>
            </div>
            <form onSubmit={handleSaveVehicle} className="space-y-3 text-xs">
              <input type="text" placeholder="Plat Nomor (Contoh: B 1234 ABC) *" className="w-full border p-2.5 rounded-xl font-bold uppercase" value={vehicleForm.plate_number} onChange={(e) => setVehicleForm({ ...vehicleForm, plate_number: e.target.value })} required />
              <input type="text" placeholder="Model / Tipe Kendaraan *" className="w-full border p-2.5 rounded-xl" value={vehicleForm.model} onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })} required />
              <div className="grid grid-cols-2 gap-2">
                <input type="number" placeholder="Tahun *" className="border p-2.5 rounded-xl font-mono" value={vehicleForm.year} onChange={(e) => setVehicleForm({ ...vehicleForm, year: Number(e.target.value) })} required />
                <input type="number" placeholder="KM Odometer Terkini *" className="border p-2.5 rounded-xl font-mono" value={vehicleForm.last_km} onChange={(e) => setVehicleForm({ ...vehicleForm, last_km: Number(e.target.value) })} required />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Anggaran Bulanan BBM (Rp) *</label>
                <input type="number" placeholder="1500000" className="w-full border p-2.5 rounded-xl font-mono font-bold" value={vehicleForm.monthly_budget} onChange={(e) => setVehicleForm({ ...vehicleForm, monthly_budget: Number(e.target.value) })} required />
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

      {showFuelModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-bold text-slate-900">Tambah Jenis BBM Baru</h3>
              <button onClick={() => setShowFuelModal(false)} className="text-slate-400 font-bold">✕</button>
            </div>
            <form onSubmit={handleSaveFuel} className="space-y-3 text-xs">
              <input type="text" placeholder="Nama BBM (Misal: Pertamax Green 95) *" className="w-full border p-2.5 rounded-xl font-bold" value={fuelForm.name} onChange={(e) => setFuelForm({ ...fuelForm, name: e.target.value })} required />
              <input type="number" placeholder="Harga Per Liter (Rp) *" className="w-full border p-2.5 rounded-xl font-mono font-bold" value={fuelForm.price} onChange={(e) => setFuelForm({ ...fuelForm, price: Number(e.target.value) })} required />
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
    <Suspense fallback={<div className="min-h-screen bg-slate-900 text-white p-6">Memuat Pengaturan...</div>}>
      <SettingsContent />
    </Suspense>
  )
}