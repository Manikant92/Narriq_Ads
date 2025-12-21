import { useState } from 'react'
import { Play, Download, Share2, Edit, Loader2, Check, Monitor, Smartphone, Square } from 'lucide-react'
import { motion } from 'framer-motion'
import clsx from 'clsx'

const aspectRatioIcons = {
  '16:9': Monitor,
  '9:16': Smartphone,
  '1:1': Square,
}

const statusColors = {
  pending: 'bg-gray-100 text-gray-600',
  generating: 'bg-yellow-100 text-yellow-700',
  ready: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
}

export default function VariantGallery({ variants, onSelect, onRender, selectedId }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Variants</h3>
        <span className="text-sm text-gray-500">{variants.length} variants</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {variants.map((variant, index) => (
          <VariantCard
            key={variant.variantId}
            variant={variant}
            index={index}
            isSelected={selectedId === variant.variantId}
            onSelect={() => onSelect(variant)}
            onRender={() => onRender(variant)}
          />
        ))}
      </div>
    </div>
  )
}

function VariantCard({ variant, index, isSelected, onSelect, onRender }) {
  const [isHovered, setIsHovered] = useState(false)
  const AspectIcon = aspectRatioIcons[variant.aspectRatio] || Monitor

  const aspectRatioClass = {
    '16:9': 'aspect-video',
    '9:16': 'aspect-[9/16]',
    '1:1': 'aspect-square',
  }[variant.aspectRatio] || 'aspect-video'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={clsx(
        'bg-white rounded-xl border-2 overflow-hidden transition-all cursor-pointer',
        isSelected ? 'border-primary-500 shadow-lg' : 'border-gray-200 hover:border-gray-300'
      )}
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Preview */}
      <div className={clsx('relative bg-gray-100', aspectRatioClass)}>
        {variant.previewUrl || variant.scenes?.[0]?.imageUrl ? (
          <img
            src={variant.previewUrl || variant.scenes?.[0]?.imageUrl}
            alt={`Variant ${variant.aspectRatio}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            {variant.status === 'generating' ? (
              <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
            ) : (
              <AspectIcon className="w-12 h-12 text-gray-300" />
            )}
          </div>
        )}

        {/* Watermark indicator */}
        {(variant.previewUrl || variant.scenes?.[0]?.imageUrl) && (
          <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/50 text-white text-xs rounded">
            PREVIEW
          </div>
        )}

        {/* Hover overlay */}
        {isHovered && variant.status === 'ready' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/40 flex items-center justify-center gap-3"
          >
            <button className="p-3 bg-white rounded-full hover:bg-gray-100 transition-colors">
              <Play className="w-5 h-5 text-gray-900" />
            </button>
          </motion.div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <AspectIcon className="w-4 h-4 text-gray-500" />
            <span className="font-medium text-gray-900">{variant.aspectRatio}</span>
          </div>
          <span className={clsx(
            'px-2 py-1 rounded-full text-xs font-medium',
            statusColors[variant.status]
          )}>
            {variant.status === 'generating' && <Loader2 className="w-3 h-3 inline mr-1 animate-spin" />}
            {variant.status === 'ready' && <Check className="w-3 h-3 inline mr-1" />}
            {variant.status.charAt(0).toUpperCase() + variant.status.slice(1)}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onRender()
            }}
            disabled={variant.status !== 'ready'}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            Render
          </button>
          <button
            onClick={(e) => e.stopPropagation()}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => e.stopPropagation()}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}
