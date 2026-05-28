import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import PropTypes from 'prop-types'
import { Upload, Camera, X, Image as ImageIcon, AlertCircle } from 'lucide-react'

const MAX_SIZE = 10 * 1024 * 1024 // 10MB
const ACCEPTED = { 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.bmp'] }

export default function ImageUploader({ onFileSelect, disabled = false }) {
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState(null)

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    setError(null)

    if (rejectedFiles.length > 0) {
      const err = rejectedFiles[0].errors[0]
      if (err.code === 'file-too-large') {
        setError('File size must be under 10MB')
      } else if (err.code === 'file-invalid-type') {
        setError('Only image files are accepted (JPG, PNG, WEBP, BMP)')
      } else {
        setError(err.message)
      }
      return
    }

    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]
      const url = URL.createObjectURL(file)
      setPreview(url)
      onFileSelect(file)
    }
  }, [onFileSelect])

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: ACCEPTED,
    maxSize: MAX_SIZE,
    maxFiles: 1,
    disabled,
  })

  const clearImage = () => {
    if (preview) URL.revokeObjectURL(preview)
    setPreview(null)
    setError(null)
    onFileSelect(null)
  }

  const borderColor = isDragReject
    ? 'border-red-500/60'
    : isDragActive
    ? 'border-indigo-500/80'
    : preview
    ? 'border-teal-500/50'
    : 'border-white/20 hover:border-indigo-500/50'

  const bgColor = isDragActive ? 'bg-indigo-500/10' : 'bg-white/3'

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {!preview ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            {...getRootProps()}
            id="image-dropzone"
            className={`
              relative cursor-pointer rounded-2xl border-2 border-dashed
              transition-all duration-300 p-10 text-center
              ${borderColor} ${bgColor}
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input {...getInputProps()} id="image-file-input" />

            <motion.div
              animate={{ y: isDragActive ? -8 : 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="flex flex-col items-center gap-4"
            >
              <div className={`
                w-20 h-20 rounded-2xl flex items-center justify-center
                transition-all duration-300
                ${isDragActive
                  ? 'bg-indigo-500/30 shadow-glow'
                  : 'bg-white/10 group-hover:bg-indigo-500/20'}
              `}>
                {isDragActive
                  ? <ImageIcon size={36} className="text-indigo-400" />
                  : <Upload size={36} className="text-slate-400" />
                }
              </div>

              <div>
                <p className="text-lg font-semibold text-white mb-1">
                  {isDragActive ? 'Drop your image here' : 'Upload Skin Image'}
                </p>
                <p className="text-slate-400 text-sm">
                  Drag & drop or <span className="text-indigo-400 underline underline-offset-2">browse files</span>
                </p>
                <p className="text-slate-500 text-xs mt-2">
                  JPG, PNG, WEBP, BMP · Max 10MB
                </p>
              </div>
            </motion.div>

            {isDragActive && (
              <motion.div
                className="absolute inset-0 rounded-2xl border-2 border-indigo-500 shadow-glow pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            )}
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative rounded-2xl overflow-hidden border-2 border-teal-500/40 shadow-glow-teal"
          >
            <img
              src={preview}
              alt="Upload preview"
              className="w-full h-64 object-cover"
              id="preview-image"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-navy-900/80 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
              <span className="text-sm text-white font-medium bg-navy-900/60 px-3 py-1 rounded-lg backdrop-blur-sm">
                ✓ Image ready for analysis
              </span>
              <button
                id="clear-image-btn"
                onClick={(e) => { e.stopPropagation(); clearImage() }}
                className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/40 transition-colors border border-red-500/30"
                disabled={disabled}
              >
                <X size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 mt-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
          >
            <AlertCircle size={14} />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Camera note */}
      {!preview && (
        <p className="flex items-center gap-1.5 mt-3 text-xs text-slate-500">
          <Camera size={12} />
          For best results, use a well-lit, close-up photo of the affected skin area.
        </p>
      )}
    </div>
  )
}

ImageUploader.propTypes = {
  onFileSelect: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
}
