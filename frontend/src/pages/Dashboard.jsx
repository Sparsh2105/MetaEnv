import { useState, useEffect } from 'react'
import { api } from '../api/client.js'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar } from 'recharts'

const TASK_INFO = {
  easy: {
    title: 'Frontend Developer Intern',
    company: 'StartupXYZ',
    platform: '1click',
    deadline: 15,
    keywords: ['React', 'CSS', 'JavaScript'],
    chaos: false,
    ghosting: '0%',
    curveball: '0%',
    desc: 'Straightforward 1-click apply. No chaos, no ghosting. Perfect for baseline agents.',
  },
  medium: {
    title: 'Backend Engineer',
    company: 'MidSizeCo',
    platform: 'linkedin_easy_apply',
    deadline: 10,
    keywords: ['Node.js', 'PostgreSQL', 'REST APIs', 'Docker'],
    chaos: true,
    ghosting: '30%',
    curveball: '20%',
    desc: 'Tighter deadline with recruiter chaos. Agent must handle curveballs and prioritize correctly.',
  },
  hard: {
    title: 'Software Engineer',
    company: 'BigTechCorp',
    platform: 'workday',
    deadline: 7,
    keywords: ['System Design', 'Python', 'Distributed Systems', 'Kubernetes', 'Go'],
    chaos: true,
    ghosting: '50%',
    curveball: '35%',
    desc: 'Workday costs 3 steps. High chaos, mandatory tailoring, brutal deadline. Frontier model territory.',
  },
}

const SCORE_DATA = [
  { name: 'Easy',   score: 0.82, fill: '#4ade80' },
  { name: 'Medium', score: 0.54, fill: '#facc15' },
  { name: 'Hard',   score: 0.21, fill: '#f87171' },
]

const REWARD_BREAKDOWN = [
  { name: 'Interview', value: 1.0, fill: '#4f6ef7' },
  { name: 'w/ Referral', value: 0.5, fill: '#818cf8' },
  { name: 'Cold Apply', value: 0.2, fill: '#a5b4fc' },
  { name: 'Missed', value: 0.0, fill: '#334155' },
]

