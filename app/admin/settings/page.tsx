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

export default function SettingsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState(false)
  const [prices, setPrices] = useState<Record<string, number>>(DEFAULT_PRICES)
  const [savedSuccess, setSavedSuccess] = useState(false)

  useEffect(() => {
    const localPrices = localStorage.getItem('fuel_prices')
    if (localPrices) {
      setPrices(JSON.parse(localPrices))
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

  const handlePriceChange = (fuelType: string, newPrice: string) => {
    const numericValue = Number(newPrice.replace(/[^0-9]/g, ''))
    setPrices((prev) => ({
      ...prev,
      [fuelType]: numericValue,
    }))
  }

  const handleSavePrices = (e: React.FormEvent) => {
    e.preventDefault()
    localStorage.setItem('fuel_prices', JSON.stringify(prices))
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 3000)
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans">
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 max-w-sm w-full space-y-4 text-center">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
            ⚙️
          </div>
          <h1 className="text-lg font-bold text-gray-800">Akses Pengaturan Harga</h1>
          <p className="text-xs text-gray-500">Masukkan PIN Admin untuk mengubah harga BBM</p>

          <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="password"
              maxLength={4}
              placeholder="PIN (Default: 1234)"
              className="w-full text-center text-lg tracking-widest p-2.5 border rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none font-bold"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
            />

            {pinError && (
              <p className="text-xs text-red-600 font-medium">PIN salah! Gunakan PIN: 1234</p>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg text-sm transition"
            >
              Masuk Pengaturan
            </button>
          </form>

          <Link href="/admin" className="block text-xs text-gray-500 hover:underline pt-2">
            ← Kembali ke Dashboard Admin
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 font-sans">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Header Navigation */}
        <div className="flex justify-between items-center bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Pengaturan Harga BBM</h1>
            <p className="text-xs text-gray-500">Penetapan tarif dasar per 1 liter bahan bakar</p>
          </div>
          <Link
            href="/admin"
            className="text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 px-3.5 py-2 rounded-lg transition"
          >
            ← Ke Dashboard Admin
          </Link>
        </div>

        {/* Form Set Harga Per Liter */}
        <form onSubmit={handleSavePrices} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
          {savedSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-bold flex items-center justify-between">
              <span>Tarif harga BBM berhasil diperbarui!</span>
              <span>✓</span>
            </div>
          )}

          <div className="space-y-3 divide-y divide-gray-100">
            {Object.keys(prices).map((fuelType) => (
              <div key={fuelType} className="pt-3 flex items-center justify-between gap-4">
                <label className="text-xs font-bold text-gray-700 w-1/2">{fuelType}</label>
                <div className="relative w-1/2">
                  <span className="absolute left-3 top-2.5 text-xs text-gray-500 font-medium">Rp</span>
                  <input
                    type="text"
                    required
                    className="w-full p-2 pl-9 border rounded-lg text-sm border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-900 text-right pr-3"
                    value={prices[fuelType] ? prices[fuelType].toLocaleString('id-ID') : ''}
                    onChange={(e) => handlePriceChange(fuelType, e.target.value)}
                  />
                  <span className="absolute right-3 top-2.5 text-[10px] text-gray-400">/Liter</span>
                </div>
              </div>
            ))}
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg text-sm transition mt-4 shadow-sm"
          >
            Simpan Perubahan Harga
          </button>
        </form>

      </div>
    </div>
  )
}