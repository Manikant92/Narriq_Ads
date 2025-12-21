import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Loader2, Download, RefreshCw } from 'lucide-react'
import { motion } from 'framer-motion'
import clsx from 'clsx'
import { getRenderStatus } from '../api/projects'

const statusConfig = {
  queued: {
    icon: Loader2,
    color: 'text-gray-500',
    bgColor: 'bg-gray-100',
    label: 'Queued',
    animate: true,
  },
  moderating: {
    icon: Loader2,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-100',
    label: 'Content Check',
    animate: true,
  },
  processing: {
    icon: Loader2,
    color: 'text-primary-500',
    bgColor: 'bg-primary-100',
    label: 'Rendering',
    animate: true,
  },
  completed: {
    icon: CheckCircle,
    color: 'text-green-500',
    bgColor: 'bg-green-100',
    label: 'Complete',
    animate: false,
  },
  failed: {
    icon: XCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-100',
    label: 'Failed',
    animate: false,
  },
}

export default function RenderProgress({ jobId, onComplete, onRetry }) {
  const [status, setStatus] = useState('queued')
  const [progress, setProgress] = useState(0)
  const [outputUrl, setOutputUrl] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!jobId) return

    let isMounted = true
    let interval = null

    const pollStatus = async () => {
      if (!isMounted) return
      
      try {
        const data = await getRenderStatus(jobId)
        
        if (!isMounted) return
        
        setStatus(data.status)
        setProgress(data.progress || 0)
        
        if (data.outputUrl) {
          setOutputUrl(data.outputUrl)
        }
        
        if (data.error) {
          setError(data.error)
        }

        if (data.status === 'completed') {
          onComplete?.(data)
          // Stop polling when completed
          if (interval) {
            clearInterval(interval)
            interval = null
          }
        }
        
        if (data.status === 'failed') {
          // Stop polling when failed
          if (interval) {
            clearInterval(interval)
            interval = null
          }
        }
      } catch (err) {
        console.error('Failed to fetch render status:', err)
      }
    }

    // Initial poll
    pollStatus()

    // Set up polling interval
    interval = setInterval(pollStatus, 2000)

    return () => {
      isMounted = false
      if (interval) clearInterval(interval)
    }
  }, [jobId, onComplete])

  const config = statusConfig[status] || statusConfig.queued
  const StatusIcon = config.icon

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-4 mb-6">
        <div className={clsx('p-3 rounded-full', config.bgColor)}>
          <StatusIcon className={clsx('w-6 h-6', config.color, config.animate && 'animate-spin')} />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{config.label}</h3>
          <p className="text-sm text-gray-500">
            {status === 'queued' && 'Your render is in the queue...'}
            {status === 'moderating' && 'Checking content safety...'}
            {status === 'processing' && `Rendering your video... ${progress}%`}
            {status === 'completed' && 'Your video is ready!'}
            {status === 'failed' && (error || 'Something went wrong')}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      {(status === 'processing' || status === 'moderating') && (
        <div className="mb-6">
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
        </div>
      )}

      {/* Render stages */}
      <div className="space-y-3 mb-6">
        <RenderStage 
          label="Content Moderation" 
          status={getStageStatus('moderating', status, progress)} 
        />
        <RenderStage 
          label="Generating Frames" 
          status={getStageStatus('frames', status, progress)} 
        />
        <RenderStage 
          label="Adding Audio" 
          status={getStageStatus('audio', status, progress)} 
        />
        <RenderStage 
          label="Final Composition" 
          status={getStageStatus('composition', status, progress)} 
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {status === 'completed' && outputUrl && (
          <a
            href={outputUrl}
            download
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            <Download className="w-5 h-5" />
            Download Video
          </a>
        )}
        
        {status === 'failed' && (
          <button
            onClick={onRetry}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            <RefreshCw className="w-5 h-5" />
            Retry Render
          </button>
        )}
      </div>
    </div>
  )
}

function RenderStage({ label, status }) {
  const statusStyles = {
    pending: 'bg-gray-200',
    active: 'bg-primary-500 animate-pulse',
    completed: 'bg-green-500',
    failed: 'bg-red-500',
  }

  return (
    <div className="flex items-center gap-3">
      <div className={clsx('w-2 h-2 rounded-full', statusStyles[status])} />
      <span className={clsx(
        'text-sm',
        status === 'active' ? 'text-gray-900 font-medium' : 'text-gray-500'
      )}>
        {label}
      </span>
      {status === 'completed' && (
        <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />
      )}
    </div>
  )
}

function getStageStatus(stage, currentStatus, progress) {
  const stages = ['moderating', 'frames', 'audio', 'composition']
  const stageIndex = stages.indexOf(stage)
  
  if (currentStatus === 'failed') {
    return progress > stageIndex * 25 ? 'failed' : 'pending'
  }
  
  if (currentStatus === 'completed') {
    return 'completed'
  }
  
  if (currentStatus === 'queued') {
    return 'pending'
  }
  
  // Processing
  const currentStageIndex = Math.floor(progress / 25)
  
  if (stageIndex < currentStageIndex) {
    return 'completed'
  } else if (stageIndex === currentStageIndex) {
    return 'active'
  }
  
  return 'pending'
}
