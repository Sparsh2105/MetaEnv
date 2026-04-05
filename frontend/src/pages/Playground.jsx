import { useState, useCallback } from 'react'
import { api } from '../api/client.js'
import StatePanel from '../components/StatePanel.jsx'
import RewardChart from '../components/RewardChart.jsx'
import StepLog from '../components/StepLog.jsx'

const ACTIONS = [
  { id: 'request_referral',   label: 'Request Referral',   icon: '🤝', desc: '30% ghosting risk',  cost: '1 step' },
  { id: 'reply_email',        label: 'Reply Email',        icon: '📧', desc: 'Respond to recruiter', cost: '1 step', urgent: true },
  { id: 'apply_workday',      label: 'Apply Workday',      icon: '🏢', desc: 'Workday only',        cost: '3 steps' },
  { id: 'apply_1click',       label: 'Apply 1-Click',      icon: '⚡', desc: 'Not for Workday',     cost: '1 step' },
  { id: 'submit_application', label: 'Submit Application', icon: '📤', desc: 'Finalize + tailor',   cost: '1 step' },
  { id: 'wait',               label: 'Wait',               icon: '⏳', desc: 'Skip step',           cost: '1 step' },
]

const PRESETS = {
  easy:   { job_title: 'Frontend Developer Intern', company: 'StartupXYZ',  platform: '1click',             deadline: 15, keywords: 'React, CSS, JavaScript',                                    chaos_enabled: false, ghosting_probability: 0,   recruiter_curveball_probability: 0,    require_tailoring: false },
  medium: { job_title: 'Backend Engineer',          company: 'MidSizeCo',   platform: 'linkedin_easy_apply', deadline: 10, keywords: 'Node.js, PostgreSQL, REST APIs, Docker',                    chaos_enabled: true,  ghosting_probability: 0.3, recruiter_curveball_probability: 0.2,  require_tailoring: false },
  hard:   { job_title: 'Software Engineer',         company: 'BigTechCorp', platform: 'workday',             deadline: 7,  keywords: 'System Design, Python, Distributed Systems, Kubernetes, Go', chaos_enabled: true,  ghosting_probability: 0.5, recruiter_curveball_probability: 0.35, require_tailoring: true  },
}

const DEFAULT_CUSTOM = {
  job_title: '', company: '', platform: '1click', deadline: 10,
  keywords: '', chaos_enabled: true, ghosting_probability: 0.3,
  recruiter_curveball_probability: 0.2, require_tailoring: false,
}

