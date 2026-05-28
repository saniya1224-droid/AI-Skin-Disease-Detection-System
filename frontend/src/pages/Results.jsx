import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'
import HeatmapViewer from '../components/HeatmapViewer'
import PredictionPanel from '../components/PredictionPanel'
import ConfidenceChart from '../components/ConfidenceChart'
import { predictAPI, reportAPI } from '../services/api'
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react'

export default function Results() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pdfLoading, setPdfLoading] = useState(false)

  useEffect(() => {
    const fetchPrediction = async () => {
      try {
        // Try location state first (from dashboard), then fetch from API
        const stateData = window.history.state?.usr?.predictionData
        if (stateData) {
          setData(stateData)
          setLoading(false)
          return
        }
        const { data: apiData } = await predictAPI.getHistoryDetail(id)
        setData({ prediction: apiData.prediction })
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load results')
      } finally {
        setLoading(false)
      }
    }
    fetchPrediction()
  }, [id])

  const handleDownloadPDF = async () => {
    setPdfLoading(true)
    try {
      // Step 1: Generate report
      const { data: reportData } = await reportAPI.generate(id)
      const reportId = reportData.report.id

      // Step 2: Download PDF blob
      const { data: blob } = await reportAPI.download(reportId)
      const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `dermai_report_${id.slice(0, 8)}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('PDF report downloaded!')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to generate report')
    } finally {
      setPdfLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-indigo-400" />
          <p className="text-slate-400">Loading results...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-navy-900 flex items-center justify-center px-4">
        <div className="glass-card p-8 text-center max-w-md">
          <AlertCircle size={40} className="text-red-400 mx-auto mb-4" />
          <h2 className="text-white font-bold text-xl mb-2">Failed to Load Results</h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <Link to="/dashboard" className="btn-primary">Back to Dashboard</Link>
        </div>
      </div>
    )
  }

  const { prediction, symptoms = [], precautions = [], specialist } = data || {}

  return (
    <div className="min-h-screen bg-navy-900">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 pt-24 pb-12">

        {/* Back button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <button
            id="back-to-dashboard-btn"
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
        </motion.div>

        {/* Page Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white">
            Analysis <span className="gradient-text">Results</span>
          </h1>
          {prediction?.created_at && (
            <p className="text-slate-400 text-sm mt-1">
              Scan #{id.slice(0, 8).toUpperCase()} ·{' '}
              {new Date(prediction.created_at).toLocaleString()}
            </p>
          )}
        </motion.div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left: Images */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col gap-5"
          >
            <HeatmapViewer
              imageUrl={prediction?.image_path}
              heatmapUrl={prediction?.heatmap_path}
            />
            {prediction?.all_probabilities && (
              <ConfidenceChart probabilities={prediction.all_probabilities} />
            )}
          </motion.div>

          {/* Right: Prediction details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
          >
            <PredictionPanel
              prediction={prediction}
              symptoms={symptoms}
              precautions={precautions}
              specialist={specialist}
              onDownloadPDF={handleDownloadPDF}
              pdfLoading={pdfLoading}
            />
          </motion.div>
        </div>

        {/* Disclaimer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 px-5 py-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400/90 text-sm text-center"
        >
          ⚠️ This is an AI-generated analysis for informational purposes only.
          Always consult a certified dermatologist for proper diagnosis and treatment.
        </motion.div>
      </div>
    </div>
  )
}
