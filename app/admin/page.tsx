'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { FuelLogsTable } from '@/components/admin/FuelLogsTable'
import { AnalyticsTab } from '@/components/admin/AnalyticsTab'
import { MaintenanceTab } from '@/components/admin/MaintenanceTab'
import { DriverScorecardTab } from '@/components/admin/DriverScorecardTab'
import { ReimbursementTab } from '@/components/admin/ReimbursementTab'
import { WhatsAppReminderModal } from '@/components/admin/WhatsAppReminderModal'
import { ExportReportsModal } from '@/components/admin/ExportReportsModal'

const DEFAULT_VEHICLES = [
  { id: 'V1', plate_number: 'B 1234 ABC', model: 'Toyota Avanza 1.5 G', monthly_budget: 1500000, monthly_service_budget: 500000, target_km_monthly: 1500, last_km: 45860, kir_expiry: '2026-10-15', stnk_expiry: '2027-08-20' },
  { id: 'V2', plate_number: 'B 5678 XYZ', model: 'Daihatsu Gran Max', monthly_budget: 2000000, monthly_service_budget: 750000, target_km_monthly: 2500, last_km: 32000, kir_expiry: '2026-09-10', stnk_expiry: '2026-12-05' },
  { id: 'V3', plate_number: 'B 9012 DEF', model: 'Isuzu Traga Pick Up', monthly_budget: 2500000, monthly_service_budget: 1000000, target_km_monthly: 3500, last_km: 18500, kir_expiry: '2026-12-01', stnk_expiry: '2028-01-15' },
  { id: 'V4', plate_number: 'KB 1234 YK', model: 'Toyota Innova Zenix', monthly_budget: 2500000, monthly_service_budget: 800000, target_km_monthly: 2000, last_km: 47905, kir_expiry: '2027-02-15', stnk_expiry: '2027-11-11' },
]

const DEFAULT_LOGS = [
  {
    id: 1,
    plate_number: 'B 1234 ABC',
    vehicle_model: 'Toyota Avanza',
    driver_name: 'Ahmad Supardi',
    initial_km: 45250,
    final_km: 45750,
    distance_km: 500,
    liters: 15,
    unit_price: 10000,
    km_per_liter: 33.33,
    total_cost: 150000,
    fuel_type: 'Pertalite',
    fill_location: 'SPBU Resmi',
    date: '2026-08-31',
    status: 'VERIFIED',
    audit_note: '',
  },
]

const DEFAULT_SERVICES = [
  {
    id: 1,
    plate_number: 'B 1234 ABC',
    category: 'Servis Rutin & Oli',
    service_type: 'Ganti Oli & Filter Mesin',
    parts_replaced: 'Oli Shell Helix 4L',
    cost: 450000,
    workshop: 'Auto2000',
    km_done: 40000,
    date: '2026-06-15',
  },
]

