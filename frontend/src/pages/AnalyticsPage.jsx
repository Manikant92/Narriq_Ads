import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { BarChart3, TrendingUp, Clock, CheckCircle, XCircle, Video, Eye, Download, Share2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { getProjectAnalytics, getGlobalAnalytics } from '../api/projects'

export default function AnalyticsPage() {
  const { projectId } = useParams()
  const [analytics, setAnalytics] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        if (projectId) {
          const data = await getProjectAnalytics(projectId)
          setAnalytics(data)
        } else {
          const data = await getGlobalAnalytics()
          setAnalytics(data)
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error)
        // Use mock data for demo
        setAnalytics(getMockAnalytics(projectId))
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnalytics()
  }, [projectId])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-gray-400">Loading analytics...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {projectId ? 'Project Analytics' : 'Platform Analytics'}
        </h1>
        <p className="text-gray-500 mt-1">
          {projectId ? 'Performance metrics for this project' : 'Overview of all platform activity'}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard
          title="Total Renders"
          value={analytics?.platform?.totalRenders || analytics?.metrics?.rendersCompleted || 0}
          icon={Video}
          trend="+12%"
          trendUp={true}
        />
        <KPICard
          title="Success Rate"
          value={`${(analytics?.platform?.successRate || analytics?.kpis?.successRate || 100).toFixed(1)}%`}
          icon={CheckCircle}
          trend="+2.5%"
          trendUp={true}
        />
        <KPICard
          title="Avg Render Time"
          value={`${(analytics?.platform?.avgRenderTime || analytics?.kpis?.avgRenderTime || 0).toFixed(1)}s`}
          icon={Clock}
          trend="-8%"
          trendUp={true}
        />
        <KPICard
          title={projectId ? 'Preview Views' : 'Total Projects'}
          value={analytics?.platform?.totalProjects || analytics?.metrics?.previewViews || 0}
          icon={projectId ? Eye : BarChart3}
          trend="+24%"
          trendUp={true}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Render Activity */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Render Activity</h3>
          <div className="h-64 flex items-end justify-between gap-2">
            {Array.from({ length: 7 }).map((_, i) => {
              const height = 30 + Math.random() * 70
              return (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="flex-1 bg-primary-500 rounded-t-lg"
                />
              )
            })}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <span key={day}>{day}</span>
            ))}
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Distribution</h3>
          <div className="space-y-4">
            <StatusBar label="Completed" value={75} color="bg-green-500" />
            <StatusBar label="Processing" value={15} color="bg-yellow-500" />
            <StatusBar label="Failed" value={10} color="bg-red-500" />
          </div>
        </div>
      </div>

      {/* Recent Events */}
      {analytics?.recentEvents && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Events</h3>
          <div className="space-y-3">
            {analytics.recentEvents.slice(0, 10).map((event, index) => (
              <EventRow key={event.eventId || index} event={event} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function KPICard({ title, value, icon: Icon, trend, trendUp }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-gray-200 p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-primary-100 rounded-lg">
          <Icon className="w-5 h-5 text-primary-600" />
        </div>
        {trend && (
          <span className={`flex items-center gap-1 text-sm font-medium ${
            trendUp ? 'text-green-600' : 'text-red-600'
          }`}>
            <TrendingUp className={`w-4 h-4 ${!trendUp && 'rotate-180'}`} />
            {trend}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-500 mt-1">{title}</div>
    </motion.div>
  )
}

function StatusBar({ label, value, color }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-gray-600">{label}</span>
        <span className="text-sm font-medium text-gray-900">{value}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.5 }}
          className={`h-full ${color} rounded-full`}
        />
      </div>
    </div>
  )
}

function EventRow({ event }) {
  const eventIcons = {
    'project.created': Video,
    'variant.generated': Video,
    'render.started': Clock,
    'render.completed': CheckCircle,
    'render.failed': XCircle,
    'preview.viewed': Eye,
    'video.downloaded': Download,
    'video.shared': Share2,
  }

  const Icon = eventIcons[event.eventType] || Video

  return (
    <div className="flex items-center gap-4 py-2 border-b border-gray-100 last:border-0">
      <div className="p-2 bg-gray-100 rounded-lg">
        <Icon className="w-4 h-4 text-gray-600" />
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium text-gray-900">
          {event.eventType.replace(/\./g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </div>
        <div className="text-xs text-gray-500">
          {new Date(event.timestamp).toLocaleString()}
        </div>
      </div>
    </div>
  )
}

function getMockAnalytics(projectId) {
  if (projectId) {
    return {
      projectId,
      metrics: {
        variantsGenerated: 3,
        rendersCompleted: 5,
        rendersFailed: 0,
        totalRenderTime: 150,
        previewViews: 24,
        downloads: 3,
        shares: 1,
      },
      kpis: {
        conversionRate: 12.5,
        avgRenderTime: 30,
        successRate: 100,
        engagementScore: 89,
      },
      recentEvents: [
        { eventId: '1', eventType: 'render.completed', timestamp: new Date().toISOString() },
        { eventId: '2', eventType: 'preview.viewed', timestamp: new Date(Date.now() - 3600000).toISOString() },
        { eventId: '3', eventType: 'variant.generated', timestamp: new Date(Date.now() - 7200000).toISOString() },
      ],
    }
  }

  return {
    platform: {
      totalProjects: 12,
      totalRenders: 45,
      avgRenderTime: 28.5,
      successRate: 95.5,
      queueDepth: 2,
    },
  }
}
