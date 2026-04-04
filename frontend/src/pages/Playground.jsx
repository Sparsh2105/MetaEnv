import { useState, useCallback } from 'react'
import { api } from '../api/client.js'
import StatePanel from '../components/StatePanel.jsx'
import RewardChart from '../components/RewardChart.jsx'
import StepLog from '../components/StepLog.jsx'
import DifficultyBadge from '../components/DifficultyBadge.jsx'

const ACTIONS = [
  { id: 'request_referral',   label: 'Request Referral',   icon: '🤝', desc: '30% ghosting chance', cost: '1 step' },
  { id: 'reply_email',        label: 'Reply Email',        icon: '📧', desc: 'Respond to recruiter', cost: '1 step', urgent: true },
  { id: 'apply_workday',      label: 'Apply Workday',      icon: '🏢', desc: 'Workday portal only',  cost: '3 steps' },
  { id: 'apply_1click',       label: 'Apply 1-Click',      icon: '⚡', desc: 'Not for Workday',      cost: '1 step' },
  { id: 'submit_application', label: 'Submit Application', icon: '📤', desc: 'Finalize + tailor',    cost: '1 step' },
  { id: 'wait',               label: 'Wait',               icon: '⏳', desc: 'Skip step',            cost: '1 step' },
]

export default function Playground() {
  const [difficulty, setDifficulty] = useState('medium')
  const [obs, setObs] = useState(null)
  const [logs, setLogs] = useState([])
  const [rewardHistory, setRewardHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [tailoredSkills, setTailoredSkills] = useState('')
  const [error, setError] = useState(null)

  const addLog = useCallback((entry) => {
    setLogs(prev => [...prev, entry])
  }, [])

  const handleReset = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.reset(difficulty)
      setObs(data.observation)
      setLogs([{ label: `Episode reset — ${difficulty.toUpperCase()}`, type: 'info', message: `Deadline: ${data.observation.deadline} days` }])
      setRewardHistory([])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (actionId) => {
    if (!obs || obs.done || loading) return
    setLoading(true)
    setError(null)
    try {
      const skills = actionId === 'submit_application' && tailoredSkills
        ? tailoredSkills.split(',').map(s => s.trim()).filter(Boolean)
        : undefined

      const result = await api.step(actionId, skills)
      setObs(result.observation)
      setRewardHistory(prev => [...prev, result.reward])

      const logEntry = {
        step: result.observation.steps_taken,
        action: actionId,
        reward: result.reward,
        type: result.reward > 0 ? 'success' : result.reward < -0.5 ? 'error' : 'info',
        message: result.info?.message || result.info?.warning || result.info?.penalty || '',
      }
      addLog(logEntry)

      if (result.info?.final_grade) {
        const g = result.info.final_grade
        addLog({
          label: `FINAL SCORE: ${g.score}`,
          type: g.score >= 0.5 ? 'success' : 'warning',
          message: `${result.info.terminal_reason} | ${g.breakdown.tailoring_multiplier}x tailoring`,
        })
      }
    } catch (e) {
      setError(e.message)
      addLog({ label: 'Error', type: 'error', message: e.message })
    } finally {
      setLoading(false)
    }
  }

  const finalGrade = logs.find(l => l.label?.startsWith('FINAL SCORE'))

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Controls */}
      <div className="glass rounded-xl p-4 flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-slate-300">Difficulty:</span>
        {['easy', 'medium', 'hard'].map(d => (
          <button
            key={d}
            onClick={() => setDifficulty(d)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all
              ${difficulty === d
                ? 'bg-brand-500/20 border-brand-500/50 text-brand-300'
                : 'bg-surface-700 border-surface-600 text-slate-400 hover:border-slate-500'}`}
          >
            <DifficultyBadge difficulty={d} />
          </button>
        ))}
        <div className="ml-auto flex gap-2">
          <button onClick={handleReset} disabled={loading} className="btn-primary text-sm">
            {loading ? '⏳' : '▶'} {obs ? 'Restart' : 'Start Episode'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-700/50 rounded-xl px-4 py-3 text-red-300 text-sm">
          ⚠️ {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: state + actions */}
        <div className="lg:col-span-1 space-y-4">
          <StatePanel obs={obs} />

          {obs && !obs.done && (
            <div className="glass rounded-xl p-4 space-y-3">
              <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</div>
              <div className="grid grid-cols-2 gap-2">
                {ACTIONS.map(a => {
                  const isUrgent = a.urgent && obs.recruiter_replied_pending
                  const disabled = loading || obs.done
                  return (
                    <button
                      key={a.id}
                      onClick={() => handleAction(a.id)}
                      disabled={disabled}
                      className={`flex flex-col items-start gap-0.5 px-3 py-2.5 rounded-lg border text-left transition-all duration-200
                        ${isUrgent
                          ? 'bg-red-900/30 border-red-600/60 text-red-200 animate-pulse'
                          : 'bg-surface-700 border-surface-600 text-slate-300 hover:border-brand-500/50 hover:bg-surface-600'
                        } disabled:opacity-40 disabled:cursor-not-allowed`}
                    >
                      <div className="flex items-center gap-1.5 text-sm font-medium">
                        <span>{a.icon}</span>
                        <span className="text-xs">{a.label}</span>
                      </div>
                      <div className="text-xs text-slate-500">{a.cost}</div>
                    </button>
                  )
                })}
              </div>

              {/* Tailoring input */}
              <div>
                <label className="text-xs text-slate-500 block mb-1">
                  Tailored Skills (for submit_application, comma-separated)
                </label>
                <input
                  type="text"
                  value={tailoredSkills}
                  onChange={e => setTailoredSkills(e.target.value)}
                  placeholder={obs.job_description_keywords?.join(', ')}
                  className="w-full bg-surface-700 border border-surface-600 rounded-lg px-3 py-2 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-brand-500/50"
                />
              </div>
            </div>
          )}

          {finalGrade && (
            <div className={`rounded-xl p-4 text-center border animate-slide-in
              ${finalGrade.type === 'success' ? 'bg-green-900/20 border-green-700/50' : 'bg-yellow-900/20 border-yellow-700/50'}`}>
              <div className="text-2xl font-bold text-white mb-1">{finalGrade.label}</div>
              <div className="text-xs text-slate-400">{finalGrade.message}</div>
            </div>
          )}
        </div>

        {/* Right: charts + log */}
        <div className="lg:col-span-2 space-y-4">
          <RewardChart history={rewardHistory} />
          <StepLog logs={logs} />

          {/* Quick tips */}
          {!obs && (
            <div className="glass rounded-xl p-5">
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">How to Play</div>
              <div className="space-y-2 text-sm text-slate-400">
                <div className="flex gap-2"><span>1.</span><span>Select difficulty and press <strong className="text-slate-300">Start Episode</strong></span></div>
                <div className="flex gap-2"><span>2.</span><span>Check the platform — use <strong className="text-slate-300">apply_workday</strong> only for Workday (costs 3 steps)</span></div>
                <div className="flex gap-2"><span>3.</span><span>If a 🚨 recruiter event fires, use <strong className="text-slate-300">reply_email</strong> immediately or lose -1.0</span></div>
                <div className="flex gap-2"><span>4.</span><span>After applying, <strong className="text-slate-300">submit_application</strong> with matching skills for 2x reward</span></div>
                <div className="flex gap-2"><span>5.</span><span>Beat the deadline to score. Interview = 1.0, Cold apply = 0.2</span></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
