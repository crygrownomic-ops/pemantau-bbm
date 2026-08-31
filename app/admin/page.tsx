'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

// --- IKON VEKTOR SVG MODERN ---
const Icons = {
  Fuel: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  Dashboard: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  ),
  Analytics: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
    </svg>
  ),
  Wrench: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Settings: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
    </svg>
  ),
  Backup: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
    </svg>
  ),
  Wallet: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  Zap: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  Clipboard: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  ),
  Alert: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  Printer: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
    </svg>
  ),
  Mobile: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ),
  Lock: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  ),
  Check: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
    </svg>
  )
}

const DEFAULT_VEHICLES = [
  { id: '1', plate_number: 'B 1234 ABC', model: 'Toyota Avanza', monthly_budget: 1500000, last_km: 45320 },
  { id: '2', plate_number: 'B 5678 XYZ', model: 'Daihatsu Gran Max', monthly_budget: 2000000, last_km: 32000 },
  { id: '3', plate_number: 'B 9012 DEF', model: 'Isuzu Traga', monthly_budget: 2500000, last_km: 18500 },
]

const DEFAULT_LOGS = [
  { id: 1, plate_number: 'B 1234 ABC', vehicle_model: 'Toyota Avanza', driver_name: 'Ahmad Supardi', initial_km: 45250, final_km: 45750, distance_km: 500, liters: 15, unit_price: 10000, km_per_liter: 33.33, total_cost: 150000, fuel_type: 'Pertalite', fill_location: 'SPBU', emergency_note: '', date: '2026-08-31', status: 'PENDING' },
  { id: 2, plate_number: 'KB 1234 YK', vehicle_model: 'Toyota Avanza', driver_name: 'Budi Santoso', initial_km: 47582, final_km: 47896, distance_km: 314, liters: 30, unit_price: 10000, km_per_liter: 10.47, total_cost: 300000, fuel_type: 'Pertalite', fill_location: 'SPBU', emergency_note: '', date: '2026-08-31', status: 'PENDING' },
  { id: 3, plate_number: 'KB 1234 YK', vehicle_model: 'Toyota Avanza', driver_name: 'Budi Santoso', initial_km: 47500, final_km: 47582, distance_km: 82, liters: 35.5, unit_price: 12500, km_per_liter: 2.31, total_cost: 443750, fuel_type: 'Pertalite', fill_location: 'ECERAN', emergency_note: 'SPBU Terdekat Habis Stok', date: '2026-08-31', status: 'PENDING' },
  { id: 4, plate_number: 'B 1234 ABC', vehicle_model: 'Toyota Avanza', driver_name: 'Udin', initial_km: 45070, final_km: 45250, distance_km: 180, liters: 30, unit_price: 10000, km_per_liter: 6.0, total_cost: 300000, fuel_type: 'Pertalite', fill_location: 'SPBU', emergency_note: '', date: '2026-08-26', status: 'VERIFIED' },
  { id: 5, plate_number: 'B 1234 ABC', vehicle_model: 'Toyota Avanza', driver_name: 'Joko', initial_km: 0, final_km: 70, distance_km: 70, liters: 25.3, unit_price: 10000, km_per_liter: 2.77, total_cost: 253000, fuel_type: 'Pertalite', fill_location: 'SPBU', emergency_note: '', date: '2026-08-20', status: 'VERIFIED' },
]

