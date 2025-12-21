import { spawn } from 'child_process'

const FFMPEG_PATH = process.env.FFMPEG_PATH || 'ffmpeg'

// Check if FFmpeg is available
const ffmpeg = spawn(FFMPEG_PATH, ['-version'])

ffmpeg.on('close', (code) => {
  if (code === 0) {
    console.log('Health check passed: FFmpeg is available')
    process.exit(0)
  } else {
    console.error('Health check failed: FFmpeg not available')
    process.exit(1)
  }
})

ffmpeg.on('error', (error) => {
  console.error('Health check failed:', error.message)
  process.exit(1)
})
