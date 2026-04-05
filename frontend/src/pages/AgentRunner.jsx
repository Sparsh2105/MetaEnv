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
  const [difficulty, setDifficulty] = useState('medium')
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

  async function runEpisode(ep, diff) {
    setStatus(`Episode ${ep} — resetting (${diff})…`)
    const resetData = await api.reset(diff)
    let currentObs = resetData.observation
    setObs(currentObs)
    setRewardHistory([])

    addLog({ step: 0, label: `▶ Episode ${ep} START — ${diff.toUpperCase()}`, type: 'info',
             message: `${currentObs.job_title} @ ${currentObs.company} | deadline: ${currentObs.deadline}d` })

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
          step: stepNum,
          label: parsed.action.replace(/_/g, ' '),
          reward: result.reward,
          type: result.reward > 0 ? 'success' : result.reward < -0.5 ? 'error' : 'info',
          message: parsed.reasoning || result.info?.message || '',
        })

        if (result.info?.final_grade) {
          const g = result.info.final_grade
          addLog({
            step: stepNum,
            label: `FINAL: ${g.score.toFixed(3)}`,
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
        const score = await runEpisode(ep, difficulty)
        allScores.push(score)
        setScores([...allScores])
      } catch (e) {
        setError(e.message)
        break
      }
    }

    const avg = allScores.length ? allScores.reduce((a, b) => a + b, 0) / allScores.length : 0
    addLog({ label: `RUN COMPLETE — avg score: ${avg.toFixed(3)}`, type: 'success',
             message: `${allScores.length} episode(s)` })
    setStatus(`Done — avg: ${avg.toFixed(3)}`)
    setRunning(false)
  }

  const avgScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null

  return (
    <div className="space-y-4 animate-fade-in">

      {/* Config panel */}
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
            <input type="number" min={1} max={10} value={episodes}
                   onChange={e => setEpisodes(Number(e.target.value))}
                   className="input w-full text-xs" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <div className="flex gap-2">
            {['easy', 'medium', 'hard'].map(d => (
              <button key={d} onClick={() => setDifficulty(d)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                        difficulty === d
                          ? d === 'easy'   ? 'bg-green-500/20 text-green-300 border-green-500/40'
                          : d === 'medium' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          :                  'bg-red-500/20 text-red-300 border-red-500/40'
                          : 'bg-surface-700 text-slate-400 border-white/5'
                      }`}>
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex gap-2 ml-auto">
            {running && (
              <button onClick={() => { stopRef.current = true }} className="btn-danger text-sm">
                ■ Stop
              </button>
            )}
            <button onClick={handleRun} disabled={running} className="btn-primary text-sm">
              {running ? '⏳ Running…' : '▶ Run Agent'}
            </button>
          </div>
        </div>

        {status && (
          <div className="text-xs text-slate-400 font-mono bg-surface-700/50 rounded-lg px-3 py-2">
            {status}
          </div>
        )}
        {error && (
          <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/25 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
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
              }`}>
                Ep {i + 1}: {s.toFixed(3)}
              </div>
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
        <div className="space-y-4">
          <StatePanel obs={obs} />
        </div>
        <div className="space-y-4">
          <RewardChart history={rewardHistory} />
          <StepLog logs={logs} />
        </div>
      </div>

    </div>
  )
}
