import { useEffect, useRef } from 'react'

const typeStyle = {
  success: 'text-green-400',
  error:   'text-red-400',
  warning: 'text-amber-400',
  chaos:   'text-purple-400',
  info:    'text-slate-400',
}

export default function StepLog({ logs }) {
  const ref = useRef(null)

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight
  }, [logs])

  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5">
        <span className="section-title mb-0">Step Log</span>
        <span className="text-xs text-slate-600 font-mono">{logs.length} entries</span>
      </div>
      <div ref={ref} className="h-52 overflow-y-auto p-3 space-y-1 terminal-text">
        {logs.length === 0 && (
          <div className="text-slate-600 text-center py-8">No steps yet</div>
        )}
        {logs.map((log, i) => (
          <div key={i} className="flex items-start gap-2 py-0.5 hover:bg-white/5 rounded px-1 transition-colors">
            <span className="text-slate-600 shrink-0 w-6 text-right">{log.step ?? i}</span>
            <span className="text-slate-600 shrink-0">›</span>
            <span className={`shrink-0 font-medium ${typeStyle[log.type] || typeStyle.info}`}>
              {log.label || log.action || '—'}
            </span>
            {log.reward !== undefined && (
              <span className={`shrink-0 font-mono ${log.reward >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {log.reward >= 0 ? '+' : ''}{log.reward?.toFixed(3)}
              </span>
            )}
            {log.message && (
              <span className="text-slate-500 truncate">{log.message}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