export default function Dashboard() {
  const [apiStatus, setApiStatus] = useState(null)
  const [liveObs, setLiveObs] = useState(null)

  useEffect(() => {
    api.getState()
      .then(d => { setApiStatus('online'); setLiveObs(d.observation) })
      .catch(() => setApiStatus('offline'))
  }, [])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero */}
      <div className="glass-bright rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
             style={{background: 'radial-gradient(ellipse at 70% 50%, #4f6ef7 0%, transparent 70%)'}} />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="tag bg-brand-500/20 text-brand-400 border border-brand-500/30">OpenEnv v1.0</span>
              <span className="tag bg-green-900/30 text-green-400 border border-green-700/30">
                {apiStatus === 'online' ? '● Live' : apiStatus === 'offline' ? '○ Offline' : '◌ Checking'}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Job Application RL Environment</h1>
            <p className="text-slate-400 text-sm max-w-xl">
              Train and evaluate LLM agents on real-world job application tasks — time pressure,
              recruiter chaos, platform constraints, and resume tailoring mechanics.
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <div className="stat-card text-center min-w-[80px]">
              <div className="text-2xl font-bold text-brand-400">3</div>
              <div className="text-xs text-slate-500">Tasks</div>
            </div>
            <div className="stat-card text-center min-w-[80px]">
              <div className="text-2xl font-bold text-green-400">6</div>
              <div className="text-xs text-slate-500">Actions</div>
            </div>
            <div className="stat-card text-center min-w-[80px]">
              <div className="text-2xl font-bold text-yellow-400">1.0</div>
              <div className="text-xs text-slate-500">Max Score</div>
            </div>
          </div>
        </div>
      </div>

      {/* Live state strip */}
      {liveObs && (
        <div className="glass rounded-xl px-5 py-3 flex flex-wrap items-center gap-4 text-sm">
          <span className="text-slate-400 text-xs font-medium">LIVE STATE</span>
          <span className="text-white font-medium">{liveObs.job_title}</span>
          <span className="text-slate-400">@{liveObs.company}</span>
          <span className="tag bg-surface-600 text-slate-300">Day {liveObs.day}/{liveObs.deadline}</span>
          <span className={`font-mono text-xs ${liveObs.total_reward >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            reward: {liveObs.total_reward >= 0 ? '+' : ''}{liveObs.total_reward?.toFixed(4)}
          </span>
          {liveObs.done && <span className="tag bg-brand-500/20 text-brand-400 border border-brand-500/30">Episode Done</span>}
        </div>
      )}

      {/* Task cards */}
      <div>
        <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Task Scenarios</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(TASK_INFO).map(([diff, info]) => {
            const colors = {
              easy:   { border: 'border-green-700/30',  badge: 'bg-green-900/30 text-green-300',  glow: 'rgba(74,222,128,0.1)' },
              medium: { border: 'border-yellow-700/30', badge: 'bg-yellow-900/30 text-yellow-300', glow: 'rgba(250,204,21,0.1)' },
              hard:   { border: 'border-red-700/30',    badge: 'bg-red-900/30 text-red-300',       glow: 'rgba(248,113,113,0.1)' },
            }[diff]
            return (
              <div key={diff}
                   className={`glass rounded-xl p-5 border ${colors.border} hover:glow-border transition-all duration-300`}
                   style={{background: `radial-gradient(ellipse at top right, ${colors.glow}, transparent 70%)`}}>
                <div className="flex items-center justify-between mb-3">
                  <span className={`tag ${colors.badge} capitalize font-semibold`}>{diff}</span>
                  <span className="text-xs text-slate-500">deadline: {info.deadline}d</span>
                </div>
                <div className="font-bold text-white text-sm mb-0.5">{info.title}</div>
                <div className="text-slate-400 text-xs mb-3">{info.company} · {info.platform}</div>
                <p className="text-slate-500 text-xs mb-3 leading-relaxed">{info.desc}</p>
                <div className="flex flex-wrap gap-1 mb-3">
                  {info.keywords.map(k => (
                    <span key={k} className="tag bg-brand-500/10 text-brand-400 border border-brand-500/20 text-xs">{k}</span>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-surface-700 rounded-lg px-2 py-1.5">
                    <div className="text-slate-500">Ghosting</div>
                    <div className="text-white font-medium">{info.ghosting}</div>
                  </div>
                  <div className="bg-surface-700 rounded-lg px-2 py-1.5">
                    <div className="text-slate-500">Curveball</div>
                    <div className="text-white font-medium">{info.curveball}</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass rounded-xl p-4">
          <div className="text-xs text-slate-400 mb-3 font-medium">Baseline Agent Scores</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={SCORE_DATA} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(79,110,247,0.1)" />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis domain={[0, 1]} tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#0f1629', border: '1px solid rgba(79,110,247,0.3)', borderRadius: 8 }}
                labelStyle={{ color: '#94a3b8' }}
                itemStyle={{ color: '#e2e8f0' }}
              />
              <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                {SCORE_DATA.map((entry, i) => (
                  <rect key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass rounded-xl p-4">
          <div className="text-xs text-slate-400 mb-3 font-medium">Terminal Reward Structure</div>
          <div className="space-y-2.5 mt-4">
            {[
              { label: 'Interview Secured', score: 1.0, color: 'bg-brand-500', text: 'text-brand-400' },
              { label: 'Applied w/ Referral', score: 0.5, color: 'bg-purple-500', text: 'text-purple-400' },
              { label: 'Cold Apply', score: 0.2, color: 'bg-slate-500', text: 'text-slate-400' },
              { label: 'Deadline Missed', score: 0.0, color: 'bg-red-900', text: 'text-red-500' },
            ].map(({ label, score, color, text }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="text-xs text-slate-400 w-36 shrink-0">{label}</div>
                <div className="flex-1 h-2 bg-surface-600 rounded-full overflow-hidden">
                  <div className={`h-full ${color} rounded-full`} style={{ width: `${score * 100}%` }} />
                </div>
                <div className={`text-xs font-mono font-bold ${text} w-8 text-right`}>{score.toFixed(1)}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-surface-600 text-xs text-slate-500">
            + Tailoring multiplier: 1.5x (50%+ match) or 2.0x (80%+ match)
          </div>
        </div>
      </div>

      {/* Reward mechanics */}
      <div className="glass rounded-xl p-5">
        <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-4">Reward Mechanics</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Step Penalty',        val: '-0.01', desc: 'Every step costs time', color: 'text-red-400' },
            { label: 'Missed Recruiter',    val: '-1.00', desc: 'Ignore curveball event', color: 'text-red-400' },
            { label: 'Wrong Platform',      val: '-0.10', desc: 'Wrong apply action', color: 'text-orange-400' },
            { label: 'Recruiter Reply',     val: '+0.30', desc: 'Correct prioritization', color: 'text-green-400' },
          ].map(({ label, val, desc, color }) => (
            <div key={label} className="bg-surface-700 rounded-lg p-3">
              <div className={`font-mono font-bold text-lg ${color}`}>{val}</div>
              <div className="text-white text-xs font-medium mt-1">{label}</div>
              <div className="text-slate-500 text-xs">{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
