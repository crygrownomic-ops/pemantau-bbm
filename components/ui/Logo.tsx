import Link from 'next/link'

export function Logo({ compact = false, dark = false }: { compact?: boolean; dark?: boolean }) {
  return (
    <Link href="/" className="group inline-flex items-center gap-2.5">
      <span className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-gold-400 text-navy-950 shadow-[0_10px_24px_-12px_rgba(217,171,45,0.9)]">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
          <path d="M4 18V7.5A2.5 2.5 0 0 1 6.5 5H14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M4 12h7.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M14 14.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7Z" stroke="currentColor" strokeWidth="2.1" />
        </svg>
      </span>
      {!compact && (
        <span className="leading-tight">
          <span className={`block text-[13px] font-extrabold tracking-tight ${dark ? 'text-white' : 'text-navy-950'}`}>
            FleetOps <span className="text-gold-500">360</span>
          </span>
          <span className={`block text-[9px] font-bold uppercase tracking-[0.18em] ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
            Fuel &amp; Fleet Control
          </span>
        </span>
      )}
    </Link>
  )
}
