import { useState, useRef, useCallback } from 'react'
import { api } from '../api/client.js'
import StatePanel from '../components/StatePanel.jsx'
import RewardChart from '../components/RewardChart.jsx'
import StepLog from '../components/StepLog.jsx'

const SYSTEM_PROMPT = `You are an AI agent playing a job application simulation.
Goal: Secure an interview before the deadline.
Rules:
- If recruiter_replied_pending is true, you MUST use reply_email or face -1.0 penalty
- Platform matters: apply_workday costs 3 steps (only for platform=workday), apply_1click costs 1 step (not for workday)
- After applying, call submit_application with tailored_skills matching job_description_keywords
- Every step costs -0.01 (time penalty), act efficiently
Respond ONLY with valid JSON: {"action":"...","tailored_skills":[],"reasoning":"..."}`

const PRESETS = {
  easy:   { job_title: 'Frontend Developer Intern', company: 'StartupXYZ',  platform: '1click',             deadline: 15, keywords: 'React, CSS, JavaScript',                                    chaos_enabled: false, ghosting_probability: 0,   recruiter_curveball_probability: 0    },
  medium: { job_title: 'Backend Engineer',          company: 'MidSizeCo',   platform: 'linkedin_easy_apply', deadline: 10, keywords: 'Node.js, PostgreSQL, REST APIs, Docker',                    chaos_enabled: true,  ghosting_probability: 0.3, recruiter_curveball_probability: 0.2  },
  hard:   { job_title: 'Software Engineer',         company: 'BigTechCorp', platform: 'workday',             deadline: 7,  keywords: 'System Design, Python, Distributed Systems, Kubernetes, Go', chaos_enabled: true,  ghosting_probability: 0.5, recruiter_curveball_probability: 0.35 },
}

const DEFAULT_CUSTOM = {
  job_title: '', company: '', platform: '1click', deadline: 10,
  keywords: '', chaos_enabled: true, ghosting_probability: 0.3,
  recruiter_curveball_probability: 0.2, require_tailoring: false,
}

function buildPrompt(obs) {
  return `Current state:\n${JSON.stringify(obs, null, 2)}\n\nWhat action do you take? Respond with JSON only.`
}

function parseAction(text) {
  try {
    const match = text.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0])
  } catch {}
  return null
}

