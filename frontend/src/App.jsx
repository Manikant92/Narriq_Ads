import { Routes, Route } from 'react-router-dom'
import { useState } from 'react'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import ProjectPage from './pages/ProjectPage'
import AnalyticsPage from './pages/AnalyticsPage'
import QuickCreateModal from './components/QuickCreateModal'

function App() {
  const [showQuickCreate, setShowQuickCreate] = useState(false)

  return (
    <Layout onQuickCreate={() => setShowQuickCreate(true)}>
      <Routes>
        <Route path="/" element={<HomePage onQuickCreate={() => setShowQuickCreate(true)} />} />
        <Route path="/project/:projectId" element={<ProjectPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/analytics/:projectId" element={<AnalyticsPage />} />
      </Routes>
      
      <QuickCreateModal 
        isOpen={showQuickCreate} 
        onClose={() => setShowQuickCreate(false)} 
      />
    </Layout>
  )
}

export default App
