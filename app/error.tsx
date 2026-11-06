"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Keep details in the deployment logs; avoid exposing internal errors in the UI.
    console.error("Application error", error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5 text-slate-100">
      <section className="card-surface max-w-lg rounded-3xl p-8 text-center">
        <div
          className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-400/10 text-2xl font-black text-rose-300"
          aria-hidden="true"
        >
          !
        </div>
        <h1 className="text-2xl font-black text-white">Terjadi kendala</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Halaman tidak dapat dimuat saat ini. Silakan coba lagi, atau kembali ke beranda.
        </p>
        {error.digest ? (
          <p className="mt-3 text-xs text-slate-500">Kode referensi: {error.digest}</p>
        ) : null}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-xl bg-gradient-to-r from-amber-300 to-orange-500 px-5 py-3 text-sm font-extrabold text-slate-950"
          >
            Coba lagi
          </button>
          <Link
            href="/"
            className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-bold text-slate-100"
          >
            Kembali ke beranda
          </Link>
        </div>
      </section>
    </main>
  );
}