export default function AgentRunner() {
  const [mode, setMode] = useState('medium')
  const [custom, setCustom] = useState(DEFAULT_CUSTOM)
  const [showCustom, setShowCustom] = useState(false)

  const [apiBase, setApiBase] = useState(import.meta.env.VITE_LLM_API_BASE || 'https://api.openai.com/v1')
  const [modelName, setModelName] = useState(import.meta.env.VITE_MODEL_NAME || 'gpt-4o-mini')
  const [apiKey, setApiKey] = useState('')
  const [episodes, setEpisodes] = useState(1)

  const [running, setRunning] = useState(false)
  const [obs, setObs] = useState(null)
  const [logs, setLogs] = useState([])
  const [rewardHistory, setRewardHistory] = useState([])
  const [scores, setScores] = useState([])
  const [status, setStatus] = useState('')
  const [error, setError] = useState(null)
  const stopRef = useRef(false)

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

  const setField = (k, v) => setCustom(prev => ({ ...prev, [k]: v }))

  async function callLLM(messages) {
    const res = await fetch(`${apiBase}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ model: modelName, messages, temperature: 0.7, max_tokens: 300 }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error?.message || `LLM API error ${res.status}`)
    }
    const data = await res.json()
    return data.choices[0].message.content
  }

  async function runEpisode(ep) {
    const config = buildResetConfig()
    const label = mode === 'custom' ? `${custom.job_title || 'Custom'} @ ${custom.company || 'Corp'}` : mode.toUpperCase()
    setStatus(`Episode ${ep} — resetting (${label})…`)

    const resetData = await api.reset(config)
    let currentObs = resetData.observation
    setObs(currentObs)
    setRewardHistory([])

    addLog({ step: 0, label: `▶ Episode ${ep} START — ${label}`, type: 'info',
             message: `${currentObs.job_title} @ ${currentObs.company} | ${currentObs.platform} | deadline: ${currentObs.deadline}d` })

    const messages = [{ role: 'system', content: SYSTEM_PROMPT }]
    let stepNum = 0

    while (!currentObs.done && !stopRef.current) {
      stepNum++
      setStatus(`Episode ${ep} — step ${stepNum}`)
      messages.push({ role: 'user', content: buildPrompt(currentObs) })

      let parsed = null
      try {
        const raw = await callLLM(messages)
        messages.push({ role: 'assistant', content: raw })
        parsed = parseAction(raw)
      } catch (e) {
        addLog({ step: stepNum, label: 'LLM Error', type: 'error', message: e.message })
        break
      }

      if (!parsed?.action) {
        addLog({ step: stepNum, label: 'Parse Error', type: 'error', message: 'Could not parse action' })
        break
      }

      try {
        const result = await api.step(parsed.action, parsed.tailored_skills?.length ? parsed.tailored_skills : undefined)
        currentObs = result.observation
        setObs(currentObs)
        setRewardHistory(prev => [...prev, result.reward])
        addLog({
          step: stepNum, label: parsed.action.replace(/_/g, ' '),
          reward: result.reward,
          type: result.reward > 0 ? 'success' : result.reward < -0.5 ? 'error' : 'info',
          message: parsed.reasoning || result.info?.message || '',
        })
        if (result.info?.final_grade) {
          const g = result.info.final_grade
          addLog({
            step: stepNum, label: `FINAL: ${g.score.toFixed(3)}`,
            type: g.score >= 0.5 ? 'success' : 'warning',
            message: `${result.info.terminal_reason} | ×${g.breakdown?.tailoring_multiplier ?? 1} tailoring`,
          })
          return g.score
        }
      } catch (e) {
        addLog({ step: stepNum, label: 'Step Error', type: 'error', message: e.message })
        break
      }
    }
    return currentObs.total_reward ?? 0
  }

  const handleRun = async () => {
    if (!apiKey.trim()) { setError('API key is required'); return }
    setRunning(true); setError(null); setScores([]); setLogs([]); stopRef.current = false

    const allScores = []
    for (let ep = 1; ep <= episodes; ep++) {
      if (stopRef.current) break
      try {
        const score = await runEpisode(ep)
        allScores.push(score)
        setScores([...allScores])
      } catch (e) { setError(e.message); break }
    }

    const avg = allScores.length ? allScores.reduce((a, b) => a + b, 0) / allScores.length : 0
    addLog({ label: `RUN COMPLETE — avg: ${avg.toFixed(3)}`, type: 'success', message: `${allScores.length} episode(s)` })
    setStatus(`Done — avg: ${avg.toFixed(3)}`)
    setRunning(false)
  }

  const avgScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null

  return (
    <div className="space-y-4 animate-fade-in">

      {/* LLM Config */}
      <div className="glass rounded-2xl p-5 space-y-4">
        <div className="section-title">Agent Configuration</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-500 block mb-1">LLM API Base URL</label>
            <input value={apiBase} onChange={e => setApiBase(e.target.value)}
                   className="input w-full text-xs" placeholder="https://api.openai.com/v1" />
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">Model Name</label>
            <input value={modelName} onChange={e => setModelName(e.target.value)}
                   className="input w-full text-xs" placeholder="gpt-4o-mini" />
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">API Key</label>
            <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)}
                   className="input w-full text-xs" placeholder="sk-…" />
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">Episodes</label>
            <input type="number" min={1} max={20} value={episodes}
                   onChange={e => setEpisodes(Number(e.target.value))}
                   className="input w-full text-xs" />
          </div>
        </div>

        {/* Scenario mode */}
        <div className="border-t border-white/5 pt-3 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="section-title mb-0 shrink-0">Scenario</span>
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
          </div>

          {showCustom && (
            <div className="space-y-3 animate-fade-in">
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
                         onChange={e => setField('deadline', e.target.value)} className="input w-full text-xs" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 uppercase tracking-wide block mb-1">Ghosting Prob.</label>
                  <input type="number" min={0} max={1} step={0.05} value={custom.ghosting_probability}
                         onChange={e => setField('ghosting_probability', e.target.value)} className="input w-full text-xs" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 uppercase tracking-wide block mb-1">Curveball Prob.</label>
                  <input type="number" min={0} max={1} step={0.05} value={custom.recruiter_curveball_probability}
                         onChange={e => setField('recruiter_curveball_probability', e.target.value)} className="input w-full text-xs" />
                </div>
                <div className="col-span-2 md:col-span-3">
                  <label className="text-[10px] text-slate-500 uppercase tracking-wide block mb-1">Keywords (comma-separated)</label>
                  <input value={custom.keywords} onChange={e => setField('keywords', e.target.value)}
                         placeholder="Python, FastAPI, Docker…" className="input w-full text-xs" />
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={custom.chaos_enabled}
                           onChange={e => setField('chaos_enabled', e.target.checked)} className="accent-brand-500" />
                    <span className="text-xs text-slate-300">Chaos</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={custom.require_tailoring}
                           onChange={e => setField('require_tailoring', e.target.checked)} className="accent-brand-500" />
                    <span className="text-xs text-slate-300">Require tailoring</span>
                  </label>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-600">Quick-fill:</span>
                {['easy', 'medium', 'hard'].map(d => (
                  <button key={d} onClick={() => setCustom({ ...PRESETS[d] })}
                          className="text-[10px] text-slate-400 hover:text-slate-200 underline underline-offset-2">
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-1">
          {running && (
            <button onClick={() => { stopRef.current = true }} className="btn-danger text-sm">■ Stop</button>
          )}
          <button onClick={handleRun} disabled={running} className="btn-primary text-sm ml-auto">
            {running ? '⏳ Running…' : '▶ Run Agent'}
          </button>
        </div>

        {status && <div className="text-xs text-slate-400 font-mono bg-surface-700/50 rounded-lg px-3 py-2">{status}</div>}
        {error  && <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/25 rounded-lg px-3 py-2">{error}</div>}
      </div>

      {/* Scores */}
      {scores.length > 0 && (
        <div className="glass rounded-2xl p-4 flex flex-wrap items-center gap-4">
          <div className="section-title mb-0">Episode Scores</div>
          <div className="flex flex-wrap gap-2">
            {scores.map((s, i) => (
              <div key={i} className={`tag border font-mono ${
                s >= 0.7 ? 'bg-green-500/15 text-green-400 border-green-500/30' :
                s >= 0.4 ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' :
                           'bg-red-500/15 text-red-400 border-red-500/30'
              }`}>Ep {i + 1}: {s.toFixed(3)}</div>
            ))}
          </div>
          {avgScore !== null && (
            <div className="ml-auto text-sm font-bold font-mono text-white">
              Avg: <span className={avgScore >= 0.7 ? 'text-green-400' : avgScore >= 0.4 ? 'text-amber-400' : 'text-red-400'}>
                {avgScore.toFixed(3)}
              </span>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <StatePanel obs={obs} />
        <div className="space-y-4">
          <RewardChart history={rewardHistory} />
          <StepLog logs={logs} />
        </div>
      </div>
    </div>
  )
}