const DEFAULT_SERVICE_HISTORY = [
  { id: 1, plate_number: 'B 1234 ABC', service_type: 'Ganti Oli & Filter', cost: 450000, workshop: 'Auto2000 Grogol', km_done: 40000, date: '2026-06-15' },
  { id: 2, plate_number: 'B 5678 XYZ', service_type: 'Servis Berkala 30.000 KM', cost: 1200000, workshop: 'Bengkel Resmi Daihatsu', km_done: 30000, date: '2026-07-02' },
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

function sanitizeLogs(data: any) {
  if (!Array.isArray(data)) return DEFAULT_LOGS
  return data.map((l, idx) => ({
    id: l?.id || Date.now() + idx,
    plate_number: String(l?.plate_number || 'ARMADA').toUpperCase(),
    vehicle_model: String(l?.vehicle_model || '-'),
    driver_name: String(l?.driver_name || 'Driver'),
    initial_km: Number(l?.initial_km) || 0,
    final_km: Number(l?.final_km) || 0,
    distance_km: Number(l?.distance_km) || 0,
    liters: Number(l?.liters) || 0,
    unit_price: Number(l?.unit_price) || 0,
    km_per_liter: l?.km_per_liter ? String(l.km_per_liter) : '0',
    total_cost: Number(l?.total_cost) || 0,
    fuel_type: String(l?.fuel_type || 'Pertalite'),
    fill_location: String(l?.fill_location || 'SPBU'),
    emergency_note: String(l?.emergency_note || ''),
    receipt_image: l?.receipt_image || '',
    date: String(l?.date || new Date().toISOString().split('T')[0]),
    status: String(l?.status || 'PENDING'),
  }))
}

function getMaintenanceSchedule(currentKm: number) {
  const km = Number(currentKm) || 0
  const oilInterval = 5000
  const serviceInterval = 10000
  const brakeInterval = 20000
  const tireInterval = 25000

  const nextOilKm = Math.ceil((km + 1) / oilInterval) * oilInterval
  const remainingOilKm = nextOilKm - km

  const nextServiceKm = Math.ceil((km + 1) / serviceInterval) * serviceInterval
  const remainingServiceKm = nextServiceKm - km

  const nextBrakeKm = Math.ceil((km + 1) / brakeInterval) * brakeInterval
  const remainingBrakeKm = nextBrakeKm - km

  const nextTireKm = Math.ceil((km + 1) / tireInterval) * tireInterval
  const remainingTireKm = nextTireKm - km

  let status: 'CRITICAL' | 'WARNING' | 'OK' = 'OK'
  if (remainingOilKm <= 300 || remainingServiceKm <= 300 || remainingBrakeKm <= 500) {
    status = 'CRITICAL'
  } else if (remainingOilKm <= 1000 || remainingServiceKm <= 1000) {
    status = 'WARNING'
  }

  return { nextOilKm, remainingOilKm, nextServiceKm, remainingServiceKm, nextBrakeKm, remainingBrakeKm, nextTireKm, remainingTireKm, status }
}

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState(false)

  const [vehicles, setVehicles] = useState(DEFAULT_VEHICLES)
  const [logs, setLogs] = useState<any[]>(DEFAULT_LOGS)
  const [serviceHistory, setServiceHistory] = useState<any[]>(DEFAULT_SERVICE_HISTORY)

  const [activeTab, setActiveTab] = useState<'dashboard' | 'analytics' | 'maintenance'>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isKelolaOpen, setIsKelolaOpen] = useState(false)

  const [selectedVehicle, setSelectedVehicle] = useState('ALL')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [previewReceipt, setPreviewReceipt] = useState<any | null>(null)

  const [showPrintModal, setShowPrintModal] = useState(false)
  const [showResetModal, setShowResetModal] = useState(false)
  const [resetPinInput, setResetPinInput] = useState('')
  const [resetPinError, setResetPinError] = useState(false)

  // STATE MODAL SERVIS SELESAI
  const [selectedServiceVehicle, setSelectedServiceVehicle] = useState<any | null>(null)
  const [serviceTypeInput, setServiceTypeInput] = useState('Ganti Oli & Filter Mesin')
  const [serviceCostInput, setServiceCostInput] = useState('')
  const [workshopInput, setWorkshopInput] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('admin_authenticated') === 'true') {
      setIsAuthenticated(true)
    }
  }, [])

  useEffect(() => {
    try {
      const storedVehicles = localStorage.getItem('vehicle_budgets')
      const storedLogs = localStorage.getItem('fuel_logs')
      const storedServices = localStorage.getItem('service_history')

      if (storedVehicles) {
        setVehicles(sanitizeVehicles(JSON.parse(storedVehicles)))
      }
      if (storedLogs) {
        setLogs(sanitizeLogs(JSON.parse(storedLogs)))
      }
      if (storedServices) {
        setServiceHistory(JSON.parse(storedServices))
      }
    } catch (err) {
      console.error('Error loading stored data:', err)
    }
  }, [])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (pinInput === '1234') {
      setIsAuthenticated(true)
      localStorage.setItem('admin_authenticated', 'true')
      setPinError(false)
    } else {
      setPinError(true)
    }
  }

  const handleLogout = () => {
    if (confirm('Kunci kembali akses Admin?')) {
      localStorage.removeItem('admin_authenticated')
      setIsAuthenticated(false)
    }
  }

  const handleUpdateStatus = (id: number, newStatus: 'VERIFIED' | 'FLAGGED') => {
    const updatedLogs = logs.map((l) => (l.id === id ? { ...l, status: newStatus } : l))
    setLogs(updatedLogs)
    localStorage.setItem('fuel_logs', JSON.stringify(updatedLogs))
    if (previewReceipt && previewReceipt.id === id) {
      setPreviewReceipt({ ...previewReceipt, status: newStatus })
    }
  }

  const handleDeleteLog = (id: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus catatan transaksi ini?')) {
      const updatedLogs = logs.filter((l) => l.id !== id)
      setLogs(updatedLogs)
      localStorage.setItem('fuel_logs', JSON.stringify(updatedLogs))
    }
  }

  const handleRecordServiceSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedServiceVehicle) return

    const newServiceRecord = {
      id: Date.now(),
      plate_number: selectedServiceVehicle.plate_number,
      service_type: serviceTypeInput,
      cost: Number(serviceCostInput) || 0,
      workshop: workshopInput || 'Bengkel Rekanan',
      km_done: selectedServiceVehicle.last_km,
      date: new Date().toISOString().split('T')[0],
    }

    const updatedHistory = [newServiceRecord, ...serviceHistory]
    setServiceHistory(updatedHistory)
    localStorage.setItem('service_history', JSON.stringify(updatedHistory))

    alert(`Pencatatan Servis untuk ${selectedServiceVehicle.plate_number} berhasil disimpan!`)
    setSelectedServiceVehicle(null)
    setServiceCostInput('')
    setWorkshopInput('')
  }

  const handleConfirmResetCache = (e: React.FormEvent) => {
    e.preventDefault()
    if (resetPinInput === '1234') {
      localStorage.removeItem('fuel_logs')
      localStorage.removeItem('service_history')
      setLogs(DEFAULT_LOGS)
      setServiceHistory(DEFAULT_SERVICE_HISTORY)
      setShowResetModal(false)
      setResetPinInput('')
      setResetPinError(false)
      alert('Cache berhasil dibersihkan!')
    } else {
      setResetPinError(true)
    }
  }

  const handleDownloadReceipt = (receiptBase64: string, plateNumber: string, date: string, finalKm: number) => {
    const cleanPlate = (plateNumber || 'ARMADA').replace(/\s+/g, '').toUpperCase()
    const cleanDate = date || 'TANPATANGGAL'
    const fileName = `${cleanPlate}_${cleanDate}_${finalKm || 0}.jpg`

    const a = document.createElement('a')
    a.href = receiptBase64
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const renderEfficiencyBadge = (kmPerLiterVal: any) => {
    const val = Number(kmPerLiterVal) || 0
    if (val < 8) {
      return (
        <span className="bg-rose-500/10 text-rose-600 border border-rose-300 font-bold px-2.5 py-1 rounded-full text-[10px] inline-flex items-center gap-1.5 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse"></span>
          {val} KM/L (Boros)
        </span>
      )
    } else if (val < 12) {
      return (
        <span className="bg-amber-500/10 text-amber-700 border border-amber-300 font-bold px-2.5 py-1 rounded-full text-[10px] inline-flex items-center gap-1.5 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          {val} KM/L (Normal)
        </span>
      )
    } else {
      return (
        <span className="bg-emerald-500/10 text-emerald-700 border border-emerald-300 font-bold px-2.5 py-1 rounded-full text-[10px] inline-flex items-center gap-1.5 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          {val} KM/L (Irit)
        </span>
      )
    }
  }

  const renderStatusBadge = (status?: string) => {
    if (status === 'VERIFIED') {
      return <span className="bg-emerald-500 text-white font-bold px-2.5 py-0.5 rounded-full text-[10px] shadow-sm">VERIFIED</span>
    } else if (status === 'FLAGGED') {
      return <span className="bg-rose-500 text-white font-bold px-2.5 py-0.5 rounded-full text-[10px] shadow-sm">ANOMALI</span>
    } else {
      return <span className="bg-amber-500 text-white font-bold px-2.5 py-0.5 rounded-full text-[10px] shadow-sm">PENDING</span>
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
        <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm w-full space-y-5 text-center border border-slate-100">
          <div className="w-12 h-12 bg-amber-500 text-slate-950 rounded-2xl flex items-center justify-center mx-auto text-xl font-bold shadow-lg">
            <Icons.Fuel />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Dashboard Admin</h1>
            <p className="text-xs text-slate-500 mt-0.5">Sistem Monitoring BBM & Maintenance Armada</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="password"
              maxLength={4}
              placeholder="••••"
              className="w-full text-center text-2xl tracking-widest py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-mono font-bold bg-slate-50"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
            />

            {pinError && (
              <p className="text-xs text-rose-600 font-semibold">PIN tidak valid (Default: 1234)</p>
            )}

            <button
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl text-xs transition shadow-md flex items-center justify-center gap-2"
            >
              <Icons.Lock /> Verifikasi Akses Admin
            </button>
          </form>

          <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
            <Link href="/" className="hover:text-amber-600 font-bold transition flex items-center gap-1">
              <Icons.Mobile /> Form Driver BBM
            </Link>
            <button
              onClick={() => setShowResetModal(true)}
              className="text-rose-600 hover:text-rose-800 font-semibold"
            >
              Reset Cache
            </button>
          </div>
        </div>
      </div>
    )
  }

  const safeLogs = Array.isArray(logs) ? logs : []
  const safeVehicles = Array.isArray(vehicles) ? vehicles : []

  const filteredLogs = safeLogs.filter((log) => {
    const matchVehicle = selectedVehicle === 'ALL' || log.plate_number === selectedVehicle
    const matchStart = !startDate || log.date >= startDate
    const matchEnd = !endDate || log.date <= endDate
    return matchVehicle && matchStart && matchEnd
  })

  const pendingCount = safeLogs.filter((l) => !l.status || l.status === 'PENDING').length
  const emergencyCount = safeLogs.filter((l) => l.fill_location === 'ECERAN').length
  const highConsumptionLogs = safeLogs.filter((l) => Number(l.km_per_liter) < 8)

  const totalCost = filteredLogs.reduce((acc, l) => acc + (Number(l.total_cost) || 0), 0)
  const totalLiters = filteredLogs.reduce((acc, l) => acc + (Number(l.liters) || 0), 0)
  const totalKm = filteredLogs.reduce((acc, l) => acc + (Number(l.distance_km) || 0), 0)
  const avgKmPerLiter = totalLiters > 0 ? (totalKm / totalLiters).toFixed(2) : '0'
  const totalMaintenanceCost = serviceHistory.reduce((acc, s) => acc + (Number(s.cost) || 0), 0)

  const vehicleStats = safeVehicles.map((v) => {
    const vLogs = safeLogs.filter((l) => l.plate_number === v.plate_number)
    const spentCost = vLogs.reduce((acc, l) => acc + (Number(l.total_cost) || 0), 0)
    const km = vLogs.reduce((acc, l) => acc + (Number(l.distance_km) || 0), 0)
    const liters = vLogs.reduce((acc, l) => acc + (Number(l.liters) || 0), 0)
    const efficiency = liters > 0 ? (km / liters).toFixed(1) : '0'
    const budget = Number(v.monthly_budget) || 1
    const usagePercent = Math.min(Math.round((spentCost / budget) * 100), 100)
    const isOverBudget = spentCost > budget

    const maintenance = getMaintenanceSchedule(v.last_km)

    return { ...v, spentCost, efficiency: Number(efficiency), usagePercent, isOverBudget, monthly_budget: budget, maintenance, totalLiters: liters, totalKm: km }
  })

  const criticalServiceCount = vehicleStats.filter((v) => v.maintenance.status === 'CRITICAL').length

  const exportToExcel = () => {
    const title = 'REKAPITULASI OPERASIONAL PENGISIAN BBM'
    const periodStr = `Periode: ${startDate || 'Awal'} s/d ${endDate || 'Hari Ini'}`
    const filterStr = `Filter Armada: ${selectedVehicle === 'ALL' ? 'Semua Armada' : selectedVehicle}`

    let tableRows = ''
    filteredLogs.forEach((l) => {
      const effVal = Number(l.km_per_liter) || 0
      const statusEff = effVal < 8 ? 'Boros (<8 KM/L)' : effVal < 12 ? 'Normal (8-12 KM/L)' : 'Irit (>12 KM/L)'
      const tempatFill = l.fill_location === 'ECERAN' ? 'DARURAT (ECERAN)' : 'SPBU RESMI'
      
      tableRows += `
        <tr>
          <td style="text-align: center;">${l.date || '-'}</td>
          <td style="font-weight: bold; text-align: center;">${l.plate_number || '-'}</td>
          <td>${l.vehicle_model || '-'}</td>
          <td>${l.driver_name || '-'}</td>
          <td style="text-align: center;">${tempatFill}</td>
          <td>${l.emergency_note || '-'}</td>
          <td style="text-align: center;">${l.fuel_type || '-'}</td>
          <td style="text-align: right;">${(Number(l.initial_km) || 0).toLocaleString('id-ID')}</td>
          <td style="text-align: right;">${(Number(l.final_km) || 0).toLocaleString('id-ID')}</td>
          <td style="text-align: right; font-weight: bold;">${(Number(l.distance_km) || 0).toLocaleString('id-ID')} KM</td>
          <td style="text-align: right;">${(Number(l.liters) || 0).toLocaleString('id-ID')} L</td>
          <td style="text-align: right;">Rp ${(Number(l.unit_price) || 0).toLocaleString('id-ID')}</td>
          <td style="text-align: right; font-weight: bold;">Rp ${(Number(l.total_cost) || 0).toLocaleString('id-ID')}</td>
          <td style="text-align: center;">${effVal} KM/L</td>
          <td style="text-align: center;">${statusEff}</td>
          <td style="text-align: center; font-weight: bold;">${l.status || 'PENDING'}</td>
        </tr>
      `
    })

    const excelHTML = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
        <style>
          body { font-family: Arial, sans-serif; }
          .header-title { font-size: 16px; font-weight: bold; color: #0f172a; }
          .header-meta { font-size: 11px; color: #475569; }
          table { border-collapse: collapse; width: 100%; margin-top: 12px; }
          th { background-color: #0f172a; color: #ffffff; font-weight: bold; border: 1px solid #cbd5e1; padding: 8px; text-align: center; font-size: 11px; }
          td { border: 1px solid #cbd5e1; padding: 6px; font-size: 11px; }
          .total-row { background-color: #f1f5f9; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header-title">${title}</div>
        <div class="header-meta">${periodStr}</div>
        <div class="header-meta">${filterStr}</div>
        <table>
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Plat Kendaraan</th>
              <th>Model / Tipe</th>
              <th>Pengemudi</th>
              <th>Tempat Pengisian</th>
              <th>Alasan Darurat</th>
              <th>Jenis BBM</th>
              <th>KM Awal</th>
              <th>KM Akhir</th>
              <th>Jarak Tempuh</th>
              <th>Volume (Liter)</th>
              <th>Harga / Liter</th>
              <th>Total Biaya</th>
              <th>Efisiensi</th>
              <th>Kategori Efisiensi</th>
              <th>Status Audit</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
            <tr class="total-row">
              <td colspan="9" style="text-align: right;">TOTAL REKAPITULASI:</td>
              <td style="text-align: right;">${totalKm.toLocaleString('id-ID')} KM</td>
              <td style="text-align: right;">${totalLiters.toLocaleString('id-ID')} L</td>
              <td></td>
              <td style="text-align: right;">Rp ${totalCost.toLocaleString('id-ID')}</td>
              <td style="text-align: center;">${avgKmPerLiter} KM/L</td>
              <td colspan="2"></td>
            </tr>
          </tbody>
        </table>
      </body>
      </html>
    `

    const blob = new Blob(['\uFEFF' + excelHTML], { type: 'application/vnd.ms-excel;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `REKAP_OPERASIONAL_BBM_${selectedVehicle.replace(/\s+/g, '')}_${new Date().toISOString().split('T')[0]}.xls`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans text-slate-800">
      
      {/* SIDEBAR NAVIGATION KIRI WITH VEKTOR ICONS & DROPDOWN ACCORDION */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static flex flex-col justify-between print:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div>
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 rounded-xl flex items-center justify-center font-extrabold shadow-md">
                <Icons.Fuel />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white tracking-wide">PEMANTAU BBM</h2>
                <span className="text-[10px] text-amber-400 font-bold tracking-wider uppercase">Enterprise Edition</span>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
              ✕
            </button>
          </div>

          <nav className="p-4 space-y-1">
            
            <Link
              href="/"
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950 shadow-md hover:brightness-105 transition mb-3"
            >
              <Icons.Mobile /> Form Input BBM Driver
            </Link>

            <button
              onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${activeTab === 'dashboard' ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-bold shadow-md' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}
            >
              <Icons.Dashboard /> Dashboard Utama
            </button>

            <button
              onClick={() => { setActiveTab('analytics'); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${activeTab === 'analytics' ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-bold shadow-md' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}
            >
              <Icons.Analytics /> Analytics & Grafik
            </button>

            <button
              onClick={() => { setActiveTab('maintenance'); setSidebarOpen(false); }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${activeTab === 'maintenance' ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-bold shadow-md' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}
            >
              <div className="flex items-center gap-3">
                <Icons.Wrench /> Servis & Maintenance
              </div>
              {criticalServiceCount > 0 && (
                <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                  {criticalServiceCount}
                </span>
              )}
            </button>

            {/* PUSAT KELOLA OPERASIONAL DROPDOWN ACCORDION */}
            <div className="pt-3">
              <button
                type="button"
                onClick={() => setIsKelolaOpen(!isKelolaOpen)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition group"
              >
                <span className="uppercase text-[10px] tracking-wider text-amber-400 font-extrabold flex items-center gap-2">
                  <Icons.Settings /> Pusat Kelola Operasional
                </span>
                <span className="text-slate-500 group-hover:text-white transition-transform text-xs font-bold">
                  {isKelolaOpen ? '▲' : '▼'}
                </span>
              </button>

              {isKelolaOpen && (
                <div className="mt-1 pl-3 space-y-1 border-l-2 border-slate-700 ml-3 animate-fade-in">
                  <Link
                    href="/admin/settings?tab=drivers"
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-amber-400 transition"
                  >
                    <span>👨‍✈️</span> Master Biodata Driver
                  </Link>

                  <Link
                    href="/admin/settings?tab=vehicles"
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-amber-400 transition"
                  >
                    <span>🚚</span> Armada Kendaraan
                  </Link>

                  <Link
                    href="/admin/settings?tab=prices"
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-amber-400 transition"
                  >
                    <span>⛽</span> Tarif Bahan Bakar
                  </Link>

                  <Link
                    href="/admin/settings?tab=company"
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-amber-400 transition"
                  >
                    <span>🏢</span> Profil Perusahaan
                  </Link>
                </div>
              )}
            </div>

            <Link
              href="/admin/backup"
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition pt-3 border-t border-slate-800 mt-2"
            >
              <Icons.Backup /> Pusat Backup (.JSON)
            </Link>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800 space-y-2">
          <button
            onClick={handleLogout}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2"
          >
            <Icons.Lock /> Kunci Akses Admin
          </button>
          <button
            onClick={() => setShowResetModal(true)}
            className="w-full bg-rose-900/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 py-1.5 rounded-xl text-[11px] font-semibold transition flex items-center justify-center gap-1.5"
          >
            <Icons.Alert /> Reset Cache
          </button>
          <div className="text-[10px] text-slate-500 text-center pt-1">
            Dev by <span className="font-bold text-slate-400">Urai Ikhsan Fadhilah</span>
          </div>
        </div>
      </aside>

      {/* KONTEN UTAMA */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* TOP BAR / HEADER */}
        <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3.5 flex justify-between items-center sticky top-0 z-30 shadow-sm print:hidden">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-700 text-xl p-1">
              ☰
            </button>
            <h1 className="text-base sm:text-lg font-bold text-slate-900">
              {activeTab === 'dashboard' ? 'Monitoring Operasional BBM' : activeTab === 'analytics' ? 'Analytics & Grafik Tren Konsumsi' : 'Jadwal Servis & Pemeliharaan Armada'}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm"
            >
              <Icons.Mobile /> Form Driver
            </Link>
            <button
              onClick={() => setShowPrintModal(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition hidden sm:flex items-center gap-1.5 shadow-sm"
            >
              <Icons.Printer /> Cetak PDF Eksekutif
            </button>
            <button
              onClick={exportToExcel}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition hidden sm:flex items-center gap-1.5 shadow-sm"
            >
              Export Excel (.XLS)
            </button>
          </div>
        </header>

        {/* MAIN BODY CONTENT */}
        <main className="p-4 sm:p-6 space-y-6 overflow-y-auto print:p-0">
          
          {/* BANNER PERINGATAN ANOMALI */}
          {(pendingCount > 0 || emergencyCount > 0 || highConsumptionLogs.length > 0 || criticalServiceCount > 0) && (
            <div className="p-4 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border border-amber-300/80 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-sm print:hidden">
              <div className="flex items-center gap-3">
                <div className="text-amber-600"><Icons.Alert /></div>
                <div className="text-xs text-amber-950">
                  <span className="font-bold uppercase tracking-wider text-[11px] text-amber-800">Perhatian Audit Operasional:</span>
                  <span className="block mt-0.5">
                    Terdapat <strong className="text-indigo-900 underline">{pendingCount} laporan baru</strong>, <strong className="text-amber-800 underline">{emergencyCount} pengisian darurat emperan</strong>, <strong className="text-rose-700 underline">{highConsumptionLogs.length} transaksi boros (&lt; 8 KM/L)</strong>, dan <strong className="text-rose-700 underline">{criticalServiceCount} armada wajib servis</strong>.
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <>
              {/* MERGED EXECUTIVE COMMAND BAR DENGAN IKON VEKTOR */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-5 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white rounded-2xl shadow-lg relative overflow-hidden space-y-2 border border-indigo-500/30">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">Total Biaya Operasional</span>
                    <span className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                      <Icons.Wallet />
                    </span>
                  </div>
                  <div className="text-2xl font-extrabold font-mono text-white">
                    Rp {(Number(totalCost) || 0).toLocaleString('id-ID')}
                  </div>
                  <span className="text-[10px] font-medium text-indigo-100 block">Akumulasi Real-Time Pengeluaran</span>
                </div>

                <div className="p-5 bg-gradient-to-br from-emerald-600 to-teal-800 text-white rounded-2xl shadow-lg relative overflow-hidden space-y-2 border border-emerald-500/30">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">Rata-Rata Efisiensi</span>
                    <span className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                      <Icons.Zap />
                    </span>
                  </div>
                  <div className="text-2xl font-extrabold font-mono text-white">
                    {avgKmPerLiter} <span className="text-xs font-sans font-medium text-emerald-100">KM/L</span>
                  </div>
                  <span className="text-[10px] font-medium text-emerald-100 block">Rasio Efisiensi Seluruh Armada</span>
                </div>

                <div className="p-5 bg-gradient-to-br from-amber-500 to-orange-600 text-slate-950 rounded-2xl shadow-lg relative overflow-hidden space-y-2 border border-amber-400/30">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-900">Total Konsumsi BBM</span>
                    <span className="w-8 h-8 rounded-xl bg-slate-950/20 backdrop-blur-md text-slate-950 flex items-center justify-center">
                      <Icons.Fuel />
                    </span>
                  </div>
                  <div className="text-2xl font-extrabold font-mono text-slate-950">
                    {(Number(totalLiters) || 0).toLocaleString('id-ID')} <span className="text-xs font-sans font-semibold text-slate-800">Liter</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-900 block">Total Volume BBM Terdistribusi</span>
                </div>

                <div className="p-5 bg-gradient-to-br from-blue-600 to-sky-700 text-white rounded-2xl shadow-lg relative overflow-hidden space-y-2 border border-blue-500/30">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-200">Total Transaksi</span>
                    <span className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                      <Icons.Clipboard />
                    </span>
                  </div>
                  <div className="text-2xl font-extrabold font-mono text-white">
                    {filteredLogs.length} <span className="text-xs font-sans font-medium text-blue-100">Laporan</span>
                  </div>
                  <span className="text-[10px] font-medium text-blue-100 block">Audit Transaksi Terverifikasi</span>
                </div>
              </div>

              {/* PAGU ANGGARAN BULANAN PANEL */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
                <div className="flex justify-between items-center border-b pb-3">
                  <h2 className="text-xs font-extrabold text-slate-900 tracking-wider uppercase flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                    Realisasi vs Pagu Anggaran Bulanan Armada
                  </h2>
                  <span className="text-[11px] text-slate-500 font-medium">Batas Maksimum Pengeluaran Operasional</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {vehicleStats.map((v) => (
                    <div key={v.plate_number} className="p-4 bg-gradient-to-b from-slate-50 to-slate-100/60 rounded-xl border border-slate-200/90 space-y-3 hover:shadow-md transition">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-extrabold text-xs text-slate-900">{v.plate_number}</div>
                          <div className="text-[11px] text-slate-500">{v.model}</div>
                        </div>
                        {v.isOverBudget ? (
                          <span className="bg-rose-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                            Exceeded
                          </span>
                        ) : (
                          <span className="bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                            Normal
                          </span>
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-slate-500 font-sans">Realisasi:</span>
                          <span className={v.isOverBudget ? 'text-rose-600 font-bold' : 'text-slate-900 font-semibold'}>
                            Rp {(Number(v.spentCost) || 0).toLocaleString('id-ID')}
                          </span>
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                          <span className="font-sans">Pagu Mandiri:</span>
                          <span>Rp {(Number(v.monthly_budget) || 0).toLocaleString('id-ID')}</span>
                        </div>

                        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden mt-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${
                              v.isOverBudget ? 'bg-gradient-to-r from-rose-500 to-red-600' : 'bg-gradient-to-r from-indigo-500 to-blue-600'
                            }`}
                            style={{ width: `${v.usagePercent}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200/80 flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-medium">Rasio Efisiensi:</span>
                        {renderEfficiencyBadge(v.efficiency)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* TABEL REKAPITULASI AUDIT LOGS - SCROLL LOCK 3 BARIS & DROPDOWN AKSI */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
                  <h2 className="text-xs font-extrabold text-slate-900 tracking-wider uppercase flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    Rincian Transaksi Pengisian BBM
                  </h2>
                  
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <div className="flex items-center gap-1 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                      <span className="text-slate-500 font-medium">Dari:</span>
                      <input
                        type="date"
                        className="bg-transparent font-medium text-slate-800 outline-none"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                      <span className="text-slate-500 font-medium">s/d</span>
                      <input
                        type="date"
                        className="bg-transparent font-medium text-slate-800 outline-none"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                      {(startDate || endDate) && (
                        <button
                          onClick={() => {
                            setStartDate('')
                            setEndDate('')
                          }}
                          className="text-slate-400 hover:text-slate-700 ml-1 font-bold"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    <select
                      className="text-xs border border-slate-300 rounded-xl p-2 bg-white font-medium text-slate-700 outline-none"
                      value={selectedVehicle}
                      onChange={(e) => setSelectedVehicle(e.target.value)}
                    >
                      <option value="ALL">Semua Armada</option>
                      {safeVehicles.map((v) => (
                        <option key={v.plate_number} value={v.plate_number}>
                          {v.plate_number} - {v.model}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto max-h-[210px] overflow-y-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-900 text-white font-bold border-b border-slate-800 sticky top-0 z-10 shadow-sm">
                      <tr>
                        <th className="p-3.5">Tanggal</th>
                        <th className="p-3.5">Kendaraan</th>
                        <th className="p-3.5">Pengemudi</th>
                        <th className="p-3.5">Tempat Pengisian</th>
                        <th className="p-3.5">Jenis BBM</th>
                        <th className="p-3.5">KM Odometer</th>
                        <th className="p-3.5">Volume</th>
                        <th className="p-3.5">Efisiensi</th>
                        <th className="p-3.5">Audit Struk</th>
                        <th className="p-3.5">Status Admin</th>
                        <th className="p-3.5 text-right">Total Biaya</th>
                        <th className="p-3.5 text-center">Aksi Verifikasi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/80 transition">
                          <td className="p-3.5 font-medium whitespace-nowrap">{log.date}</td>
                          <td className="p-3.5 font-bold text-slate-900 whitespace-nowrap">{log.plate_number}</td>
                          <td className="p-3.5 whitespace-nowrap font-medium text-slate-800">{log.driver_name}</td>
                          
                          <td className="p-3.5 whitespace-nowrap">
                            {log.fill_location === 'ECERAN' ? (
                              <span className="bg-amber-500/10 text-amber-900 border border-amber-300 font-extrabold px-2.5 py-0.5 rounded-full text-[10px] inline-flex items-center gap-1 shadow-xs">
                                ⚠️ DARURAT (ECERAN)
                              </span>
                            ) : (
                              <span className="bg-slate-100 text-slate-700 font-semibold px-2.5 py-0.5 rounded-full text-[10px]">
                                ⛽ SPBU RESMI
                              </span>
                            )}
                          </td>

                          <td className="p-3.5 whitespace-nowrap">
                            <span className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg font-medium text-[11px]">
                              {log.fuel_type}
                            </span>
                          </td>
                          <td className="p-3.5 font-mono whitespace-nowrap">
                            {(Number(log.initial_km) || 0).toLocaleString('id-ID')} → {(Number(log.final_km) || 0).toLocaleString('id-ID')} ({log.distance_km || 0} KM)
                          </td>
                          <td className="p-3.5 font-mono whitespace-nowrap">{log.liters || 0} L</td>
                          <td className="p-3.5 font-mono whitespace-nowrap">
                            {renderEfficiencyBadge(log.km_per_liter)}
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            {log.receipt_image ? (
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => setPreviewReceipt(log)}
                                  className="text-[11px] text-blue-600 hover:text-blue-800 font-bold underline"
                                >
                                  Lihat
                                </button>
                                <button
                                  onClick={() => handleDownloadReceipt(log.receipt_image, log.plate_number, log.date, log.final_km)}
                                  className="text-[10px] text-slate-700 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded border border-slate-200 font-mono"
                                  title="Unduh Struk"
                                >
                                  📥
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setPreviewReceipt(log)}
                                className="text-slate-400 hover:text-slate-600 text-[11px] underline"
                              >
                                Detail
                              </button>
                            )}
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            {renderStatusBadge(log.status)}
                          </td>
                          <td className="p-3.5 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                            Rp {(Number(log.total_cost) || 0).toLocaleString('id-ID')}
                          </td>

                          <td className="p-3.5 text-center whitespace-nowrap">
                            <select
                              className="text-[11px] font-bold border border-slate-300 rounded-lg px-2.5 py-1 bg-white text-slate-700 hover:bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer transition shadow-xs"
                              value=""
                              onChange={(e) => {
                                const val = e.target.value
                                if (val === 'VERIFIED') handleUpdateStatus(log.id, 'VERIFIED')
                                if (val === 'FLAGGED') handleUpdateStatus(log.id, 'FLAGGED')
                                if (val === 'DELETE') handleDeleteLog(log.id)
                              }}
                            >
                              <option value="" disabled>⚡ Pilih Aksi</option>
                              <option value="VERIFIED">✓ Setujui (Verified)</option>
                              <option value="FLAGGED">⚠ Tandai Anomali</option>
                              <option value="DELETE">🗑 Hapus Transaksi</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-3.5 border-t border-slate-100 bg-slate-50 flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-mono text-[11px]">
                    Menampilkan total <strong className="text-slate-900">{filteredLogs.length}</strong> transaksi
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium italic">
                    💡 Gulung (scroll) ke bawah pada tabel untuk melihat data lainnya
                  </span>
                </div>
              </div>
            </>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <h2 className="text-sm font-bold text-slate-900">Analisis Kinerja & Efisiensi Konsumsi BBM</h2>
                <p className="text-xs text-slate-500">Visualisasi statistik rasio efisiensi KM/L dan distribusi pengeluaran biaya BBM per kendaraan</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Perbandingan Efisiensi Armada (KM/Liter)</h3>
                  <div className="space-y-4 pt-2">
                    {vehicleStats.map((v) => {
                      const eff = v.efficiency
                      const maxEff = 15
                      const percent = Math.min(Math.round((eff / maxEff) * 100), 100)
                      const isBoros = eff < 8

                      return (
                        <div key={v.plate_number} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold">
                            <span>{v.plate_number} ({v.model})</span>
                            <span className={isBoros ? 'text-rose-600 font-bold' : 'text-emerald-700 font-bold'}>{eff} KM/L</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                            <div
                              className={`h-3 rounded-full transition-all duration-700 ${isBoros ? 'bg-gradient-to-r from-rose-500 to-red-600' : 'bg-gradient-to-r from-emerald-500 to-teal-600'}`}
                              style={{ width: `${percent}%` }}
                            ></div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Alokasi Biaya BBM Per Kendaraan</h3>
                  <div className="space-y-4 pt-2">
                    {vehicleStats.map((v) => {
                      const costShare = totalCost > 0 ? Math.round((v.spentCost / totalCost) * 100) : 0

                      return (
                        <div key={v.plate_number} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold">
                            <span>{v.plate_number}</span>
                            <span className="font-mono text-slate-700">Rp {v.spentCost.toLocaleString('id-ID')} ({costShare}%)</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                            <div
                              className="h-3 rounded-full bg-gradient-to-r from-indigo-500 to-blue-600 transition-all duration-700"
                              style={{ width: `${costShare}%` }}
                            ></div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MODUL SERVIS & MAINTENANCE ARMADA DISEMPURNAKAN */}
          {activeTab === 'maintenance' && (
            <div className="space-y-6">
              
              {/* HEADER MAITENANCE INFO */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Icons.Wrench /> Modul Pengawas Servis & Maintenance Otomatis
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Menghitung sisa KM menuju jadwal servis berkala, ganti oli, pemeriksaan rem, dan rotasi ban berdasarkan Odometer real-time.
                  </p>
                </div>

                <div className="bg-indigo-50 border border-indigo-200/80 p-3 rounded-xl text-xs font-mono text-indigo-900 flex items-center gap-3">
                  <div>
                    <span className="text-[10px] text-indigo-500 block font-sans">Total Biaya Pemeliharaan:</span>
                    <strong className="text-sm font-bold text-indigo-950">Rp {totalMaintenanceCost.toLocaleString('id-ID')}</strong>
                  </div>
                </div>
              </div>

              {/* CARDS JADWAL SERVIS PER VEHICLE */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {vehicleStats.map((v) => (
                  <div key={v.plate_number} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start border-b pb-3">
                        <div>
                          <div className="font-bold text-sm text-slate-900">{v.plate_number}</div>
                          <div className="text-xs text-slate-500">{v.model}</div>
                        </div>
                        {v.maintenance.status === 'CRITICAL' ? (
                          <span className="bg-rose-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full animate-pulse shadow-sm">
                            🚨 WAJIB SERVIS
                          </span>
                        ) : v.maintenance.status === 'WARNING' ? (
                          <span className="bg-amber-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                            ⚠️ MENDEKATI SERVIS
                          </span>
                        ) : (
                          <span className="bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                            ✓ KONDISI PRIMA
                          </span>
                        )}
                      </div>

                      <div className="space-y-3 pt-3">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500 font-medium">Odometer Terkini:</span>
                          <span className="font-mono font-bold text-slate-900">{v.last_km.toLocaleString('id-ID')} KM</span>
                        </div>

                        {/* SUB CHECKLIST MAINTENANCE */}
                        <div className="space-y-2">
                          {/* OLI */}
                          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center text-xs">
                            <div>
                              <span className="font-bold text-slate-800 block text-[11px]">🛢️ Ganti Oli Mesin</span>
                              <span className="text-[10px] text-slate-500 font-mono">Target: {v.maintenance.nextOilKm.toLocaleString('id-ID')} KM</span>
                            </div>
                            <span className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded-md ${v.maintenance.remainingOilKm <= 300 ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-700'}`}>
                              {v.maintenance.remainingOilKm.toLocaleString('id-ID')} KM Lagi
                            </span>
                          </div>

                          {/* SERVIS */}
                          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center text-xs">
                            <div>
                              <span className="font-bold text-slate-800 block text-[11px]">🔧 Servis Berkala Mesin</span>
                              <span className="text-[10px] text-slate-500 font-mono">Target: {v.maintenance.nextServiceKm.toLocaleString('id-ID')} KM</span>
                            </div>
                            <span className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded-md ${v.maintenance.remainingServiceKm <= 300 ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-700'}`}>
                              {v.maintenance.remainingServiceKm.toLocaleString('id-ID')} KM Lagi
                            </span>
                          </div>

                          {/* KAMPAS REM */}
                          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center text-xs">
                            <div>
                              <span className="font-bold text-slate-800 block text-[11px]">🛑 Cek Kampas Rem</span>
                              <span className="text-[10px] text-slate-500 font-mono">Target: {v.maintenance.nextBrakeKm.toLocaleString('id-ID')} KM</span>
                            </div>
                            <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-200 text-slate-700">
                              {v.maintenance.remainingBrakeKm.toLocaleString('id-ID')} KM Lagi
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ACTION BUTTON CATAT SERVIS */}
                    <button
                      onClick={() => setSelectedServiceVehicle(v)}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 rounded-xl transition shadow-md flex items-center justify-center gap-1.5 mt-2"
                    >
                      <Icons.Wrench /> Catat / Reset Servis Selesai
                    </button>
                  </div>
                ))}
              </div>

              {/* TABEL HISTORI PERBAIKAN BENGKEL */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm space-y-3">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                    Riwayat Pengerjaan Servis & Catatan Bengkel
                  </h3>
                  <span className="text-[11px] text-slate-500 font-mono">Total {serviceHistory.length} Pengerjaan</span>
                </div>

                <div className="overflow-x-auto max-h-[220px] overflow-y-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-900 text-white font-bold border-b border-slate-800 sticky top-0 z-10 shadow-sm">
                      <tr>
                        <th className="p-3">Tanggal</th>
                        <th className="p-3">Kendaraan</th>
                        <th className="p-3">Jenis Pengerjaan</th>
                        <th className="p-3">Bengkel Rekanan</th>
                        <th className="p-3">KM Pengerjaan</th>
                        <th className="p-3 text-right">Biaya Servis</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {serviceHistory.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50 transition">
                          <td className="p-3 font-mono">{s.date}</td>
                          <td className="p-3 font-bold text-slate-900">{s.plate_number}</td>
                          <td className="p-3 font-medium text-slate-800">{s.service_type}</td>
                          <td className="p-3">{s.workshop}</td>
                          <td className="p-3 font-mono">{s.km_done.toLocaleString('id-ID')} KM</td>
                          <td className="p-3 text-right font-mono font-bold text-slate-900">
                            Rp {(Number(s.cost) || 0).toLocaleString('id-ID')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

        </main>
      </div>

      {/* MODAL CATAT SERVIS SELESAI */}
      {selectedServiceVehicle && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Catat Servis Armada Selesai</h3>
                <p className="text-xs text-slate-500">{selectedServiceVehicle.plate_number} • {selectedServiceVehicle.model}</p>
              </div>
              <button onClick={() => setSelectedServiceVehicle(null)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordServiceSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Jenis Pengerjaan Servis</label>
                <select
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-slate-50 font-medium text-slate-800 outline-none"
                  value={serviceTypeInput}
                  onChange={(e) => setServiceTypeInput(e.target.value)}
                >
                  <option value="Ganti Oli & Filter Mesin">🛢️ Ganti Oli & Filter Mesin (Interval 5.000 KM)</option>
                  <option value="Servis Berkala Mesin">🔧 Servis Berkala Mesin (Interval 10.000 KM)</option>
                  <option value="Penggantian Kampas Rem">🛑 Penggantian Kampas Rem (Interval 20.000 KM)</option>
                  <option value="Rotasi / Ganti Ban">🛞 Rotasi / Ganti Ban (Interval 25.000 KM)</option>
                  <option value="Servis Total (Overhaul)">⚙️ Servis Major / Overhaul Total</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Bengkel / Rekanan</label>
                <input
                  type="text"
                  placeholder="Contoh: Auto2000 Grogol / Bengkel Resmi"
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-slate-50 font-medium text-slate-800 outline-none"
                  value={workshopInput}
                  onChange={(e) => setWorkshopInput(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Biaya Pengerjaan (Rp)</label>
                <input
                  type="number"
                  placeholder="Contoh: 450000"
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-slate-50 font-mono font-bold text-slate-800 outline-none"
                  value={serviceCostInput}
                  onChange={(e) => setServiceCostInput(e.target.value)}
                  required
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedServiceVehicle(null)}
                  className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2.5 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 rounded-xl shadow-md"
                >
                  Simpan Servis
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CETAK PDF EXECUTIVE */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="border-b-2 border-slate-900 pb-4 text-center space-y-1">
              <h2 className="text-base font-bold text-slate-900 tracking-wider uppercase">LAPORAN RINGKASAN EKSEKUTIF OPERASIONAL BBM</h2>
              <p className="text-xs text-slate-600">Dokumen Resmi Audit Konsumsi & Biaya Bahan Bakar Armada Perusahaan</p>
              <p className="text-[11px] text-slate-400 font-mono">Tanggal Cetak: {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center border p-3 rounded-xl bg-slate-50 text-xs font-mono">
              <div>
                <span className="text-[10px] text-slate-500 block font-sans">Total Biaya Operasional</span>
                <span className="font-bold text-slate-900 text-sm">Rp {totalCost.toLocaleString('id-ID')}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block font-sans">Total Volume Terdistribusi</span>
                <span className="font-bold text-slate-900 text-sm">{totalLiters.toLocaleString('id-ID')} Liter</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block font-sans">Efisiensi Rata-Rata</span>
                <span className="font-bold text-slate-900 text-sm">{avgKmPerLiter} KM/L</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border">
                <thead className="bg-slate-900 text-white font-bold text-[11px]">
                  <tr>
                    <th className="p-2 border">Tanggal</th>
                    <th className="p-2 border">Armada</th>
                    <th className="p-2 border">Pengemudi</th>
                    <th className="p-2 border">Tempat Pengisian</th>
                    <th className="p-2 border text-right">Volume</th>
                    <th className="p-2 border text-right">Total Biaya</th>
                    <th className="p-2 border text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-[11px]">
                  {filteredLogs.map((l) => (
                    <tr key={l.id}>
                      <td className="p-2 border">{l.date}</td>
                      <td className="p-2 border font-bold">{l.plate_number}</td>
                      <td className="p-2 border">{l.driver_name}</td>
                      <td className="p-2 border">{l.fill_location === 'ECERAN' ? 'DARURAT (ECERAN)' : 'SPBU RESMI'}</td>
                      <td className="p-2 border text-right font-mono">{l.liters} L</td>
                      <td className="p-2 border text-right font-mono font-bold">Rp {l.total_cost.toLocaleString('id-ID')}</td>
                      <td className="p-2 border text-center font-bold">{l.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-2 gap-8 pt-6 text-center text-xs">
              <div>
                <p className="text-slate-500">Dibuat Oleh,</p>
                <div className="h-16"></div>
                <p className="font-bold underline text-slate-900">Manajer Operasional</p>
              </div>
              <div>
                <p className="text-slate-500">Disetujui Oleh,</p>
                <div className="h-16"></div>
                <p className="font-bold underline text-slate-900">Direktur / Management</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t print:hidden">
              <button
                onClick={() => setShowPrintModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Tutup
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5"
              >
                <Icons.Printer /> Cetak / Simpan PDF
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL PREVIEW STRUK & AUDIT DETAIL DARURAT */}
      {previewReceipt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-5 space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <div>
                <h3 className="text-xs font-bold text-slate-900">Audit Transaksi Pengisian BBM</h3>
                <p className="text-[11px] text-slate-500">{previewReceipt.plate_number} • {previewReceipt.date} • {previewReceipt.driver_name}</p>
              </div>
              <button
                onClick={() => setPreviewReceipt(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {previewReceipt.fill_location === 'ECERAN' && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1 text-xs">
                <span className="font-bold text-amber-900 flex items-center gap-1">
                  <span>⚠️</span> STATUS: PENGISIAN DARURAT (ECERAN/PERTAMINI)
                </span>
                {previewReceipt.emergency_note && (
                  <p className="text-amber-950 italic">
                    Catatan Driver: "{previewReceipt.emergency_note}"
                  </p>
                )}
                <div className="text-[11px] text-amber-900 font-mono pt-1 border-t border-amber-200/60 flex justify-between">
                  <span>Harga per Liter:</span>
                  <span className="font-bold">Rp {(Number(previewReceipt.unit_price) || 0).toLocaleString('id-ID')} / L</span>
                </div>
              </div>
            )}

            <div className="max-h-[45vh] overflow-y-auto rounded-xl border bg-slate-50 flex items-center justify-center p-2">
              {previewReceipt.receipt_image ? (
                <img src={previewReceipt.receipt_image} alt="Bukti Struk/Nota" className="max-w-full h-auto rounded-lg" />
              ) : (
                <div className="p-8 text-center text-xs text-slate-400">Tidak Ada Unggahan Foto Struk</div>
              )}
            </div>

            <div className="space-y-2 pt-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Status Audit Saat Ini:</span>
                {renderStatusBadge(previewReceipt.status)}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleUpdateStatus(previewReceipt.id, 'VERIFIED')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 rounded-xl transition shadow-sm"
                >
                  ✓ Setujui (Verified)
                </button>
                <button
                  onClick={() => handleUpdateStatus(previewReceipt.id, 'FLAGGED')}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold py-2.5 rounded-xl transition shadow-sm"
                >
                  ⚠ Tandai Anomali
                </button>
              </div>

              {previewReceipt.receipt_image && (
                <button
                  onClick={() => handleDownloadReceipt(previewReceipt.receipt_image, previewReceipt.plate_number, previewReceipt.date, previewReceipt.final_km)}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold py-2.5 rounded-xl border border-slate-200 transition"
                >
                  📥 Unduh Berkas Struk
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL RESET CACHE BER-PIN */}
      {showResetModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 text-left">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 space-y-4">
            <div className="text-center space-y-1">
              <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center mx-auto text-lg font-bold">
                <Icons.Alert />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Konfirmasi Reset Cache</h3>
              <p className="text-xs text-rose-600 font-medium leading-relaxed">
                PERINGATAN: Tindakan ini akan MENGHAPUS SELURUH riwayat transaksi & maintenance lokal di browser ini!
              </p>
            </div>

            <form onSubmit={handleConfirmResetCache} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1 text-center">Masukkan PIN Admin untuk Konfirmasi</label>
                <input
                  type="password"
                  maxLength={4}
                  placeholder="••••"
                  className="w-full text-center text-lg tracking-widest py-2 border rounded-xl border-slate-300 focus:ring-2 focus:ring-slate-900 outline-none font-mono font-bold"
                  value={resetPinInput}
                  onChange={(e) => setResetPinInput(e.target.value)}
                />
                {resetPinError && (
                  <p className="text-[11px] text-rose-600 text-center font-medium mt-1">PIN Salah!</p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowResetModal(false)
                    setResetPinInput('')
                    setResetPinError(false)
                  }}
                  className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2.5 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold py-2.5 rounded-xl shadow-sm"
                >
                  Ya, Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}