export default function Playground() {
  const [mode, setMode] = useState('medium')          // 'easy' | 'medium' | 'hard' | 'custom'
  const [custom, setCustom] = useState(DEFAULT_CUSTOM)
  const [showCustom, setShowCustom] = useState(false)

  const [obs, setObs] = useState(null)
  const [logs, setLogs] = useState([])
  const [rewardHistory, setRewardHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [tailoredSkills, setTailoredSkills] = useState('')
  const [error, setError] = useState(null)
  const [finalScore, setFinalScore] = useState(null)

  const addLog = useCallback((entry) => setLogs(prev => [...prev, entry]), [])

  const buildResetConfig = () => {
    if (mode !== 'custom') return { difficulty: mode }
    return {
      custom: true,
      job_title:   custom.job_title || 'Custom Role',
      company:     custom.company   || 'Custom Corp',
      platform:    custom.platform,
      deadline:    parseInt(custom.deadline, 10) || 10,
      keywords:    custom.keywords.split(',').map(s => s.trim()).filter(Boolean),
      chaos_enabled:                  custom.chaos_enabled,
      ghosting_probability:           parseFloat(custom.ghosting_probability),
      recruiter_curveball_probability: parseFloat(custom.recruiter_curveball_probability),
      require_tailoring:              custom.require_tailoring,
    }
  }

  const handleReset = async () => {
    setLoading(true); setError(null); setFinalScore(null)
    try {
      const config = buildResetConfig()
      const data = await api.reset(config)
      setObs(data.observation)
      setLogs([{
        step: 0, label: `Episode reset — ${mode.toUpperCase()}`, type: 'info',
        message: `${data.observation.job_title} @ ${data.observation.company} | ${data.observation.platform} | ${data.observation.deadline}d`,
      }])
      setRewardHistory([])
      setTailoredSkills(data.observation.job_description_keywords?.join(', ') || '')
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const handleAction = async (actionId) => {
    if (!obs || obs.done || loading) return
    setLoading(true); setError(null)
    try {
      const skills = actionId === 'submit_application' && tailoredSkills
        ? tailoredSkills.split(',').map(s => s.trim()).filter(Boolean)
        : undefined

      const result = await api.step(actionId, skills)
      setObs(result.observation)
      setRewardHistory(prev => [...prev, result.reward])
      addLog({
        step: result.observation.steps_taken,
        label: actionId.replace(/_/g, ' '),
        reward: result.reward,
        type: result.reward > 0 ? 'success' : result.reward < -0.5 ? 'error' : 'info',
        message: result.info?.message || result.info?.warning || result.info?.penalty || '',
      })
      if (result.info?.final_grade) {
        const g = result.info.final_grade
        setFinalScore(g)
        addLog({
          step: result.observation.steps_taken,
          label: `FINAL SCORE: ${g.score.toFixed(3)}`,
          type: g.score >= 0.5 ? 'success' : 'warning',
          message: `${result.info.terminal_reason} | ×${g.breakdown?.tailoring_multiplier ?? 1} tailoring`,
        })
      }
    } catch (e) {
      setError(e.message)
      addLog({ label: 'Error', type: 'error', message: e.message })
    } finally { setLoading(false) }
  }

  const setField = (k, v) => setCustom(prev => ({ ...prev, [k]: v }))
  const isUrgent = obs?.recruiter_replied_pending

  return (
    <div className="space-y-4 animate-fade-in">

      {/* Mode selector */}
      <div className="glass rounded-2xl p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="section-title mb-0 shrink-0">Mode</span>
          <div className="flex flex-wrap gap-2">
            {['easy', 'medium', 'hard'].map(d => (
              <button key={d} onClick={() => { setMode(d); setShowCustom(false) }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                        mode === d && !showCustom
                          ? d === 'easy'   ? 'bg-green-500/20 text-green-300 border-green-500/40'
                          : d === 'medium' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          :                  'bg-red-500/20 text-red-300 border-red-500/40'
                          : 'bg-surface-700 text-slate-400 border-white/5 hover:border-white/10'
                      }`}>
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </button>
            ))}
            <button onClick={() => { setMode('custom'); setShowCustom(true) }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                      mode === 'custom'
                        ? 'bg-brand-500/20 text-brand-300 border-brand-500/40'
                        : 'bg-surface-700 text-slate-400 border-white/5 hover:border-white/10'
                    }`}>
              ⚙ Custom
            </button>
          </div>
          <button onClick={handleReset} disabled={loading} className="btn-primary text-sm ml-auto">
            {loading ? '⏳ Loading…' : obs ? '↺ Reset Episode' : '▶ Start Episode'}
          </button>
        </div>

        {/* Custom config panel */}
        {showCustom && (
          <div className="border-t border-white/5 pt-3 space-y-3 animate-fade-in">
            <div className="text-xs text-slate-400 font-medium">Custom Scenario — configure everything</div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-wide block mb-1">Job Title</label>
                <input value={custom.job_title} onChange={e => setField('job_title', e.target.value)}
                       placeholder="e.g. ML Engineer" className="input w-full text-xs" />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-wide block mb-1">Company</label>
                <input value={custom.company} onChange={e => setField('company', e.target.value)}
                       placeholder="e.g. OpenAI" className="input w-full text-xs" />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-wide block mb-1">Platform</label>
                <select value={custom.platform} onChange={e => setField('platform', e.target.value)}
                        className="input w-full text-xs">
                  <option value="1click">1-Click Apply</option>
                  <option value="linkedin_easy_apply">LinkedIn Easy Apply</option>
                  <option value="workday">Workday (3 steps)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-wide block mb-1">Deadline (days)</label>
                <input type="number" min={1} max={60} value={custom.deadline}
                       onChange={e => setField('deadline', e.target.value)}
                       className="input w-full text-xs" />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-wide block mb-1">Ghosting Probability</label>
                <input type="number" min={0} max={1} step={0.05} value={custom.ghosting_probability}
                       onChange={e => setField('ghosting_probability', e.target.value)}
                       className="input w-full text-xs" />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-wide block mb-1">Curveball Probability</label>
                <input type="number" min={0} max={1} step={0.05} value={custom.recruiter_curveball_probability}
                       onChange={e => setField('recruiter_curveball_probability', e.target.value)}
                       className="input w-full text-xs" />
              </div>
              <div className="col-span-2 md:col-span-3">
                <label className="text-[10px] text-slate-500 uppercase tracking-wide block mb-1">Job Keywords (comma-separated)</label>
                <input value={custom.keywords} onChange={e => setField('keywords', e.target.value)}
                       placeholder="Python, FastAPI, Docker, Kubernetes…" className="input w-full text-xs" />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={custom.chaos_enabled}
                         onChange={e => setField('chaos_enabled', e.target.checked)}
                         className="accent-brand-500" />
                  <span className="text-xs text-slate-300">Chaos enabled</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={custom.require_tailoring}
                         onChange={e => setField('require_tailoring', e.target.checked)}
                         className="accent-brand-500" />
                  <span className="text-xs text-slate-300">Require tailoring</span>
                </label>
              </div>
            </div>
            {/* Quick-fill from presets */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-600">Quick-fill from preset:</span>
              {['easy', 'medium', 'hard'].map(d => (
                <button key={d} onClick={() => setCustom({ ...PRESETS[d] })}
                        className="text-[10px] text-slate-400 hover:text-slate-200 underline underline-offset-2 transition-colors">
                  {d}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">{error}</div>
      )}

      {finalScore && (
        <div className={`rounded-2xl p-4 border text-center animate-slide-up ${
          finalScore.score >= 0.7 ? 'bg-green-500/10 border-green-500/30' :
          finalScore.score >= 0.4 ? 'bg-amber-500/10 border-amber-500/30' :
                                    'bg-red-500/10 border-red-500/30'
        }`}>
          <div className="text-2xl font-bold font-mono text-white">{finalScore.score.toFixed(3)}</div>
          <div className="text-sm text-slate-400 mt-1">Final Score</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-4">
          <StatePanel obs={obs} />
          {obs && !obs.done && (
            <div className="glass rounded-2xl p-4 space-y-3">
              <div className="section-title">Actions</div>
              <div className="grid grid-cols-2 gap-2">
                {ACTIONS.map(({ id, label, icon, desc, cost, urgent }) => {
                  const isThisUrgent = urgent && isUrgent
                  return (
                    <button key={id} onClick={() => handleAction(id)} disabled={loading}
                            className={`flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all duration-200 disabled:opacity-40 active:scale-95 ${
                              isThisUrgent
                                ? 'bg-red-500/15 border-red-500/40 hover:bg-red-500/25 animate-pulse-slow'
                                : 'bg-surface-700/50 border-white/5 hover:bg-surface-600/60 hover:border-white/10'
                            }`}>
                      <div className="flex items-center gap-2 w-full">
                        <span className="text-base">{icon}</span>
                        <span className={`text-xs font-semibold ${isThisUrgent ? 'text-red-300' : 'text-slate-200'}`}>{label}</span>
                      </div>
                      <div className="text-[10px] text-slate-500">{desc}</div>
                      <div className="text-[10px] text-slate-600">{cost}</div>
                    </button>
                  )
                })}
              </div>
              <div>
                <label className="section-title block">Tailored Skills (for submit_application)</label>
                <input type="text" value={tailoredSkills} onChange={e => setTailoredSkills(e.target.value)}
                       placeholder="React, Node.js, Docker…" className="input w-full text-xs" />
                <div className="text-[10px] text-slate-600 mt-1">Comma-separated. 80%+ keyword match = ×2.0 reward</div>
              </div>
            </div>
          )}
        </div>
        <div className="space-y-4">
          <RewardChart history={rewardHistory} />
          <StepLog logs={logs} />
        </div>
      </div>
    </div>
  )
}
