import { useState } from 'react'

function CodeBlock({ code }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <div className="relative group">
      <pre className="bg-surface-950 border border-white/5 rounded-xl p-4 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed">
        {code}
      </pre>
      <button onClick={copy}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity
                         bg-surface-700 hover:bg-surface-600 text-slate-400 text-xs px-2 py-1 rounded-lg border border-white/5">
        {copied ? '✓ Copied' : 'Copy'}
      </button>
    </div>
  )
}

function TryIt({ endpoint, method, defaultBody, label }) {
  const [body, setBody] = useState(defaultBody ? JSON.stringify(defaultBody, null, 2) : '')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const run = async () => {
    setLoading(true); setError(null)
    try {
      let data
      if (method === 'GET') {
        const res = await fetch(`/api${endpoint}`)
        data = await res.json()
      } else {
        const res = await fetch(`/api${endpoint}`, {
          method, headers: { 'Content-Type': 'application/json' },
          body: body || undefined,
        })
        data = await res.json()
      }
      setResult(data)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="bg-surface-800/60 border border-white/5 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500 font-medium">Try it live</span>
        <button onClick={run} disabled={loading} className="btn-primary text-xs py-1 px-3">
          {loading ? '⏳' : '▶ Send'}
        </button>
      </div>
      {defaultBody && (
        <textarea value={body} onChange={e => setBody(e.target.value)} rows={3}
                  className="input w-full text-xs font-mono resize-none" />
      )}
      {error && <div className="text-red-400 text-xs">{error}</div>}
      {result && (
        <pre className="text-xs font-mono text-green-300 bg-surface-950 rounded-xl p-3 overflow-x-auto max-h-48 border border-white/5">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  )
}

const ENDPOINTS = [
  {
    method: 'GET', path: '/state', label: 'Get State',
    desc: 'Returns the current observation — what the agent can see right now.',
    response: `{ "observation": { "job_title": "Backend Engineer", "company": "MidSizeCo", "platform": "linkedin_easy_apply", "day": 1, "deadline": 10, "days_remaining": 9, "done": false, "total_reward": 0, ... } }`,
    tryIt: { endpoint: '/state', method: 'GET' },
  },
  {
    method: 'POST', path: '/reset', label: 'Reset Episode',
    desc: 'Resets the environment to a fresh episode. Pass difficulty to select the task.',
    body: `{ "difficulty": "easy" | "medium" | "hard" }`,
    response: `{ "observation": { ... }, "message": "Episode reset. Difficulty: medium" }`,
    tryIt: { endpoint: '/reset', method: 'POST', defaultBody: { difficulty: 'medium' } },
  },
  {
    method: 'POST', path: '/step', label: 'Take Action',
    desc: 'Executes one action and returns the new observation, reward, done flag, and info.',
    body: `{ "action": "request_referral" | "reply_email" | "apply_workday" | "apply_1click" | "submit_application" | "wait", "tailored_skills": ["skill1", "skill2"]  // optional, for submit_application }`,
    response: `{ "observation": { ... }, "reward": 0.3, "done": false, "info": { "message": "Recruiter replied!" } }`,
    tryIt: { endpoint: '/step', method: 'POST', defaultBody: { action: 'wait' } },
  },
  {
    method: 'GET', path: '/actions', label: 'List Actions',
    desc: 'Returns all valid actions with descriptions and costs.',
    response: `{ "valid_actions": [ { "name": "request_referral", "description": "...", "cost": "1 step" }, ... ] }`,
    tryIt: { endpoint: '/actions', method: 'GET' },
  },
]

const OBS_FIELDS = [
  { field: 'job_title',                  type: 'string',  desc: 'Job title for this episode' },
  { field: 'company',                    type: 'string',  desc: 'Company name' },
  { field: 'platform',                   type: 'enum',    desc: 'workday | 1click | linkedin_easy_apply' },
  { field: 'job_description_keywords',   type: 'string[]',desc: 'Keywords for tailoring bonus' },
  { field: 'day',                        type: 'integer', desc: 'Current day in episode' },
  { field: 'deadline',                   type: 'integer', desc: 'Total days allowed' },
  { field: 'days_remaining',             type: 'integer', desc: 'Days left before deadline' },
  { field: 'referral_requested',         type: 'boolean', desc: 'Whether referral was requested' },
  { field: 'ghosted',                    type: 'boolean', desc: 'Whether contact ghosted you' },
  { field: 'applied',                    type: 'boolean', desc: 'Whether application was started' },
  { field: 'application_submitted',      type: 'boolean', desc: 'Whether application was finalized' },
  { field: 'recruiter_event',            type: 'object?', desc: 'Active recruiter curveball event' },
  { field: 'recruiter_replied_pending',  type: 'boolean', desc: 'MUST reply_email immediately' },
  { field: 'got_interview',              type: 'boolean', desc: 'Whether interview was secured' },
  { field: 'done',                       type: 'boolean', desc: 'Whether episode is complete' },
  { field: 'terminal_reason',            type: 'string?', desc: 'interview_secured | applied_with_referral | applied_cold | deadline_missed' },
  { field: 'steps_taken',               type: 'integer', desc: 'Total steps used so far' },
  { field: 'total_reward',              type: 'float',   desc: 'Cumulative reward this episode' },
]

const METHOD_COLOR = {
  GET:  'bg-green-500/15 text-green-400 border-green-500/30',
  POST: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
}

const PYTHON_SNIPPET = `import requests, os

API = "http://localhost:3000"

# Reset
obs = requests.post(f"{API}/reset", json={"difficulty": "medium"}).json()["observation"]

# Step loop
while not obs["done"]:
    action = "reply_email" if obs["recruiter_replied_pending"] else "apply_1click"
    result = requests.post(f"{API}/step", json={"action": action}).json()
    obs = result["observation"]
    print(f"Step {obs['steps_taken']}: reward={result['reward']:.3f}")

print(f"Final reward: {obs['total_reward']:.3f}")`

export default function DocsPage() {
  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">

      {/* Header */}
      <div className="glass-bright rounded-2xl p-5">
        <div className="text-lg font-bold text-white mb-1">API Reference</div>
        <p className="text-slate-400 text-sm">
          Full HTTP interface for the Job Application RL Environment. All endpoints return JSON.
          Base URL: <code className="text-brand-300 bg-brand-500/10 px-1.5 py-0.5 rounded text-xs font-mono">http://localhost:3000</code>
        </p>
      </div>

      {/* Endpoints */}
      {ENDPOINTS.map(ep => (
        <div key={ep.path} className="card space-y-4">
          <div className="flex items-center gap-3">
            <span className={`tag border font-mono font-bold ${METHOD_COLOR[ep.method]}`}>{ep.method}</span>
            <code className="text-white font-mono text-sm">{ep.path}</code>
            <span className="text-slate-500 text-sm">{ep.label}</span>
          </div>
          <p className="text-slate-400 text-sm">{ep.desc}</p>
          {ep.body && (
            <div>
              <div className="section-title">Request Body</div>
              <CodeBlock code={ep.body} />
            </div>
          )}
          <div>
            <div className="section-title">Response</div>
            <CodeBlock code={ep.response} />
          </div>
          <TryIt {...ep.tryIt} />
        </div>
      ))}

      {/* Observation space */}
      <div className="card">
        <div className="section-title">Observation Space</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-slate-500 font-medium pb-2 pr-4">Field</th>
                <th className="text-left text-slate-500 font-medium pb-2 pr-4">Type</th>
                <th className="text-left text-slate-500 font-medium pb-2">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {OBS_FIELDS.map(({ field, type, desc }) => (
                <tr key={field} className="hover:bg-white/5 transition-colors">
                  <td className="py-2 pr-4 font-mono text-brand-300">{field}</td>
                  <td className="py-2 pr-4 text-amber-400">{type}</td>
                  <td className="py-2 text-slate-400">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Python quickstart */}
      <div className="card">
        <div className="section-title">Python Quick Start</div>
        <CodeBlock code={PYTHON_SNIPPET} />
      </div>

    </div>
  )
}
