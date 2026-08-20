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
  { id: '1', plate_number: 'B 1234 ABC', model: 'Toyota Avanza', monthly_budget: 1500000 },
  { id: '2', plate_number: 'B 5678 XYZ', model: 'Daihatsu Gran Max', monthly_budget: 2000000 },
  { id: '3', plate_number: 'B 9012 DEF', model: 'Isuzu Traga', monthly_budget: 2500000 },
]

export default function SettingsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState(false)
  const [prices, setPrices] = useState<Record<string, number>>(DEFAULT_PRICES)
  const [vehicles, setVehicles] = useState(DEFAULT_VEHICLES)
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

  const handleBudgetChange = (id: string, val: string) => {
    const num = Number(val.replace(/[^0-9]/g, ''))
    setVehicles((prev) =>
      prev.map((v) => (v.id === id ? { ...v, monthly_budget: num } : v))
    )
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    localStorage.setItem('fuel_prices', JSON.stringify(prices))
    localStorage.setItem('vehicle_budgets', JSON.stringify(vehicles))
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 3000)
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
            <p className="text-xs text-slate-500 mt-0.5">Masukkan PIN Administrator untuk mengubah konfigurasi</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="password"
              maxLength={4}
              placeholder="••••"
              className="w-full text-center text-xl tracking-widest py-2.5 border rounded-lg border-slate-300 focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none font-mono font-bold"
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
        
        {/* Header */}
        <div className="flex justify-between items-center bg-white p-5 rounded-xl border border-slate-200">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Konfigurasi Operasional</h1>
            <p className="text-xs text-slate-500 mt-0.5">Penetapan tarif bahan bakar per liter & pagu anggaran armada</p>
          </div>
          <Link
            href="/admin"
            className="text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg transition border border-slate-200"
          >
            ← Kembali ke Dashboard
          </Link>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {savedSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center justify-between">
              <span>Konfigurasi tarif dan pagu anggaran berhasil diperbarui.</span>
              <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}

          {/* Section Tarif BBM */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
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
                      className="w-full py-2 pl-9 pr-3 border rounded-lg text-xs border-slate-300 focus:ring-2 focus:ring-slate-900 outline-none font-semibold text-slate-900"
                      value={prices[type] ? prices[type].toLocaleString('id-ID') : ''}
                      onChange={(e) => handlePriceChange(type, e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section Pagu Anggaran Kendaraan */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
            <h2 className="text-xs font-bold text-slate-900 tracking-wider uppercase">Pagu Anggaran Bulanan Per Kendaraan</h2>
            <div className="space-y-3 pt-1">
              {vehicles.map((v) => (
                <div key={v.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div>
                    <div className="text-xs font-bold text-slate-900">{v.plate_number}</div>
                    <div className="text-[11px] text-slate-500">{v.model}</div>
                  </div>
                  <div className="relative w-full sm:w-48">
                    <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-medium">Rp</span>
                    <input
                      type="text"
                      required
                      className="w-full py-2 pl-9 pr-3 border rounded-lg text-xs border-slate-300 focus:ring-2 focus:ring-slate-900 outline-none font-semibold text-slate-900 text-right"
                      value={v.monthly_budget ? v.monthly_budget.toLocaleString('id-ID') : ''}
                      onChange={(e) => handleBudgetChange(v.id, e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 rounded-lg text-xs transition shadow-sm"
          >
            Simpan Seluruh Perubahan
          </button>
        </form>

      </div>
    </div>
  )
}