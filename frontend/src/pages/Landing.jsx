import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import Navbar from '../components/Navbar'
import {
  Upload, Zap, Eye, FileText, Shield, Activity,
  ArrowRight, ChevronRight, Microscope, Brain,
  HeartPulse, Users,
} from 'lucide-react'

// ── Animated Counter ─────────────────────────
function AnimatedCounter({ end, label, prefix = '', suffix = '' }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (!inView) return
    let start = 0
    const step = end / 60
    const timer = setInterval(() => {
      start += step
      if (start >= end) { setCount(end); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, 16)
    return () => clearInterval(timer)
  }, [inView, end])

  return (
    <div ref={ref} className="text-center">
      <div className="text-4xl font-bold gradient-text mb-1">
        {prefix}{count.toLocaleString()}{suffix}
      </div>
      <div className="text-slate-400 text-sm">{label}</div>
    </div>
  )
}

// ── Feature Card ─────────────────────────────
function FeatureCard({ icon: Icon, title, description, color, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="glass-card-hover p-6 group"
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110 ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
    </motion.div>
  )
}

// ── Disease Tag ───────────────────────────────
function DiseaseTag({ name, severity }) {
  const colors = {
    low: 'border-green-500/30 text-green-400 bg-green-500/10',
    moderate: 'border-yellow-500/30 text-yellow-400 bg-yellow-500/10',
    high: 'border-orange-500/30 text-orange-400 bg-orange-500/10',
    critical: 'border-red-500/30 text-red-400 bg-red-500/10',
  }
  return (
    <span className={`px-3 py-1.5 rounded-full text-xs font-medium border ${colors[severity]}`}>
      {name}
    </span>
  )
}

