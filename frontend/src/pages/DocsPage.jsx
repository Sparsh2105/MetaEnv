import { useState } from 'react'
import { api } from '../api/client.js'

function CodeBlock({ code, lang = 'json' }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <div className="relative group">
      <pre className="bg-surface-800 border border-surface-600 rounded-lg p-4 text-xs terminal-text text-slate-300 overflow-x-auto">
        {code}
      </pre>
      <button
        onClick={copy}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity
                   bg-surface-600 hover:bg-surface-500 text-slate-400 text-xs px-2 py-1 rounded"
      >
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
    setLoading(true)
    setError(null)
    try {
      let data
      if (method === 'GET') {
        const res = await fetch(`/api${endpoint}`)
        data = await res.json()
      } else {
        const res = await fetch(`/api${endpoint}`, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: body || undefined,
        })
        data = await res.json()
      }
      setResult(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-surface-800 border border-surface-600 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400 font-medium">Try it live</span>
        <button onClick={run} disabled={loading} className="btn-primary text-xs py-1 px-3">
          {loading ? '⏳' : '▶ Send'}
        </button>
      </div>
      {defaultBody && (
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          rows={3}
          className="w-full bg-surface-700 border border-surface-600 rounded-lg px-3 py-2 text-xs terminal-text text-slate-300 focus:outline-none focus:border-brand-500/50 resize-none"
        />
      )}
      {error && <div className="text-red-400 text-xs">{error}</div>}
      {result && (
        <pre className="text-xs terminal-text text-green-300 bg-surface-900 rounded-lg p-3 overflow-x-auto max-h-48">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  )
}

const ENDPOINTS = [
  {
    method: 'GET', path: '/state', color: 'text-green-400 bg-green-900/30 border-green-700/50',
    desc: 'Returns the current observation — what the agent can see.',
    response: `{
  "observation": {
    "job_title": "Backend Engineer",
    "company": "MidSizeCo",
    "platform": "linkedin_easy_apply",
    "job_description_keywords": ["Node.js", "PostgreSQL", "REST APIs", "Docker"],
    "day": 3,
    "deadline": 10,
    "days_remaining": 7,
    "recruiter_event": null,
    "done": false,
    "total_reward": -0.02
  }
}`,
  },
  {
    method: 'POST', path: '/reset', color: 'text-blue-400 bg-blue-900/30 border-blue-700/50',
    desc: 'Resets the episode. Pass difficulty: easy | medium | hard.',
    body: { difficulty: 'medium' },
    response: `{
  "observation": { ... },
  "message": "Episode reset. Difficulty: medium"
}`,
  },
  {
    method: 'POST', path: '/step', color: 'text-blue-400 bg-blue-900/30 border-blue-700/50',
    desc: 'Takes one action. Returns observation, reward, done, info.',
    body: { action: 'apply_1click' },
    response: `{
  "observation": { "applied": true, "day": 4, ... },
  "reward": -0.01,
  "done": false,
  "info": { "event": "applied_1click", "message": "Applied via 1-click." }
}`,
  },
  {
    method: 'GET', path: '/actions', color: 'text-green-400 bg-green-900/30 border-green-700/50',
    desc: 'Lists all valid actions with descriptions and costs.',
    response: `{
  "valid_actions": [
    { "name": "request_referral", "description": "...", "cost": "1 step" },
    { "name": "reply_email", ... },
    ...
  ]
}`,
  },
]

export default function DocsPage() {
  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {/* Intro */}
      <div className="glass-bright rounded-xl p-6">
        <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">OpenEnv API Reference</div>
        <h2 className="text-xl font-bold text-white mb-2">Job Application RL Environment</h2>
        <p className="text-slate-400 text-sm leading-relaxed">
          A stateful HTTP API implementing the OpenEnv spec. Each session maintains one environment instance.
          Call <code className="text-brand-400 bg-brand-500/10 px-1 rounded">/reset</code> to start a new episode,
          then loop <code className="text-brand-400 bg-brand-500/10 px-1 rounded">/step</code> until{' '}
          <code className="text-brand-400 bg-brand-500/10 px-1 rounded">done: true</code>.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="tag bg-surface-700 text-slate-400 border border-surface-600">Base: http://localhost:3000</span>
          <span className="tag bg-surface-700 text-slate-400 border border-surface-600">HF Space: PORT 7860</span>
          <span className="tag bg-brand-500/15 text-brand-400 border border-brand-500/30">OpenEnv v1.0</span>
        </div>
      </div>

      {/* Endpoints */}
      {ENDPOINTS.map(ep => (
        <div key={ep.path} className="glass rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-surface-600">
            <div className="flex items-center gap-3 mb-2">
              <span className={`tag border font-mono font-bold ${ep.color}`}>{ep.method}</span>
              <code className="text-white font-mono text-sm">{ep.path}</code>
            </div>
            <p className="text-slate-400 text-sm">{ep.desc}</p>
          </div>
          <div className="p-5 space-y-4">
            {ep.body && (
              <div>
                <div className="text-xs text-slate-500 mb-2">Request Body</div>
                <CodeBlock code={JSON.stringify(ep.body, null, 2)} />
              </div>
            )}
            <div>
              <div className="text-xs text-slate-500 mb-2">Response</div>
              <CodeBlock code={ep.response} />
            </div>
            <TryIt endpoint={ep.path} method={ep.method} defaultBody={ep.body} />
          </div>
        </div>
      ))}

      {/* Observation space */}
      <div className="glass rounded-xl p-5">
        <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-4">Observation Space</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {[
            ['job_title', 'string', 'Job position title'],
            ['company', 'string', 'Company name'],
            ['platform', 'workday | 1click | linkedin_easy_apply', 'Application platform'],
            ['job_description_keywords', 'string[]', 'Keywords for resume tailoring'],
            ['day', 'integer', 'Current day (1-indexed)'],
            ['deadline', 'integer', 'Episode deadline in days'],
            ['days_remaining', 'integer', 'deadline - day'],
            ['referral_requested', 'boolean', 'Whether referral was requested'],
            ['ghosted', 'boolean', 'Whether referral contact ghosted'],
            ['applied', 'boolean', 'Whether application was submitted'],
            ['application_submitted', 'boolean', 'Whether final submission done'],
            ['recruiter_event', 'object | null', 'Pending recruiter curveball'],
            ['recruiter_replied_pending', 'boolean', 'MUST reply_email next step'],
            ['got_interview', 'boolean', 'Interview secured flag'],
            ['done', 'boolean', 'Episode terminal flag'],
            ['terminal_reason', 'string | null', 'Why episode ended'],
            ['steps_taken', 'integer', 'Total steps in episode'],
            ['total_reward', 'float', 'Accumulated reward'],
          ].map(([field, type, desc]) => (
            <div key={field} className="flex gap-3 bg-surface-700 rounded-lg px-3 py-2">
              <code className="text-brand-400 text-xs font-mono shrink-0 w-40">{field}</code>
              <div>
                <div className="text-slate-500 text-xs">{type}</div>
                <div className="text-slate-400 text-xs">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick start */}
      <div className="glass rounded-xl p-5">
        <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-4">Quick Start — Python</div>
        <CodeBlock lang="python" code={`import requests

BASE = "http://localhost:3000"

# Start episode
obs = requests.post(f"{BASE}/reset", json={"difficulty": "medium"}).json()["observation"]

# Agent loop
while not obs["done"]:
    # Your agent logic here
    action = "apply_1click"  # or use an LLM
    
    result = requests.post(f"{BASE}/step", json={"action": action}).json()
    obs = result["observation"]
    print(f"reward: {result['reward']}, done: {result['done']}")

print(f"Final score: {obs['total_reward']}")`} />
      </div>
    </div>
  )
}
