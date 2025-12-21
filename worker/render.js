/**
 * Narriq FFmpeg Render Worker
 * 
 * This worker processes render jobs from the queue and produces
 * video outputs using FFmpeg.
 */

import { spawn } from 'child_process'
import { writeFileSync, mkdirSync, existsSync, unlinkSync, statSync } from 'fs'
import { join } from 'path'
import axios from 'axios'

const FFMPEG_PATH = process.env.FFMPEG_PATH || 'ffmpeg'
const WORK_DIR = process.env.WORK_DIR || '/app/tmp'
const OUTPUT_DIR = process.env.OUTPUT_DIR || '/app/output'
const MOTIA_API_URL = process.env.MOTIA_API_URL || 'http://localhost:3000'

// Ensure directories exist
if (!existsSync(WORK_DIR)) mkdirSync(WORK_DIR, { recursive: true })
if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true })

/**
 * Main render function
 */
async function renderVideo(job) {
  const { jobId, variantId, aspectRatio, scenes, watermark, quality, brandProfile } = job
  const jobDir = join(WORK_DIR, jobId)
  
  console.log(`[Worker] Starting render job: ${jobId}`)
  
  try {
    // Create job directory
    if (!existsSync(jobDir)) {
      mkdirSync(jobDir, { recursive: true })
    }

    // Report progress
    await reportProgress(jobId, 5, 'Downloading assets...')

    // Download scene images
    const imagePaths = await downloadSceneImages(scenes, jobDir)
    
    await reportProgress(jobId, 20, 'Preparing composition...')

    // Generate FFmpeg filter complex
    const resolution = getResolution(aspectRatio, quality)
    const filterComplex = buildFilterComplex(scenes, imagePaths, resolution, watermark, brandProfile)
    
    await reportProgress(jobId, 30, 'Rendering video...')

    // Build and execute FFmpeg command
    const outputPath = join(OUTPUT_DIR, `${jobId}_${quality}.mp4`)
    const result = await executeFFmpeg(imagePaths, filterComplex, outputPath, quality, jobId)

    if (result.success) {
      await reportProgress(jobId, 100, 'Complete')
      
      // Report completion
      await reportCompletion(jobId, {
        outputUrl: outputPath,
        duration: result.duration,
        fileSize: result.fileSize,
      })
      
      console.log(`[Worker] Render complete: ${jobId}`)
    } else {
      throw new Error(result.error)
    }

    // Cleanup
    cleanupJobDir(jobDir)
    
    return { success: true, outputPath }
  } catch (error) {
    console.error(`[Worker] Render failed: ${jobId}`, error)
    
    await reportFailure(jobId, error.message)
    cleanupJobDir(jobDir)
    
    return { success: false, error: error.message }
  }
}

/**
 * Download scene images to local directory
 */
async function downloadSceneImages(scenes, jobDir) {
  const imagePaths = []
  
  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i]
    const imagePath = join(jobDir, `scene_${i}.png`)
    
    if (scene.imageUrl && scene.imageUrl.startsWith('http')) {
      try {
        const response = await axios.get(scene.imageUrl, { responseType: 'arraybuffer' })
        writeFileSync(imagePath, response.data)
      } catch (error) {
        console.warn(`Failed to download image for scene ${i}, using placeholder`)
        await createPlaceholderImage(imagePath, i + 1)
      }
    } else {
      await createPlaceholderImage(imagePath, i + 1)
    }
    
    imagePaths.push(imagePath)
  }
  
  return imagePaths
}

/**
 * Create a placeholder image
 */
async function createPlaceholderImage(path, sceneNumber) {
  // Create a simple colored placeholder using FFmpeg
  const color = ['#2563eb', '#1e40af', '#3b82f6', '#60a5fa'][sceneNumber % 4]
  
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn(FFMPEG_PATH, [
      '-f', 'lavfi',
      '-i', `color=c=${color.replace('#', '0x')}:s=1920x1080:d=1`,
      '-vframes', '1',
      '-y',
      path
    ])
    
    ffmpeg.on('close', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`Placeholder creation failed with code ${code}`))
    })
  })
}

/**
 * Build FFmpeg filter complex
 */
function buildFilterComplex(scenes, imagePaths, resolution, watermark, brandProfile) {
  const filters = []
  const { width, height } = resolution
  
  // Process each scene
  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i]
    const sceneFilters = []
    
    // Scale and pad
    sceneFilters.push(`[${i}:v]scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`)
    
    // Loop for duration
    const frames = Math.ceil(scene.duration * 25)
    sceneFilters.push(`loop=loop=${frames}:size=1:start=0`)
    sceneFilters.push(`setpts=N/25/TB`)
    sceneFilters.push(`trim=duration=${scene.duration}`)
    
    // Add text overlay if present
    if (scene.textOverlay) {
      const escapedText = scene.textOverlay.replace(/'/g, "\\'").replace(/:/g, "\\:")
      sceneFilters.push(`drawtext=text='${escapedText}':fontsize=64:fontcolor=white:borderw=3:bordercolor=black:x=(w-text_w)/2:y=h*0.8`)
    }
    
    filters.push(sceneFilters.join(',') + `[v${i}]`)
  }
  
  // Concatenate scenes
  const concatInputs = scenes.map((_, i) => `[v${i}]`).join('')
  filters.push(`${concatInputs}concat=n=${scenes.length}:v=1:a=0[outv]`)
  
  // Add watermark if enabled
  if (watermark) {
    filters.push(`[outv]drawtext=text='NARRIQ PREVIEW':fontsize=48:fontcolor=white@0.5:x=(w-text_w)/2:y=h-100[finalv]`)
  } else {
    filters.push(`[outv]copy[finalv]`)
  }
  
  return filters.join(';')
}

