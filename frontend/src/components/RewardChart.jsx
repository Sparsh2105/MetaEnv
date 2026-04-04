import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const val = payload[0].value
  return (
    <div className="glass rounded-lg px-3 py-2 text-xs border border-brand-500/30">
      <div className="text-slate-400">Step {label}</div>
      <div className={`font-mono font-bold ${val >= 0 ? 'text-green-400' : 'text-red-400'}`}>
        {val >= 0 ? '+' : ''}{val?.toFixed(4)}
      </div>
    </div>
  )
}

export default function RewardChart({ history }) {
  if (!history?.length) return (
    <div className="glass rounded-xl p-6 flex items-center justify-center text-slate-500 text-sm h-48">
      Reward history will appear here
    </div>
  )

  const data = history.map((r, i) => ({ step: i + 1, reward: r }))

  return (
    <div className="glass rounded-xl p-4">
      <div className="text-xs text-slate-400 mb-3 font-medium">Reward per Step</div>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(79,110,247,0.1)" />
          <XAxis dataKey="step" tick={{ fill: '#64748b', fontSize: 10 }} />
          <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={0} stroke="rgba(148,163,184,0.3)" strokeDasharray="4 4" />
          <Line
            type="monotone"
            dataKey="reward"
            stroke="#4f6ef7"
            strokeWidth={2}
            dot={{ fill: '#4f6ef7', r: 3 }}
            activeDot={{ r: 5, fill: '#6b8cff' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
