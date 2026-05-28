import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import ImageUploader from '../components/ImageUploader'
import ChatBot from '../components/ChatBot'
import { predictAPI } from '../services/api'
import {
  Activity, History, Upload, Shield, LogOut,
  Loader2, Scan, AlertCircle, ChevronRight,
} from 'lucide-react'

// ── Sidebar ───────────────────────────────────
function Sidebar({ active, onNavigate, isAdmin, onLogout }) {
  const items = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity, href: '/dashboard' },
    { id: 'history', label: 'History', icon: History, href: '/history' },
    ...(isAdmin ? [{ id: 'admin', label: 'Admin Panel', icon: Shield, href: '/admin' }] : []),
  ]

  return (
    <aside className="w-64 flex-shrink-0 hidden lg:flex flex-col glass-card border-r border-white/10 min-h-screen rounded-none rounded-r-none p-4 sticky top-0">
      <Link to="/" className="flex items-center gap-2.5 px-2 mb-8 mt-4">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-teal-500 flex items-center justify-center shadow-glow">
          <Activity size={16} className="text-white" />
        </div>
        <span className="font-bold text-lg">
          <span className="gradient-text">Derm</span><span className="text-white">AI</span>
        </span>
      </Link>

      <nav className="flex flex-col gap-1 flex-1">
        {items.map(({ id, label, icon: Icon, href }) => (
          <Link
            key={id}
            to={href}
            id={`sidebar-${id}`}
            className={`sidebar-item ${active === id ? 'active' : ''}`}
          >
            <Icon size={16} />
            {label}
          </Link>
        ))}
      </nav>

      <button
        onClick={onLogout}
        id="sidebar-logout-btn"
        className="sidebar-item text-red-400 hover:text-red-300 hover:bg-red-500/10 mt-auto"
      >
        <LogOut size={16} /> Sign Out
      </button>
    </aside>
  )
}

// ── Skeleton Loader ───────────────────────────
function AnalysisSkeleton() {
  return (
    <div className="glass-card p-8 flex flex-col gap-4 animate-pulse">
      <div className="h-6 skeleton rounded w-1/2" />
      <div className="h-4 skeleton rounded w-3/4" />
      <div className="h-4 skeleton rounded w-2/3" />
      <div className="h-32 skeleton rounded mt-2" />
    </div>
  )
}

export default function Dashboard() {
  const { user, isAdmin, logout } = useAuth()
  const navigate = useNavigate()
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [predictionData, setPredictionData] = useState(null)

  const handleLogout = () => { logout(); navigate('/') }

  const handleFileSelect = (f) => {
    setFile(f)
    setPredictionData(null)
  }

  const handleAnalyze = async () => {
    if (!file) { toast.error('Please select an image first'); return }
    setLoading(true)
    setPredictionData(null)
    try {
      const formData = new FormData()
      formData.append('image', file)
      const { data } = await predictAPI.predict(formData)
      setPredictionData(data)
      toast.success('Analysis complete!')
      // Navigate to results after a brief delay
      setTimeout(() => navigate(`/results/${data.prediction.id}`), 800)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Analysis failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-navy-900 flex">
      <Sidebar active="dashboard" isAdmin={isAdmin} onLogout={handleLogout} />

      <main className="flex-1 min-h-screen">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 pt-24 pb-12">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <h1 className="text-3xl font-bold text-white mb-1">
              Welcome back, <span className="gradient-text">{user?.name?.split(' ')[0]}</span>
            </h1>
            <p className="text-slate-400">Upload a skin image to run an AI analysis.</p>
          </motion.div>

          {/* Upload Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-8 mb-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                <Scan size={18} className="text-indigo-400" />
              </div>
              <div>
                <h2 className="text-white font-semibold">Upload Skin Scan</h2>
                <p className="text-slate-500 text-xs">Clear, well-lit images give the best results</p>
              </div>
            </div>

            <ImageUploader onFileSelect={handleFileSelect} disabled={loading} />

            {/* Analyze Button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: file ? 1 : 0.4 }}
              className="mt-6"
            >
              <button
                id="analyze-btn"
                onClick={handleAnalyze}
                disabled={!file || loading}
                className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-base disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading
                  ? <><Loader2 size={18} className="animate-spin" /> Analyzing with AI...</>
                  : <><Activity size={18} /> Analyze with DermAI</>
                }
              </button>
            </motion.div>
          </motion.div>

          {/* Loading skeleton */}
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <AnalysisSkeleton />
            </motion.div>
          )}

          {/* Success message */}
          {predictionData && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-5 flex items-center justify-between border border-teal-500/30"
            >
              <div className="flex items-center gap-3 text-teal-400">
                <Activity size={18} />
                <span className="text-sm font-medium">
                  Analysis complete! Redirecting to results...
                </span>
              </div>
              <Link
                to={`/results/${predictionData.prediction.id}`}
                className="text-sm text-teal-400 hover:text-teal-300 flex items-center gap-1"
              >
                View now <ChevronRight size={14} />
              </Link>
            </motion.div>
          )}

          {/* Tips card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-6 mt-6"
          >
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <AlertCircle size={15} className="text-amber-400" /> Tips for Best Results
            </h3>
            <ul className="space-y-2 text-slate-400 text-sm">
              {[
                'Use natural lighting or good indoor lighting',
                'Keep the camera 6–12 inches from the skin',
                'Ensure the affected area is clearly visible',
                'Avoid blurry or out-of-focus images',
                'For rashes, capture the full affected area',
              ].map((tip) => (
                <li key={tip} className="flex items-start gap-2">
                  <ChevronRight size={14} className="text-indigo-400 mt-0.5 flex-shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </main>

      {/* AI Chatbot */}
      <ChatBot />
    </div>
  )
}
