export default function StatePanel({ obs }) {
  if (!obs) return (
    <div className="glass rounded-2xl p-8 flex flex-col items-center justify-center gap-3 text-slate-500 min-h-[200px]">
      <div className="text-3xl opacity-40">◎</div>
      <div className="text-sm">No episode loaded — press Reset to start</div>
    </div>
  )

  const pct = Math.max(0, Math.round(((obs.deadline - obs.day) / obs.deadline) * 100))
  const urgency = pct < 30 ? 'text-red-400' : pct < 60 ? 'text-amber-400' : 'text-green-400'
  const barColor = pct < 30 ? 'bg-red-500' : pct < 60 ? 'bg-amber-500' : 'bg-green-500'

  const platformStyle = {
    workday:              'bg-orange-500/10 text-orange-300 border-orange-500/25',
    '1click':             'bg-green-500/10 text-green-300 border-green-500/25',
    linkedin_easy_apply:  'bg-blue-500/10 text-blue-300 border-blue-500/25',
  }[obs.platform] || 'bg-slate-700 text-slate-300 border-slate-600'

  const flags = [
    { label: 'Referral',   val: obs.referral_requested,       icon: '🤝', danger: false },
    { label: 'Applied',    val: obs.applied,                  icon: '📝', danger: false },
    { label: 'Submitted',  val: obs.application_submitted,    icon: '✅', danger: false },
    { label: 'Interview',  val: obs.got_interview,            icon: '🎯', danger: false },
    { label: 'Ghosted',    val: obs.ghosted,                  icon: '👻', danger: true  },
    { label: 'Recruiter!', val: obs.recruiter_replied_pending, icon: '🚨', danger: true  },
  ]

  return (
    <div className="glass rounded-2xl p-5 space-y-4 animate-fade-in">
      {/* Job header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-white font-bold text-base leading-tight">{obs.job_title}</div>
          <div className="text-slate-400 text-sm mt-0.5">{obs.company}</div>
        </div>
        <span className={`tag border ${platformStyle} shrink-0`}>{obs.platform}</span>
      </div>

      {/* Time bar */}
      <div>
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-slate-500">Day {obs.day} / {obs.deadline}</span>
          <span className={urgency + ' font-medium'}>{obs.days_remaining}d remaining</span>
        </div>
        <div className="h-1.5 bg-surface-600 rounded-full overflow-hidden">
          <div className={`h-full ${barColor} rounded-full transition-all duration-500`}
               style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Keywords */}
      {obs.job_description_keywords?.length > 0 && (
        <div>
          <div className="section-title">Job Keywords</div>
          <div className="flex flex-wrap gap-1.5">
            {obs.job_description_keywords.map(k => (
              <span key={k} className="tag bg-brand-500/10 text-brand-300 border border-brand-500/20">{k}</span>
            ))}
          </div>
        </div>
      )}

      {/* Recruiter event */}
      {obs.recruiter_replied_pending && obs.recruiter_event && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 animate-pulse-slow">
          <div className="flex items-center gap-2 text-red-400 text-xs font-semibold mb-1">
            <span>🚨</span> URGENT — Recruiter Event
          </div>
          <div className="text-red-300 text-xs">"{obs.recruiter_event.message}"</div>
          <div className="text-red-500 text-xs mt-1">Use reply_email immediately or -1.0 penalty</div>
        </div>
      )}

      {/* Status flags */}
      <div className="grid grid-cols-3 gap-2">
        {flags.map(({ label, val, icon, danger }) => (
          <div key={label}
               className={`rounded-lg px-2 py-1.5 text-center transition-all duration-300 ${
                 val
                   ? danger
                     ? 'bg-red-500/15 border border-red-500/30'
                     : 'bg-green-500/10 border border-green-500/25'
                   : 'bg-surface-700/50 border border-white/5 opacity-40'
               }`}>
            <div className="text-base">{icon}</div>
            <div className={`text-[10px] font-medium mt-0.5 ${val ? (danger ? 'text-red-400' : 'text-green-400') : 'text-slate-500'}`}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Reward */}
      <div className="flex items-center justify-between pt-1 border-t border-white/5">
        <span className="text-xs text-slate-500">Total Reward</span>
        <span className={`text-sm font-bold font-mono ${obs.total_reward >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {obs.total_reward?.toFixed(3) ?? '0.000'}
        </span>
      </div>

      {/* Done banner */}
      {obs.done && (
        <div className="bg-brand-500/10 border border-brand-500/30 rounded-xl p-3 text-center">
          <div className="text-brand-300 font-semibold text-sm">Episode Complete</div>
          <div className="text-slate-400 text-xs mt-0.5">{obs.terminal_reason?.replace(/_/g, ' ')}</div>
        </div>
      )}
    </div>
  )
}
