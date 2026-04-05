import { useState, useEffect } from 'react'
import { api } from '../api/client.js'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadialBarChart, RadialBar, Cell,
} from 'recharts'

const TASKS = {
  easy: {
    title: 'Frontend Developer Intern', company: 'StartupXYZ', platform: '1click',
    deadline: 15, keywords: ['React', 'CSS', 'JavaScript'],
    chaos: false, ghosting: '0%', curveball: '0%',
    score: 0.82,
    desc: 'Straightforward 1-click apply. No chaos, no ghosting. Perfect for baseline agents.',
  },
  medium: {
    title: 'Backend Engineer', company: 'MidSizeCo', platform: 'linkedin_easy_apply',
    deadline: 10, keywords: ['Node.js', 'PostgreSQL', 'REST APIs', 'Docker'],
    chaos: true, ghosting: '30%', curveball: '20%',
    score: 0.54,
    desc: 'Tighter deadline with recruiter chaos. Agent must handle curveballs and prioritize correctly.',
  },
  hard: {
    title: 'Software Engineer', company: 'BigTechCorp', platform: 'workday',
    deadline: 7, keywords: ['System Design', 'Python', 'Distributed Systems', 'Kubernetes', 'Go'],
    chaos: true, ghosting: '50%', curveball: '35%',
    score: 0.21,
    desc: 'Workday costs 3 steps. High chaos, mandatory tailoring, brutal deadline. Frontier model territory.',
  },
}

const SCORE_DATA = [
  { name: 'Easy',   score: 0.82, fill: '#4ade80' },
  { name: 'Medium', score: 0.54, fill: '#fbbf24' },
  { name: 'Hard',   score: 0.21, fill: '#f87171' },
]

const REWARD_ROWS = [
  { event: 'Interview secured',       reward: '+1.00', color: 'text-green-400',  bg: 'bg-green-500/10' },
  { event: 'Applied with referral',   reward: '+0.50', color: 'text-green-400',  bg: 'bg-green-500/10' },
  { event: 'Cold application',        reward: '+0.20', color: 'text-amber-400',  bg: 'bg-amber-500/10' },
  { event: 'Recruiter reply bonus',   reward: '+0.30', color: 'text-blue-400',   bg: 'bg-blue-500/10'  },
  { event: 'Tailoring 80%+ match',    reward: '×2.00', color: 'text-purple-400', bg: 'bg-purple-500/10'},
  { event: 'Tailoring 50%+ match',    reward: '×1.50', color: 'text-purple-400', bg: 'bg-purple-500/10'},
  { event: 'Per step (time penalty)', reward: '−0.01', color: 'text-red-400',    bg: 'bg-red-500/10'   },
  { event: 'Missed recruiter event',  reward: '−1.00', color: 'text-red-400',    bg: 'bg-red-500/10'   },
  { event: 'Wrong platform action',   reward: '−0.10', color: 'text-red-400',    bg: 'bg-red-500/10'   },
  { event: 'Deadline missed',         reward: '0.00',  color: 'text-slate-500',  bg: 'bg-surface-700'  },
]

const CustomBarTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-lg px-3 py-2 text-xs border border-white/10">
      <div className="text-slate-400">{payload[0].payload.name}</div>
      <div className="font-bold font-mono text-white">{payload[0].value.toFixed(2)}</div>
    </div>
  )
}

