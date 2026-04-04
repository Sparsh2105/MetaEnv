import { useState, useEffect } from 'react'
import { api } from '../api/client.js'

export default function Header({ tab, tabs, onTabChange }) {
  const [online, setOnline] = useState(null)

  useEffect(() => {
    const check = () =>
      api.getState()
        .then(() => setOnline(true))
        .catch(() => setOnline(false))
    check()
    const id = setInterval(check, 8000)
    return () => clearInterval(id)
  }, [])

  return (
    <header className="glass border-b border-brand-700/30 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-brand-500 flex items-center justify-center text-lg shadow-lg"
                 style={{boxShadow:'0 0 20px rgba(79,110,247,0.5)'}}>
              💼
            </div>
            <div>
              <div className="font-bold text-white text-sm leading-tight">MetaEnv</div>
              <div className="text-xs text-slate-400 leading-tight">Job Application RL</div>
            </div>
          </div>

          {/* Tabs */}
          <nav className="flex items-center gap-1">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => onTabChange(t.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200
                  ${tab === t.id
                    ? 'bg-brand-500/20 text-brand-400 border border-brand-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-surface-700'
                  }`}
              >
                <span>{t.icon}</span>
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            ))}
          </nav>

          {/* Status */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              online === null ? 'bg-yellow-400 animate-pulse' :
              online ? 'bg-green-400' : 'bg-red-400'
            }`} />
            <span className="text-xs text-slate-400">
              {online === null ? 'Connecting…' : online ? 'API Online' : 'API Offline'}
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
