'use client'

import Link from 'next/link'
import { Suspense, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { useSearchParams } from 'next/navigation'
import { PageHeader } from '@/components/ui/PageHeader'
import { Modal } from '@/components/ui/Modal'
import { Icon, type IconName } from '@/components/ui/Icon'
import { useFleet } from '@/components/providers/FleetProvider'
import {
  daysUntil,
  formatCurrency,
  formatDate,
  formatNumber,
  formatNumberInput,
  initials,
  parseNumberInput,
} from '@/lib/format'
import { downloadFile } from '@/lib/export'
import type {
  AppSettings,
  AuditEntry,
  Driver,
  FleetDatabase,
  FuelPrice,
  TenantUser,
  Vehicle,
} from '@/lib/types'

type TabKey = 'drivers' | 'vehicles' | 'prices' | 'users' | 'system'

const TABS: Array<{ key: TabKey; label: string; icon: IconName; description: string }> = [
  {
    key: 'drivers',
    label: 'Master Driver',
    icon: 'users',
    description: 'Data pengemudi, dokumen SIM, kontak darurat, dan armada yang ditugaskan.',
  },
  {
    key: 'vehicles',
    label: 'Master Armada',
    icon: 'truck',
    description: 'Spesifikasi kendaraan, baseline konsumsi BBM, anggaran bulanan, dan legalitas.',
  },
  {
    key: 'prices',
    label: 'Tarif BBM',
    icon: 'fuel',
    description: 'Katalog harga bahan bakar yang dipakai saat validasi biaya pengisian.',
  },
  {
    key: 'users',
    label: 'Pengguna',
    icon: 'lock',
    description: 'Kelola akun admin dan driver yang dapat masuk ke perusahaan ini sesuai batas paket.',
  },
  {
    key: 'system',
    label: 'Sistem & Audit',
    icon: 'settings',
    description: 'Identitas perusahaan, ambang kualitas, keamanan sesi, cadangan data, dan audit trail.',
  },
]

const COLLECTION_LABELS: Record<string, string> = {
  vehicles: 'Armada',
  drivers: 'Driver',
  fuelPrices: 'Tarif BBM',
  fuelLogs: 'Transaksi BBM',
  serviceHistory: 'Servis',
  inspections: 'Inspeksi',
  reimbursementClaims: 'Klaim',
  cashAdvances: 'Uang Jalan',
  auditTrail: 'Audit',
  settings: 'Pengaturan',
}

const EMPTY_DRIVER: Record<string, string> = {
  name: '',
  nik: '',
  phone: '',
  address: '',
  sim_type: 'SIM A',
  sim_number: '',
  sim_expiry: '',
  emergency_name: '',
  emergency_relation: '',
  emergency_phone: '',
  assigned_vehicle: '',
  joined_at: '',
  status: 'ACTIVE',
}

const EMPTY_VEHICLE: Record<string, string> = {
  plate_number: '',
  model: '',
  year: String(new Date().getFullYear()),
  monthly_budget: '',
  monthly_service_budget: '',
  target_km_monthly: '',
  baseline_km_per_liter: '',
  last_km: '',
  kir_expiry: '',
  stnk_expiry: '',
  status: 'ACTIVE',
}

const EMPTY_PRICE: Record<string, string> = {
  name: '',
  category: 'Non-Subsidi',
  price: '',
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="card flex items-center gap-3 p-6 text-xs font-bold text-slate-500">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-navy-800" />
          Memuat pengaturan…
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  )
}

