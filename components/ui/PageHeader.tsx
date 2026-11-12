import type { ReactNode } from 'react'

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <p className="mb-1.5 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-gold-600">
            <span className="h-1.5 w-1.5 rounded-full bg-gold-400" />
            {eyebrow}
          </p>
        )}
        <h1 className="text-xl font-extrabold tracking-tight text-navy-950 sm:text-2xl">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
