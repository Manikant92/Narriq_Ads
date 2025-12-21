import { create } from 'zustand'

// Project store
export const useProjectStore = create((set, get) => ({
  projects: [],
  currentProject: null,
  isLoading: false,
  error: null,

  setProjects: (projects) => set({ projects }),
  setCurrentProject: (project) => set({ currentProject: project }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  addProject: (project) => set((state) => ({
    projects: [project, ...state.projects],
  })),

  updateProject: (projectId, updates) => set((state) => ({
    projects: state.projects.map((p) =>
      p.projectId === projectId ? { ...p, ...updates } : p
    ),
    currentProject:
      state.currentProject?.projectId === projectId
        ? { ...state.currentProject, ...updates }
        : state.currentProject,
  })),
}))

// Render store
export const useRenderStore = create((set) => ({
  activeJobs: {},
  
  setJobProgress: (jobId, progress) => set((state) => ({
    activeJobs: {
      ...state.activeJobs,
      [jobId]: { ...state.activeJobs[jobId], progress },
    },
  })),

  setJobStatus: (jobId, status) => set((state) => ({
    activeJobs: {
      ...state.activeJobs,
      [jobId]: { ...state.activeJobs[jobId], status },
    },
  })),

  setJobComplete: (jobId, outputUrl) => set((state) => ({
    activeJobs: {
      ...state.activeJobs,
      [jobId]: { ...state.activeJobs[jobId], status: 'completed', outputUrl },
    },
  })),

  removeJob: (jobId) => set((state) => {
    const { [jobId]: _, ...rest } = state.activeJobs
    return { activeJobs: rest }
  }),
}))

// UI store
export const useUIStore = create((set) => ({
  showQuickCreate: false,
  sidebarOpen: true,
  activeTab: 'variants',

  setShowQuickCreate: (show) => set({ showQuickCreate: show }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setActiveTab: (tab) => set({ activeTab: tab }),
}))