function TaskCard({ difficulty, task }) {
  const diffStyle = {
    easy:   { badge: 'badge-easy',   glow: 'hover:border-green-500/30 hover:shadow-green-500/10' },
    medium: { badge: 'badge-medium', glow: 'hover:border-amber-500/30 hover:shadow-amber-500/10' },
    hard:   { badge: 'badge-hard',   glow: 'hover:border-red-500/30 hover:shadow-red-500/10'     },
  }[difficulty]

  const scoreColor = task.score >= 0.7 ? 'text-green-400' : task.score >= 0.4 ? 'text-amber-400' : 'text-red-400'
  const barColor   = task.score >= 0.7 ? 'bg-green-500' : task.score >= 0.4 ? 'bg-amber-500' : 'bg-red-500'

  return (
    <div className={`card-hover ${diffStyle.glow} hover:shadow-lg`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-white font-semibold text-sm">{task.title}</div>
          <div className="text-slate-500 text-xs mt-0.5">{task.company}</div>
        </div>
        <span className={diffStyle.badge}>{difficulty}</span>
      </div>

      <p className="text-slate-400 text-xs leading-relaxed mb-4">{task.desc}</p>

      <div className="grid grid-cols-2 gap-2 mb-4">
        {[
          { label: 'Platform',  val: task.platform },
          { label: 'Deadline',  val: `${task.deadline} days` },
          { label: 'Ghosting',  val: task.ghosting },
          { label: 'Curveball', val: task.curveball },
        ].map(({ label, val }) => (
          <div key={label} className="bg-surface-700/50 rounded-lg px-2.5 py-1.5">
            <div className="text-[10px] text-slate-500 uppercase tracking-wide">{label}</div>
            <div className="text-xs text-slate-200 font-medium mt-0.5">{val}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-1 mb-4">
        {task.keywords.map(k => (
          <span key={k} className="tag bg-brand-500/10 text-brand-300 border border-brand-500/20">{k}</span>
        ))}
      </div>

      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-slate-500">Baseline Score (gpt-4o-mini)</span>
          <span className={`font-bold font-mono ${scoreColor}`}>{task.score.toFixed(2)}</span>
        </div>
        <div className="h-1.5 bg-surface-600 rounded-full overflow-hidden">
          <div className={`h-full ${barColor} rounded-full`} style={{ width: `${task.score * 100}%` }} />
        </div>
      </div>
    </div>
  )
}

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
      <div className="relative glass-bright rounded-2xl p-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
             style={{ background: 'radial-gradient(ellipse 60% 80% at 80% 50%, rgba(99,102,241,0.12), transparent)' }} />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="tag bg-brand-500/15 text-brand-300 border border-brand-500/25">OpenEnv v1.0</span>
              <span className={`tag border ${apiStatus === 'online' ? 'bg-green-500/10 text-green-400 border-green-500/25' : apiStatus === 'offline' ? 'bg-red-500/10 text-red-400 border-red-500/25' : 'bg-amber-500/10 text-amber-400 border-amber-500/25'}`}>
                {apiStatus === 'online' ? '● Live' : apiStatus === 'offline' ? '○ Offline' : '◌ Checking'}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2 leading-tight">
              Job Application RL Environment
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              Train and evaluate LLM agents on real-world job application tasks — time pressure,
              recruiter chaos, platform constraints, and resume tailoring mechanics.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 shrink-0">
            {[
              { label: 'Tasks',       val: '3',    sub: 'Easy → Hard'    },
              { label: 'Actions',     val: '6',    sub: 'Typed API'      },
              { label: 'Reward',      val: '0–1',  sub: 'Partial signal' },
              { label: 'Spec',        val: '✓',    sub: 'OpenEnv valid'  },
            ].map(({ label, val, sub }) => (
              <div key={label} className="stat-card text-center">
                <div className="text-xl font-bold text-white">{val}</div>
                <div className="text-xs font-medium text-slate-300">{label}</div>
                <div className="text-[10px] text-slate-500">{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Live state strip */}
      {liveObs && (
        <div className="glass rounded-xl px-4 py-3 flex flex-wrap items-center gap-4 text-xs">
          <span className="text-slate-500 font-medium">Live State:</span>
          <span className="text-slate-300">{liveObs.job_title} @ {liveObs.company}</span>
          <span className="tag bg-surface-700 text-slate-400 border border-white/5">{liveObs.platform}</span>
          <span className="text-slate-500">Day {liveObs.day}/{liveObs.deadline}</span>
          <span className={`font-mono font-bold ${liveObs.total_reward >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            R={liveObs.total_reward?.toFixed(3)}
          </span>
          {liveObs.done && <span className="tag badge-easy">Done</span>}
        </div>
      )}

      {/* Task cards */}
      <div>
        <div className="section-title">Task Scenarios</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(TASKS).map(([diff, task]) => (
            <TaskCard key={diff} difficulty={diff} task={task} />
          ))}
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Baseline scores */}
        <div className="card">
          <div className="section-title">Baseline Agent Scores (gpt-4o-mini)</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={SCORE_DATA} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 1]} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                {SCORE_DATA.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Reward table */}
        <div className="card">
          <div className="section-title">Reward Structure</div>
          <div className="space-y-1">
            {REWARD_ROWS.map(({ event, reward, color, bg }) => (
              <div key={event} className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg ${bg}`}>
                <span className="text-xs text-slate-400">{event}</span>
                <span className={`text-xs font-bold font-mono ${color}`}>{reward}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Spec compliance */}
      <div className="card">
        <div className="section-title">OpenEnv Spec Compliance</div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {[
            'Real-world task', 'Typed models', 'step() / reset() / state()',
            'openenv.yaml', '3+ tasks + graders', 'Reward 0–1',
            'Partial signals', 'Baseline script', 'Dockerfile', 'HF Space',
          ].map(item => (
            <div key={item} className="flex items-center gap-2 bg-green-500/8 border border-green-500/20 rounded-lg px-2.5 py-2">
              <span className="text-green-400 text-xs">✓</span>
              <span className="text-xs text-slate-300">{item}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
