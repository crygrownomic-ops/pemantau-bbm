import type { ReactNode } from "react";

export default function LoadingScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5 text-slate-100">
      <div className="card-surface flex items-center gap-4 rounded-2xl px-5 py-4" role="status" aria-live="polite">
        <span className="h-9 w-9 animate-spin rounded-full border-2 border-amber-300/25 border-t-amber-300" aria-hidden="true" />
        <span>
          <span className="block text-[10px] uppercase tracking-[0.22em] text-slate-400">Memuat halaman</span>
          <span className="block text-sm font-extrabold text-white">FleetOps 360</span>
        </span>
      </div>
    </main>
  );
}

export function Template({ children }: { children: ReactNode }) {
  return children;
}
