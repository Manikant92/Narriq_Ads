import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Loader2, Settings, Share2, RefreshCw } from 'lucide-react'
import VariantGallery from '../components/VariantGallery'
import TimelineEditor from '../components/TimelineEditor'
import StoryboardCanvas from '../components/StoryboardCanvas'
import RenderProgress from '../components/RenderProgress'
import { getProject, startRender } from '../api/projects'

export default function ProjectPage() {
  const { projectId } = useParams()
  const [project, setProject] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [activeTab, setActiveTab] = useState('variants')
  const [renderJobId, setRenderJobId] = useState(null)
  const [pollingCount, setPollingCount] = useState(0)

  const fetchProject = async () => {
    try {
      const data = await getProject(projectId)
      setProject(data)
      if (data.variants?.length > 0 && !selectedVariant) {
        setSelectedVariant(data.variants[0])
      }
      setError(null)
      return data // Return data to check if we should stop polling
    } catch (err) {
      console.error('Failed to fetch project:', err)
      // If project not found in state yet, it's still processing
      if (err.error === 'Project not found') {
        setError('processing')
      } else {
        setError(err.message || 'Failed to load project')
      }
      return null
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let interval = null
    
    const startPolling = async () => {
      const data = await fetchProject()
      
      // Only poll if project not found yet (still processing)
      if (!data) {
        interval = setInterval(async () => {
          setPollingCount(c => c + 1)
          const result = await fetchProject()
          // Stop polling once project is found
          if (result && result.status === 'ready') {
            clearInterval(interval)
          }
        }, 5000)
      }
    }
    
    startPolling()

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [projectId])

  const handleRender = async (variant) => {
    try {
      const result = await startRender({
        projectId: project.projectId,
        variantId: variant.variantId,
        quality: 'preview',
        watermark: true,
      })
      setRenderJobId(result.jobId)
      setActiveTab('render')
    } catch (error) {
      console.error('Failed to start render:', error)
    }
  }

  const handleScenesChange = (newScenes) => {
    if (!selectedVariant) return
    
    setProject(prev => ({
      ...prev,
      variants: prev.variants.map(v => 
        v.variantId === selectedVariant.variantId
          ? { ...v, scenes: newScenes }
          : v
      ),
    }))
    
    setSelectedVariant(prev => ({ ...prev, scenes: newScenes }))
  }

  const handleStoryboardGenerated = (storyboard) => {
    console.log('Storyboard generated:', storyboard)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading project...</p>
        </div>
      </div>
    )
  }

  if (error === 'processing') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Creating Your Ads</h2>
          <p className="text-gray-600 mb-4">
            Our AI is analyzing your website and generating 5-second video ads. This usually takes 1-2 minutes.
          </p>
          <div className="bg-gray-100 rounded-lg p-4 text-left text-sm">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Scraping website content</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Extracting brand identity</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                <span>Generating ad scripts</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                <span>Creating images with DALL-E</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                <span>Generating voiceovers</span>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            Checking for updates... ({pollingCount})
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link to="/" className="text-primary-600 hover:underline">
            Go back to projects
          </Link>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Project not found</h2>
          <Link to="/" className="text-primary-600 hover:underline">
            Go back to projects
          </Link>
        </div>
      </div>
    )
  }

  const totalDuration = selectedVariant?.scenes?.reduce((acc, s) => acc + s.duration, 0) || 5

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {project.brandProfile?.brandName || 'Project'}
              </h1>
              <p className="text-sm text-gray-500">{projectId}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={fetchProject}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <Share2 className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mt-4">
          {['variants', 'timeline', 'sketch', 'render'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-auto p-6 bg-gray-50">
        {activeTab === 'variants' && project.variants && (
          <VariantGallery
            variants={project.variants}
            selectedId={selectedVariant?.variantId}
            onSelect={setSelectedVariant}
            onRender={handleRender}
          />
        )}

        {activeTab === 'timeline' && selectedVariant && (
          <TimelineEditor
            scenes={selectedVariant.scenes || []}
            onScenesChange={handleScenesChange}
            totalDuration={totalDuration}
          />
        )}

        {activeTab === 'sketch' && (
          <StoryboardCanvas onStoryboardGenerated={handleStoryboardGenerated} />
        )}

        {activeTab === 'render' && renderJobId && (
          <RenderProgress
            jobId={renderJobId}
            onComplete={(data) => console.log('Render complete:', data)}
            onRetry={() => selectedVariant && handleRender(selectedVariant)}
          />
        )}

        {/* Show analytics if available */}
        {project.analytics?.length > 0 && activeTab === 'variants' && (
          <div className="mt-6 bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">AI Performance Predictions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {project.analytics.map((a) => (
                <div key={a.variantId} className="border rounded-lg p-4">
                  <div className="text-sm text-gray-500 mb-2">{a.aspectRatio}</div>
                  <div className="text-2xl font-bold text-primary-600">{a.overallScore}/100</div>
                  <div className="text-sm text-gray-600 mt-1">Predicted CTR: {a.predictedCTR}</div>
                  {a.suggestions?.length > 0 && (
                    <div className="mt-2 text-xs text-gray-500">
                      💡 {a.suggestions[0]}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
