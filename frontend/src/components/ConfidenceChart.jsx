import { motion } from 'framer-motion'
import PropTypes from 'prop-types'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

const COLORS = ['#6366f1', '#14b8a6', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981', '#f97316', '#3b82f6']

const CustomTooltip = ({ active, payload }) => {
  if (active && payload?.length) {
    const { name, value } = payload[0]
    return (
      <div className="glass-card px-3 py-2 text-sm">
        <p className="text-white font-medium">{name}</p>
        <p className="text-indigo-400">{(value * 100).toFixed(1)}%</p>
      </div>
    )
  }
  return null
}

CustomTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.array,
}

export default function ConfidenceChart({ probabilities }) {
  if (!probabilities) return null

  const data = Object.entries(probabilities)
    .map(([name, value]) => ({ name: name.replace(' ', '\n'), value, fullName: name }))
    .sort((a, b) => b.value - a.value)

  return (
    <div className="glass-card p-6">
      <h3 className="text-white font-semibold mb-1">Probability Distribution</h3>
      <p className="text-slate-500 text-xs mb-5">Confidence scores across all 8 detectable conditions</p>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 60 }}>
          <XAxis
            dataKey="name"
            tick={{ fill: '#94a3b8', fontSize: 10 }}
            angle={-40}
            textAnchor="end"
            interval={0}
          />
          <YAxis
            tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
            tick={{ fill: '#94a3b8', fontSize: 10 }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={entry.fullName} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <motion.div
        className="mt-4 grid grid-cols-2 gap-1.5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {data.slice(0, 4).map((entry, i) => (
          <div key={entry.fullName} className="flex items-center gap-1.5 text-xs">
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: COLORS[i % COLORS.length] }}
            />
            <span className="text-slate-400 truncate">{entry.fullName}</span>
            <span className="text-slate-500 ml-auto">{(entry.value * 100).toFixed(1)}%</span>
          </div>
        ))}
      </motion.div>
    </div>
  )
}

ConfidenceChart.propTypes = {
  probabilities: PropTypes.objectOf(PropTypes.number),
}
