interface ProgressBarProps {
  current: number
  total: number
}

export default function ProgressBar({ current, total }: ProgressBarProps) {
  const pct = total > 0 ? (current / total) * 100 : 0

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-ink-300">
          {current} / {total}
        </span>
        <span className="text-sm font-medium text-gold-400">
          {Math.round(pct)}%
        </span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-ink-800 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-gold-500 to-gold-300 transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
