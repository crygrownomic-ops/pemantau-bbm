import React from "react";

export default function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
      <div className="card-surface flex items-center gap-4 rounded-2xl px-5 py-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-amber-400/30 border-t-amber-400" />
        <div>
          <div className="text-xs uppercase tracking-[0.22em] text-slate-400">Loading</div>
          <div className="text-base font-extrabold text-white">FleetOps 360</div>
        </div>
      </div>
    </div>
  );
}
