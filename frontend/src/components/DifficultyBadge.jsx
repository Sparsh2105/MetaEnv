export default function DifficultyBadge({ difficulty }) {
  const map = {
    easy:   { cls: 'badge-easy',   label: 'Easy',   dot: '●' },
    medium: { cls: 'badge-medium', label: 'Medium', dot: '●' },
    hard:   { cls: 'badge-hard',   label: 'Hard',   dot: '●' },
  }
  const { cls, label, dot } = map[difficulty] || map.medium
  return <span className={cls}>{dot} {label}</span>
}
