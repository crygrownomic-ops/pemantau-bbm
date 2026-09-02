'use client'

import { useState, useEffect } from 'react'

const formatNumberDots = (val: number | string) => {
  if (!val && val !== 0) return ''
  const numStr = String(val).replace(/\D/g, '')
  if (!numStr) return ''
  return numStr.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

const parseDotsToNum = (val: string) => {
  return Number(String(val).replace(/\./g, '')) || 0
}

const DEFAULT_ADVANCES = [
  { id: 'ADV-1', driver_name: 'Ahmad Supardi', plate_number: 'B 1234 ABC', amount: 500000, date: '2026-08-30', notes: 'Uang jalan luar kota Bandung' },
  { id: 'ADV-2', driver_name: 'Budi Santoso', plate_number: 'B 5678 XYZ', amount: 350000, date: '2026-08-31', notes: 'Uang jalan dalam kota Tangerang' },
]

export function ReimbursementTab({
  drivers = [],
  vehicles = [],
  logs = [],
}: {
  drivers: any[]
  vehicles: any[]
  logs: any[]
}) {
  const [advances, setAdvances] = useState<any[]>(DEFAULT_ADVANCES)
  const [claims, setClaims] = useState<any[]>([])
  const [showAdvanceModal, setShowAdvanceModal] = useState(false)

  const [formDriver, setFormDriver] = useState(drivers[0]?.name || 'Ahmad Supardi')
  const [formPlate, setFormPlate] = useState(vehicles[0]?.plate_number || 'B 1234 ABC')
  const [formAmountInput, setFormAmountInput] = useState('500.000')
  const [formNotes, setFormNotes] = useState('')

  const loadData = () => {
    try {
      const storedAdv = localStorage.getItem('cash_advances')
      const storedClm = localStorage.getItem('reimbursement_claims')
      if (storedAdv) setAdvances(JSON.parse(storedAdv))
      if (storedClm) setClaims(JSON.parse(storedClm))
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleAddAdvance = (e: React.FormEvent) => {
    e.preventDefault()
    const amount = parseDotsToNum(formAmountInput)

    const newAdvance = {
      id: `ADV-${Date.now()}`,
      driver_name: formDriver,
      plate_number: formPlate,
      amount,
      date: new Date().toISOString().split('T')[0],
      notes: formNotes,
    }

    const updated = [newAdvance, ...advances]
    setAdvances(updated)
    localStorage.setItem('cash_advances', JSON.stringify(updated))
    setShowAdvanceModal(false)
    setFormNotes('')
  }

  const handleUpdateClaimStatus = (id: string, newStatus: string) => {
    const updated = claims.map((c) => (c.id === id ? { ...c, status: newStatus } : c))
    setClaims(updated)
    localStorage.setItem('reimbursement_claims', JSON.stringify(updated))
  }

  // Agregasi Finansial
  const totalAdvances = advances.reduce((acc, a) => acc + (Number(a.amount) || 0), 0)
  const approvedClaims = claims.filter((c) => c.status === 'APPROVED')
  const totalClaimsCost = approvedClaims.reduce((acc, c) => acc + (Number(c.amount) || 0), 0)
  const totalFuelCost = logs.reduce((acc, l) => acc + (Number(l.total_cost) || 0), 0)

  // Rekonsiliasi Kasbon vs Total Operasional Terpakai
  const totalSpentInTrip = totalFuelCost + totalClaimsCost
  const remainingCashBalance = totalAdvances - totalSpentInTrip

  return (
    <div className="space-y-6 font-sans">
      {/* HEADER BAR */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-sm font-extrabold text-slate-900 tracking-wider uppercase flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
            Modul Uang Jalan & Reimbursement Operasional
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pencatatan kasbon, verifikasi klaim Tol/Parkir supir, dan rekonsiliasi sisa kas jalan
          </p>
        </div>

        <button
          onClick={() => setShowAdvanceModal(true)}
          className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition flex items-center gap-1.5"
        >
          + Berikan Kasbon / Uang Jalan
        </button>
      </div>

      {/* 4 KARTU REKONSILIASI KAS JALAN */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Total Kasbon Dikeluarkan</span>
          <strong className="text-lg font-mono font-extrabold text-slate-900 block">
            Rp {totalAdvances.toLocaleString('id-ID')}
          </strong>
          <span className="text-[10px] text-slate-500">{advances.length} Penyerahan Uang Jalan</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Klaim Tol / Parkir (Approved)</span>
          <strong className="text-lg font-mono font-extrabold text-indigo-900 block">
            Rp {totalClaimsCost.toLocaleString('id-ID')}
          </strong>
          <span className="text-[10px] text-indigo-700 font-bold">{approvedClaims.length} Struk Disetujui</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Total BBM Terpakai</span>
          <strong className="text-lg font-mono font-extrabold text-amber-700 block">
            Rp {totalFuelCost.toLocaleString('id-ID')}
          </strong>
          <span className="text-[10px] text-slate-500">Biaya Bensin di Jalan</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Sisa Kas Jalan / Selisih</span>
          <strong className={`text-lg font-mono font-extrabold block ${remainingCashBalance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            Rp {remainingCashBalance.toLocaleString('id-ID')}
          </strong>
          <span className="text-[10px] text-slate-500">
            {remainingCashBalance >= 0 ? 'Sisa Kas di Supir' : 'Supir Kurang Bayar (Nalangi)'}
          </span>
        </div>
      </div>

      {/* TABEL VERIFIKASI KLAIM REIMBURSEMENT DRIVER */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Daftar Pengajuan Klaim Reimbursement Supir
          </h3>
          <span className="text-[10px] font-bold bg-indigo-100 text-indigo-900 px-2.5 py-1 rounded-full">
            {claims.filter((c) => c.status === 'PENDING').length} Butuh Persetujuan
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-900 text-white font-bold">
              <tr>
                <th className="p-3.5">Tanggal & Supir</th>
                <th className="p-3.5">Armada</th>
                <th className="p-3.5">Kategori</th>
                <th className="p-3.5">Catatan / Keterangan</th>
                <th className="p-3.5 text-right">Nominal Klaim</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-center">Aksi Verifikasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {claims.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-400 italic">
                    Belum ada pengajuan reimbursement dari supir.
                  </td>
                </tr>
              ) : (
                claims.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5">
                      <strong className="text-slate-900 block font-bold">{c.driver_name}</strong>
                      <span className="text-[10px] text-slate-400 font-mono">{c.date} ({c.time || '10:00'})</span>
                    </td>
                    <td className="p-3.5 font-mono font-bold text-slate-800">{c.plate_number}</td>
                    <td className="p-3.5 font-bold text-indigo-900">{c.category}</td>
                    <td className="p-3.5 text-slate-600">{c.notes || '-'}</td>
                    <td className="p-3.5 text-right font-mono font-extrabold text-slate-900">
                      Rp {(Number(c.amount) || 0).toLocaleString('id-ID')}
                    </td>
                    <td className="p-3.5 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          c.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : c.status === 'REJECTED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800 animate-pulse'
                        }`}
                      >
                        {c.status === 'APPROVED' ? '✅ Disetujui' : c.status === 'REJECTED' ? '❌ Ditolak' : '⏳ Menunggu'}
                      </span>
                    </td>
                    <td className="p-3.5 text-center space-x-1">
                      {c.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleUpdateClaimStatus(c.id, 'APPROVED')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2 py-1 rounded text-[10px]"
                          >
                            Setujui
                          </button>
                          <button
                            onClick={() => handleUpdateClaimStatus(c.id, 'REJECTED')}
                            className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-2 py-1 rounded text-[10px]"
                          >
                            Tolak
                          </button>
                        </>
                      )}
                      {c.status !== 'PENDING' && <span className="text-slate-400 text-[10px] italic">Telah Diproses</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL INPUT KASBON / UANG JALAN */}
      {showAdvanceModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100 text-slate-900 text-xs">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-bold text-slate-900">Penyerahan Uang Jalan / Kasbon Driver</h3>
              <button onClick={() => setShowAdvanceModal(false)} className="text-slate-400 font-bold">✕</button>
            </div>

            <form onSubmit={handleAddAdvance} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold mb-1">Pilih Driver / Supir *</label>
                <select
                  value={formDriver}
                  onChange={(e) => setFormDriver(e.target.value)}
                  className="w-full border p-2.5 rounded-xl font-bold bg-slate-50"
                >
                  {drivers.map((d: any) => (
                    <option key={d.name} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold mb-1">Armada Kendaraan *</label>
                <select
                  value={formPlate}
                  onChange={(e) => setFormPlate(e.target.value)}
                  className="w-full border p-2.5 rounded-xl font-bold bg-slate-50"
                >
                  {vehicles.map((v: any) => (
                    <option key={v.plate_number} value={v.plate_number}>
                      {v.plate_number} ({v.model})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold mb-1">Nominal Kasbon / Uang Jalan (Rp) *</label>
                <div className="relative flex items-center">
                  <span className="absolute left-2.5 font-bold text-slate-400">Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    className="w-full border p-2.5 pl-8 rounded-xl font-mono font-bold text-slate-900 outline-none"
                    value={formAmountInput}
                    onChange={(e) => setFormAmountInput(formatNumberDots(e.target.value))}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold mb-1">Catatan / Keperluan Jalan</label>
                <input
                  type="text"
                  placeholder="Contoh: Uang jalan operasional pengiriman Jakarta - Bandung"
                  className="w-full border p-2.5 rounded-xl"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowAdvanceModal(false)} className="w-1/2 bg-slate-100 font-bold py-2.5 rounded-xl">Batal</button>
                <button type="submit" className="w-1/2 bg-slate-900 text-white font-bold py-2.5 rounded-xl shadow-md">Simpan Uang Jalan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ReimbursementTab