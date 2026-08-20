'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const DEFAULT_VEHICLES = [
  { id: '1', plate_number: 'B 1234 ABC', model: 'Toyota Avanza', monthly_budget: 1500000, last_km: 45000 },
  { id: '2', plate_number: 'B 5678 XYZ', model: 'Daihatsu Gran Max', monthly_budget: 2000000, last_km: 32000 },
  { id: '3', plate_number: 'B 9012 DEF', model: 'Isuzu Traga', monthly_budget: 2500000, last_km: 18500 },
]

const DEFAULT_PRICES: Record<string, number> = {
  'Pertalite': 10000,
  'Pertamax': 12950,
  'Pertamax Green 95': 13600,
  'Pertamax Turbo': 14400,
  'Biosolar / Solar': 6800,
  'Dexlite': 14550,
  'Pertamina Dex': 15100,
}

export default function BackupPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState(false)

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (pinInput === '1234') {
      setIsAuthenticated(true)
      setPinError(false)
    } else {
      setPinError(true)
    }
  }

  // Unduh Berkas JSON Backup ke Drive D: / C:
  const handleExportBackup = () => {
    try {
      const storedVehicles = JSON.parse(localStorage.getItem('vehicle_budgets') || '[]')
      const storedPrices = JSON.parse(localStorage.getItem('fuel_prices') || '{}')
      const storedLogs = JSON.parse(localStorage.getItem('fuel_logs') || '[]')

      const backupData = {
        app_name: 'Pemantau BBM Hybrid Backup',
        version: '1.0',
        exported_at: new Date().toISOString(),
        vehicle_budgets: storedVehicles.length > 0 ? storedVehicles : DEFAULT_VEHICLES,
        fuel_prices: Object.keys(storedPrices).length > 0 ? storedPrices : DEFAULT_PRICES,
        fuel_logs: storedLogs,
      }

      const jsonString = JSON.stringify(backupData, null, 2)
      const blob = new Blob([jsonString], { type: 'application/json' })
      const url = URL.createObjectURL(blob)

      const dateStr = new Date().toISOString().split('T')[0]
      const link = document.createElement('a')
      link.href = url
      link.download = `BACKUP_BBM_${dateStr}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      alert('Berkas cadangan berhasil diunduh! Silakan simpan di Drive D: atau C: Anda.')
    } catch (err) {
      alert('Gagal mengekspor data cadangan!')
    }
  }

  // Upload & Restore Berkas JSON
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string
        const parsed = JSON.parse(content)

        if (parsed.vehicle_budgets && parsed.fuel_prices && parsed.fuel_logs) {
          if (confirm('Apakah Anda yakin ingin memulihkan (restore) seluruh data dari berkas ini? Data lama di browser akan digantikan.')) {
            localStorage.setItem('vehicle_budgets', JSON.stringify(parsed.vehicle_budgets))
            localStorage.setItem('fuel_prices', JSON.stringify(parsed.fuel_prices))
            localStorage.setItem('fuel_logs', JSON.stringify(parsed.fuel_logs))

            alert('Pemulihan data (Restore) Berhasil! Seluruh armada dan riwayat transaksi telah diperbarui.')
            window.location.href = '/admin'
          }
        } else {
          alert('Format berkas cadangan tidak valid. Pastikan mengunggah berkas .json resmi!')
        }
      } catch (err) {
        alert('Gagal membaca berkas cadangan.')
      }
    }
    reader.readAsText(file)
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
            <h1 className="text-base font-bold text-slate-900">Autentikasi Pusat Backup</h1>
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans text-slate-800">
      <div className="max-w-2xl w-full mx-auto p-4 sm:p-6 space-y-6">
        
        <div className="flex justify-between items-center bg-white p-5 rounded-xl border border-slate-200">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Pusat Cadangan Data (Backup & Restore)</h1>
            <p className="text-xs text-slate-500 mt-0.5">Ekspor data ke disk lokal (Drive C:/D:) atau pulihkan dari file backup</p>
          </div>
          <Link
            href="/admin"
            className="text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg transition border border-slate-200"
          >
            ← Ke Dashboard
          </Link>
        </div>

        {/* Panel Hybrid Backup & Restore */}
        <div className="bg-slate-900 text-white p-6 rounded-xl space-y-5 shadow-sm">
          <div>
            <h2 className="text-xs font-bold tracking-wider uppercase text-slate-300">AMANKAN DATA OPERASIONAL (HYBRID ENGINE)</h2>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Seluruh riwayat pengisian BBM, foto struk, dan data armada dapat diunduh dalam 1 file cadangan resmi (.JSON). Simpan berkas ini di Drive D: atau C: Anda secara berkala.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              onClick={handleExportBackup}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-lg text-xs transition flex items-center justify-center gap-2 shadow-sm"
            >
              <span>💾</span> Unduh Backup Data (.JSON)
            </button>

            <label className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold py-3 px-4 rounded-lg text-xs transition flex items-center justify-center gap-2 cursor-pointer">
              <span>📂</span> Unggah & Pulihkan Data
              <input
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                className="hidden"
              />
            </label>
          </div>
        </div>

      </div>

      <footer className="py-4 text-center border-t border-slate-200 bg-white text-[11px] text-slate-500 font-medium mt-8">
        Developed by <span className="font-bold text-slate-800">Urai Ikhsan Fadhilah</span>
      </footer>
    </div>
  )
}