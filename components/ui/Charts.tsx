import { formatCompactCurrency } from '@/lib/format'

export interface TrendPoint {
  label: string
  fuel: number
  service: number
  claims?: number
}

export function TrendChart({ data, height = 220 }: { data: TrendPoint[]; height?: number }) {
  if (data.length === 0) {
    return <div className="flex h-48 items-center justify-center text-xs text-slate-400">Belum ada data tren.</div>
  }

  const width = 760
  const padding = { top: 18, right: 12, bottom: 30, left: 52 }
  const innerWidth = width - padding.left - padding.right
  const innerHeight = height - padding.top - padding.bottom
  const maxValue = Math.max(...data.map((point) => point.fuel + point.service + (point.claims || 0)), 1)
  const niceMax = Math.ceil(maxValue / 5_000_000) * 5_000_000 || maxValue
  const slot = innerWidth / data.length
  const barWidth = Math.min(16, slot * 0.28)

  const ticks = [0, 0.25, 0.5, 0.75, 1]

  return (
    <div className="w-full overflow-hidden">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label="Grafik tren biaya operasional">
        {ticks.map((tick) => {
          const y = padding.top + innerHeight - tick * innerHeight
          return (
            <g key={tick}>
              <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke="#eef2f7" strokeWidth="1" />
              <text x={padding.left - 8} y={y + 3} textAnchor="end" fontSize="8" fill="#94a3b8" fontFamily="var(--font-jetbrains)">
                {formatCompactCurrency(niceMax * tick).replace('Rp ', '')}
              </text>
            </g>
          )
        })}

        {data.map((point, index) => {
          const center = padding.left + slot * index + slot / 2
          const fuelHeight = (point.fuel / niceMax) * innerHeight
          const serviceHeight = (point.service / niceMax) * innerHeight
          const claimsHeight = ((point.claims || 0) / niceMax) * innerHeight
          const total = point.fuel + point.service + (point.claims || 0)
          return (
            <g key={point.label}>
              <rect
                x={center - barWidth - 2}
                y={padding.top + innerHeight - fuelHeight}
                width={barWidth}
                height={Math.max(fuelHeight, 0)}
                rx="3"
                fill="#16293d"
              />
              <rect
                x={center + 2}
                y={padding.top + innerHeight - serviceHeight - claimsHeight}
                width={barWidth}
                height={Math.max(serviceHeight + claimsHeight, 0)}
                rx="3"
                fill="#d9ab2d"
              />
              <text x={center} y={height - 10} textAnchor="middle" fontSize="8.5" fill="#64748b" fontWeight="700">
                {point.label}
              </text>
              <title>{`${point.label}: ${formatCompactCurrency(total)}`}</title>
            </g>
          )
        })}
      </svg>
      <div className="mt-1 flex flex-wrap items-center gap-4 px-2 text-[10px] font-bold text-slate-500">
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-navy-900" /> BBM</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-gold-400" /> Servis + Klaim</span>
      </div>
    </div>
  )
}

export function QualityGauge({ score, size = 132 }: { score: number; size?: number }) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)))
  const radius = size / 2 - 10
  const circumference = 2 * Math.PI * radius
  const dash = (clamped / 100) * circumference
  const color = clamped >= 85 ? '#059669' : clamped >= 70 ? '#d9ab2d' : clamped >= 55 ? '#ea580c' : '#e11d48'

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#eef2f7" strokeWidth="10" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-2xl font-bold tracking-tight text-navy-950">{clamped}</span>
        <span className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-slate-400">Skor</span>
      </div>
    </div>
  )
}
