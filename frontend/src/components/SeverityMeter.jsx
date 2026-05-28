import { motion } from 'framer-motion'
import PropTypes from 'prop-types'

const SEVERITY_MAP = {
  low:      { label: 'Low',      color: '#22c55e', angle: -90,  fill: '#22c55e' },
  moderate: { label: 'Moderate', color: '#eab308', angle: -30,  fill: '#eab308' },
  high:     { label: 'High',     color: '#f97316', angle: 30,   fill: '#f97316' },
  critical: { label: 'Critical', color: '#ef4444', angle: 90,   fill: '#ef4444' },
}

// SVG arc helper
function describeArc(x, y, r, startAngle, endAngle) {
  const toRad = (deg) => (deg * Math.PI) / 180
  const sx = x + r * Math.cos(toRad(startAngle))
  const sy = y + r * Math.sin(toRad(startAngle))
  const ex = x + r * Math.cos(toRad(endAngle))
  const ey = y + r * Math.sin(toRad(endAngle))
  const largeArc = endAngle - startAngle > 180 ? 1 : 0
  return `M ${sx} ${sy} A ${r} ${r} 0 ${largeArc} 1 ${ex} ${ey}`
}

export default function SeverityMeter({ severity }) {
  const config = SEVERITY_MAP[severity] || SEVERITY_MAP.low

  // Map severity to 0–100 percentage
  const pctMap = { low: 18, moderate: 45, high: 72, critical: 95 }
  const pct = pctMap[severity] || 18

  // Needle angle: -130° (low) to 130° (critical)
  const needleAngle = -130 + (pct / 100) * 260

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 120 80" width="120" height="80" aria-label={`Severity: ${config.label}`}>
        {/* Track arcs (background) */}
        {[
          { color: '#22c55e33', sa: -130, ea: -65 },
          { color: '#eab30833', sa: -63,  ea: 0   },
          { color: '#f9731633', sa: 2,    ea: 65  },
          { color: '#ef444433', sa: 67,   ea: 130 },
        ].map(({ color, sa, ea }, i) => (
          <path
            key={i}
            d={describeArc(60, 70, 45, sa, ea)}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
          />
        ))}

        {/* Active arc */}
        <motion.path
          d={describeArc(60, 70, 45, -130, needleAngle)}
          fill="none"
          stroke={config.color}
          strokeWidth="10"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
          style={{
            filter: `drop-shadow(0 0 6px ${config.color}80)`,
          }}
        />

        {/* Needle */}
        <motion.g
          initial={{ rotate: -130 }}
          animate={{ rotate: needleAngle }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.4 }}
          style={{ transformOrigin: '60px 70px' }}
        >
          <line x1="60" y1="70" x2="60" y2="32" stroke={config.color} strokeWidth="2.5" strokeLinecap="round" />
        </motion.g>

        {/* Center dot */}
        <circle cx="60" cy="70" r="4" fill={config.color} />
        <circle cx="60" cy="70" r="2" fill="#0f172a" />
      </svg>

      <motion.span
        className="text-sm font-bold mt-1"
        style={{ color: config.color }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        {config.label}
      </motion.span>
    </div>
  )
}

SeverityMeter.propTypes = {
  severity: PropTypes.oneOf(['low', 'moderate', 'high', 'critical']).isRequired,
}
