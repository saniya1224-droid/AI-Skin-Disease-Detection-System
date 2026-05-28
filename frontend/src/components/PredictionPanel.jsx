import { motion } from 'framer-motion'
import PropTypes from 'prop-types'
import {
  Stethoscope, AlertTriangle, Shield, CheckCircle,
  ChevronRight, FileDown, Loader2,
} from 'lucide-react'
import SeverityMeter from './SeverityMeter'

const SEVERITY_CONFIG = {
  low: { label: 'Low', class: 'badge-low', icon: CheckCircle, color: '#22c55e' },
  moderate: { label: 'Moderate', class: 'badge-moderate', icon: Shield, color: '#eab308' },
  high: { label: 'High', class: 'badge-high', icon: AlertTriangle, color: '#f97316' },
  critical: { label: 'Critical', class: 'badge-critical', icon: AlertTriangle, color: '#ef4444' },
}

export default function PredictionPanel({
  prediction,
  symptoms = [],
  precautions = [],
  specialist = 'Dermatologist',
  onDownloadPDF,
  pdfLoading = false,
}) {
  if (!prediction) return null

  const { predicted_disease, confidence, severity } = prediction
  const sev = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.low
  const SevIcon = sev.icon
  const confidencePct = (confidence * 100).toFixed(1)

  return (
    <div className="flex flex-col gap-5">
      {/* Disease Name */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-6"
      >
        <p className="text-slate-400 text-sm font-medium mb-1">Detected Condition</p>
        <h2 className="text-3xl font-bold gradient-text mb-3">{predicted_disease}</h2>

        <div className="flex items-center gap-3 flex-wrap">
          <span className={sev.class}>
            <span className="flex items-center gap-1">
              <SevIcon size={12} />
              {sev.label} Severity
            </span>
          </span>
          <span className="text-slate-400 text-sm">
            Consult: <span className="text-teal-400 font-medium">{specialist}</span>
          </span>
        </div>
      </motion.div>

      {/* Confidence + Severity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 gap-4"
      >
        {/* Confidence */}
        <div className="glass-card p-5">
          <p className="text-slate-400 text-xs font-medium mb-3 uppercase tracking-wide">AI Confidence</p>
          <div className="flex items-end gap-1 mb-3">
            <motion.span
              className="text-4xl font-bold text-white"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              {confidencePct}
            </motion.span>
            <span className="text-slate-400 text-xl mb-1">%</span>
          </div>
          {/* Progress bar */}
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-teal-500"
              initial={{ width: 0 }}
              animate={{ width: `${confidencePct}%` }}
              transition={{ delay: 0.5, duration: 1, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Severity Meter */}
        <div className="glass-card p-5 flex flex-col items-center justify-center">
          <p className="text-slate-400 text-xs font-medium mb-2 uppercase tracking-wide">Severity</p>
          <SeverityMeter severity={severity} />
        </div>
      </motion.div>

      {/* Symptoms */}
      {symptoms.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6"
        >
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Stethoscope size={16} className="text-indigo-400" /> Common Symptoms
          </h3>
          <ul className="space-y-2">
            {symptoms.map((symptom, i) => (
              <motion.li
                key={symptom}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.07 }}
                className="flex items-start gap-2.5 text-slate-300 text-sm"
              >
                <ChevronRight size={14} className="text-indigo-400 mt-0.5 flex-shrink-0" />
                {symptom}
              </motion.li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Precautions */}
      {precautions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6"
        >
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Shield size={16} className="text-teal-400" /> Precautions & Care
          </h3>
          <ul className="space-y-2">
            {precautions.map((p, i) => (
              <motion.li
                key={p}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.07 }}
                className="flex items-start gap-2.5 text-slate-300 text-sm"
              >
                <CheckCircle size={14} className="text-teal-400 mt-0.5 flex-shrink-0" />
                {p}
              </motion.li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* PDF Download */}
      {onDownloadPDF && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <button
            id="download-pdf-btn"
            onClick={onDownloadPDF}
            disabled={pdfLoading}
            className="btn-teal w-full flex items-center justify-center gap-2"
          >
            {pdfLoading ? (
              <><Loader2 size={16} className="animate-spin" /> Generating Report...</>
            ) : (
              <><FileDown size={16} /> Download PDF Report</>
            )}
          </button>
          <p className="text-center text-xs text-slate-500 mt-2">
            Includes prediction details, symptoms, and medical disclaimer
          </p>
        </motion.div>
      )}
    </div>
  )
}

PredictionPanel.propTypes = {
  prediction: PropTypes.shape({
    predicted_disease: PropTypes.string.isRequired,
    confidence: PropTypes.number.isRequired,
    severity: PropTypes.oneOf(['low', 'moderate', 'high', 'critical']).isRequired,
  }),
  symptoms: PropTypes.arrayOf(PropTypes.string),
  precautions: PropTypes.arrayOf(PropTypes.string),
  specialist: PropTypes.string,
  onDownloadPDF: PropTypes.func,
  pdfLoading: PropTypes.bool,
}
