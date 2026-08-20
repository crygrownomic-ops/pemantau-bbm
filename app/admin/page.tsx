{/* Tambahkan tombol ⚙️ Pengaturan di dalam div header navigasi */}
<div className="flex items-center gap-2">
  <Link
    href="/admin/settings"
    className="text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-800 px-3.5 py-2 rounded-lg border border-gray-300 transition flex items-center gap-1"
  >
    ⚙️ Pengaturan Tarif
  </Link>
  <button
    onClick={exportToCSV}
    className="text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-3.5 py-2 rounded-lg border border-emerald-200 transition"
  >
    📥 Export CSV
  </button>
  <Link
    href="/"
    className="text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 px-3.5 py-2 rounded-lg transition"
  >
    ← Form Driver
  </Link>
</div>