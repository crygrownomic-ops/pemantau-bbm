'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Icons } from '@/components/ui/Icons'

const DEFAULT_DRIVERS = [
  { id: '1', name: 'Ahmad Supardi', phone: '081234567890', status: 'Aktif' },
  { id: '2', name: 'Budi Santoso', phone: '081987654321', status: 'Aktif' },
]

const DEFAULT_RATES = [
  { id: '1', fuel_type: 'Pertalite', price: 10000 },
  { id: '2', fuel_type: 'Pertamax', price: 12500 },
  { id: '3', fuel_type: 'Solar', price: 6800 },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'drivers' | 'vehicles' | 'prices' | 'company'>('drivers')
  const [drivers, setDrivers] = useState(DEFAULT_DRIVERS)
  const [rates, setRates] = useState(DEFAULT_RATES)

  // FORM INPUT DRIVER BARU
  const [newDriverName, setNewDriverName] = useState('')
  const [newDriverPhone, setNewDriverPhone] = useState('')

  useEffect(() => {
    try {
      const storedDrivers = localStorage.getItem('master_drivers')
      if (storedDrivers) setDrivers(JSON.parse(storedDrivers))

      const storedRates = localStorage.getItem('master_rates')
      if (storedRates) setRates(JSON.parse(storedRates))
    } catch (e) {
      console.error(e)
    }
  }, [])

  const handleAddDriver = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDriverName) return

    const updated = [...drivers, { id: String(Date.now()), name: newDriverName, phone: newDriverPhone || '-', status: 'Aktif' }]
    setDrivers(updated)
    localStorage.setItem('master_drivers', JSON.stringify(updated))
    setNewDriverName('')
    setNewDriverPhone('')
  }

  const handleUpdatePrice = (id: string, newPrice: number) => {
    const updated = rates.map((r) => (r.id === id ? { ...r, price: newPrice } : r))
    setRates(updated)
    localStorage.setItem('master_rates', JSON.stringify(updated))
  }

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans text-slate-800">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between p-4">
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-2 border-b border-slate-800">
            <div className="w-8 h-8 bg-amber-500 text-slate-950 rounded-lg flex items-center justify-center font-bold">
              <Icons.Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-white uppercase">Kelola Operasional</h2>
              <span className="text-[10px] text-amber-400 block">Master Data System</span>
            </div>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('drivers')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition ${activeTab === 'drivers' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-400'}`}
            >
              <Icons.Users className="w-4 h-4" /> Master Biodata Driver
            </button>

            <button
              onClick={() => setActiveTab('prices')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition ${activeTab === 'prices' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-400'}`}
            >
              <Icons.Price className="w-4 h-4" /> Tarif Bahan Bakar
            </button>
          </nav>
        </div>

        <Link
          href="/admin"
          className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-xl text-xs font-bold text-center block"
        >
          ← Kembali ke Admin
        </Link>
      </aside>

      {/* CONTENT MAIN */}
      <main className="flex-1 p-6 space-y-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <h1 className="text-base font-bold text-slate-900">
            {activeTab === 'drivers' ? 'Master Biodata Driver' : 'Pengaturan Tarif Bahan Bakar'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Kelola data terpusat operasional armada kendaraan</p>
        </div>

        {activeTab === 'drivers' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase">Tambah Driver Baru</h3>
              <form onSubmit={handleAddDriver} className="space-y-3">
                <input
                  type="text"
                  placeholder="Nama Pengemudi"
                  className="w-full text-xs border p-2.5 rounded-xl outline-none"
                  value={newDriverName}
                  onChange={(e) => setNewDriverName(e.target.value)}
                  required
                />
                <input
                  type="text"
                  placeholder="Nomor Whatsapp / Telepon"
                  className="w-full text-xs border p-2.5 rounded-xl outline-none"
                  value={newDriverPhone}
                  onChange={(e) => setNewDriverPhone(e.target.value)}
                />
                <button type="submit" className="w-full bg-slate-900 text-white text-xs font-bold py-2.5 rounded-xl">
                  Simpan Driver
                </button>
              </form>
            </div>

            <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-white font-bold">
                  <tr>
                    <th className="p-3">Nama Pengemudi</th>
                    <th className="p-3">No. Kontak</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {drivers.map((d) => (
                    <tr key={d.id}>
                      <td className="p-3 font-bold">{d.name}</td>
                      <td className="p-3 font-mono">{d.phone}</td>
                      <td className="p-3"><span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">{d.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'prices' && (
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm max-w-xl space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase">Tarif Dasar BBM per Liter</h3>
            <div className="space-y-3">
              {rates.map((r) => (
                <div key={r.id} className="flex justify-between items-center p-3 bg-slate-50 border rounded-xl">
                  <span className="text-xs font-bold text-slate-800">{r.fuel_type}</span>
                  <input
                    type="number"
                    className="text-xs font-mono font-bold text-right border p-1.5 rounded-lg w-28 bg-white"
                    value={r.price}
                    onChange={(e) => handleUpdatePrice(r.id, Number(e.target.value))}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

    </div>
  )
}