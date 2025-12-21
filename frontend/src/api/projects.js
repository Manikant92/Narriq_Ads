import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

// Request interceptor for logging
api.interceptors.request.use((config) => {
  console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`)
  return config
})

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('[API Error]', error.response?.data || error.message)
    throw error.response?.data || error
  }
)

/**
 * Create a new project with Ad Generation
 */
export async function createProject({ url, aspectRatios, duration, brandHints }) {
  const response = await api.post('/generate', {
    url,
    aspectRatios,
    duration,
    brandHints,
  })
  return response.data
}

/**
 * Get project status and variants
 */
export async function getProject(projectId) {
  const response = await api.get(`/project/${projectId}`)
  return response.data
}

/**
 * Start a render job
 */
export async function startRender({ projectId, variantId, quality, watermark }) {
  const response = await api.post('/render', {
    projectId,
    variantId,
    quality,
    watermark,
  })
  return response.data
}

/**
 * Get render job status
 */
export async function getRenderStatus(jobId) {
  const response = await api.get(`/render-status/${jobId}`)
  return response.data
}

/**
 * Convert sketch to storyboard
 */
export async function convertSketchToStoryboard({ imageData, projectId, hints }) {
  const response = await api.post('/sketch-to-storyboard', {
    imageData,
    projectId,
    hints,
  })
  return response.data
}

/**
 * Apply edits to a variant
 */
export async function editVariant({ projectId, variantId, edits, regenerateImages, regenerateTTS }) {
  const response = await api.post('/edit', {
    projectId,
    variantId,
    edits,
    regenerateImages,
    regenerateTTS,
  })
  return response.data
}

/**
 * Generate TTS audio
 */
export async function generateVoice({ text, voiceId, voiceSettings }) {
  const response = await api.post('/ai/voice', {
    text,
    voiceId,
    voiceSettings,
  })
  return response.data
}

/**
 * Get available TTS voices
 */
export async function getVoices() {
  const response = await api.get('/ai/voices')
  return response.data.voices
}

/**
 * Generate AI image
 */
export async function generateImage({ prompt, aspectRatio, style, provider }) {
  const response = await api.post('/ai/image', {
    prompt,
    aspectRatio,
    style,
    provider,
  })
  return response.data
}

/**
 * Get project analytics
 */
export async function getProjectAnalytics(projectId) {
  const response = await api.get(`/analytics/${projectId}`)
  return response.data
}

/**
 * Get global platform analytics
 */
export async function getGlobalAnalytics() {
  const response = await api.get('/analytics')
  return response.data
}
