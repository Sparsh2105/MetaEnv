import { useEffect, useRef } from 'react'

const ACTION_ICONS = {
  request_referral: '🤝',
  reply_email: '📧',
  apply_workday: '🏢',
  apply_1click: '⚡',
  submit_application: '📤',
  wait: '⏳',
}

export default function StepLog({ logs }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  if (!logs?.length) return (
    <div className="glass rounded-xl p-6 flex items-center justify-center text-slate-500 text-sm h-48">
      Step log will appear here
    </div>
  )

  return (
    <div className="glass rounded-xl overflow-hidden">
      <div className="px-4 py-2.5 border-b border-surface-600 flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400">Step Log</span>
        <span className="tag bg-surface-600 text-slate-400">{logs.length} steps</span>
      </div>
      <div className="overflow-y-auto max-h-72 p-3 space-y-1.5 terminal-text">
        {logs.map((log, i) => (
          <div key={i} className={`flex items-start gap-2 px-2 py-1.5 rounded-lg animate-slide-in
            ${log.type === 'error'   ? 'bg-red-900/20 border border-red-800/30' :
              log.type === 'success' ? 'bg-green-900/20 border border-green-800/30' :
              log.type === 'warning' ? 'bg-yellow-900/20 border border-yellow-800/30' :
              log.type === 'chaos'   ? 'bg-red-900/30 border border-red-700/50' :
              'bg-surface-700/50 border border-surface-600/30'}`}>
            <span className="shrink-0 mt-0.5">
              {log.type === 'error'   ? '❌' :
               log.type === 'success' ? '✅' :
               log.type === 'warning' ? '⚠️' :
               log.type === 'chaos'   ? '🚨' :
               ACTION_ICONS[log.action] || '→'}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-slate-300 font-medium">
                  {log.action ? `[${log.action}]` : log.label}
                </span>
                {log.reward !== undefined && (
                  <span className={`font-mono text-xs ${log.reward >= 0 ? 'reward-positive' : 'reward-negative'}`}>
                    {log.reward >= 0 ? '+' : ''}{log.reward?.toFixed(4)}
                  </span>
                )}
                {log.step !== undefined && (
                  <span className="text-slate-600 text-xs">step {log.step}</span>
                )}
              </div>
              {log.message && <div className="text-slate-500 text-xs mt-0.5 truncate">{log.message}</div>}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
