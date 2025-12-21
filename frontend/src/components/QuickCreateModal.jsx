import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Link as LinkIcon, Loader2, Sparkles, Monitor, Smartphone, Square } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import { createProject } from '../api/projects'

const aspectRatioOptions = [
  { value: '16:9', label: 'Landscape', icon: Monitor, description: 'YouTube, TV' },
  { value: '9:16', label: 'Portrait', icon: Smartphone, description: 'TikTok, Reels' },
  { value: '1:1', label: 'Square', icon: Square, description: 'Instagram, Feed' },
]

export default function QuickCreateModal({ isOpen, onClose }) {
  const navigate = useNavigate()
  const [url, setUrl] = useState('')
  const [aspectRatios, setAspectRatios] = useState(['16:9', '9:16', '1:1'])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const duration = 5 // Fixed 5-second videos

  const toggleAspectRatio = (ratio) => {
    setAspectRatios(prev => 
      prev.includes(ratio)
        ? prev.filter(r => r !== ratio)
        : [...prev, ratio]
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!url) {
      setError('Please enter a URL')
      return
    }

    if (aspectRatios.length === 0) {
      setError('Please select at least one aspect ratio')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const result = await createProject({ url, aspectRatios, duration })
      onClose()
      navigate(`/project/${result.projectId}`)
    } catch (err) {
      setError(err.message || 'Failed to create project')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Generate Ad</h2>
                    <p className="text-sm text-gray-500">Create AI video ads from any URL</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* URL Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website URL
                  </label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://example.com"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Aspect Ratios */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Aspect Ratios
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {aspectRatioOptions.map((option) => {
                      const isSelected = aspectRatios.includes(option.value)
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => toggleAspectRatio(option.value)}
                          className={clsx(
                            'p-4 rounded-xl border-2 transition-all text-center',
                            isSelected
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-gray-200 hover:border-gray-300'
                          )}
                        >
                          <option.icon className={clsx(
                            'w-6 h-6 mx-auto mb-2',
                            isSelected ? 'text-primary-600' : 'text-gray-400'
                          )} />
                          <div className={clsx(
                            'font-medium text-sm',
                            isSelected ? 'text-primary-700' : 'text-gray-700'
                          )}>
                            {option.label}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {option.description}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Duration Info */}
                <div className="p-3 bg-primary-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary-600" />
                    <span className="text-sm font-medium text-primary-700">5-second video ads</span>
                  </div>
                  <p className="text-xs text-primary-600 mt-1">Optimized for social media engagement</p>
                </div>

                {/* Error */}
                {error && (
                  <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Generate Ads
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
