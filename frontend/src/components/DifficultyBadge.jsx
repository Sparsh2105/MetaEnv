const CONFIG = {
  easy:   { color: 'bg-green-900/40 text-green-300 border-green-700/50',  icon: '🟢', label: 'Easy'   },
  medium: { color: 'bg-yellow-900/40 text-yellow-300 border-yellow-700/50', icon: '🟡', label: 'Medium' },
  hard:   { color: 'bg-red-900/40 text-red-300 border-red-700/50',        icon: '🔴', label: 'Hard'   },
}

export default function DifficultyBadge({ difficulty, size = 'sm' }) {
  const c = CONFIG[difficulty] || CONFIG.medium
  return (
    <span className={`tag border ${c.color} ${size === 'lg' ? 'text-sm px-3 py-1' : ''}`}>
      {c.icon} {c.label}
    </span>
  )
}
