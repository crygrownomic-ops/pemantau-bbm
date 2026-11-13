'use client'

import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Icon } from '@/components/ui/Icon'
import { useFleet } from '@/components/providers/FleetProvider'
import { PreTripChecklistModal } from '@/components/driver/PreTripChecklistModal'
import { ReimbursementModal } from '@/components/driver/ReimbursementModal'
import { daysUntil, formatCurrency, formatDate, formatNumber } from '@/lib/format'
import { efficiencyOf, scoreFuelLog } from '@/lib/fuel'
import type { FuelLog, Role, Vehicle } from '@/lib/types'

interface PortalUser {
  username: string
  name: string
  role: Role
  driverName?: string
}

const MAX_RECEIPT_BYTES = 1_500_000

export function DriverPortal({ user }: { user: PortalUser }) {
  const { data, loading, error, create, refresh, notify } = useFleet()
  const [previewDriver, setPreviewDriver] = useState('')
  const [selectedPlate, setSelectedPlate] = useState('')
  const [finalKm, setFinalKm] = useState('')
  const [liters, setLiters] = useState('')
  const [fuelType, setFuelType] = useState('')
  const [fillLocation, setFillLocation] = useState<'SPBU Resmi' | 'ECERAN'>('SPBU Resmi')
  const [eceranNote, setEceranNote] = useState('')
  const [receipt, setReceipt] = useState('')
  const [date, setDate] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [checklistOpen, setChecklistOpen] = useState(false)
  const [claimOpen, setClaimOpen] = useState(false)

  const isAdmin = user.role === 'admin'
  const vehicles = useMemo(() => data?.vehicles ?? [], [data])
  const drivers = useMemo(() => data?.drivers ?? [], [data])
  const prices = useMemo(() => data?.fuelPrices ?? [], [data])

  const identityName = isAdmin
    ? previewDriver || drivers[0]?.name || user.name
    : user.driverName || user.name

  const driverRecord = useMemo(
    () => drivers.find((driver) => driver.name.toLowerCase() === identityName.toLowerCase()),
    [drivers, identityName]
  )
  const assignedPlate = driverRecord?.assigned_vehicle || ''
  const today = new Date().toISOString().slice(0, 10)
  const effectiveDate = date || today

  const effectivePlate =
    (selectedPlate && vehicles.some((vehicle) => vehicle.plate_number === selectedPlate) ? selectedPlate : '') ||
    (assignedPlate && vehicles.some((vehicle) => vehicle.plate_number === assignedPlate) ? assignedPlate : '') ||
    vehicles[0]?.plate_number ||
    ''

  const selectedVehicle = useMemo(
    () => vehicles.find((vehicle) => vehicle.plate_number === effectivePlate),
    [vehicles, effectivePlate]
  )

  const effectiveFuelType =
    (fuelType && prices.some((fuel) => fuel.name === fuelType) ? fuelType : '') || prices[0]?.name || ''
  const selectedFuel = prices.find((fuel) => fuel.name === effectiveFuelType) || prices[0]
  const initialKm = Number(selectedVehicle?.last_km) || 0
  const unitPrice = Number(selectedFuel?.price) || 0
  const finalKmValue = Number(finalKm) || 0
  const litersValue = Number(String(liters).replace(',', '.')) || 0
  const distanceKm = finalKmValue > initialKm ? finalKmValue - initialKm : 0
  const kmPerLiter = litersValue > 0 && distanceKm > 0 ? distanceKm / litersValue : 0
  const estimatedCost = Math.round(litersValue * unitPrice)
  const baseline = Number(selectedVehicle?.baseline_km_per_liter) || 0
  const projectedScore =
    baseline > 0 && kmPerLiter > 0
      ? Math.max(0, Math.min(100, Math.round((kmPerLiter / baseline) * 100)))
      : 0

  const myLogs = useMemo(() => {
    return (data?.fuelLogs || []).filter((log) => (log.driver_name || '').toLowerCase() === identityName.toLowerCase())
  }, [data, identityName])

  const recentLogs = myLogs.slice(0, 6)
  const monthKey = new Date().toISOString().slice(0, 7)
  const monthLogs = myLogs.filter((log) => (log.date || '').startsWith(monthKey))
  const monthLiters = monthLogs.reduce((total, log) => total + (Number(log.liters) || 0), 0)
  const monthKm = monthLogs.reduce((total, log) => total + (Number(log.distance_km) || 0), 0)
  const monthEfficiency = monthLiters > 0 ? monthKm / monthLiters : 0
  const pendingClaims = (data?.reimbursementClaims || []).filter((claim) => claim.status === 'PENDING').length
  const lastInspection = (data?.inspections || [])[0]

  const resetForm = () => {
    setFinalKm('')
    setLiters('')
    setReceipt('')
    setEceranNote('')
    setFillLocation('SPBU Resmi')
    setDate(new Date().toISOString().slice(0, 10))
  }

  const handleReceiptUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > MAX_RECEIPT_BYTES) {
      notify('Ukuran foto struk terlalu besar. Maksimal 1,5 MB.', 'error')
      event.target.value = ''
      return
    }
    const reader = new FileReader()
    reader.onloadend = () => setReceipt(String(reader.result || ''))
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (submitting) return

    if (!selectedVehicle) {
      notify('Belum ada armada pada master data. Hubungi admin.', 'error')
      return
    }
    if (!selectedFuel) {
      notify('Belum ada tarif BBM pada master data. Hubungi admin.', 'error')
      return
    }
    if (finalKmValue <= initialKm) {
      notify(`KM akhir harus lebih besar dari KM awal (${formatNumber(initialKm)}).`, 'error')
      return
    }
    if (litersValue <= 0) {
      notify('Jumlah liter BBM harus lebih dari 0.', 'error')
      return
    }

    setSubmitting(true)
    try {
      await create('fuelLogs', {
        plate_number: selectedVehicle.plate_number,
        driver_name: identityName,
        final_km: finalKmValue,
        liters: litersValue,
        fuel_type: selectedFuel.name,
        unit_price: unitPrice,
        fill_location: fillLocation,
        eceran_note: fillLocation === 'ECERAN' ? eceranNote : '',
        receipt_image: receipt,
        date: effectiveDate,
      })
      await refresh()
      resetForm()
    } catch {
      // Notifikasi kegagalan sudah ditampilkan oleh provider.
    } finally {
      setSubmitting(false)
    }
  }

  if (loading && !data) {
    return (
      <div className="space-y-4">
        <div className="card h-24 animate-pulse bg-white" />
        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="card h-96 animate-pulse bg-white" />
          <div className="card h-96 animate-pulse bg-white" />
        </div>
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="card flex flex-col items-center gap-3 p-10 text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-50 text-rose-600">
          <Icon name="alert" className="h-5 w-5" />
        </span>
        <p className="text-sm font-extrabold text-slate-800">Data portal gagal dimuat</p>
        <p className="max-w-md text-xs text-slate-500">{error}</p>
        <button type="button" onClick={() => void refresh()} className="btn btn-primary">
          <Icon name="refresh" className="h-3.5 w-3.5" />
          Coba lagi
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {isAdmin && (
        <div className="flex flex-col gap-3 rounded-xl border border-gold-200 bg-gold-50/80 p-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <Icon name="eye" className="mt-0.5 h-4 w-4 shrink-0 text-gold-700" />
            <div>
              <p className="text-[11px] font-extrabold text-gold-800">Mode pratinjau admin</p>
              <p className="text-[10px] leading-relaxed text-gold-700">
                Laporan yang dikirim akan tercatat atas nama driver yang dipilih.
              </p>
            </div>
          </div>
          <select
            value={identityName}
            onChange={(event) => {
              setPreviewDriver(event.target.value)
              const next = drivers.find((driver) => driver.name === event.target.value)
              setSelectedPlate(next?.assigned_vehicle || vehicles[0]?.plate_number || '')
            }}
            className="input bg-white py-2 sm:w-64"
          >
            {drivers.map((driver) => (
              <option key={driver.id} value={driver.name}>
                {driver.name} — {driver.assigned_vehicle || 'tanpa armada'}
              </option>
            ))}
          </select>
        </div>
      )}

      <PageHeader
        eyebrow="Laporan Harian"
        title="Pengisian BBM"
        description={`Halo ${identityName.split(' ')[0]}, catat pengisian bahan bakar dengan odometer yang benar agar kualitas konsumsi dapat diverifikasi.`}
        actions={
          <>
            <button type="button" onClick={() => setChecklistOpen(true)} className="btn btn-ghost">
              <Icon name="shield" className="h-3.5 w-3.5" />
              Inspeksi siap jalan
            </button>
            <button type="button" onClick={() => setClaimOpen(true)} className="btn btn-primary">
              <Icon name="receipt" className="h-3.5 w-3.5" />
              Klaim biaya jalan
            </button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <PortalStat label="Transaksi bulan ini" value={formatNumber(monthLogs.length)} icon="fuel" />
        <PortalStat label="Liter bulan ini" value={`${formatNumber(Number(monthLiters.toFixed(1)))} L`} icon="chart" />
        <PortalStat
          label="Rata-rata KM/L"
          value={monthEfficiency > 0 ? monthEfficiency.toFixed(2) : '—'}
          icon="gauge"
          tone={baseline > 0 && monthEfficiency > 0 && monthEfficiency < baseline * 0.8 ? 'amber' : 'navy'}
        />
        <PortalStat label="Klaim menunggu" value={formatNumber(pendingClaims)} icon="receipt" tone={pendingClaims > 0 ? 'amber' : 'navy'} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <form onSubmit={handleSubmit} className="card overflow-hidden">
          <div className="card-header">
            <div>
              <p className="card-title">Form laporan pengisian</p>
              <p className="card-subtitle">KM awal diambil otomatis dari odometer terakhir armada.</p>
            </div>
            <span className="badge badge-blue">{selectedVehicle?.plate_number || 'Armada'}</span>
          </div>

          <div className="space-y-4 p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <span className="label">Nama driver</span>
                <div className="input flex items-center gap-2 bg-slate-50 text-slate-600">
                  <Icon name="users" className="h-3.5 w-3.5 text-slate-400" />
                  <span className="truncate font-semibold">{identityName}</span>
                </div>
              </div>
              <div>
                <span className="label">Tanggal pengisian</span>
                <input type="date" className="input" value={effectiveDate} onChange={(event) => setDate(event.target.value)} required />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <span className="label">Armada</span>
                <select
                  className="input font-semibold"
                  value={selectedVehicle?.plate_number || ''}
                  onChange={(event) => setSelectedPlate(event.target.value)}
                  required
                >
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.plate_number}>
                      {vehicle.plate_number} — {vehicle.model}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <span className="label">Jenis BBM</span>
                <select className="input font-semibold" value={effectiveFuelType} onChange={(event) => setFuelType(event.target.value)} required>
                  {prices.map((fuel) => (
                    <option key={fuel.id} value={fuel.name}>
                      {fuel.name} — {formatCurrency(fuel.price)}/L
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <span className="label">KM awal</span>
                <div className="input flex items-center justify-end gap-1 bg-slate-50 font-mono font-bold text-slate-500">
                  {formatNumber(initialKm)}
                  <span className="text-[10px] font-semibold text-slate-400">km</span>
                </div>
              </div>
              <div>
                <span className="label">KM akhir</span>
                <input
                  className="input font-mono font-bold text-navy-900"
                  inputMode="numeric"
                  placeholder={String(initialKm + 100)}
                  value={finalKm}
                  onChange={(event) => setFinalKm(event.target.value.replace(/\D/g, ''))}
                  required
                />
              </div>
              <div>
                <span className="label">Jumlah liter</span>
                <input
                  className="input font-mono font-bold"
                  inputMode="decimal"
                  placeholder="25.5"
                  value={liters}
                  onChange={(event) => setLiters(event.target.value.replace(/[^0-9.,]/g, ''))}
                  required
                />
              </div>
            </div>

            <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5 sm:grid-cols-3">
              <div>
                <p className="stat-label">Jarak tempuh</p>
                <p className="font-mono text-sm font-bold text-slate-800">{formatNumber(distanceKm)} km</p>
              </div>
              <div>
                <p className="stat-label">KM / Liter</p>
                <p className="font-mono text-sm font-bold text-slate-800">{kmPerLiter > 0 ? kmPerLiter.toFixed(2) : '—'}</p>
              </div>
              <div>
                <p className="stat-label">Estimasi biaya</p>
                <p className="font-mono text-sm font-bold text-navy-950">{formatCurrency(estimatedCost)}</p>
              </div>
              <div className="sm:col-span-3">
                <div className="flex items-center justify-between gap-3 text-[10px] font-semibold text-slate-500">
                  <span>Proyeksi kualitas terhadap baseline {baseline > 0 ? `${baseline} km/L` : 'armada'}</span>
                  <span className={projectedScore >= 78 ? 'text-emerald-600' : projectedScore >= 60 ? 'text-amber-600' : 'text-rose-600'}>
                    {projectedScore > 0 ? `${projectedScore} / 100` : 'Menunggu data'}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={`h-full rounded-full transition-all ${
                      projectedScore >= 78 ? 'bg-emerald-500' : projectedScore >= 60 ? 'bg-gold-400' : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(100, projectedScore)}%` }}
                  />
                </div>
              </div>
            </div>

            <div>
              <span className="label">Lokasi pengisian</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFillLocation('SPBU Resmi')}
                  className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-[11px] font-extrabold transition ${
                    fillLocation === 'SPBU Resmi'
                      ? 'border-navy-900 bg-navy-900 text-white'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <Icon name="fuel" className="h-3.5 w-3.5" />
                  SPBU Resmi
                </button>
                <button
                  type="button"
                  onClick={() => setFillLocation('ECERAN')}
                  className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-[11px] font-extrabold transition ${
                    fillLocation === 'ECERAN'
                      ? 'border-rose-600 bg-rose-600 text-white'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <Icon name="alert" className="h-3.5 w-3.5" />
                  Darurat / Eceran
                </button>
              </div>
              {fillLocation === 'ECERAN' && (
                <div className="mt-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3">
                  <p className="flex items-center gap-1.5 text-[10px] font-extrabold text-rose-700">
                    <Icon name="alert" className="h-3.5 w-3.5" />
                    Transaksi eceran otomatis masuk audit admin.
                  </p>
                  <input
                    className="input mt-2 bg-white"
                    placeholder="Nama kios / lokasi eceran (opsional)"
                    value={eceranNote}
                    onChange={(event) => setEceranNote(event.target.value)}
                  />
                </div>
              )}
            </div>

            <div>
              <span className="label">Foto struk (opsional)</span>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <label className="btn btn-ghost cursor-pointer">
                  <Icon name="camera" className="h-3.5 w-3.5" />
                  {receipt ? 'Ganti foto' : 'Unggah foto'}
                  <input type="file" accept="image/*" className="hidden" onChange={handleReceiptUpload} />
                </label>
                {receipt ? (
                  <div className="flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={receipt} alt="Pratinjau struk" className="h-10 w-10 rounded-lg border border-slate-200 object-cover" />
                    <button type="button" onClick={() => setReceipt('')} className="text-[10px] font-bold text-rose-600 hover:underline">
                      Hapus foto
                    </button>
                  </div>
                ) : (
                  <p className="text-[10px] leading-relaxed text-slate-400">
                    Bukti struk menambah skor integritas transaksi.
                  </p>
                )}
              </div>
            </div>

            <button type="submit" disabled={submitting || vehicles.length === 0 || prices.length === 0} className="btn btn-gold w-full py-3">
              <Icon name="check" className="h-4 w-4" />
              {submitting ? 'Mengirim laporan…' : 'Kirim laporan pengisian'}
            </button>
          </div>
        </form>

        <div className="space-y-4">
          <div className="card overflow-hidden">
            <div className="card-header">
              <div>
                <p className="card-title">Armada aktif</p>
                <p className="card-subtitle">Ringkasan kendaraan yang sedang dipakai.</p>
              </div>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-50 text-navy-700">
                <Icon name="truck" className="h-4 w-4" />
              </span>
            </div>
            {selectedVehicle ? (
              <div className="space-y-3 p-5">
                <div>
                  <p className="font-mono text-lg font-extrabold tracking-tight text-navy-950">{selectedVehicle.plate_number}</p>
                  <p className="text-[11px] font-semibold text-slate-500">
                    {selectedVehicle.model} · {selectedVehicle.year}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <MiniStat label="Odometer" value={`${formatNumber(selectedVehicle.last_km)} km`} />
                  <MiniStat label="Baseline" value={`${selectedVehicle.baseline_km_per_liter} km/L`} />
                  <MiniStat label="Target bulan" value={`${formatNumber(selectedVehicle.target_km_monthly)} km`} />
                  <MiniStat label="Anggaran BBM" value={formatCurrency(selectedVehicle.monthly_budget)} />
                </div>
                <div className="space-y-1.5 border-t border-slate-100 pt-3 text-[10px]">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-500">KIR · {formatDate(selectedVehicle.kir_expiry)}</span>
                    <LegalBadge date={selectedVehicle.kir_expiry} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-500">STNK · {formatDate(selectedVehicle.stnk_expiry)}</span>
                    <LegalBadge date={selectedVehicle.stnk_expiry} />
                  </div>
                </div>
              </div>
            ) : (
              <p className="px-5 py-8 text-center text-xs text-slate-400">Belum ada armada terdaftar.</p>
            )}
          </div>

          <div className="card overflow-hidden">
            <div className="card-header">
              <div>
                <p className="card-title">Pengiriman terakhir</p>
                <p className="card-subtitle">{lastInspection ? `Inspeksi terakhir ${formatDate(lastInspection.date)} · ${lastInspection.time}` : 'Belum ada inspeksi tercatat.'}</p>
              </div>
              <span className="badge badge-slate">{recentLogs.length}</span>
            </div>
            {recentLogs.length === 0 ? (
              <p className="px-5 py-8 text-center text-xs text-slate-400">Belum ada laporan pengisian BBM.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {recentLogs.map((log) => (
                  <LogRow key={String(log.id)} log={log} vehicle={selectedVehicle} />
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <PreTripChecklistModal
        open={checklistOpen}
        onClose={() => setChecklistOpen(false)}
        vehicles={vehicles}
        driverName={identityName}
        defaultPlate={selectedVehicle?.plate_number || ''}
      />

      <ReimbursementModal
        open={claimOpen}
        onClose={() => setClaimOpen(false)}
        vehicles={vehicles}
        driverName={identityName}
        defaultPlate={selectedVehicle?.plate_number || ''}
      />
    </div>
  )
}

function PortalStat({
  label,
  value,
  icon,
  tone = 'navy',
}: {
  label: string
  value: string
  icon: 'fuel' | 'chart' | 'gauge' | 'receipt'
  tone?: 'navy' | 'amber'
}) {
  return (
    <div className="card flex items-center gap-3 p-4">
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
          tone === 'amber' ? 'bg-amber-50 text-amber-600' : 'bg-navy-50 text-navy-700'
        }`}
      >
        <Icon name={icon} className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="stat-label">{label}</p>
        <p className="truncate font-mono text-base font-bold tracking-tight text-navy-950">{value}</p>
      </div>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 px-2.5 py-2">
      <p className="stat-label">{label}</p>
      <p className="truncate font-mono text-[11px] font-bold text-slate-800">{value}</p>
    </div>
  )
}

function LegalBadge({ date }: { date: string }) {
  const days = daysUntil(date)
  if (days === null) return <span className="badge badge-slate">Belum diisi</span>
  if (days < 0) return <span className="badge badge-red">Lewat</span>
  if (days <= 45) return <span className="badge badge-amber">{days} hari</span>
  return <span className="badge badge-green">{days} hari</span>
}

function LogRow({ log, vehicle }: { log: FuelLog; vehicle?: Vehicle }) {
  const statusTone =
    log.status === 'VERIFIED' ? 'badge-green' : log.status === 'FLAGGED' ? 'badge-red' : 'badge-amber'
  const statusLabel = log.status === 'VERIFIED' ? 'Terverifikasi' : log.status === 'FLAGGED' ? 'Anomali' : 'Menunggu'
  const score = vehicle ? scoreFuelLog(log, vehicle).score : 0

  return (
    <li className="flex items-center justify-between gap-3 px-5 py-3">
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="font-mono text-[11px] font-extrabold text-slate-800">{log.plate_number}</p>
          <span className={`badge ${statusTone}`}>{statusLabel}</span>
        </div>
        <p className="mt-0.5 text-[10px] text-slate-400">
          {formatDate(log.date)} · {formatNumber(log.liters)} L · {efficiencyOf(log).toFixed(2)} km/L
        </p>
      </div>
      <div className="text-right">
        <p className="font-mono text-[11px] font-bold text-slate-800">{formatCurrency(log.total_cost)}</p>
        {score > 0 && (
          <p className={`text-[9px] font-bold ${score >= 78 ? 'text-emerald-600' : score >= 60 ? 'text-amber-600' : 'text-rose-600'}`}>
            Skor {score}
          </p>
        )}
      </div>
    </li>
  )
}