/**
 * Execute FFmpeg command
 */
function executeFFmpeg(imagePaths, filterComplex, outputPath, quality, jobId) {
  return new Promise((resolve) => {
    const args = ['-y']
    
    // Add inputs
    for (const imagePath of imagePaths) {
      args.push('-loop', '1', '-i', imagePath)
    }
    
    // Add filter complex
    args.push('-filter_complex', filterComplex)
    args.push('-map', '[finalv]')
    
    // Quality settings
    if (quality === 'final') {
      args.push('-c:v', 'libx264', '-preset', 'slow', '-crf', '18')
    } else {
      args.push('-c:v', 'libx264', '-preset', 'fast', '-crf', '28')
    }
    
    args.push('-pix_fmt', 'yuv420p')
    args.push('-movflags', '+faststart')
    args.push(outputPath)
    
    console.log(`[Worker] FFmpeg args:`, args.join(' '))
    
    const ffmpeg = spawn(FFMPEG_PATH, args)
    let stderr = ''
    let lastProgress = 0
    
    ffmpeg.stderr.on('data', async (data) => {
      stderr += data.toString()
      
      // Parse progress
      const timeMatch = stderr.match(/time=(\d{2}):(\d{2}):(\d{2})/)
      if (timeMatch) {
        const currentTime = parseInt(timeMatch[1]) * 3600 + parseInt(timeMatch[2]) * 60 + parseInt(timeMatch[3])
        const progress = Math.min(95, 30 + currentTime * 2)
        
        if (progress > lastProgress + 5) {
          lastProgress = progress
          await reportProgress(jobId, progress, 'Rendering...')
        }
      }
    })
    
    ffmpeg.on('close', (code) => {
      if (code === 0) {
        const stats = statSync(outputPath)
        resolve({
          success: true,
          duration: 30, // TODO: Get actual duration
          fileSize: stats.size,
        })
      } else {
        resolve({
          success: false,
          error: `FFmpeg exited with code ${code}: ${stderr.slice(-500)}`,
        })
      }
    })
    
    ffmpeg.on('error', (error) => {
      resolve({
        success: false,
        error: error.message,
      })
    })
  })
}

/**
 * Get resolution based on aspect ratio and quality
 */
function getResolution(aspectRatio, quality) {
  const resolutions = {
    '16:9': { preview: { width: 1280, height: 720 }, final: { width: 1920, height: 1080 } },
    '9:16': { preview: { width: 720, height: 1280 }, final: { width: 1080, height: 1920 } },
    '1:1': { preview: { width: 720, height: 720 }, final: { width: 1080, height: 1080 } },
  }
  
  return resolutions[aspectRatio]?.[quality] || resolutions['16:9'].preview
}

/**
 * Report progress to Motia
 */
async function reportProgress(jobId, progress, message) {
  try {
    await axios.post(`${MOTIA_API_URL}/api/worker/progress`, {
      jobId,
      progress,
      message,
    })
  } catch (error) {
    console.warn(`Failed to report progress: ${error.message}`)
  }
}

/**
 * Report completion to Motia
 */
async function reportCompletion(jobId, result) {
  try {
    await axios.post(`${MOTIA_API_URL}/api/worker/complete`, {
      jobId,
      ...result,
    })
  } catch (error) {
    console.warn(`Failed to report completion: ${error.message}`)
  }
}

/**
 * Report failure to Motia
 */
async function reportFailure(jobId, error) {
  try {
    await axios.post(`${MOTIA_API_URL}/api/worker/failed`, {
      jobId,
      error,
    })
  } catch (err) {
    console.warn(`Failed to report failure: ${err.message}`)
  }
}

/**
 * Cleanup job directory
 */
function cleanupJobDir(jobDir) {
  try {
    if (existsSync(jobDir)) {
      const files = require('fs').readdirSync(jobDir)
      for (const file of files) {
        unlinkSync(join(jobDir, file))
      }
      require('fs').rmdirSync(jobDir)
    }
  } catch (error) {
    console.warn(`Failed to cleanup job directory: ${error.message}`)
  }
}

// Export for use as module
export { renderVideo }

// If running directly, start worker loop
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('[Worker] FFmpeg Render Worker started')
  console.log(`[Worker] FFmpeg path: ${FFMPEG_PATH}`)
  console.log(`[Worker] Work directory: ${WORK_DIR}`)
  console.log(`[Worker] Output directory: ${OUTPUT_DIR}`)
  
  // TODO: Implement job queue polling
  // For now, this is a placeholder for the worker loop
  setInterval(() => {
    console.log('[Worker] Waiting for jobs...')
  }, 30000)
}