function SettingsContent() {
  const { data, loading, error, refreshing, refresh } = useFleet()
  const searchParams = useSearchParams()
  const rawTab = searchParams.get('tab') || 'drivers'
  const tab = (TABS.some((item) => item.key === rawTab) ? rawTab : 'drivers') as TabKey
  const activeTab = TABS.find((item) => item.key === tab) || TABS[0]

  if (loading && !data) {
    return (
      <div className="card space-y-3 p-6">
        <div className="h-4 w-40 animate-pulse rounded bg-slate-100" />
        <div className="h-3 w-72 animate-pulse rounded bg-slate-100" />
        <div className="h-40 animate-pulse rounded-xl bg-slate-50" />
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="card flex flex-col items-center gap-3 p-10 text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-50 text-rose-600">
          <Icon name="alert" className="h-5 w-5" />
        </span>
        <p className="text-sm font-extrabold text-slate-800">Data pengaturan gagal dimuat</p>
        <p className="max-w-md text-xs text-slate-500">{error}</p>
        <button type="button" onClick={() => void refresh()} className="btn btn-primary">
          <Icon name="refresh" className="h-3.5 w-3.5" />
          Coba lagi
        </button>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Master & Sistem"
        title={activeTab.label}
        description={activeTab.description}
        actions={
          <button type="button" onClick={() => void refresh()} disabled={refreshing} className="btn btn-ghost">
            <Icon name="refresh" className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Muat ulang
          </button>
        }
      />

      <div className="flex flex-wrap gap-1.5 rounded-xl border border-slate-200 bg-white p-1.5">
        {TABS.map((item) => {
          const active = item.key === tab
          return (
            <Link
              key={item.key}
              href={`/admin/settings?tab=${item.key}`}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-extrabold transition ${
                active
                  ? 'bg-navy-900 text-white shadow-sm'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-navy-900'
              }`}
            >
              <Icon name={item.icon} className="h-3.5 w-3.5" />
              {item.label}
            </Link>
          )
        })}
      </div>

      {tab === 'drivers' && <DriversTab />}
      {tab === 'vehicles' && <VehiclesTab />}
      {tab === 'prices' && <PricesTab />}
      {tab === 'users' && <UsersTab />}
      {tab === 'system' && <SystemTab />}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Shared bits                                                         */
/* ------------------------------------------------------------------ */

function Field({
  label,
  hint,
  children,
  className = '',
}: {
  label: string
  hint?: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <span className="label">{label}</span>
      {children}
      {hint && <p className="mt-1 text-[10px] leading-relaxed text-slate-400">{hint}</p>}
    </div>
  )
}

function StatusPill({ status }: { status?: string }) {
  const active = (status || 'ACTIVE') === 'ACTIVE'
  return <span className={`badge ${active ? 'badge-green' : 'badge-slate'}`}>{active ? 'Aktif' : 'Nonaktif'}</span>
}

function LegalPill({ date }: { date: string }) {
  const days = daysUntil(date)
  if (days === null) return <span className="badge badge-slate">Belum diisi</span>
  if (days < 0) return <span className="badge badge-red">Lewat {Math.abs(days)} hari</span>
  if (days <= 45) return <span className="badge badge-amber">{days} hari lagi</span>
  return <span className="badge badge-green">{days} hari lagi</span>
}

function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <Icon name="file" className="h-5 w-5" />
      </span>
      <div>
        <p className="text-sm font-extrabold text-slate-800">{title}</p>
        <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-slate-500">{description}</p>
      </div>
      {action}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Drivers                                                             */
/* ------------------------------------------------------------------ */

function DriversTab() {
  const { data, create, update, remove } = useFleet()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('ALL')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Driver | null>(null)
  const [form, setForm] = useState<Record<string, string>>(EMPTY_DRIVER)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Driver | null>(null)
  const [deleting, setDeleting] = useState(false)

  const drivers = useMemo(() => data?.drivers ?? [], [data])
  const vehicles = useMemo(() => data?.vehicles ?? [], [data])

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    return drivers.filter((driver) => {
      const matchesStatus = status === 'ALL' || (driver.status || 'ACTIVE') === status
      const haystack = [driver.name, driver.nik, driver.phone, driver.sim_number, driver.assigned_vehicle]
        .join(' ')
        .toLowerCase()
      return matchesStatus && (!term || haystack.includes(term))
    })
  }, [drivers, query, status])

  const openCreate = () => {
    setEditing(null)
    setForm({ ...EMPTY_DRIVER, assigned_vehicle: vehicles[0]?.plate_number || '' })
    setOpen(true)
  }

  const openEdit = (driver: Driver) => {
    setEditing(driver)
    setForm({
      name: driver.name || '',
      nik: driver.nik || '',
      phone: driver.phone || '',
      address: driver.address || '',
      sim_type: driver.sim_type || 'SIM A',
      sim_number: driver.sim_number || '',
      sim_expiry: driver.sim_expiry || '',
      emergency_name: driver.emergency_name || '',
      emergency_relation: driver.emergency_relation || '',
      emergency_phone: driver.emergency_phone || driver.emergency_contact_phone || '',
      assigned_vehicle: driver.assigned_vehicle || '',
      joined_at: driver.joined_at || '',
      status: driver.status || 'ACTIVE',
    })
    setOpen(true)
  }

  const setField = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }))

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (saving) return
    if (!form.name.trim()) return
    setSaving(true)

    const emergencyName = form.emergency_name.trim()
    const emergencyRelation = form.emergency_relation.trim()
    const payload = {
      name: form.name.trim(),
      nik: form.nik.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      sim_type: form.sim_type.trim(),
      sim_number: form.sim_number.trim(),
      sim_expiry: form.sim_expiry,
      emergency_name: emergencyName,
      emergency_relation: emergencyRelation,
      emergency_phone: form.emergency_phone.trim(),
      emergency_contact_name: emergencyName
        ? `${emergencyName}${emergencyRelation ? ` (${emergencyRelation})` : ''}`
        : '',
      emergency_contact_phone: form.emergency_phone.trim(),
      assigned_vehicle: form.assigned_vehicle,
      status: form.status,
      joined_at: form.joined_at || new Date().toISOString().slice(0, 10),
    }

    try {
      if (editing) await update('drivers', editing.id, payload)
      else await create('drivers', payload)
      setOpen(false)
    } catch {
      // Notifikasi kegagalan sudah ditampilkan oleh provider.
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget || deleting) return
    setDeleting(true)
    try {
      await remove('drivers', deleteTarget.id)
      setDeleteTarget(null)
    } catch {
      // Notifikasi kegagalan sudah ditampilkan oleh provider.
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard label="Total driver" value={formatNumber(drivers.length)} icon="users" />
        <SummaryCard
          label="Driver aktif"
          value={formatNumber(drivers.filter((driver) => (driver.status || 'ACTIVE') === 'ACTIVE').length)}
          icon="check"
        />
        <SummaryCard
          label="SIM mendekati kedaluwarsa"
          value={formatNumber(
            drivers.filter((driver) => {
              const days = daysUntil(driver.sim_expiry)
              return days !== null && days <= 60
            }).length
          )}
          icon="alert"
          tone="amber"
        />
      </div>

      <div className="card overflow-hidden">
        <div className="card-header flex-col gap-3 sm:flex-row sm:items-center">
          <div>
            <p className="card-title">Daftar pengemudi</p>
            <p className="card-subtitle">{filtered.length} dari {drivers.length} driver ditampilkan.</p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <div className="relative">
              <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari nama, NIK, SIM…"
                className="input py-2 pl-9 sm:w-56"
              />
            </div>
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="input py-2 sm:w-36">
              <option value="ALL">Semua status</option>
              <option value="ACTIVE">Aktif</option>
              <option value="INACTIVE">Nonaktif</option>
            </select>
            <button type="button" onClick={openCreate} className="btn btn-gold">
              <Icon name="plus" className="h-3.5 w-3.5" />
              Tambah driver
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title="Tidak ada driver ditemukan"
            description="Ubah kata kunci atau tambahkan pengemudi baru ke master data."
            action={
              <button type="button" onClick={openCreate} className="btn btn-primary">
                <Icon name="plus" className="h-3.5 w-3.5" />
                Tambah driver
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Driver</th>
                  <th>Kontak</th>
                  <th>SIM</th>
                  <th>Armada</th>
                  <th>Status</th>
                  <th className="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((driver) => (
                  <tr key={driver.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-navy-900 text-[10px] font-extrabold text-gold-300">
                          {initials(driver.name)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-slate-800">{driver.name}</p>
                          <p className="truncate font-mono text-[10px] text-slate-400">{driver.nik || 'NIK belum diisi'}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <p className="text-xs font-semibold text-slate-700">{driver.phone || '-'}</p>
                      <p className="max-w-[180px] truncate text-[10px] text-slate-400">{driver.address || 'Alamat belum diisi'}</p>
                    </td>
                    <td>
                      <p className="text-xs font-semibold text-slate-700">{driver.sim_type || '-'}</p>
                      <p className="font-mono text-[10px] text-slate-400">{driver.sim_number || '-'}</p>
                      <div className="mt-1">
                        <LegalPill date={driver.sim_expiry || ''} />
                      </div>
                    </td>
                    <td>
                      <p className="font-mono text-[11px] font-bold text-slate-700">{driver.assigned_vehicle || 'Belum ditugaskan'}</p>
                      <p className="text-[10px] text-slate-400">
                        {driver.emergency_name ? `Darurat: ${driver.emergency_name}` : 'Kontak darurat belum diisi'}
                      </p>
                    </td>
                    <td>
                      <StatusPill status={driver.status} />
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(driver)}
                          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-navy-50 hover:text-navy-800"
                          title="Ubah driver"
                          aria-label={`Ubah ${driver.name}`}
                        >
                          <Icon name="edit" className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(driver)}
                          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                          title="Hapus driver"
                          aria-label={`Hapus ${driver.name}`}
                        >
                          <Icon name="trash" className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Ubah data driver' : 'Tambah driver baru'}
        description="Data ini dipakai untuk validasi identitas pengemudi pada transaksi BBM dan klaim."
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nama lengkap" className="sm:col-span-2">
              <input
                className="input"
                value={form.name}
                onChange={(event) => setField('name', event.target.value)}
                placeholder="Nama sesuai KTP"
                required
              />
            </Field>
            <Field label="NIK">
              <input
                className="input font-mono"
                value={form.nik}
                onChange={(event) => setField('nik', event.target.value)}
                placeholder="16 digit NIK"
                inputMode="numeric"
              />
            </Field>
            <Field label="Nomor telepon">
              <input
                className="input font-mono"
                value={form.phone}
                onChange={(event) => setField('phone', event.target.value)}
                placeholder="08xxxxxxxxxx"
                inputMode="tel"
              />
            </Field>
            <Field label="Alamat" className="sm:col-span-2">
              <textarea
                className="input min-h-[70px] resize-y"
                value={form.address}
                onChange={(event) => setField('address', event.target.value)}
                placeholder="Alamat domisili"
              />
            </Field>
            <Field label="Jenis SIM">
              <select className="input" value={form.sim_type} onChange={(event) => setField('sim_type', event.target.value)}>
                <option value="SIM A">SIM A</option>
                <option value="SIM B1">SIM B1</option>
                <option value="SIM B1 Umum">SIM B1 Umum</option>
                <option value="SIM B2 Umum">SIM B2 Umum</option>
                <option value="SIM C">SIM C</option>
              </select>
            </Field>
            <Field label="Nomor SIM">
              <input
                className="input font-mono"
                value={form.sim_number}
                onChange={(event) => setField('sim_number', event.target.value)}
                placeholder="Nomor SIM"
              />
            </Field>
            <Field label="Masa berlaku SIM">
              <input
                type="date"
                className="input"
                value={form.sim_expiry}
                onChange={(event) => setField('sim_expiry', event.target.value)}
              />
            </Field>
            <Field label="Armada ditugaskan">
              <select
                className="input"
                value={form.assigned_vehicle}
                onChange={(event) => setField('assigned_vehicle', event.target.value)}
              >
                <option value="">Belum ditugaskan</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.plate_number}>
                    {vehicle.plate_number} — {vehicle.model}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Kontak darurat">
              <input
                className="input"
                value={form.emergency_name}
                onChange={(event) => setField('emergency_name', event.target.value)}
                placeholder="Nama kontak darurat"
              />
            </Field>
            <Field label="Hubungan">
              <input
                className="input"
                value={form.emergency_relation}
                onChange={(event) => setField('emergency_relation', event.target.value)}
                placeholder="Istri, orang tua, saudara…"
              />
            </Field>
            <Field label="Telepon darurat">
              <input
                className="input font-mono"
                value={form.emergency_phone}
                onChange={(event) => setField('emergency_phone', event.target.value)}
                placeholder="08xxxxxxxxxx"
                inputMode="tel"
              />
            </Field>
            <Field label="Tanggal bergabung">
              <input
                type="date"
                className="input"
                value={form.joined_at}
                onChange={(event) => setField('joined_at', event.target.value)}
              />
            </Field>
            <Field label="Status">
              <select className="input" value={form.status} onChange={(event) => setField('status', event.target.value)}>
                <option value="ACTIVE">Aktif</option>
                <option value="INACTIVE">Nonaktif</option>
              </select>
            </Field>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
            <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost">
              Batal
            </button>
            <button type="submit" disabled={saving || !form.name.trim()} className="btn btn-primary">
              {saving ? 'Menyimpan…' : editing ? 'Simpan perubahan' : 'Tambah driver'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDelete
        open={Boolean(deleteTarget)}
        title="Hapus driver?"
        description={
          deleteTarget
            ? `${deleteTarget.name} akan dihapus dari master driver. Riwayat transaksi yang sudah ada tetap tersimpan.`
            : ''
        }
        busy={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Vehicles                                                            */
/* ------------------------------------------------------------------ */

function VehiclesTab() {
  const { data, create, update, remove } = useFleet()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('ALL')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Vehicle | null>(null)
  const [form, setForm] = useState<Record<string, string>>(EMPTY_VEHICLE)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null)
  const [deleting, setDeleting] = useState(false)

  const vehicles = useMemo(() => data?.vehicles ?? [], [data])

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    return vehicles.filter((vehicle) => {
      const matchesStatus = status === 'ALL' || (vehicle.status || 'ACTIVE') === status
      const haystack = [vehicle.plate_number, vehicle.model, String(vehicle.year)].join(' ').toLowerCase()
      return matchesStatus && (!term || haystack.includes(term))
    })
  }, [vehicles, query, status])

  const openCreate = () => {
    setEditing(null)
    setForm({ ...EMPTY_VEHICLE })
    setOpen(true)
  }

  const openEdit = (vehicle: Vehicle) => {
    setEditing(vehicle)
    setForm({
      plate_number: vehicle.plate_number || '',
      model: vehicle.model || '',
      year: String(vehicle.year || new Date().getFullYear()),
      monthly_budget: formatNumberInput(vehicle.monthly_budget),
      monthly_service_budget: formatNumberInput(vehicle.monthly_service_budget),
      target_km_monthly: formatNumberInput(vehicle.target_km_monthly),
      baseline_km_per_liter: String(vehicle.baseline_km_per_liter || ''),
      last_km: formatNumberInput(vehicle.last_km),
      kir_expiry: vehicle.kir_expiry || '',
      stnk_expiry: vehicle.stnk_expiry || '',
      status: vehicle.status || 'ACTIVE',
    })
    setOpen(true)
  }

  const setField = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }))

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (saving) return
    if (!form.plate_number.trim() || !form.model.trim()) return
    setSaving(true)

    const payload = {
      plate_number: form.plate_number.trim().toUpperCase(),
      model: form.model.trim(),
      year: Number(form.year) || new Date().getFullYear(),
      monthly_budget: parseNumberInput(form.monthly_budget),
      monthly_service_budget: parseNumberInput(form.monthly_service_budget),
      target_km_monthly: parseNumberInput(form.target_km_monthly),
      baseline_km_per_liter: Number(String(form.baseline_km_per_liter).replace(',', '.')) || 0,
      last_km: parseNumberInput(form.last_km),
      kir_expiry: form.kir_expiry,
      stnk_expiry: form.stnk_expiry,
      status: form.status,
    }

    try {
      if (editing) await update('vehicles', editing.id, payload)
      else await create('vehicles', payload)
      setOpen(false)
    } catch {
      // Notifikasi kegagalan sudah ditampilkan oleh provider.
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget || deleting) return
    setDeleting(true)
    try {
      await remove('vehicles', deleteTarget.id)
      setDeleteTarget(null)
    } catch {
      // Notifikasi kegagalan sudah ditampilkan oleh provider.
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard label="Total armada" value={formatNumber(vehicles.length)} icon="truck" />
        <SummaryCard
          label="Armada aktif"
          value={formatNumber(vehicles.filter((vehicle) => (vehicle.status || 'ACTIVE') === 'ACTIVE').length)}
          icon="check"
        />
        <SummaryCard
          label="Legalitas ≤ 45 hari"
          value={formatNumber(
            vehicles.filter((vehicle) => {
              const kir = daysUntil(vehicle.kir_expiry)
              const stnk = daysUntil(vehicle.stnk_expiry)
              return (kir !== null && kir <= 45) || (stnk !== null && stnk <= 45)
            }).length
          )}
          icon="shield"
          tone="amber"
        />
      </div>

      <div className="card overflow-hidden">
        <div className="card-header flex-col gap-3 sm:flex-row sm:items-center">
          <div>
            <p className="card-title">Armada terdaftar</p>
            <p className="card-subtitle">Baseline KM/L menjadi acuan skor kualitas konsumsi BBM.</p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <div className="relative">
              <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari plat atau model…"
                className="input py-2 pl-9 sm:w-56"
              />
            </div>
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="input py-2 sm:w-36">
              <option value="ALL">Semua status</option>
              <option value="ACTIVE">Aktif</option>
              <option value="INACTIVE">Nonaktif</option>
            </select>
            <button type="button" onClick={openCreate} className="btn btn-gold">
              <Icon name="plus" className="h-3.5 w-3.5" />
              Tambah armada
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title="Tidak ada armada ditemukan"
            description="Tambahkan kendaraan agar driver dapat mengirim laporan pengisian BBM."
            action={
              <button type="button" onClick={openCreate} className="btn btn-primary">
                <Icon name="plus" className="h-3.5 w-3.5" />
                Tambah armada
              </button>
            }
          />
        ) : (
          <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((vehicle) => (
              <div key={vehicle.id} className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-navy-200">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-extrabold tracking-tight text-navy-950">{vehicle.plate_number}</span>
                      <StatusPill status={vehicle.status} />
                    </div>
                    <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-500">{vehicle.model}</p>
                    <p className="text-[10px] text-slate-400">Tahun {vehicle.year}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(vehicle)}
                      className="rounded-lg p-1.5 text-slate-400 transition hover:bg-navy-50 hover:text-navy-800"
                      title="Ubah armada"
                      aria-label={`Ubah ${vehicle.plate_number}`}
                    >
                      <Icon name="edit" className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(vehicle)}
                      className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                      title="Hapus armada"
                      aria-label={`Hapus ${vehicle.plate_number}`}
                    >
                      <Icon name="trash" className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-2.5">
                  <div>
                    <p className="stat-label">Odometer</p>
                    <p className="font-mono text-xs font-bold text-slate-800">{formatNumber(vehicle.last_km)} km</p>
                  </div>
                  <div>
                    <p className="stat-label">Baseline</p>
                    <p className="font-mono text-xs font-bold text-slate-800">{vehicle.baseline_km_per_liter} km/L</p>
                  </div>
                  <div>
                    <p className="stat-label">Anggaran BBM</p>
                    <p className="font-mono text-[11px] font-bold text-slate-800">{formatCurrency(vehicle.monthly_budget)}</p>
                  </div>
                  <div>
                    <p className="stat-label">Target KM</p>
                    <p className="font-mono text-xs font-bold text-slate-800">{formatNumber(vehicle.target_km_monthly)} km</p>
                  </div>
                </div>

                <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-2.5 text-[10px]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-slate-500">KIR · {formatDate(vehicle.kir_expiry)}</span>
                    <LegalPill date={vehicle.kir_expiry} />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-slate-500">STNK · {formatDate(vehicle.stnk_expiry)}</span>
                    <LegalPill date={vehicle.stnk_expiry} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Ubah data armada' : 'Tambah armada baru'}
        description="Baseline KM/L dan anggaran bulanan dipakai untuk menghitung kualitas serta efisiensi biaya."
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nomor plat">
              <input
                className="input font-mono uppercase"
                value={form.plate_number}
                onChange={(event) => setField('plate_number', event.target.value.toUpperCase())}
                placeholder="B 1234 ABC"
                required
              />
            </Field>
            <Field label="Model kendaraan">
              <input
                className="input"
                value={form.model}
                onChange={(event) => setField('model', event.target.value)}
                placeholder="Toyota Avanza 1.5 G"
                required
              />
            </Field>
            <Field label="Tahun">
              <input
                className="input font-mono"
                value={form.year}
                onChange={(event) => setField('year', event.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="2024"
                inputMode="numeric"
              />
            </Field>
            <Field label="Odometer terakhir (km)">
              <input
                className="input font-mono"
                value={form.last_km}
                onChange={(event) => setField('last_km', formatNumberInput(event.target.value))}
                placeholder="45.000"
                inputMode="numeric"
              />
            </Field>
            <Field label="Baseline konsumsi (km/L)" hint="Acuan pabrikan atau hasil uji operasional.">
              <input
                className="input font-mono"
                value={form.baseline_km_per_liter}
                onChange={(event) => setField('baseline_km_per_liter', event.target.value.replace(/[^0-9.,]/g, ''))}
                placeholder="13"
                inputMode="decimal"
              />
            </Field>
            <Field label="Target KM per bulan">
              <input
                className="input font-mono"
                value={form.target_km_monthly}
                onChange={(event) => setField('target_km_monthly', formatNumberInput(event.target.value))}
                placeholder="1.500"
                inputMode="numeric"
              />
            </Field>
            <Field label="Anggaran BBM per bulan">
              <input
                className="input font-mono"
                value={form.monthly_budget}
                onChange={(event) => setField('monthly_budget', formatNumberInput(event.target.value))}
                placeholder="1.500.000"
                inputMode="numeric"
              />
            </Field>
            <Field label="Anggaran servis per bulan">
              <input
                className="input font-mono"
                value={form.monthly_service_budget}
                onChange={(event) => setField('monthly_service_budget', formatNumberInput(event.target.value))}
                placeholder="500.000"
                inputMode="numeric"
              />
            </Field>
            <Field label="Masa berlaku KIR">
              <input
                type="date"
                className="input"
                value={form.kir_expiry}
                onChange={(event) => setField('kir_expiry', event.target.value)}
              />
            </Field>
            <Field label="Masa berlaku STNK">
              <input
                type="date"
                className="input"
                value={form.stnk_expiry}
                onChange={(event) => setField('stnk_expiry', event.target.value)}
              />
            </Field>
            <Field label="Status armada">
              <select className="input" value={form.status} onChange={(event) => setField('status', event.target.value)}>
                <option value="ACTIVE">Aktif</option>
                <option value="INACTIVE">Nonaktif</option>
              </select>
            </Field>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
            <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost">
              Batal
            </button>
            <button
              type="submit"
              disabled={saving || !form.plate_number.trim() || !form.model.trim()}
              className="btn btn-primary"
            >
              {saving ? 'Menyimpan…' : editing ? 'Simpan perubahan' : 'Tambah armada'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDelete
        open={Boolean(deleteTarget)}
        title="Hapus armada?"
        description={
          deleteTarget
            ? `${deleteTarget.plate_number} — ${deleteTarget.model} akan dihapus dari master armada. Riwayat transaksi tetap tersimpan.`
            : ''
        }
        busy={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Fuel prices                                                         */
/* ------------------------------------------------------------------ */

function PricesTab() {
  const { data, create, update, remove } = useFleet()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<FuelPrice | null>(null)
  const [form, setForm] = useState<Record<string, string>>(EMPTY_PRICE)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<FuelPrice | null>(null)
  const [deleting, setDeleting] = useState(false)

  const prices = data?.fuelPrices || []

  const openCreate = () => {
    setEditing(null)
    setForm({ ...EMPTY_PRICE })
    setOpen(true)
  }

  const openEdit = (price: FuelPrice) => {
    setEditing(price)
    setForm({ name: price.name, category: price.category || 'Non-Subsidi', price: formatNumberInput(price.price) })
    setOpen(true)
  }

  const setField = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }))

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (saving) return
    if (!form.name.trim()) return
    setSaving(true)

    const payload = {
      name: form.name.trim(),
      category: form.category,
      price: parseNumberInput(form.price),
    }

    try {
      if (editing) await update('fuelPrices', editing.id, payload)
      else await create('fuelPrices', payload)
      setOpen(false)
    } catch {
      // Notifikasi kegagalan sudah ditampilkan oleh provider.
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget || deleting) return
    setDeleting(true)
    try {
      await remove('fuelPrices', deleteTarget.id)
      setDeleteTarget(null)
    } catch {
      // Notifikasi kegagalan sudah ditampilkan oleh provider.
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard label="Jenis BBM" value={formatNumber(prices.length)} icon="fuel" />
        <SummaryCard
          label="Harga rata-rata"
          value={formatCurrency(prices.length ? Math.round(prices.reduce((total, price) => total + Number(price.price || 0), 0) / prices.length) : 0)}
          icon="chart"
        />
        <SummaryCard
          label="Harga tertinggi"
          value={formatCurrency(prices.reduce((max, price) => Math.max(max, Number(price.price || 0)), 0))}
          icon="spark"
          tone="amber"
        />
      </div>

      <div className="card overflow-hidden">
        <div className="card-header">
          <div>
            <p className="card-title">Katalog tarif BBM</p>
            <p className="card-subtitle">Harga di sini menjadi nilai default saat driver mengirim laporan pengisian.</p>
          </div>
          <button type="button" onClick={openCreate} className="btn btn-gold">
            <Icon name="plus" className="h-3.5 w-3.5" />
            Tambah tarif
          </button>
        </div>

        {prices.length === 0 ? (
          <EmptyState
            title="Belum ada tarif BBM"
            description="Tambahkan minimal satu jenis bahan bakar agar laporan pengisian dapat dihitung."
            action={
              <button type="button" onClick={openCreate} className="btn btn-primary">
                <Icon name="plus" className="h-3.5 w-3.5" />
                Tambah tarif
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Jenis BBM</th>
                  <th>Kategori</th>
                  <th>Harga per liter</th>
                  <th className="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {prices.map((price) => (
                  <tr key={price.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-50 text-gold-700">
                          <Icon name="fuel" className="h-4 w-4" />
                        </span>
                        <span className="text-xs font-bold text-slate-800">{price.name}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${price.category === 'Subsidi' ? 'badge-green' : 'badge-blue'}`}>
                        {price.category || 'Non-Subsidi'}
                      </span>
                    </td>
                    <td className="font-mono text-xs font-bold text-slate-800">{formatCurrency(price.price)}</td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(price)}
                          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-navy-50 hover:text-navy-800"
                          title="Ubah tarif"
                          aria-label={`Ubah ${price.name}`}
                        >
                          <Icon name="edit" className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(price)}
                          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                          title="Hapus tarif"
                          aria-label={`Hapus ${price.name}`}
                        >
                          <Icon name="trash" className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Ubah tarif BBM' : 'Tambah tarif BBM'}
        description="Pastikan harga sesuai kebijakan terbaru agar perhitungan biaya transaksi akurat."
        size="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <Field label="Nama jenis BBM">
            <input
              className="input"
              value={form.name}
              onChange={(event) => setField('name', event.target.value)}
              placeholder="Pertalite"
              required
            />
          </Field>
          <Field label="Kategori">
            <select className="input" value={form.category} onChange={(event) => setField('category', event.target.value)}>
              <option value="Subsidi">Subsidi</option>
              <option value="Non-Subsidi">Non-Subsidi</option>
            </select>
          </Field>
          <Field label="Harga per liter">
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">
                Rp
              </span>
              <input
                className="input pl-9 font-mono"
                value={form.price}
                onChange={(event) => setField('price', formatNumberInput(event.target.value))}
                placeholder="10.000"
                inputMode="numeric"
                required
              />
            </div>
          </Field>

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
            <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost">
              Batal
            </button>
            <button type="submit" disabled={saving || !form.name.trim()} className="btn btn-primary">
              {saving ? 'Menyimpan…' : editing ? 'Simpan perubahan' : 'Tambah tarif'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDelete
        open={Boolean(deleteTarget)}
        title="Hapus tarif BBM?"
        description={deleteTarget ? `${deleteTarget.name} akan dihapus dari katalog. Transaksi lama tidak berubah.` : ''}
        busy={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* System                                                              */
/* ------------------------------------------------------------------ */

function UsersTab() {
  const { data, refresh, notify } = useFleet()
  const [limits, setLimits] = useState<{ vehicles: number; drivers: number; users: number } | null>(null)
  const [plan, setPlan] = useState('')
  const [currentUsername, setCurrentUsername] = useState('')
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<TenantUser | null>(null)
  const [form, setForm] = useState({
    name: '',
    username: '',
    password: '',
    role: 'admin' as TenantUser['role'],
    driver_name: '',
    status: 'ACTIVE' as TenantUser['status'],
  })
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<TenantUser | null>(null)
  const [deleting, setDeleting] = useState(false)

  const users = useMemo(() => data?.users ?? [], [data])
  const drivers = useMemo(() => data?.drivers ?? [], [data])

  useEffect(() => {
    let active = true
    Promise.all([
      fetch('/api/users', { credentials: 'same-origin', cache: 'no-store' })
        .then((response) => response.json())
        .catch(() => null),
      fetch('/api/auth/session', { credentials: 'same-origin', cache: 'no-store' })
        .then((response) => response.json())
        .catch(() => null),
    ]).then(([usersPayload, sessionPayload]) => {
      if (!active) return
      const payload = usersPayload as { limits?: typeof limits; plan?: string } | null
      if (payload?.limits) setLimits(payload.limits)
      if (payload?.plan) setPlan(payload.plan)
      const session = sessionPayload as { user?: { username?: string } } | null
      setCurrentUsername(session?.user?.username || '')
    })
    return () => {
      active = false
    }
  }, [])

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    return users.filter((user) => {
      const matchesRole = roleFilter === 'ALL' || user.role === roleFilter
      const haystack = [user.name, user.username, user.driver_name].join(' ').toLowerCase()
      return matchesRole && (!term || haystack.includes(term))
    })
  }, [users, query, roleFilter])

  const userLimit = limits?.users ?? 0
  const atLimit = userLimit > 0 && users.length >= userLimit

  const openCreate = () => {
    setEditing(null)
    setForm({
      name: '',
      username: '',
      password: '',
      role: 'admin',
      driver_name: '',
      status: 'ACTIVE',
    })
    setOpen(true)
  }

  const openEdit = (user: TenantUser) => {
    setEditing(user)
    setForm({
      name: user.name || '',
      username: user.username,
      password: '',
      role: user.role,
      driver_name: user.driver_name || '',
      status: user.status || 'ACTIVE',
    })
    setOpen(true)
  }

  const setField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((current) => ({ ...current, [key]: value }))

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (saving) return
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        name: form.name.trim(),
        role: form.role,
        driver_name: form.role === 'driver' ? form.driver_name.trim() : '',
        status: form.status,
      }
      if (form.password) payload.password = form.password

      const url = editing ? '/api/users' : '/api/users'
      const body = editing ? { ...payload, id: editing.id } : { ...payload, username: form.username.trim().toLowerCase() }
      const response = await fetch(url, {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'same-origin',
      })
      const result = (await response.json().catch(() => null)) as { ok?: boolean; message?: string } | null
      if (!response.ok || !result || result.ok === false) {
        throw new Error(result?.message || 'Gagal menyimpan pengguna.')
      }
      notify(editing ? 'Akun pengguna berhasil diperbarui.' : 'Akun pengguna berhasil dibuat.')
      await refresh()
      setOpen(false)
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Gagal menyimpan pengguna.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget || deleting) return
    setDeleting(true)
    try {
      const response = await fetch(`/api/users?id=${encodeURIComponent(deleteTarget.id)}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      })
      const result = (await response.json().catch(() => null)) as { ok?: boolean; message?: string } | null
      if (!response.ok || !result || result.ok === false) {
        throw new Error(result?.message || 'Gagal menghapus pengguna.')
      }
      notify('Akun pengguna berhasil dihapus.', 'info')
      await refresh()
      setDeleteTarget(null)
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Gagal menghapus pengguna.', 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard label="Total akun" value={formatNumber(users.length)} icon="users" />
        <SummaryCard
          label="Admin aktif"
          value={formatNumber(users.filter((user) => user.role === 'admin' && user.status !== 'INACTIVE').length)}
          icon="lock"
        />
        <SummaryCard
          label="Batas paket"
          value={userLimit > 0 ? `${users.length} / ${userLimit}` : '—'}
          icon="package"
          tone={atLimit ? 'amber' : 'navy'}
        />
      </div>

      <div className="card overflow-hidden">
        <div className="card-header flex-col gap-3 sm:flex-row sm:items-center">
          <div>
            <p className="card-title">Akun pengguna perusahaan</p>
            <p className="card-subtitle">
              {filtered.length} dari {users.length} akun ditampilkan
              {plan ? ` · paket ${plan.toUpperCase()}` : ''}.
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <div className="relative">
              <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari nama atau username…"
                className="input py-2 pl-9 sm:w-56"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
              className="input py-2 sm:w-36"
            >
              <option value="ALL">Semua peran</option>
              <option value="admin">Admin</option>
              <option value="driver">Driver</option>
            </select>
            <button type="button" onClick={openCreate} disabled={atLimit} className="btn btn-gold">
              <Icon name="userPlus" className="h-3.5 w-3.5" />
              Tambah akun
            </button>
          </div>
        </div>

        {atLimit && (
          <div className="flex items-start gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-[11px] font-semibold text-amber-800">
            <Icon name="alert" className="mt-px h-3.5 w-3.5 shrink-0" />
            Batas akun paket {plan ? plan.toUpperCase() : ''} tercapai ({userLimit} akun). Tingkatkan paket untuk
            menambah pengguna.
          </div>
        )}

        {filtered.length === 0 ? (
          <EmptyState
            title="Tidak ada akun ditemukan"
            description="Ubah kata kunci atau tambahkan akun baru untuk tim operasional Anda."
            action={
              !atLimit ? (
                <button type="button" onClick={openCreate} className="btn btn-primary">
                  <Icon name="userPlus" className="h-3.5 w-3.5" />
                  Tambah akun
                </button>
              ) : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base min-w-[760px]">
              <thead>
                <tr>
                  <th>Pengguna</th>
                  <th>Peran</th>
                  <th>Driver terkait</th>
                  <th>Status</th>
                  <th>Login terakhir</th>
                  <th className="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => {
                  const self = user.username.toLowerCase() === currentUsername.toLowerCase()
                  return (
                    <tr key={user.id}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-navy-900 text-[10px] font-extrabold text-gold-300">
                            {initials(user.name)}
                          </span>
                          <div className="min-w-0">
                            <p className="flex items-center gap-1.5 truncate text-xs font-bold text-slate-800">
                              {user.name}
                              {self && <span className="badge badge-slate">Anda</span>}
                            </p>
                            <p className="truncate font-mono text-[10px] text-slate-400">{user.username}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${user.role === 'admin' ? 'badge-blue' : 'badge-slate'}`}>
                          {user.role === 'admin' ? 'Admin' : 'Driver'}
                        </span>
                      </td>
                      <td className="text-xs font-semibold text-slate-600">{user.driver_name || '-'}</td>
                      <td>
                        <StatusPill status={user.status} />
                      </td>
                      <td className="whitespace-nowrap text-[11px] text-slate-500">
                        {user.last_login_at ? formatDate(user.last_login_at.slice(0, 10)) : 'Belum pernah'}
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(user)}
                            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-navy-50 hover:text-navy-800"
                            title="Ubah akun"
                            aria-label={`Ubah ${user.name}`}
                          >
                            <Icon name="edit" className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(user)}
                            disabled={self}
                            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40"
                            title={self ? 'Tidak dapat menghapus akun sendiri' : 'Hapus akun'}
                            aria-label={`Hapus ${user.name}`}
                          >
                            <Icon name="trash" className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Ubah akun pengguna' : 'Tambah akun pengguna'}
        description="Akun ini dapat dipakai untuk masuk ke perusahaan ini menggunakan kode perusahaan Anda."
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nama lengkap" className="sm:col-span-2">
              <input
                className="input"
                value={form.name}
                onChange={(event) => setField('name', event.target.value)}
                placeholder="Nama pengguna"
                required
              />
            </Field>
            <Field label="Username" hint={editing ? 'Username tidak dapat diubah.' : 'Huruf kecil, angka, titik, atau garis bawah.'}>
              <input
                className="input font-mono lowercase"
                value={form.username}
                onChange={(event) => setField('username', event.target.value.toLowerCase())}
                placeholder="nama.pengguna"
                disabled={Boolean(editing)}
                required
              />
            </Field>
            <Field
              label={editing ? 'Password baru' : 'Password'}
              hint={editing ? 'Kosongkan bila tidak ingin mengubah password.' : 'Minimal 8 karakter.'}
            >
              <input
                type="password"
                className="input font-mono"
                value={form.password}
                onChange={(event) => setField('password', event.target.value)}
                placeholder={editing ? '••••••••' : 'Minimal 8 karakter'}
                minLength={editing ? undefined : 8}
                autoComplete="new-password"
                required={!editing}
              />
            </Field>
            <Field label="Peran">
              <select
                className="input"
                value={form.role}
                onChange={(event) => setField('role', event.target.value as TenantUser['role'])}
              >
                <option value="admin">Admin</option>
                <option value="driver">Driver</option>
              </select>
            </Field>
            <Field label="Status">
              <select
                className="input"
                value={form.status}
                onChange={(event) => setField('status', event.target.value as TenantUser['status'])}
              >
                <option value="ACTIVE">Aktif</option>
                <option value="INACTIVE">Nonaktif</option>
              </select>
            </Field>
            {form.role === 'driver' && (
              <Field
                label="Nama driver terkait"
                className="sm:col-span-2"
                hint="Harus sama dengan nama pada master driver agar data transaksi terhubung."
              >
                <input
                  className="input"
                  value={form.driver_name}
                  onChange={(event) => setField('driver_name', event.target.value)}
                  placeholder="Nama driver"
                  list="user-driver-names"
                  required
                />
                <datalist id="user-driver-names">
                  {drivers.map((driver) => (
                    <option key={driver.id} value={driver.name} />
                  ))}
                </datalist>
              </Field>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
            <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost">
              Batal
            </button>
            <button type="submit" disabled={saving} className="btn btn-primary">
              {saving ? 'Menyimpan…' : editing ? 'Simpan perubahan' : 'Buat akun'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDelete
        open={Boolean(deleteTarget)}
        title={deleteTarget ? `Hapus akun ${deleteTarget.name}?` : 'Hapus akun'}
        description={
          deleteTarget
            ? `Akun ${deleteTarget.username} tidak akan bisa login lagi. Riwayat transaksi yang pernah dibuat tetap tersimpan.`
            : ''
        }
        busy={deleting}
        onCancel={() => (deleting ? undefined : setDeleteTarget(null))}
        onConfirm={() => void handleDelete()}
      />
    </div>
  )
}

function SystemTab() {
  const { data, updateSettings, resetDemo } = useFleet()

  if (!data) {
    return (
      <div className="space-y-4">
        <div className="card h-72 animate-pulse bg-white" />
        <div className="card h-64 animate-pulse bg-white" />
      </div>
    )
  }

  return (
    <SystemPanel
      key={JSON.stringify(data.settings)}
      settings={data.settings}
      database={data}
      auditTrail={data.auditTrail}
      updateSettings={updateSettings}
      resetDemo={resetDemo}
    />
  )
}

function SystemPanel({
  settings,
  database,
  auditTrail,
  updateSettings,
  resetDemo,
}: {
  settings: AppSettings
  database: FleetDatabase
  auditTrail: AuditEntry[]
  updateSettings: (patch: Partial<AppSettings>) => Promise<void>
  resetDemo: () => Promise<void>
}) {
  const [form, setForm] = useState<AppSettings>(settings)
  const [saving, setSaving] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [auditQuery, setAuditQuery] = useState('')
  const [auditCollection, setAuditCollection] = useState('ALL')

  const filteredAudit = useMemo(() => {
    const term = auditQuery.trim().toLowerCase()
    return auditTrail.filter((entry) => {
      const matchesCollection = auditCollection === 'ALL' || entry.collection === auditCollection
      const haystack = [entry.actor, entry.action, entry.summary, entry.collection, entry.itemId].join(' ').toLowerCase()
      return matchesCollection && (!term || haystack.includes(term))
    })
  }, [auditTrail, auditQuery, auditCollection])

  const setField = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) =>
    setForm((current) => ({ ...current, [key]: value }))

  const handleSave = async (event: FormEvent) => {
    event.preventDefault()
    if (saving) return
    setSaving(true)
    try {
      await updateSettings(form)
    } catch {
      // Notifikasi kegagalan sudah ditampilkan oleh provider.
    } finally {
      setSaving(false)
    }
  }

  const handleBackup = () => {
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
    downloadFile(`fleetops-backup-${stamp}.json`, JSON.stringify(database, null, 2), 'application/json')
  }

  const handleReset = async () => {
    if (resetting) return
    setResetting(true)
    try {
      await resetDemo()
      setResetOpen(false)
    } catch {
      // Notifikasi kegagalan sudah ditampilkan oleh provider.
    } finally {
      setResetting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <form onSubmit={handleSave} className="card">
          <div className="card-header">
            <div>
              <p className="card-title">Identitas &amp; ambang kualitas</p>
              <p className="card-subtitle">Pengaturan ini dipakai di seluruh dashboard dan laporan.</p>
            </div>
            <span className="badge badge-blue">Admin</span>
          </div>
          <div className="grid gap-3 p-5 sm:grid-cols-2">
            <Field label="Nama perusahaan" className="sm:col-span-2">
              <input
                className="input"
                value={form.company_name}
                onChange={(event) => setField('company_name', event.target.value)}
                placeholder="PT Nusantara Logistik Prima"
                required
              />
            </Field>
            <Field label="Singkatan perusahaan">
              <input
                className="input uppercase"
                value={form.company_short}
                onChange={(event) => setField('company_short', event.target.value.toUpperCase())}
                placeholder="NLP"
                maxLength={24}
              />
            </Field>
            <Field label="Mata uang">
              <input
                className="input uppercase"
                value={form.currency}
                onChange={(event) => setField('currency', event.target.value.toUpperCase())}
                placeholder="IDR"
                maxLength={8}
              />
            </Field>
            <Field label="Target skor kualitas" hint="Ambang hijau pada gauge dan laporan kualitas.">
              <input
                type="number"
                min={0}
                max={100}
                className="input font-mono"
                value={form.quality_target}
                onChange={(event) => setField('quality_target', Number(event.target.value))}
              />
            </Field>
            <Field label="Ambang anomali BBM" hint="Transaksi di bawah nilai ini masuk pusat perhatian.">
              <input
                type="number"
                min={0}
                max={100}
                className="input font-mono"
                value={form.fuel_anomaly_threshold}
                onChange={(event) => setField('fuel_anomaly_threshold', Number(event.target.value))}
              />
            </Field>
            <Field label="Durasi sesi (jam)" hint="Berlaku untuk cookie sesi login.">
              <input
                type="number"
                min={1}
                max={72}
                className="input font-mono"
                value={form.session_hours}
                onChange={(event) => setField('session_hours', Number(event.target.value))}
              />
            </Field>
            <div className="flex items-end">
              <button type="submit" disabled={saving || !form.company_name.trim()} className="btn btn-primary w-full">
                <Icon name="check" className="h-3.5 w-3.5" />
                {saving ? 'Menyimpan…' : 'Simpan pengaturan'}
              </button>
            </div>
          </div>
        </form>

        <div className="space-y-4">
          <div className="card">
            <div className="card-header">
              <div>
                <p className="card-title">Keamanan &amp; sesi</p>
                <p className="card-subtitle">Kontrol akses berbasis peran.</p>
              </div>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <Icon name="shield" className="h-4 w-4" />
              </span>
            </div>
            <ul className="space-y-2.5 p-5 text-[11px] text-slate-600">
              <SecurityRow label="Cookie sesi" value="HttpOnly · SameSite Lax" />
              <SecurityRow label="Penandatanganan" value="HMAC-SHA256" />
              <SecurityRow label="Hash password" value="scrypt (64 byte)" />
              <SecurityRow label="Pembatasan login" value="8 percobaan / 10 menit" />
              <SecurityRow label="Proteksi CSRF" value="Same-origin check" />
            </ul>
            <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-3 text-[10px] leading-relaxed text-slate-500">
              Kredensial produksi diatur melalui variabel lingkungan <code className="font-mono">ADMIN_PASSWORD_HASH</code> dan{' '}
              <code className="font-mono">SESSION_SECRET</code>. Jangan gunakan nilai contoh di server produksi.
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div>
                <p className="card-title">Cadangan &amp; pemulihan</p>
                <p className="card-subtitle">Unduh salinan database JSON lengkap.</p>
              </div>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-50 text-navy-700">
                <Icon name="database" className="h-4 w-4" />
              </span>
            </div>
            <div className="space-y-2 p-5">
              <button type="button" onClick={handleBackup} className="btn btn-ghost w-full justify-start">
                <Icon name="download" className="h-3.5 w-3.5" />
                Unduh cadangan JSON
              </button>
              <button type="button" onClick={() => setResetOpen(true)} className="btn btn-ghost w-full justify-start text-rose-600 hover:border-rose-200 hover:bg-rose-50">
                <Icon name="refresh" className="h-3.5 w-3.5" />
                Kembalikan data contoh
              </button>
              <p className="pt-1 text-[10px] leading-relaxed text-slate-400">
                Reset akan mengganti seluruh data operasional dengan data contoh awal. Lakukan backup terlebih dahulu.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="card-header flex-col gap-3 sm:flex-row sm:items-center">
          <div>
            <p className="card-title">Audit trail</p>
            <p className="card-subtitle">Jejak perubahan data terbaru, maksimal 500 entri.</p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <div className="relative">
              <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                value={auditQuery}
                onChange={(event) => setAuditQuery(event.target.value)}
                placeholder="Cari aktor atau ringkasan…"
                className="input py-2 pl-9 sm:w-56"
              />
            </div>
            <select
              value={auditCollection}
              onChange={(event) => setAuditCollection(event.target.value)}
              className="input py-2 sm:w-44"
            >
              <option value="ALL">Semua modul</option>
              {Object.entries(COLLECTION_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredAudit.length === 0 ? (
          <EmptyState title="Belum ada aktivitas" description="Perubahan data oleh admin dan driver akan tercatat otomatis di sini." />
        ) : (
          <div className="max-h-[460px] overflow-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Waktu</th>
                  <th>Aktor</th>
                  <th>Modul</th>
                  <th>Aksi</th>
                  <th>Ringkasan</th>
                </tr>
              </thead>
              <tbody>
                {filteredAudit.map((entry) => (
                  <tr key={entry.id}>
                    <td className="whitespace-nowrap font-mono text-[10px] text-slate-500">
                      {new Date(entry.at).toLocaleString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td>
                      <p className="text-[11px] font-bold text-slate-800">{entry.actor}</p>
                      <span className={`badge ${entry.role === 'admin' ? 'badge-blue' : 'badge-slate'}`}>{entry.role}</span>
                    </td>
                    <td className="text-[11px] font-semibold text-slate-600">
                      {COLLECTION_LABELS[entry.collection] || entry.collection}
                    </td>
                    <td>
                      <span className="badge badge-slate font-mono">{entry.action}</span>
                    </td>
                    <td className="max-w-[420px] text-[11px] leading-relaxed text-slate-600">{entry.summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Kembalikan data contoh?"
        description="Tindakan ini tidak dapat dibatalkan setelah dijalankan."
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-[11px] leading-relaxed text-rose-700">
            <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Seluruh transaksi BBM, klaim, servis, inspeksi, dan audit trail akan diganti dengan data contoh awal.
              Unduh cadangan JSON terlebih dahulu bila data ini masih dibutuhkan.
            </p>
          </div>
          <div className="flex items-center justify-end gap-2">
            <button type="button" onClick={() => setResetOpen(false)} className="btn btn-ghost">
              Batal
            </button>
            <button type="button" onClick={handleReset} disabled={resetting} className="btn btn-danger">
              {resetting ? 'Memproses…' : 'Ya, kembalikan data'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function SecurityRow({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex items-center justify-between gap-3">
      <span className="font-semibold text-slate-500">{label}</span>
      <span className="text-right font-mono text-[10px] font-bold text-slate-700">{value}</span>
    </li>
  )
}

function SummaryCard({
  label,
  value,
  icon,
  tone = 'navy',
}: {
  label: string
  value: string
  icon: IconName
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

function ConfirmDelete({
  open,
  title,
  description,
  busy,
  onCancel,
  onConfirm,
}: {
  open: boolean
  title: string
  description: string
  busy: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <Modal open={open} onClose={onCancel} title={title} size="sm">
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-[11px] leading-relaxed text-rose-700">
          <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{description}</p>
        </div>
        <div className="flex items-center justify-end gap-2">
          <button type="button" onClick={onCancel} className="btn btn-ghost">
            Batal
          </button>
          <button type="button" onClick={onConfirm} disabled={busy} className="btn btn-danger">
            {busy ? 'Menghapus…' : 'Hapus'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
