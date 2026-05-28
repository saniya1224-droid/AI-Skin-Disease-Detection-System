import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'
import { predictAPI, reportAPI } from '../services/api'
import {
  History as HistoryIcon, ChevronRight, FileDown,
  Loader2, Search, SlidersHorizontal, AlertCircle,
  ArrowLeft, ArrowRight,
} from 'lucide-react'

const SEVERITY_BADGE = {
  low: 'badge-low',
  moderate: 'badge-moderate',
  high: 'badge-high',
  critical: 'badge-critical',
}

export default function History() {
  const navigate = useNavigate()
  const [predictions, setPredictions] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [downloadingId, setDownloadingId] = useState(null)

  const fetchHistory = useCallback(async (p = 1) => {
    setLoading(true)
    try {
      const { data } = await predictAPI.getHistory(p, 10)
      setPredictions(data.predictions)
      setTotalPages(data.pages)
      setTotal(data.total)
      setPage(p)
    } catch {
      toast.error('Failed to load history')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchHistory(1) }, [fetchHistory])

  const handleDownloadPDF = async (predId, e) => {
    e.stopPropagation()
    setDownloadingId(predId)
    try {
      const { data: reportData } = await reportAPI.generate(predId)
      const reportId = reportData.report.id
      const { data: blob } = await reportAPI.download(reportId)
      const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `dermai_report_${predId.slice(0, 8)}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Report downloaded')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to generate report')
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-navy-900">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 pt-24 pb-12">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <HistoryIcon size={28} className="text-indigo-400" />
              Scan <span className="gradient-text">History</span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              {total} total scan{total !== 1 ? 's' : ''}
            </p>
          </div>
          <Link to="/dashboard" className="btn-secondary flex items-center gap-2 text-sm py-2">
            <ArrowLeft size={14} /> New Scan
          </Link>
        </motion.div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col gap-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="glass-card p-5 h-20 skeleton" />
            ))}
          </div>
        ) : predictions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card p-16 text-center"
          >
            <HistoryIcon size={48} className="text-slate-700 mx-auto mb-4" />
            <h3 className="text-white font-semibold text-xl mb-2">No scans yet</h3>
            <p className="text-slate-400 mb-6">Upload your first skin image to see results here.</p>
            <Link to="/dashboard" className="btn-primary">Upload First Scan</Link>
          </motion.div>
        ) : (
          <>
            {/* Table */}
            <div className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm" id="history-table">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left text-slate-400 font-medium px-5 py-4">Date</th>
                      <th className="text-left text-slate-400 font-medium px-5 py-4">Condition</th>
                      <th className="text-left text-slate-400 font-medium px-5 py-4">Confidence</th>
                      <th className="text-left text-slate-400 font-medium px-5 py-4">Severity</th>
                      <th className="text-right text-slate-400 font-medium px-5 py-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {predictions.map((pred, i) => (
                      <motion.tr
                        key={pred.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        onClick={() => navigate(`/results/${pred.id}`)}
                        className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors group"
                        id={`history-row-${pred.id.slice(0, 8)}`}
                      >
                        <td className="px-5 py-4 text-slate-400">
                          {new Date(pred.created_at).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric',
                          })}
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-white font-medium">{pred.predicted_disease}</span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-indigo-500 to-teal-500 rounded-full"
                                style={{ width: `${(pred.confidence * 100).toFixed(0)}%` }}
                              />
                            </div>
                            <span className="text-slate-300 text-xs">
                              {(pred.confidence * 100).toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={SEVERITY_BADGE[pred.severity] || 'badge-low'}>
                            {pred.severity}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              id={`download-report-${pred.id.slice(0, 8)}`}
                              onClick={(e) => handleDownloadPDF(pred.id, e)}
                              disabled={downloadingId === pred.id}
                              className="p-1.5 rounded-lg bg-white/10 hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-400 transition-colors"
                              title="Download PDF"
                            >
                              {downloadingId === pred.id
                                ? <Loader2 size={13} className="animate-spin" />
                                : <FileDown size={13} />
                              }
                            </button>
                            <ChevronRight size={14} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-slate-500 text-sm">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    id="prev-page-btn"
                    onClick={() => fetchHistory(page - 1)}
                    disabled={page === 1}
                    className="btn-secondary text-sm py-2 px-4 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <ArrowLeft size={14} /> Previous
                  </button>
                  <button
                    id="next-page-btn"
                    onClick={() => fetchHistory(page + 1)}
                    disabled={page === totalPages}
                    className="btn-secondary text-sm py-2 px-4 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    Next <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
