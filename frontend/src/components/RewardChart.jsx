import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Area, AreaChart,
} from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const val = payload[0].value
  return (
    <div className="glass rounded-lg px-3 py-2 text-xs border border-white/10">
      <div className="text-slate-400">Step {label}</div>
      <div className={`font-bold font-mono ${val >= 0 ? 'text-green-400' : 'text-red-400'}`}>
        {val >= 0 ? '+' : ''}{val.toFixed(3)}
      </div>
    </div>
  )
}

export default function RewardChart({ history }) {
  if (!history?.length) return (
    <div className="glass rounded-2xl p-6 flex items-center justify-center text-slate-600 text-sm min-h-[140px]">
      Reward chart will appear here
    </div>
  )

  const data = history.map((r, i) => ({ step: i + 1, reward: r }))
  const hasNeg = data.some(d => d.reward < 0)

  return (
    <div className="glass rounded-2xl p-4">
      <div className="section-title">Reward per Step</div>
      <ResponsiveContainer width="100%" height={130}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="rewardGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="step" tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} axisLine={false} />
          {hasNeg && <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4" />}
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="reward" stroke="#6366f1" strokeWidth={2}
                fill="url(#rewardGrad)" dot={false} activeDot={{ r: 4, fill: '#818cf8' }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
