import { useState, useEffect } from 'react'
import { api } from '../api/client.js'

export default function Header({ tab, tabs, onTabChange }) {
  const [online, setOnline] = useState(null)

  useEffect(() => {
    const check = () =>
      api.getState().then(() => setOnline(true)).catch(() => setOnline(false))
    check()
    const id = setInterval(check, 8000)
    return () => clearInterval(id)
  }, [])

  const statusColor = online === null ? 'bg-amber-400' : online ? 'bg-green-400' : 'bg-red-400'
  const statusLabel = online === null ? 'Connecting…' : online ? 'API Online' : 'API Offline'

  return (
    <header className="sticky top-0 z-50 glass border-b border-white/5 inset-glow">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14 gap-4">

          {/* Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-sm shadow-lg shadow-brand-600/30">
              💼
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-bold text-white leading-tight">MetaEnv</div>
              <div className="text-[10px] text-slate-500 leading-tight tracking-wide">OpenEnv · Job Application RL</div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex items-center gap-1">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => onTabChange(t.id)}
                className={tab === t.id ? 'nav-tab-active' : 'nav-tab'}
              >
                <span className="text-base leading-none">{t.icon}</span>
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            ))}
          </nav>

          {/* Status */}
          <div className="flex items-center gap-2 shrink-0">
            <div className={`glow-dot ${statusColor} ${online === null ? 'animate-pulse' : ''}`} />
            <span className="text-xs text-slate-400 hidden sm:inline">{statusLabel}</span>
            <span className="tag bg-brand-500/10 text-brand-400 border border-brand-500/20 hidden md:inline-flex">
              OpenEnv v1.0
            </span>
          </div>

        </div>
      </div>
    </header>
  )
}