export default function Landing() {
  const features = [
    {
      icon: Upload,
      title: 'Smart Image Upload',
      description: 'Drag-and-drop or capture directly from your camera. Supports JPG, PNG, WEBP formats.',
      color: 'bg-indigo-500',
      delay: 0,
    },
    {
      icon: Brain,
      title: 'Deep Learning Analysis',
      description: 'EfficientNetB0 model trained on thousands of dermatology images for high accuracy.',
      color: 'bg-violet-500',
      delay: 0.1,
    },
    {
      icon: Eye,
      title: 'Explainable AI (XAI)',
      description: 'Grad-CAM heatmaps show exactly which skin regions influenced the AI decision.',
      color: 'bg-teal-500',
      delay: 0.2,
    },
    {
      icon: FileText,
      title: 'Medical PDF Reports',
      description: 'Download professional reports with findings, symptoms, and precautions.',
      color: 'bg-blue-500',
      delay: 0.3,
    },
    {
      icon: Shield,
      title: 'Privacy First',
      description: 'JWT-secured accounts. Your health data is encrypted and never shared.',
      color: 'bg-emerald-500',
      delay: 0.4,
    },
    {
      icon: Zap,
      title: 'Instant Results',
      description: 'Get predictions in seconds. Review history anytime from your personal dashboard.',
      color: 'bg-amber-500',
      delay: 0.5,
    },
  ]

  const diseases = [
    { name: 'Acne', severity: 'low' },
    { name: 'Eczema', severity: 'moderate' },
    { name: 'Psoriasis', severity: 'high' },
    { name: 'Ringworm', severity: 'moderate' },
    { name: 'Melanoma', severity: 'critical' },
    { name: 'Vitiligo', severity: 'low' },
    { name: 'Seborrheic Dermatitis', severity: 'moderate' },
    { name: 'Basal Cell Carcinoma', severity: 'critical' },
  ]

  return (
    <div className="min-h-screen animated-gradient overflow-x-hidden">
      <Navbar />

      {/* ── Hero Section ─────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center px-4 pt-16">
        {/* Ambient blobs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-teal-500/15 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/3 right-1/3 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '4s' }} />

        <div className="relative max-w-5xl mx-auto text-center z-10">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-sm font-medium mb-6"
          >
            <Activity size={14} className="animate-pulse" />
            Powered by EfficientNetB0 + Grad-CAM XAI
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight"
          >
            Detect Skin Conditions
            <br />
            <span className="gradient-text">Early with AI</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Upload a photo of your skin and get instant AI-powered analysis with
            confidence scores, Grad-CAM explanations, and personalized precautions.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/register" id="hero-cta-register" className="btn-primary flex items-center gap-2 text-base px-8 py-4">
              Get Started Free <ArrowRight size={18} />
            </Link>
            <Link to="/login" id="hero-cta-login" className="btn-secondary flex items-center gap-2 text-base px-8 py-4">
              Sign In <ChevronRight size={18} />
            </Link>
          </motion.div>

          {/* Disclaimer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-6 text-xs text-slate-600"
          >
            ⚠️ For informational purposes only. Not a substitute for professional medical advice.
          </motion.p>
        </div>
      </section>

      {/* ── Disease Tags ──────────────────────── */}
      <section className="py-16 px-4" id="diseases">
        <div className="max-w-4xl mx-auto text-center">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-slate-400 text-sm mb-6 font-medium uppercase tracking-widest"
          >
            Detectable Conditions
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-wrap justify-center gap-3"
          >
            {diseases.map((d, i) => (
              <motion.div
                key={d.name}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
              >
                <DiseaseTag {...d} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Stats Section ────────────────────── */}
      <section className="py-20 px-4" id="stats">
        <div className="max-w-5xl mx-auto">
          <div className="glass-card p-10 grid grid-cols-2 md:grid-cols-4 gap-8">
            <AnimatedCounter end={89} suffix="%" label="Model Accuracy" />
            <AnimatedCounter end={8} label="Disease Classes" />
            <AnimatedCounter end={95} suffix="%" label="AUC-ROC Score" />
            <AnimatedCounter end={10000} suffix="+" label="Training Images" />
          </div>
        </div>
      </section>

      {/* ── Features Section ─────────────────── */}
      <section className="py-20 px-4" id="features">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Everything You Need for <span className="gradient-text">Early Detection</span>
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              A complete AI dermatology platform built on modern deep learning with explainability at its core.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => <FeatureCard key={f.title} {...f} />)}
          </div>
        </div>
      </section>

      {/* ── How It Works ────────────────────── */}
      <section className="py-20 px-4" id="how-it-works">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-4xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-slate-400">Three simple steps to your skin analysis</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: '01', icon: Upload, title: 'Upload Image', desc: 'Take or upload a clear photo of the affected skin area.' },
              { step: '02', icon: Microscope, title: 'AI Analysis', desc: 'Our EfficientNetB0 model analyzes the image in seconds.' },
              { step: '03', icon: HeartPulse, title: 'Get Results', desc: 'Receive detailed findings, heatmaps, and expert recommendations.' },
            ].map(({ step, icon: Icon, title, desc }, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="glass-card p-6 relative"
              >
                <div className="text-6xl font-black text-white/5 absolute top-4 right-4">{step}</div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-teal-500 flex items-center justify-center mb-4 shadow-glow">
                  <Icon size={20} className="text-white" />
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
                <p className="text-slate-400 text-sm">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ──────────────────────── */}
      <section className="py-20 px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto glass-card p-12 text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-teal-500/10 pointer-events-none" />
          <Users size={40} className="text-indigo-400 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Detect Early?</h2>
          <p className="text-slate-400 mb-8">
            Join thousands using DermAI for skin health awareness. Free to start.
          </p>
          <Link to="/register" id="footer-cta-register" className="btn-primary inline-flex items-center gap-2 text-base px-8 py-4">
            Start For Free <ArrowRight size={18} />
          </Link>
        </motion.div>
      </section>

      {/* ── Footer ──────────────────────────── */}
      <footer className="border-t border-white/10 py-8 px-4 text-center text-slate-600 text-sm">
        <p>© 2024 DermAI — AI-Powered Skin Disease Detection · MIT License</p>
        <p className="mt-1">Not a medical device. Always consult a certified dermatologist.</p>
      </footer>
    </div>
  )
}
