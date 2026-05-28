import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import PropTypes from 'prop-types'
import { Eye, Layers, ZoomIn } from 'lucide-react'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

export default function HeatmapViewer({ imageUrl, heatmapUrl }) {
  const [active, setActive] = useState('original') // 'original' | 'heatmap' | 'overlay'
  const [zoom, setZoom] = useState(false)

  const tabs = [
    { id: 'original', label: 'Original', icon: Eye },
    { id: 'heatmap',  label: 'Grad-CAM', icon: Layers },
  ]

  const currentUrl =
    active === 'original'
      ? imageUrl
      : heatmapUrl
      ? `${BASE_URL}/${heatmapUrl}`
      : null

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-white font-semibold">Scan Viewer</h3>
          <p className="text-slate-500 text-xs mt-0.5">
            Grad-CAM highlights regions influencing the prediction
          </p>
        </div>
        <button
          id="zoom-toggle-btn"
          onClick={() => setZoom(!zoom)}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-400 hover:text-white transition-colors"
        >
          <ZoomIn size={15} />
        </button>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 mb-4 bg-white/5 p-1 rounded-xl">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            id={`tab-${id}`}
            onClick={() => setActive(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              active === id
                ? 'bg-indigo-500 text-white shadow-glow'
                : 'text-slate-400 hover:text-white'
            } ${id === 'heatmap' && !heatmapUrl ? 'opacity-40 cursor-not-allowed' : ''}`}
            disabled={id === 'heatmap' && !heatmapUrl}
          >
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      {/* Image display */}
      <div className={`relative overflow-hidden rounded-xl transition-all duration-300 ${zoom ? 'h-96' : 'h-64'}`}>
        <AnimatePresence mode="wait">
          {currentUrl ? (
            <motion.img
              key={active}
              src={currentUrl}
              alt={active === 'original' ? 'Original skin scan' : 'Grad-CAM heatmap overlay'}
              className="w-full h-full object-cover"
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              id={`scan-image-${active}`}
            />
          ) : (
            <motion.div
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full h-full flex flex-col items-center justify-center bg-white/5 text-slate-500"
            >
              <Layers size={32} className="mb-2 opacity-40" />
              <p className="text-sm">
                {active === 'heatmap'
                  ? 'Heatmap not available (real model required)'
                  : 'No image available'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active label badge */}
        <div className="absolute top-3 left-3">
          <span className={`px-2.5 py-1 rounded-lg text-xs font-medium backdrop-blur-sm ${
            active === 'original'
              ? 'bg-indigo-500/40 text-indigo-200 border border-indigo-500/30'
              : 'bg-orange-500/40 text-orange-200 border border-orange-500/30'
          }`}>
            {active === 'original' ? 'Original Upload' : 'Grad-CAM Heatmap'}
          </span>
        </div>
      </div>

      {active === 'heatmap' && heatmapUrl && (
        <p className="mt-3 text-xs text-slate-500 text-center">
          🔴 Red/yellow areas are where the AI focused most for this prediction
        </p>
      )}
    </div>
  )
}

HeatmapViewer.propTypes = {
  imageUrl: PropTypes.string,
  heatmapUrl: PropTypes.string,
}
