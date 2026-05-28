import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'
import { adminAPI } from '../services/api'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from 'recharts'
import {
  Users, Activity, Target, TrendingUp,
  Search, Shield, RefreshCw, Loader2,
} from 'lucide-react'

const DISEASE_COLORS = ['#6366f1','#14b8a6','#8b5cf6','#f59e0b','#ef4444','#10b981','#f97316','#3b82f6']

function StatCard({ icon: Icon, label, value, color, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="glass-card p-6"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
        <Icon size={18} className="text-white" />
      </div>
      <div className="text-2xl font-bold text-white mb-0.5">{value}</div>
      <div className="text-slate-400 text-sm">{label}</div>
    </motion.div>
  )
}

export default function AdminPanel() {
  const [analytics, setAnalytics] = useState(null)
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [loadingAnalytics, setLoadingAnalytics] = useState(true)
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [modelUpdating, setModelUpdating] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [analyticsRes, usersRes] = await Promise.all([
          adminAPI.getAnalytics(),
          adminAPI.getUsers(),
        ])
        setAnalytics(analyticsRes.data)
        setUsers(usersRes.data.users || [])
      } catch (err) {
        toast.error('Failed to load admin data')
      } finally {
        setLoadingAnalytics(false)
        setLoadingUsers(false)
      }
    }
    fetchData()
  }, [])

  const handleModelUpdate = async () => {
    setModelUpdating(true)
    try {
      await adminAPI.updateModel({})
      toast.success('Model update queued successfully')
    } catch {
      toast.error('Failed to queue model update')
    } finally {
      setModelUpdating(false)
    }
  }

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-navy-900">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 pt-24 pb-12">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Shield size={28} className="text-indigo-400" />
              Admin <span className="gradient-text">Panel</span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">Platform analytics and user management</p>
          </div>
          <button
            id="model-update-btn"
            onClick={handleModelUpdate}
            disabled={modelUpdating}
            className="btn-secondary flex items-center gap-2 text-sm py-2"
          >
            {modelUpdating
              ? <><Loader2 size={14} className="animate-spin" /> Updating...</>
              : <><RefreshCw size={14} /> Update Model</>
            }
          </button>
        </motion.div>

        {/* Stats Grid */}
        {!loadingAnalytics && analytics && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard icon={Activity} label="Total Predictions" value={analytics.total_predictions} color="bg-indigo-500" delay={0} />
            <StatCard icon={Users} label="Total Patients" value={analytics.total_patients} color="bg-teal-500" delay={0.07} />
            <StatCard icon={Target} label="Avg Confidence" value={`${(analytics.average_confidence * 100).toFixed(1)}%`} color="bg-violet-500" delay={0.14} />
            <StatCard icon={TrendingUp} label="Model Accuracy" value={`${(analytics.model_accuracy * 100).toFixed(1)}%`} color="bg-emerald-500" delay={0.21} />
          </div>
        )}

        {/* Charts Row */}
        {!loadingAnalytics && analytics && (
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            {/* Disease Distribution Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card p-6"
            >
              <h3 className="text-white font-semibold mb-4">Disease Distribution</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={analytics.disease_distribution} margin={{ bottom: 40, left: -20 }}>
                  <XAxis dataKey="disease" tick={{ fill: '#94a3b8', fontSize: 9 }} angle={-35} textAnchor="end" interval={0} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                    labelStyle={{ color: '#f8fafc' }}
                    itemStyle={{ color: '#94a3b8' }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {analytics.disease_distribution.map((_, i) => (
                      <Cell key={i} fill={DISEASE_COLORS[i % DISEASE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Severity Pie */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-card p-6"
            >
              <h3 className="text-white font-semibold mb-4">Severity Distribution</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={analytics.severity_distribution}
                    dataKey="count"
                    nameKey="severity"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ severity, percent }) =>
                      `${severity} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {analytics.severity_distribution.map((entry, i) => (
                      <Cell key={i} fill={DISEASE_COLORS[i % DISEASE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>
          </div>
        )}

        {/* User Management */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card"
        >
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Users size={16} className="text-indigo-400" /> User Management
            </h3>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                id="user-search-input"
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-48"
              />
            </div>
          </div>

          {loadingUsers ? (
            <div className="p-8 flex justify-center">
              <Loader2 size={24} className="animate-spin text-indigo-400" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" id="users-table">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left text-slate-400 font-medium px-6 py-3">Name</th>
                    <th className="text-left text-slate-400 font-medium px-6 py-3">Email</th>
                    <th className="text-left text-slate-400 font-medium px-6 py-3">Role</th>
                    <th className="text-left text-slate-400 font-medium px-6 py-3">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user, i) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-white/5 hover:bg-white/3 transition-colors"
                    >
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-xs font-bold text-white">
                            {user.name[0]?.toUpperCase()}
                          </div>
                          <span className="text-white">{user.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-slate-400">{user.email}</td>
                      <td className="px-6 py-3">
                        <span className={user.role === 'admin' ? 'badge-high' : 'badge-low'}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-slate-400">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                    </motion.tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-slate-500">
                        No users found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
