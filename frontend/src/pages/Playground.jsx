import { useState, useCallback } from 'react'
import { api } from '../api/client.js'
import StatePanel from '../components/StatePanel.jsx'
import RewardChart from '../components/RewardChart.jsx'
import StepLog from '../components/StepLog.jsx'
import DifficultyBadge from '../components/DifficultyBadge.jsx'

const ACTIONS = [
  { id: 'request_referral',   label: 'Request Referral',   icon: '🤝', desc: '30% ghosting risk',  cost: '1 step' },
  { id: 'reply_email',        label: 'Reply Email',        icon: '📧', desc: 'Respond to recruiter', cost: '1 step', urgent: true },
  { id: 'apply_workday',      label: 'Apply Workday',      icon: '🏢', desc: 'Workday only',        cost: '3 steps' },
  { id: 'apply_1click',       label: 'Apply 1-Click',      icon: '⚡', desc: 'Not for Workday',     cost: '1 step' },
  { id: 'submit_application', label: 'Submit Application', icon: '📤', desc: 'Finalize + tailor',   cost: '1 step' },
  { id: 'wait',               label: 'Wait',               icon: '⏳', desc: 'Skip step',           cost: '1 step' },
]

export default function Playground() {
  const [difficulty, setDifficulty] = useState('medium')
  const [obs, setObs] = useState(null)
  const [logs, setLogs] = useState([])
  const [rewardHistory, setRewardHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [tailoredSkills, setTailoredSkills] = useState('')
  const [error, setError] = useState(null)
  const [finalScore, setFinalScore] = useState(null)

  const addLog = useCallback((entry) => setLogs(prev => [...prev, entry]), [])

  const handleReset = async () => {
    setLoading(true); setError(null); setFinalScore(null)
    try {
      const data = await api.reset(difficulty)
      setObs(data.observation)
      setLogs([{ step: 0, label: `Episode reset — ${difficulty.toUpperCase()}`, type: 'info',
                 message: `Deadline: ${data.observation.deadline} days | ${data.observation.platform}` }])
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
        action: actionId,
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
          message: `${result.info.terminal_reason} | tailoring ×${g.breakdown?.tailoring_multiplier ?? 1}`,
        })
      }
    } catch (e) {
      setError(e.message)
      addLog({ label: 'Error', type: 'error', message: e.message })
    } finally { setLoading(false) }
  }

  const isUrgent = obs?.recruiter_replied_pending

  return (
    <div className="space-y-4 animate-fade-in">

      {/* Controls */}
      <div className="glass rounded-2xl p-4 flex flex-wrap items-center gap-3">
        <div className="section-title mb-0 shrink-0">Difficulty</div>
        <div className="flex gap-2">
          {['easy', 'medium', 'hard'].map(d => (
            <button key={d} onClick={() => setDifficulty(d)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 border ${
                      difficulty === d
                        ? d === 'easy'   ? 'bg-green-500/20 text-green-300 border-green-500/40'
                        : d === 'medium' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        :                  'bg-red-500/20 text-red-300 border-red-500/40'
                        : 'bg-surface-700 text-slate-400 border-white/5 hover:border-white/10'
                    }`}>
              {d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>
        <button onClick={handleReset} disabled={loading}
                className="btn-primary text-sm ml-auto">
          {loading ? '⏳ Loading…' : obs ? '↺ Reset Episode' : '▶ Start Episode'}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Final score banner */}
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
        {/* Left: state + actions */}
        <div className="space-y-4">
          <StatePanel obs={obs} />

          {/* Action buttons */}
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
                        <span className={`text-xs font-semibold ${isThisUrgent ? 'text-red-300' : 'text-slate-200'}`}>
                          {label}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500">{desc}</div>
                      <div className="text-[10px] text-slate-600">{cost}</div>
                    </button>
                  )
                })}
              </div>

              {/* Tailored skills */}
              <div>
                <label className="section-title block">Tailored Skills (for submit_application)</label>
                <input
                  type="text"
                  value={tailoredSkills}
                  onChange={e => setTailoredSkills(e.target.value)}
                  placeholder="React, Node.js, Docker…"
                  className="input w-full text-xs"
                />
                <div className="text-[10px] text-slate-600 mt-1">Comma-separated. 80%+ keyword match = ×2.0 reward</div>
              </div>
            </div>
          )}
        </div>

        {/* Right: chart + log */}
        <div className="space-y-4">
          <RewardChart history={rewardHistory} />
          <StepLog logs={logs} />
        </div>
      </div>
    </div>
  )
}
