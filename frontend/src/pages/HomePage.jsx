import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Sparkles, Clock, Video, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'

// Mock data for demo
const mockProjects = [
  {
    id: 'proj_demo_1',
    name: 'TechStartup Landing',
    url: 'https://example-startup.com',
    createdAt: new Date(Date.now() - 86400000),
    variants: 3,
    status: 'ready',
    thumbnail: null,
  },
  {
    id: 'proj_demo_2',
    name: 'E-commerce Store',
    url: 'https://shop-example.com',
    createdAt: new Date(Date.now() - 172800000),
    variants: 3,
    status: 'processing',
    thumbnail: null,
  },
]

export default function HomePage({ onQuickCreate }) {
  const [projects] = useState(mockProjects)

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-500 mt-1">Create and manage your ad campaigns</p>
        </div>
        <button
          onClick={onQuickCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          New Project
        </button>
      </div>

      {/* Quick Start */}
      <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl p-8 mb-8 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Create Your First Ad</h2>
            <p className="text-primary-100 mb-6 max-w-md">
              Paste any website URL and let AI generate stunning video ads in multiple formats. 
              It's that simple.
            </p>
            <button
              onClick={onQuickCreate}
              className="flex items-center gap-2 px-6 py-3 bg-white text-primary-700 rounded-lg hover:bg-primary-50 transition-colors font-medium"
            >
              <Sparkles className="w-5 h-5" />
              Quick Create
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="hidden lg:block">
            <div className="w-48 h-32 bg-white/10 rounded-lg backdrop-blur-sm flex items-center justify-center">
              <Video className="w-16 h-16 text-white/50" />
            </div>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      {projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, index) => (
            <ProjectCard key={project.id} project={project} index={index} />
          ))}
        </div>
      ) : (
        <EmptyState onQuickCreate={onQuickCreate} />
      )}
    </div>
  )
}

function ProjectCard({ project, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Link
        to={`/project/${project.id}`}
        className="block bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
      >
        {/* Thumbnail */}
        <div className="aspect-video bg-gray-100 relative">
          {project.thumbnail ? (
            <img
              src={project.thumbnail}
              alt={project.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Video className="w-12 h-12 text-gray-300" />
            </div>
          )}
          
          {/* Status badge */}
          <div className="absolute top-3 right-3">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              project.status === 'ready' 
                ? 'bg-green-100 text-green-700'
                : 'bg-yellow-100 text-yellow-700'
            }`}>
              {project.status === 'ready' ? 'Ready' : 'Processing'}
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-1">{project.name}</h3>
          <p className="text-sm text-gray-500 truncate mb-3">{project.url}</p>
          
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Video className="w-4 h-4" />
              <span>{project.variants} variants</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{formatRelativeTime(project.createdAt)}</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

function EmptyState({ onQuickCreate }) {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Video className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">No projects yet</h3>
      <p className="text-gray-500 mb-6 max-w-sm mx-auto">
        Create your first project by pasting a website URL. We'll generate video ads automatically.
      </p>
      <button
        onClick={onQuickCreate}
        className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
      >
        <Plus className="w-5 h-5" />
        Create Project
      </button>
    </div>
  )
}

function formatRelativeTime(date) {
  const now = new Date()
  const diff = now - date
  const days = Math.floor(diff / 86400000)
  
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return date.toLocaleDateString()
}
