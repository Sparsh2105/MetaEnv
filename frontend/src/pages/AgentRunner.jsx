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
  const [currentStep, setCurrentStep] = useState(0)
  const [status, setStatus] = useState('')
  const [error, setError] = useState(null)
  const stopRef = useRef(false)

  const addLog = useCallback((entry) => setLogs(prev => [...prev, entry]), [])

  async function callLLM(messages) {
    const res = await fetch(`${apiBase}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages,
        temperature: 0.7,
        max_tokens: 300,
      }),
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
    setCurrentStep(0)

    addLog({ label: `▶ Episode ${ep} START — ${diff.toUpperCase()}`, type: 'info',
             message: `${currentObs.job_title} @ ${currentObs.company} | deadline: ${currentObs.deadline}d` })

    let stepNum = 0
    const MAX_STEPS = 30

    while (!currentObs.done && stepNum < MAX_STEPS && !stopRef.current) {
      stepNum++
      setCurrentStep(stepNum)
      setStatus(`Episode ${ep} — Step ${stepNum}…`)

      // Ask LLM
      let parsed = null
      try {
        const messages = [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildPrompt(currentObs) },
        ]
        const raw = await callLLM(messages)
        parsed = parseAction(raw)
        if (!parsed) throw new Error('Could not parse LLM response')
      } catch (e) {
        addLog({ label: 'LLM Error', type: 'error', message: e.message })
        break
      }

      const { action, tailored_skills, reasoning } = parsed
      addLog({
        step: stepNum,
        action,
        type: 'info',
        message: reasoning || '',
      })

      // Take action
      try {
        const result = await api.step(action, tailored_skills?.length ? tailored_skills : undefined)
        currentObs = result.observation
        setObs(currentObs)
        setRewardHistory(prev => [...prev, result.reward])

        const logType = result.reward > 0.1 ? 'success' : result.reward < -0.5 ? 'error' : 'info'
        addLog({
          step: stepNum,
          label: `reward`,
          type: logType,
          reward: result.reward,
          message: result.info?.message || result.info?.warning || result.info?.penalty || '',
        })

        if (result.info?.final_grade) {
          const g = result.info.final_grade
          addLog({
            label: `FINAL SCORE: ${g.score}`,
            type: g.score >= 0.5 ? 'success' : 'warning',
            message: `${result.info.terminal_reason} | tailoring: ${g.breakdown.tailoring_multiplier}x | steps: ${g.breakdown.steps_taken}`,
          })
          return g.score
        }
      } catch (e) {
        addLog({ label: 'Step Error', type: 'error', message: e.message })
        break
      }

      // Small delay for readability
      await new Promise(r => setTimeout(r, 400))
    }

    if (stepNum >= MAX_STEPS) {
      addLog({ label: 'Max steps reached', type: 'warning', message: 'Episode truncated' })
    }
    return currentObs.total_reward
  }

  const handleStart = async () => {
    if (!apiKey.trim()) { setError('API key is required'); return }
    setRunning(true)
    stopRef.current = false
    setError(null)
    setLogs([])
    setScores([])
    setObs(null)

    try {
      const allScores = []
      for (let ep = 1; ep <= episodes; ep++) {
        if (stopRef.current) break
        const score = await runEpisode(ep, difficulty)
        allScores.push(score)
        setScores([...allScores])
      }
      setStatus(`Done — ${allScores.length} episode(s) complete`)
    } catch (e) {
      setError(e.message)
      setStatus('Error')
    } finally {
      setRunning(false)
    }
  }

  const handleStop = () => {
    stopRef.current = true
    setStatus('Stopping…')
  }

  const avgScore = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(4) : null

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Config panel */}
      <div className="glass-bright rounded-xl p-5">
        <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-4">Agent Configuration</div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">LLM API Base URL</label>
            <input
              value={apiBase}
              onChange={e => setApiBase(e.target.value)}
              disabled={running}
              className="w-full bg-surface-700 border border-surface-600 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-brand-500/50 disabled:opacity-50"
              placeholder="https://api.openai.com/v1"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Model Name</label>
            <input
              value={modelName}
              onChange={e => setModelName(e.target.value)}
              disabled={running}
              className="w-full bg-surface-700 border border-surface-600 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-brand-500/50 disabled:opacity-50"
              placeholder="gpt-4o-mini"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              disabled={running}
              className="w-full bg-surface-700 border border-surface-600 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-brand-500/50 disabled:opacity-50"
              placeholder="sk-…"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Episodes</label>
            <input
              type="number"
              min={1}
              max={10}
              value={episodes}
              onChange={e => setEpisodes(Number(e.target.value))}
              disabled={running}
              className="w-full bg-surface-700 border border-surface-600 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-brand-500/50 disabled:opacity-50"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-4">
          <span className="text-xs text-slate-400">Difficulty:</span>
          {['easy', 'medium', 'hard'].map(d => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              disabled={running}
              className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all disabled:opacity-50
                ${difficulty === d
                  ? 'bg-brand-500/20 border-brand-500/50 text-brand-300'
                  : 'bg-surface-700 border-surface-600 text-slate-400 hover:border-slate-500'}`}
            >
              {d}
            </button>
          ))}
          <div className="ml-auto flex gap-2">
            {running ? (
              <button onClick={handleStop} className="btn-danger text-sm">⏹ Stop</button>
            ) : (
              <button onClick={handleStart} className="btn-primary text-sm">🤖 Run Agent</button>
            )}
          </div>
        </div>

        {/* Status bar */}
        {(running || status) && (
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
            {running && <div className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />}
            <span>{status}</span>
            {running && currentStep > 0 && <span className="text-slate-600">· step {currentStep}</span>}
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-700/50 rounded-xl px-4 py-3 text-red-300 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Scores summary */}
      {scores.length > 0 && (
        <div className="glass rounded-xl p-4 flex flex-wrap items-center gap-4 animate-slide-in">
          <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Results</div>
          {scores.map((s, i) => (
            <div key={i} className={`tag border font-mono
              ${s >= 0.8 ? 'bg-green-900/30 text-green-300 border-green-700/50' :
                s >= 0.4 ? 'bg-yellow-900/30 text-yellow-300 border-yellow-700/50' :
                'bg-red-900/30 text-red-300 border-red-700/50'}`}>
              Ep{i+1}: {s.toFixed(4)}
            </div>
          ))}
          {avgScore && (
            <div className="ml-auto text-sm font-bold text-white">
              Avg: <span className="text-brand-400 font-mono">{avgScore}</span>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-1 space-y-4">
          <StatePanel obs={obs} />
        </div>
        <div className="lg:col-span-2 space-y-4">
          <RewardChart history={rewardHistory} />
          <StepLog logs={logs} />
        </div>
      </div>
    </div>
  )
}