function AdminDashboardContent() {
  const searchParams = useSearchParams()
  const activeTab = (searchParams.get('tab') as 'dashboard' | 'reimbursement' | 'scorecard' | 'analytics' | 'maintenance') || 'dashboard'

  const currentYearNum = new Date().getFullYear()

  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [usernameInput, setUsernameInput] = useState('')
  const [passwordInput, setPasswordInput] = useState('')
  const [authError, setAuthError] = useState(false)

  const [vehicles, setVehicles] = useState<any[]>(DEFAULT_VEHICLES)
  const [logs, setLogs] = useState<any[]>(DEFAULT_LOGS)
  const [serviceHistory, setServiceHistory] = useState<any[]>(DEFAULT_SERVICES)
  const [drivers, setDrivers] = useState<any[]>([])
  const [inspections, setInspections] = useState<any[]>([])
  const [reimbursements, setReimbursements] = useState<any[]>([])

  // State Filter UNIFORM
  const [selectedMonth, setSelectedMonth] = useState('ALL')
  const [selectedYear, setSelectedYear] = useState(String(currentYearNum))
  const [customYears, setCustomYears] = useState<string[]>([])

  const [selectedVehicle, setSelectedVehicle] = useState('ALL')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [, setPreviewReceipt] = useState<any | null>(null)

  const [showWaModal, setShowWaModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)

  // OPSI 3: STATE NOTIFIKASI REALTIME
  const [showNotifMenu, setShowNotifMenu] = useState(false)

  const loadStorageData = () => {
    try {
      const storedLogs = localStorage.getItem('fuel_logs')
      const storedVehicles = localStorage.getItem('vehicle_budgets')
      const storedServices = localStorage.getItem('service_history')
      const storedDrivers = localStorage.getItem('master_drivers')
      const storedInspections = localStorage.getItem('pre_trip_inspections')
      const storedClaims = localStorage.getItem('reimbursement_claims')

      if (storedLogs) setLogs(JSON.parse(storedLogs))
      if (storedVehicles) setVehicles(JSON.parse(storedVehicles))
      if (storedServices) setServiceHistory(JSON.parse(storedServices))
      if (storedDrivers) setDrivers(JSON.parse(storedDrivers))
      if (storedInspections) setInspections(JSON.parse(storedInspections))
      if (storedClaims) setReimbursements(JSON.parse(storedClaims))
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('admin_authenticated') === 'true') {
      setIsAuthenticated(true)
    }
    loadStorageData()
  }, [])

  // Opsi Tahun Dinamis
  const availableYearsSet = new Set<string>()
  for (let y = 2024; y <= currentYearNum + 3; y++) {
    availableYearsSet.add(String(y))
  }
  logs.forEach((l: any) => {
    if (l.date) {
      const yr = l.date.split('-')[0]
      if (yr) availableYearsSet.add(yr)
    }
  })
  customYears.forEach((cy) => availableYearsSet.add(cy))
  const YEAR_OPTIONS = ['ALL', ...Array.from(availableYearsSet).sort()]

  const handleAddCustomYear = () => {
    const nextYearPrompt = prompt('Masukkan Tahun Proyeksi Baru (Contoh: 2028):')
    if (nextYearPrompt && !isNaN(Number(nextYearPrompt)) && nextYearPrompt.length === 4) {
      setCustomYears((prev) => [...prev, nextYearPrompt])
      setSelectedYear(nextYearPrompt)
    }
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (usernameInput.trim().toLowerCase() === 'admin' && passwordInput === 'admin123') {
      setIsAuthenticated(true)
      localStorage.setItem('admin_authenticated', 'true')
      setAuthError(false)
    } else {
      setAuthError(true)
    }
  }

  const handleUpdateStatus = (id: number, newStatus: string, auditNote?: string) => {
    const updated = logs.map((l) => (l.id === id ? { ...l, status: newStatus, audit_note: auditNote || l.audit_note } : l))
    setLogs(updated)
    localStorage.setItem('fuel_logs', JSON.stringify(updated))
  }

  const handleDeleteLog = (id: number) => {
    if (confirm('Hapus log pengisian BBM ini?')) {
      const updated = logs.filter((l) => l.id !== id)
      setLogs(updated)
      localStorage.setItem('fuel_logs', JSON.stringify(updated))
    }
  }

  const handleAddServiceRecord = (record: any) => {
    const updated = [{ ...record, id: Date.now() }, ...serviceHistory]
    setServiceHistory(updated)
    localStorage.setItem('service_history', JSON.stringify(updated))
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 text-slate-100 font-sans">
        <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm w-full text-slate-900 space-y-5">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-amber-500 text-slate-950 rounded-2xl flex items-center justify-center mx-auto text-xl font-bold">
              🔒
            </div>
            <h1 className="text-lg font-bold">Otorisasi Akses Manajemen</h1>
          </div>
          <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="text"
              placeholder="Username Admin"
              className="w-full px-3 py-2 border rounded-xl text-xs"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full px-3 py-2 border rounded-xl text-xs"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              required
            />
            {authError && <p className="text-[11px] text-rose-600 font-bold text-center">Username/Password Salah!</p>}
            <button type="submit" className="w-full bg-slate-900 text-white font-bold py-2.5 rounded-xl text-xs">
              Masuk Dashboard
            </button>
          </form>
        </div>
      </div>
    )
  }

  // Notifikasi Realtime Alerts (Opsi 3)
  const pendingClaims = reimbursements.filter((r) => r.status === 'PENDING')
  const flaggedLogs = logs.filter((l) => l.fill_location === 'ECERAN' || l.status === 'FLAGGED')
  const maintenanceAlerts = vehicles.filter((v) => ((v.last_km || 0) % 10000) >= 8500)
  const totalNotifications = pendingClaims.length + flaggedLogs.length + maintenanceAlerts.length

  const cutoffLogs = logs.filter((l) => {
    if (!l.date) return false
    const [lYear, lMonth] = l.date.split('-')
    return (selectedMonth === 'ALL' || lMonth === selectedMonth) && (selectedYear === 'ALL' || lYear === selectedYear)
  })

  const cutoffServices = serviceHistory.filter((s) => {
    if (!s.date) return false
    const [sYear, sMonth] = s.date.split('-')
    return (selectedMonth === 'ALL' || sMonth === selectedMonth) && (selectedYear === 'ALL' || sYear === selectedYear)
  })

  const filteredLogs = cutoffLogs.filter((log) => {
    const matchVehicle = selectedVehicle === 'ALL' || log.plate_number === selectedVehicle
    const matchStart = !startDate || log.date >= startDate
    const matchEnd = !endDate || log.date <= endDate
    return matchVehicle && matchStart && matchEnd
  })

  const totalFuelCost = cutoffLogs.reduce((acc, l) => acc + (Number(l.total_cost) || 0), 0)
  const totalServiceCost = cutoffServices.reduce((acc, s) => acc + (Number(s.cost) || 0), 0)
  const totalOperationalCost = totalFuelCost + totalServiceCost

  const totalFuelBudget = vehicles.reduce((acc, v) => acc + (Number(v.monthly_budget) || 0), 0)
  const totalServiceBudget = vehicles.reduce((acc, v) => acc + (Number(v.monthly_service_budget) || 500000), 0)

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans text-slate-800">
      <AdminSidebar />

      <main className="flex-1 p-6 space-y-5 overflow-y-auto">
        {/* HEADER CONTROLS DENGAN LONCENG NOTIFIKASI */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm gap-2">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Realtime Control Center — FleetOps 360
          </span>

          <div className="flex items-center gap-2 relative">
            {/* LONCENG NOTIFIKASI (OPSI 3) */}
            <button
              onClick={() => setShowNotifMenu(!showNotifMenu)}
              className="relative bg-slate-900 text-amber-400 p-2 rounded-xl text-xs font-bold hover:bg-slate-800 transition flex items-center gap-1.5"
            >
              🔔 <span className="hidden sm:inline">Alerts</span>
              {totalNotifications > 0 && (
                <span className="bg-rose-600 text-white rounded-full w-5 h-5 text-[10px] flex items-center justify-center font-extrabold animate-bounce">
                  {totalNotifications}
                </span>
              )}
            </button>

            {/* POPUP DROPDOWN NOTIFIKASI REALTIME */}
            {showNotifMenu && (
              <div className="absolute right-0 top-11 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 space-y-3 z-50 text-xs">
                <div className="flex justify-between items-center border-b pb-2">
                  <h3 className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px]">
                    🔔 Pusat Notifikasi Realtime ({totalNotifications})
                  </h3>
                  <button onClick={() => setShowNotifMenu(false)} className="text-slate-400 font-bold">✕</button>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-2">
                  {pendingClaims.length > 0 && (
                    <div className="bg-indigo-50 p-2.5 rounded-xl border border-indigo-200 space-y-1">
                      <strong className="text-indigo-900 block font-bold text-[11px]">🧾 Klaim Uang Jalan Pending ({pendingClaims.length})</strong>
                      <p className="text-[10px] text-indigo-700">Supir mengajukan reimbursement Tol/Parkir baru yang membutuhkan verifikasi.</p>
                    </div>
                  )}

                  {flaggedLogs.length > 0 && (
                    <div className="bg-rose-50 p-2.5 rounded-xl border border-rose-200 space-y-1">
                      <strong className="text-rose-900 block font-bold text-[11px]">⚠️ Pengisian BBM Eceran ({flaggedLogs.length})</strong>
                      <p className="text-[10px] text-rose-700">Terdeteksi pengisian BBM darurat di luar SPBU resmi.</p>
                    </div>
                  )}

                  {maintenanceAlerts.length > 0 && (
                    <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200 space-y-1">
                      <strong className="text-amber-900 block font-bold text-[11px]">🛠️ Jadwal Servis Dekat ({maintenanceAlerts.length})</strong>
                      <p className="text-[10px] text-amber-700">Odometer armada mendekati batas 10.000 KM perbaikan berkala.</p>
                    </div>
                  )}

                  {totalNotifications === 0 && (
                    <p className="text-center py-4 text-slate-400 italic">🟢 Tidak ada peringatan pending.</p>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={() => setShowWaModal(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-sm transition flex items-center gap-1.5"
            >
              📱 WA Legalitas
            </button>

            <button
              onClick={() => setShowExportModal(true)}
              className="bg-indigo-900 hover:bg-indigo-800 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-sm transition flex items-center gap-1.5"
            >
              📊 Export Laporan
            </button>

            <button
              onClick={loadStorageData}
              className="bg-slate-900 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-sm hover:bg-slate-800 transition"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {activeTab === 'dashboard' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                <div className="flex justify-between items-center border-b pb-2">
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="text-rose-600">🚨</span> Smart Anti-Fraud Anomali BBM
                  </h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${flaggedLogs.length > 0 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>
                    {flaggedLogs.length > 0 ? `⚠️ ${flaggedLogs.length} Terdeteksi` : '🟢 Aman 100%'}
                  </span>
                </div>

                {flaggedLogs.length > 0 ? (
                  <div className="space-y-1.5 max-h-32 overflow-y-auto font-mono text-xs">
                    {flaggedLogs.map((fl) => (
                      <div key={fl.id} className="bg-rose-50 p-2 rounded-xl border border-rose-200 flex justify-between items-center text-[11px]">
                        <div>
                          <strong className="text-rose-900">{fl.plate_number}</strong> — {fl.driver_name}
                          <span className="block text-[10px] text-rose-700">Rasio: {fl.km_per_liter} KM/L ({fl.date})</span>
                        </div>
                        <span className="text-[10px] bg-rose-600 text-white font-bold px-2 py-0.5 rounded">Periksa Nota</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 py-2">
                    Tidak ada indikasi penggelembungan nota BBM atau selisih odometer yang mencurigakan.
                  </p>
                )}
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                <div className="flex justify-between items-center border-b pb-2">
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="text-amber-500">🛠️</span> Preventive Maintenance (Jadwal Servis KM)
                  </h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${maintenanceAlerts.length > 0 ? 'bg-amber-100 text-amber-900' : 'bg-indigo-100 text-indigo-800'}`}>
                    {maintenanceAlerts.length > 0 ? `⏳ ${maintenanceAlerts.length} Butuh Servis` : '🟢 Kondisi Prima'}
                  </span>
                </div>

                {maintenanceAlerts.length > 0 ? (
                  <div className="space-y-1.5 max-h-32 overflow-y-auto font-mono text-xs">
                    {maintenanceAlerts.map((mv) => (
                      <div key={mv.id} className="bg-amber-50 p-2 rounded-xl border border-amber-200 flex justify-between items-center text-[11px]">
                        <div>
                          <strong className="text-amber-900">{mv.plate_number}</strong> ({mv.model})
                          <span className="block text-[10px] text-amber-700">Odometer: {mv.last_km.toLocaleString('id-ID')} KM</span>
                        </div>
                        <span className="text-[10px] bg-amber-600 text-white font-bold px-2 py-0.5 rounded">Jadwal Ganti Oli</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 py-2">
                    Seluruh odometer armada masih jauh dari batas waktu perbaikan berkala berikutnya.
                  </p>
                )}
              </div>
            </div>

            {/* COMPONENT FILTER UNIFORM DESAIN BARU */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-3">
              <div>
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                  Cut-Off Filter Dashboard
                </h2>
                <p className="text-[11px] text-slate-500">Filter ringkasan biaya BBM & Perbaikan per bulan/tahun</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Bulan:</label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="text-xs font-bold bg-slate-900 text-amber-400 border border-slate-800 rounded-xl px-3 py-2 outline-none shadow-sm cursor-pointer"
                  >
                    <option value="ALL">Semua Bulan</option>
                    <option value="01">Januari</option>
                    <option value="02">Februari</option>
                    <option value="03">Maret</option>
                    <option value="04">April</option>
                    <option value="05">Mei</option>
                    <option value="06">Juni</option>
                    <option value="07">Juli</option>
                    <option value="08">Agustus</option>
                    <option value="09">September</option>
                    <option value="10">Oktober</option>
                    <option value="11">November</option>
                    <option value="12">Desember</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Tahun:</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="text-xs font-bold bg-slate-900 text-amber-400 border border-slate-800 rounded-xl px-3 py-2 outline-none shadow-sm cursor-pointer"
                  >
                    {YEAR_OPTIONS.map((y) => (
                      <option key={y} value={y}>
                        {y === 'ALL' ? 'Semua Tahun' : y}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleAddCustomYear}
                  className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs px-2.5 py-2 rounded-xl border border-indigo-200 transition"
                  title="Tambah Pilihan Tahun Baru"
                >
                  + Tahun
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Pengeluaran BBM</span>
                <strong className="text-lg font-mono font-extrabold text-amber-700 block">
                  Rp {totalFuelCost.toLocaleString('id-ID')}
                </strong>
                <span className="text-[10px] text-slate-500">Plafon: Rp {totalFuelBudget.toLocaleString('id-ID')}</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Biaya Perbaikan & Servis</span>
                <strong className="text-lg font-mono font-extrabold text-indigo-900 block">
                  Rp {totalServiceCost.toLocaleString('id-ID')}
                </strong>
                <span className="text-[10px] text-slate-500">Plafon: Rp {totalServiceBudget.toLocaleString('id-ID')}</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Total Operasional</span>
                <strong className="text-lg font-mono font-extrabold text-slate-900 block">
                  Rp {totalOperationalCost.toLocaleString('id-ID')}
                </strong>
                <span className="text-[10px] text-emerald-700 font-bold">BBM + Servis Combined</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Inspection Supir Hari Ini</span>
                <strong className="text-lg font-mono font-extrabold text-slate-900 block">
                  {inspections.length} Checklist
                </strong>
                <span className="text-[10px] text-emerald-600 font-bold">📋 Status Siap Jalan</span>
              </div>
            </div>

            <FuelLogsTable
              filteredLogs={filteredLogs}
              safeVehicles={vehicles}
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
              selectedVehicle={selectedVehicle}
              setSelectedVehicle={setSelectedVehicle}
              setPreviewReceipt={setPreviewReceipt}
              handleDeleteLog={handleDeleteLog}
              handleUpdateStatus={handleUpdateStatus}
            />
          </>
        )}

        {activeTab === 'reimbursement' && (
          <ReimbursementTab drivers={drivers} vehicles={vehicles} logs={logs} />
        )}

        {activeTab === 'scorecard' && (
          <DriverScorecardTab drivers={drivers} logs={logs} inspections={inspections} />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsTab
            vehicleStats={vehicles}
            logs={logs}
            serviceHistory={serviceHistory}
            drivers={drivers}
          />
        )}

        {activeTab === 'maintenance' && (
          <MaintenanceTab
            vehicleStats={vehicles}
            serviceHistory={serviceHistory}
            totalMaintenanceCost={totalServiceCost}
            onAddServiceRecord={handleAddServiceRecord}
          />
        )}
      </main>

      <WhatsAppReminderModal
        isOpen={showWaModal}
        onClose={() => setShowWaModal(false)}
        vehicles={vehicles}
        drivers={drivers}
      />

      <ExportReportsModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        logs={logs}
        serviceHistory={serviceHistory}
        vehicles={vehicles}
      />
    </div>
  )
}

export default function AdminDashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 text-white p-6">Memuat Dashboard...</div>}>
      <AdminDashboardContent />
    </Suspense>
  )
}