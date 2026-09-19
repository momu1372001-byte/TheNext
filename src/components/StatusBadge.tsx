interface StatusBadgeProps {
  status: 'new' | 'learning' | 'reviewed'
}

const config = {
  new: { label: 'New', classes: 'bg-ink-700 text-ink-300' },
  learning: { label: 'Learning', classes: 'bg-gold-500/15 text-gold-300' },
  reviewed: { label: 'Reviewed', classes: 'bg-emerald-500/15 text-emerald-300' },
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const c = config[status]
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${c.classes}`}
    >
      {c.label}
    </span>
  )
}
