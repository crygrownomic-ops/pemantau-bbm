'use client'

import { useMemo, useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/ui/PageHeader'
import { useFleet } from '@/components/providers/FleetProvider'
import { downloadFile, toCsv } from '@/lib/export'
import {
  daysUntil,
  formatCurrency,
  formatDate,
  formatNumber,
  formatNumberInput,
  MONTH_NAMES,
  parseNumberInput,
} from '@/lib/format'
import type { ServiceRecord } from '@/lib/types'

const CATEGORY_OPTIONS = [
  'Servis Rutin & Oli',
  'Ganti Sparepart / Ban',
  'Perbaikan Mesin & AC',
  'Perpanjangan KIR / STNK',
  'Lainnya',
]

const OIL_INTERVAL_KM = 5000

interface ServiceForm {
  plate_number: string
  category: string
  service_type: string
  parts_replaced: string
  cost: string
  workshop: string
  km_done: string
  date: string
}

function emptyForm(plate = ''): ServiceForm {
  return {
    plate_number: plate,
    category: CATEGORY_OPTIONS[0],
    service_type: '',
    parts_replaced: '',
    cost: '',
    workshop: '',
    km_done: '',
    date: new Date().toISOString().slice(0, 10),
  }
}

export function MaintenanceTab() {
  const { data, create, update, remove, notify } = useFleet()
  const [month, setMonth] = useState('ALL')
  const [year, setYear] = useState(() => String(new Date().getFullYear()))
  const [vehicleFilter, setVehicleFilter] = useState('ALL')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [search, setSearch] = useState('')

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ServiceForm>(emptyForm())
  const [deleteRecord, setDeleteRecord] = useState<ServiceRecord | null>(null)
  const [busy, setBusy] = useState(false)

  const years = useMemo(() => {
    const set = new Set<string>([String(new Date().getFullYear())])
    for (const record of data?.serviceHistory || []) if (record.date) set.add(record.date.slice(0, 4))
    return Array.from(set).sort()
  }, [data])

  const view = useMemo(() => {
    const records = data?.serviceHistory || []
    const vehicles = data?.vehicles || []
    const logs = data?.fuelLogs || []

    const inPeriod = (date?: string) => {
      if (!date) return false
      const [itemYear, itemMonth] = date.split('-')
      return (year === 'ALL' || itemYear === year) && (month === 'ALL' || itemMonth === month)
    }

    const periodRecords = records.filter((record) => inPeriod(record.date))
    const keyword = search.trim().toLowerCase()

    const filtered = periodRecords.filter((record) => {
      const matchVehicle = vehicleFilter === 'ALL' || record.plate_number === vehicleFilter
      const matchStart = !startDate || record.date >= startDate
      const matchEnd = !endDate || record.date <= endDate
      const matchKeyword =
        !keyword ||
        [record.plate_number, record.category, record.service_type, record.parts_replaced, record.workshop]
          .join(' ')
          .toLowerCase()
          .includes(keyword)
      return matchVehicle && matchStart && matchEnd && matchKeyword
    })

    const periodLogs = logs.filter((log) => inPeriod(log.date))
    const totalCost = periodRecords.reduce((total, record) => total + (Number(record.cost) || 0), 0)

    const health = vehicles.map((vehicle) => {
      const vehicleRecords = records
        .filter((record) => record.plate_number === vehicle.plate_number)
        .sort((a, b) => {
          const kmDiff = (Number(b.km_done) || 0) - (Number(a.km_done) || 0)
          return kmDiff !== 0 ? kmDiff : b.date.localeCompare(a.date)
        })
      const last = vehicleRecords[0]
      const lastKm = last ? Number(last.km_done) || 0 : 0
      const nextOil = last ? lastKm + OIL_INTERVAL_KM : (Number(vehicle.last_km) || 0) + OIL_INTERVAL_KM
      const kmSince = last ? (Number(vehicle.last_km) || 0) - lastKm : 0
      const oilDue = Boolean(last) && kmSince >= OIL_INTERVAL_KM
      const periodServiceCost = periodRecords
        .filter((record) => record.plate_number === vehicle.plate_number)
        .reduce((total, record) => total + (Number(record.cost) || 0), 0)
      const periodFuelCost = periodLogs
        .filter((log) => log.plate_number === vehicle.plate_number)
        .reduce((total, log) => total + (Number(log.total_cost) || 0), 0)
      const kirDays = daysUntil(vehicle.kir_expiry)
      const stnkDays = daysUntil(vehicle.stnk_expiry)

      return {
        vehicle,
        last,
        lastKm,
        nextOil,
        kmSince,
        oilDue,
        periodServiceCost,
        periodFuelCost,
        kirDays,
        stnkDays,
      }
    })

    return {
      filtered,
      periodRecords,
      totalCost,
      averagePerVehicle: vehicles.length > 0 ? Math.round(totalCost / vehicles.length) : 0,
      health,
      dueCount: health.filter((item) => item.oilDue).length,
      legalAlerts: health.filter(
        (item) => (item.kirDays !== null && item.kirDays <= 45) || (item.stnkDays !== null && item.stnkDays <= 45)
      ).length,
    }
  }, [data, month, year, vehicleFilter, startDate, endDate, search])

  if (!data) return null

  const openAdd = (plate?: string) => {
    const selectedPlate = plate || data.vehicles[0]?.plate_number || ''
    const vehicle = data.vehicles.find((item) => item.plate_number === selectedPlate)
    const initial = emptyForm(selectedPlate)
    initial.km_done = String(vehicle?.last_km || 0)
    setForm(initial)
    setEditingId(null)
    setFormOpen(true)
  }

  const openEdit = (record: ServiceRecord) => {
    setForm({
      plate_number: record.plate_number,
      category: record.category || CATEGORY_OPTIONS[0],
      service_type: record.service_type || '',
      parts_replaced: record.parts_replaced || '',
      cost: formatNumberInput(record.cost),
      workshop: record.workshop || '',
      km_done: String(record.km_done || ''),
      date: record.date,
    })
    setEditingId(String(record.id))
    setFormOpen(true)
  }

  const submitForm = async (event: React.FormEvent) => {
    event.preventDefault()
    const cost = parseNumberInput(form.cost)
    const kmDone = Number(String(form.km_done).replace(/\D/g, '')) || 0

    if (!form.plate_number) {
      notify('Armada wajib dipilih.', 'error')
      return
    }
    if (!form.service_type.trim()) {
      notify('Jenis pengerjaan wajib diisi.', 'error')
      return
    }
    if (cost <= 0) {
      notify('Biaya perbaikan harus lebih dari 0.', 'error')
      return
    }
    if (kmDone <= 0) {
      notify('Odometer servis wajib diisi.', 'error')
      return
    }

    const payload = {
      plate_number: form.plate_number,
      category: form.category,
      service_type: form.service_type.trim(),
      parts_replaced: form.parts_replaced.trim(),
      cost,
      workshop: form.workshop.trim() || 'Bengkel Rekanan',
      km_done: kmDone,
      date: form.date,
    }

    setBusy(true)
    try {
      if (editingId) await update('serviceHistory', editingId, payload)
      else await create('serviceHistory', payload)
      setFormOpen(false)
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Catatan servis gagal disimpan.', 'error')
    } finally {
      setBusy(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteRecord) return
    setBusy(true)
    try {
      await remove('serviceHistory', deleteRecord.id)
      setDeleteRecord(null)
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Catatan servis gagal dihapus.', 'error')
    } finally {
      setBusy(false)
    }
  }

  const exportRecords = () => {
    if (view.filtered.length === 0) {
      notify('Tidak ada catatan servis pada filter ini untuk diekspor.', 'info')
      return
    }
    const rows: unknown[][] = [
      ['LAPORAN SERVIS & MAINTENANCE ARMADA — FLEETOPS 360'],
      ['Periode', `${month === 'ALL' ? 'Semua bulan' : MONTH_NAMES[Number(month) - 1]} ${year === 'ALL' ? 'Semua tahun' : year}`],
      ['Dicetak', new Date().toLocaleString('id-ID')],
      [],
      ['Tanggal', 'Plat', 'Kategori', 'Jenis Pengerjaan', 'Sparepart', 'Odometer (KM)', 'Bengkel', 'Biaya'],
      ...view.filtered.map((record) => [
        record.date,
        record.plate_number,
        record.category,
        record.service_type,
        record.parts_replaced || '',
        record.km_done,
        record.workshop,
        record.cost,
      ]),
      [],
      ['TOTAL', '', '', '', '', '', '', view.filtered.reduce((total, record) => total + (Number(record.cost) || 0), 0)],
    ]
    downloadFile(`Laporan_Maintenance_${year}-${month}.csv`, toCsv(rows))
  }

  const periodLabel = `${month === 'ALL' ? 'Semua bulan' : MONTH_NAMES[Number(month) - 1]} ${
    year === 'ALL' ? 'semua tahun' : year
  }`

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Asset Care & Compliance"
        title="Servis & Legalitas"
        description="Catat pemeliharaan armada, pantau interval ganti oli berbasis odometer, dan awasi masa berlaku KIR/STNK."
        actions={
          <>
            <button type="button" onClick={exportRecords} className="btn btn-ghost">
              <Icon name="download" className="h-3.5 w-3.5" />
              Ekspor servis
            </button>
            <button type="button" onClick={() => openAdd()} className="btn btn-primary">
              <Icon name="plus" className="h-3.5 w-3.5" />
              Catat servis
            </button>
          </>
        }
      />

      <div className="card flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
          <Icon name="filter" className="h-3.5 w-3.5 text-slate-400" />
          Periode analisis
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={month} onChange={(event) => setMonth(event.target.value)} className="input w-auto py-2 font-semibold">
            <option value="ALL">Semua bulan</option>
            {MONTH_NAMES.map((name, index) => (
              <option key={name} value={String(index + 1).padStart(2, '0')}>
                {name}
              </option>
            ))}
          </select>
          <select value={year} onChange={(event) => setYear(event.target.value)} className="input w-auto py-2 font-semibold">
            <option value="ALL">Semua tahun</option>
            {years.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <span className="badge badge-slate">{periodLabel}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="card p-4">
          <div className="flex items-start justify-between">
            <p className="stat-label">Biaya servis</p>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gold-50 text-gold-700">
              <Icon name="wrench" className="h-3.5 w-3.5" />
            </span>
          </div>
          <p className="stat-value mt-2">{formatCurrency(view.totalCost)}</p>
          <p className="mt-1 text-[10px] font-medium text-slate-500">{view.periodRecords.length} pengerjaan pada periode</p>
        </div>
        <div className="card p-4">
          <div className="flex items-start justify-between">
            <p className="stat-label">Rata-rata per armada</p>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-navy-50 text-navy-800">
              <Icon name="truck" className="h-3.5 w-3.5" />
            </span>
          </div>
          <p className="stat-value mt-2">{formatCurrency(view.averagePerVehicle)}</p>
          <p className="mt-1 text-[10px] font-medium text-slate-500">Dari {data.vehicles.length} unit armada</p>
        </div>
        <div className="card p-4">
          <div className="flex items-start justify-between">
            <p className="stat-label">Jadwal ganti oli</p>
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                view.dueCount > 0 ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
              }`}
            >
              <Icon name="gauge" className="h-3.5 w-3.5" />
            </span>
          </div>
          <p className={`stat-value mt-2 ${view.dueCount > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>{view.dueCount}</p>
          <p className="mt-1 text-[10px] font-medium text-slate-500">Armada melewati interval {formatNumber(OIL_INTERVAL_KM)} KM</p>
        </div>
        <div className="card p-4">
          <div className="flex items-start justify-between">
            <p className="stat-label">Legalitas mendekati tempo</p>
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                view.legalAlerts > 0 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
              }`}
            >
              <Icon name="shield" className="h-3.5 w-3.5" />
            </span>
          </div>
          <p className={`stat-value mt-2 ${view.legalAlerts > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>{view.legalAlerts}</p>
          <p className="mt-1 text-[10px] font-medium text-slate-500">KIR / STNK jatuh tempo ≤ 45 hari</p>
        </div>
      </div>

      <section className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Kesehatan armada</h2>
            <p className="card-subtitle">Odometer, target ganti oli, biaya periode, dan status legalitas tiap unit.</p>
          </div>
          <span className="badge badge-slate">{view.health.length} unit</span>
        </div>
        <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
          {view.health.map((item) => {
            const kirTone =
              item.kirDays !== null && item.kirDays <= 0
                ? 'badge-red'
                : item.kirDays !== null && item.kirDays <= 45
                  ? 'badge-amber'
                  : 'badge-green'
            const stnkTone =
              item.stnkDays !== null && item.stnkDays <= 0
                ? 'badge-red'
                : item.stnkDays !== null && item.stnkDays <= 45
                  ? 'badge-amber'
                  : 'badge-green'
            return (
              <div key={item.vehicle.id} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-extrabold text-navy-950">{item.vehicle.plate_number}</p>
                    <p className="text-[10px] text-slate-500">{item.vehicle.model}</p>
                  </div>
                  {item.oilDue ? (
                    <span className="badge badge-red">Ganti oli</span>
                  ) : item.last ? (
                    <span className="badge badge-green">Prima</span>
                  ) : (
                    <span className="badge badge-slate">Belum ada riwayat</span>
                  )}
                </div>

                <div className="mt-3 space-y-1.5 rounded-lg border border-slate-200 bg-white p-2.5 text-[11px]">
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-500">Odometer terkini</span>
                    <span className="font-mono font-bold text-slate-900">{formatNumber(item.vehicle.last_km)} KM</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-500">Servis oli terakhir</span>
                    <span className="font-mono font-semibold text-slate-700">
                      {item.last ? `${formatNumber(item.lastKm)} KM` : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-500">Target berikutnya</span>
                    <span className={`font-mono font-bold ${item.oilDue ? 'text-rose-600' : 'text-navy-800'}`}>
                      {formatNumber(item.nextOil)} KM
                    </span>
                  </div>
                  <div className="flex justify-between gap-2 border-t border-slate-100 pt-1.5">
                    <span className="text-slate-500">Biaya periode</span>
                    <span className="font-mono font-bold text-gold-700">{formatCurrency(item.periodServiceCost)}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-500">BBM + servis</span>
                    <span className="font-mono font-bold text-slate-900">
                      {formatCurrency(item.periodFuelCost + item.periodServiceCost)}
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <span className={`badge ${kirTone}`}>
                    KIR {item.kirDays === null ? '-' : item.kirDays < 0 ? `lewat ${Math.abs(item.kirDays)} hr` : `${item.kirDays} hr`}
                  </span>
                  <span className={`badge ${stnkTone}`}>
                    STNK {item.stnkDays === null ? '-' : item.stnkDays < 0 ? `lewat ${Math.abs(item.stnkDays)} hr` : `${item.stnkDays} hr`}
                  </span>
                  <button
                    type="button"
                    onClick={() => openAdd(item.vehicle.plate_number)}
                    className="ml-auto btn btn-ghost px-2.5 py-1.5 text-[10px]"
                  >
                    <Icon name="plus" className="h-3 w-3" />
                    Servis
                  </button>
                </div>
              </div>
            )
          })}
          {view.health.length === 0 && (
            <p className="col-span-full py-8 text-center text-xs text-slate-400">Belum ada armada pada master data.</p>
          )}
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="card-header flex-col gap-3 lg:flex-row lg:items-center">
          <div>
            <h2 className="card-title">Riwayat pemeliharaan</h2>
            <p className="card-subtitle">{view.filtered.length} catatan pada filter aktif.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari servis, bengkel…"
                className="input w-full py-2 pl-9 sm:w-48"
                aria-label="Cari catatan servis"
              />
            </div>
            <select
              value={vehicleFilter}
              onChange={(event) => setVehicleFilter(event.target.value)}
              className="input w-auto py-2 font-semibold"
              aria-label="Filter armada"
            >
              <option value="ALL">Semua armada</option>
              {data.vehicles.map((vehicle) => (
                <option key={vehicle.plate_number} value={vehicle.plate_number}>
                  {vehicle.plate_number}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="input w-auto py-2 font-semibold"
              aria-label="Tanggal mulai"
            />
            <span className="text-[10px] font-bold text-slate-400">s/d</span>
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="input w-auto py-2 font-semibold"
              aria-label="Tanggal akhir"
            />
            {(startDate || endDate || vehicleFilter !== 'ALL' || search) && (
              <button
                type="button"
                onClick={() => {
                  setStartDate('')
                  setEndDate('')
                  setVehicleFilter('ALL')
                  setSearch('')
                }}
                className="btn btn-ghost px-2.5 py-2 text-[10px]"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        <div className="scroll-thin max-h-[460px] overflow-auto">
          <table className="table-base min-w-[920px]">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Armada</th>
                <th>Pengerjaan</th>
                <th>Sparepart</th>
                <th>Odometer</th>
                <th>Bengkel</th>
                <th className="text-right">Biaya</th>
                <th className="text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {view.filtered.map((record) => (
                <tr key={String(record.id)}>
                  <td className="whitespace-nowrap font-mono text-[11px] text-slate-500">{formatDate(record.date)}</td>
                  <td className="font-bold text-slate-900">{record.plate_number}</td>
                  <td>
                    <p className="font-semibold text-slate-800">{record.service_type}</p>
                    <p className="text-[10px] text-slate-400">{record.category}</p>
                  </td>
                  <td className="text-slate-600">{record.parts_replaced || '-'}</td>
                  <td className="whitespace-nowrap font-mono text-slate-700">{formatNumber(record.km_done)} KM</td>
                  <td className="text-slate-600">{record.workshop || '-'}</td>
                  <td className="text-right font-mono font-bold text-slate-900">{formatCurrency(record.cost)}</td>
                  <td>
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(record)}
                        className="rounded-lg p-1.5 text-slate-500 transition hover:bg-navy-50 hover:text-navy-800"
                        title="Ubah catatan"
                        aria-label="Ubah catatan servis"
                      >
                        <Icon name="edit" className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteRecord(record)}
                        className="rounded-lg p-1.5 text-rose-500 transition hover:bg-rose-50"
                        title="Hapus catatan"
                        aria-label="Hapus catatan servis"
                      >
                        <Icon name="trash" className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {view.filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <p className="text-xs font-bold text-slate-600">Tidak ada catatan servis</p>
                    <p className="mt-1 text-[11px] text-slate-400">Ubah filter atau tambahkan catatan pemeliharaan baru.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/60 px-4 py-3 text-[11px] font-semibold text-slate-500">
          <span>
            Total biaya filter:{' '}
            <span className="font-mono font-bold text-slate-800">
              {formatCurrency(view.filtered.reduce((total, record) => total + (Number(record.cost) || 0), 0))}
            </span>
          </span>
          <span>Interval ganti oli default {formatNumber(OIL_INTERVAL_KM)} KM</span>
        </div>
      </section>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingId ? 'Ubah catatan servis' : 'Catat servis & sparepart'}
        description="Data akan tersimpan di server dan tercatat pada audit trail."
        size="lg"
      >
        <form onSubmit={submitForm} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="service-vehicle" className="label">
                Armada
              </label>
              <select
                id="service-vehicle"
                value={form.plate_number}
                onChange={(event) => {
                  const plate = event.target.value
                  const vehicle = data.vehicles.find((item) => item.plate_number === plate)
                  setForm((current) => ({
                    ...current,
                    plate_number: plate,
                    km_done: current.km_done || String(vehicle?.last_km || 0),
                  }))
                }}
                className="input font-semibold"
                required
              >
                <option value="">Pilih armada</option>
                {data.vehicles.map((vehicle) => (
                  <option key={vehicle.plate_number} value={vehicle.plate_number}>
                    {vehicle.plate_number} — {vehicle.model}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="service-date" className="label">
                Tanggal perbaikan
              </label>
              <input
                id="service-date"
                type="date"
                value={form.date}
                onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
                className="input"
                required
              />
            </div>
            <div>
              <label htmlFor="service-category" className="label">
                Kategori
              </label>
              <select
                id="service-category"
                value={form.category}
                onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                className="input font-semibold"
              >
                {CATEGORY_OPTIONS.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="service-workshop" className="label">
                Bengkel / workshop
              </label>
              <input
                id="service-workshop"
                type="text"
                value={form.workshop}
                onChange={(event) => setForm((current) => ({ ...current, workshop: event.target.value }))}
                placeholder="Auto2000 / Bengkel rekanan"
                className="input"
              />
            </div>
          </div>

          <div>
            <label htmlFor="service-type" className="label">
              Jenis pengerjaan
            </label>
            <input
              id="service-type"
              type="text"
              value={form.service_type}
              onChange={(event) => setForm((current) => ({ ...current, service_type: event.target.value }))}
              placeholder="Ganti oli mesin & filter oli"
              className="input"
              required
            />
          </div>

          <div>
            <label htmlFor="service-parts" className="label">
              Sparepart diganti
            </label>
            <input
              id="service-parts"
              type="text"
              value={form.parts_replaced}
              onChange={(event) => setForm((current) => ({ ...current, parts_replaced: event.target.value }))}
              placeholder="Kampas rem depan, oli 10W-40"
              className="input"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="service-km" className="label">
                Odometer servis (KM)
              </label>
              <input
                id="service-km"
                type="text"
                inputMode="numeric"
                value={form.km_done}
                onChange={(event) =>
                  setForm((current) => ({ ...current, km_done: event.target.value.replace(/\D/g, '') }))
                }
                placeholder="45860"
                className="input font-mono font-bold"
                required
              />
            </div>
            <div>
              <label htmlFor="service-cost" className="label">
                Total biaya (Rp)
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-[11px] font-bold text-slate-400">Rp</span>
                <input
                  id="service-cost"
                  type="text"
                  inputMode="numeric"
                  value={form.cost}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, cost: formatNumberInput(event.target.value) }))
                  }
                  placeholder="450.000"
                  className="input pl-9 font-mono font-bold"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 border-t border-slate-100 pt-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setFormOpen(false)} className="btn btn-ghost">
              Batal
            </button>
            <button type="submit" disabled={busy} className="btn btn-primary">
              <Icon name="check" className="h-3.5 w-3.5" />
              {busy ? 'Menyimpan…' : editingId ? 'Simpan perubahan' : 'Simpan catatan'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(deleteRecord)}
        onClose={() => setDeleteRecord(null)}
        title="Hapus catatan servis"
        description="Tindakan ini tidak dapat dibatalkan dan akan tercatat pada audit trail."
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-xs leading-relaxed text-slate-600">
            Hapus catatan <span className="font-bold text-slate-900">{deleteRecord?.service_type}</span> untuk armada{' '}
            <span className="font-bold text-slate-900">{deleteRecord?.plate_number}</span> tanggal{' '}
            <span className="font-bold text-slate-900">{deleteRecord ? formatDate(deleteRecord.date) : ''}</span>?
          </p>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setDeleteRecord(null)} className="btn btn-ghost">
              Batal
            </button>
            <button type="button" onClick={() => void confirmDelete()} disabled={busy} className="btn btn-danger">
              <Icon name="trash" className="h-3.5 w-3.5" />
              Hapus catatan
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default MaintenanceTab
