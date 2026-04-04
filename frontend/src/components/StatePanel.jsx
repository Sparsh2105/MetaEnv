export default function StatePanel({ obs }) {
  if (!obs) return (
    <div className="glass rounded-xl p-6 flex items-center justify-center text-slate-500 text-sm">
      No state loaded — press Reset to start
    </div>
  )

  const pct = Math.max(0, Math.round(((obs.deadline - obs.day) / obs.deadline) * 100))
  const urgency = pct < 30 ? 'text-red-400' : pct < 60 ? 'text-yellow-400' : 'text-green-400'
  const barColor = pct < 30 ? 'bg-red-500' : pct < 60 ? 'bg-yellow-500' : 'bg-green-500'

  const platformColor = {
    workday: 'bg-orange-900/50 text-orange-300 border-orange-700/50',
    '1click': 'bg-green-900/50 text-green-300 border-green-700/50',
    linkedin_easy_apply: 'bg-blue-900/50 text-blue-300 border-blue-700/50',
  }[obs.platform] || 'bg-slate-800 text-slate-300 border-slate-600'

  return (
    <div className="glass rounded-xl p-5 space-y-4 animate-fade-in">
      {/* Job Info */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-white font-bold text-lg leading-tight">{obs.job_title}</div>
          <div className="text-slate-400 text-sm">{obs.company}</div>
        </div>
        <span className={`tag border ${platformColor} shrink-0`}>{obs.platform}</span>
      </div>

      {/* Time bar */}
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-slate-400">Day {obs.day} / {obs.deadline}</span>
          <span className={urgency}>{obs.days_remaining} days left</span>
        </div>
        <div className="h-2 bg-surface-600 rounded-full overflow-hidden">
          <div className={`h-full ${barColor} rounded-full transition-all duration-500`}
               style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Keywords */}
      <div>
        <div className="text-xs text-slate-500 mb-1.5">Job Keywords</div>
        <div className="flex flex-wrap gap-1.5">
          {obs.job_description_keywords?.map(k => (
            <span key={k} className="tag bg-brand-500/15 text-brand-400 border border-brand-500/30">{k}</span>
          ))}
        </div>
      </div>

      {/* Status flags */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'Referral',   val: obs.referral_requested, icon: '🤝' },
          { label: 'Ghosted',    val: obs.ghosted,            icon: '👻', danger: true },
          { label: 'Applied',    val: obs.applied,            icon: '📝' },
          { label: 'Submitted',  val: obs.application_submitted, icon: '✅' },
          { label: 'Interview',  val: obs.got_interview,      icon: '🎯' },
          { label: 'Recruiter!', val: obs.recruiter_replied_pending, icon: '🚨', danger: true },
        ].map(({ label, val, icon, danger }) => (
          <div key={label}
               className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-all
                 ${val
                   ? danger
                     ? 'bg-red-900/30 border-red-700/50 text-red-300'
                     : 'bg-green-900/30 border-green-700/50 text-green-300'
                   : 'bg-surface-700 border-surface-600 text-slate-500'
                 }`}>
            <span>{icon}</span>
            <span>{label}</span>
            <span className="ml-auto">{val ? '●' : '○'}</span>
          </div>
        ))}
      </div>

      {/* Recruiter event */}
      {obs.recruiter_event && (
        <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-3 animate-slide-in">
          <div className="text-red-400 text-xs font-bold mb-1">🚨 RECRUITER EVENT</div>
          <div className="text-red-200 text-sm">"{obs.recruiter_event.message}"</div>
          <div className="text-red-400 text-xs mt-1">→ You MUST use reply_email or face -1.0 penalty</div>
        </div>
      )}

      {/* Score */}
      <div className="flex items-center justify-between pt-2 border-t border-surface-600">
        <span className="text-xs text-slate-400">Total Reward</span>
        <span className={`font-mono font-bold text-sm ${obs.total_reward >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {obs.total_reward >= 0 ? '+' : ''}{obs.total_reward?.toFixed(4)}
        </span>
      </div>

      {/* Terminal */}
      {obs.done && (
        <div className={`rounded-lg p-3 text-center font-bold text-sm border animate-slide-in
          ${obs.terminal_reason === 'interview_secured' ? 'bg-green-900/30 border-green-600/50 text-green-300' :
            obs.terminal_reason === 'deadline_missed'   ? 'bg-red-900/30 border-red-600/50 text-red-300' :
            'bg-yellow-900/30 border-yellow-600/50 text-yellow-300'}`}>
          {obs.terminal_reason === 'interview_secured' ? '🎉 Interview Secured!' :
           obs.terminal_reason === 'deadline_missed'   ? '⏰ Deadline Missed' :
           obs.terminal_reason === 'applied_with_referral' ? '✅ Applied with Referral' :
           '📝 Cold Applied'}
        </div>
      )}
    </div>
  )
}
