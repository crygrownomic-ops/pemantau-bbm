import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5 text-slate-100">
      <div className="card-surface max-w-md rounded-3xl p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-2xl font-black text-slate-950">
          !
        </div>
        <h1 className="text-3xl font-black text-white">Halaman tidak ditemukan</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Route yang Anda tuju belum tersedia atau telah dipindahkan.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-5 py-3 text-sm font-extrabold text-slate-950"
        >
          Kembali ke beranda
        </Link>
      </div>
    </main>
  );
}
