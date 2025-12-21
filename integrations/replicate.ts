import axios from 'axios'
import pRetry from 'p-retry'

const REPLICATE_API_URL = 'https://api.replicate.com/v1'

// Model versions
const MODELS = {
  sdxl: 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
  flux: 'black-forest-labs/flux-schnell',
  kandinsky: 'ai-forever/kandinsky-2.2:ea1addaab376f4dc227f5368bbd8ac01fcb0d7d77e4e8f9b8e3b8e8e8e8e8e8e',
}

// Retry configuration
const RETRY_OPTIONS = {
  retries: 3,
  minTimeout: 2000,
  maxTimeout: 30000,
  onFailedAttempt: (error: any) => {
    console.warn(`Replicate request failed, attempt ${error.attemptNumber}:`, error.message)
  },
}

interface GenerateImageOptions {
  prompt: string
  negativePrompt?: string
  aspectRatio?: string
  style?: string
  model?: keyof typeof MODELS
  numOutputs?: number
  guidanceScale?: number
  numInferenceSteps?: number
}

/**
 * Generate an image using Replicate
 */
export async function generateImage(options: GenerateImageOptions): Promise<string> {
  const {
    prompt,
    negativePrompt = 'blurry, low quality, distorted, ugly, bad anatomy',
    aspectRatio = '16:9',
    style = 'photorealistic',
    model = 'sdxl',
    numOutputs = 1,
    guidanceScale = 7.5,
    numInferenceSteps = 30,
  } = options

  const apiToken = process.env.REPLICATE_API_TOKEN
  if (!apiToken) {
    throw new Error('REPLICATE_API_TOKEN is not configured')
  }

  // Calculate dimensions based on aspect ratio
  const dimensions = getImageDimensions(aspectRatio)

  // Enhance prompt with style
  const enhancedPrompt = enhancePromptWithStyle(prompt, style)

  return pRetry(async () => {
    // Create prediction
    const createResponse = await axios.post(
      `${REPLICATE_API_URL}/predictions`,
      {
        version: MODELS[model],
        input: {
          prompt: enhancedPrompt,
          negative_prompt: negativePrompt,
          width: dimensions.width,
          height: dimensions.height,
          num_outputs: numOutputs,
          guidance_scale: guidanceScale,
          num_inference_steps: numInferenceSteps,
          scheduler: 'K_EULER',
        },
      },
      {
        headers: {
          'Authorization': `Token ${apiToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    )

    const predictionId = createResponse.data.id

    // Poll for completion
    let prediction = createResponse.data
    let attempts = 0
    const maxAttempts = 60 // 2 minutes max

    while (prediction.status !== 'succeeded' && prediction.status !== 'failed') {
      if (attempts >= maxAttempts) {
        throw new Error('Image generation timed out')
      }

      await sleep(2000)
      attempts++

      const statusResponse = await axios.get(
        `${REPLICATE_API_URL}/predictions/${predictionId}`,
        {
          headers: {
            'Authorization': `Token ${apiToken}`,
          },
          timeout: 10000,
        }
      )

      prediction = statusResponse.data
    }

    if (prediction.status === 'failed') {
      throw new Error(prediction.error || 'Image generation failed')
    }

    // Return first output URL
    const output = prediction.output
    if (Array.isArray(output) && output.length > 0) {
      return output[0]
    }

    throw new Error('No output generated')
  }, RETRY_OPTIONS)
}

/**
 * Generate video using Replicate (Runway-style)
 */
export async function generateVideo(options: {
  imageUrl: string
  prompt?: string
  duration?: number
  motionBucketId?: number
}): Promise<string> {
  const {
    imageUrl,
    prompt = '',
    duration = 4,
    motionBucketId = 127,
  } = options

  const apiToken = process.env.REPLICATE_API_TOKEN
  if (!apiToken) {
    throw new Error('REPLICATE_API_TOKEN is not configured')
  }

  return pRetry(async () => {
    // Use Stable Video Diffusion
    const createResponse = await axios.post(
      `${REPLICATE_API_URL}/predictions`,
      {
        version: 'stability-ai/stable-video-diffusion:3f0457e4619daac51203dedb472816fd4af51f3149fa7a9e0b5ffcf1b8172438',
        input: {
          input_image: imageUrl,
          motion_bucket_id: motionBucketId,
          fps: 24,
          cond_aug: 0.02,
        },
      },
      {
        headers: {
          'Authorization': `Token ${apiToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    )

    const predictionId = createResponse.data.id

    // Poll for completion (video takes longer)
    let prediction = createResponse.data
    let attempts = 0
    const maxAttempts = 120 // 4 minutes max

    while (prediction.status !== 'succeeded' && prediction.status !== 'failed') {
      if (attempts >= maxAttempts) {
        throw new Error('Video generation timed out')
      }

      await sleep(2000)
      attempts++

      const statusResponse = await axios.get(
        `${REPLICATE_API_URL}/predictions/${predictionId}`,
        {
          headers: {
            'Authorization': `Token ${apiToken}`,
          },
          timeout: 10000,
        }
      )

      prediction = statusResponse.data
    }

    if (prediction.status === 'failed') {
      throw new Error(prediction.error || 'Video generation failed')
    }

    return prediction.output
  }, RETRY_OPTIONS)
}

/**
 * Upscale an image
 */
export async function upscaleImage(imageUrl: string, scale: number = 2): Promise<string> {
  const apiToken = process.env.REPLICATE_API_TOKEN
  if (!apiToken) {
    throw new Error('REPLICATE_API_TOKEN is not configured')
  }

  return pRetry(async () => {
    const createResponse = await axios.post(
      `${REPLICATE_API_URL}/predictions`,
      {
        version: 'nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b',
        input: {
          image: imageUrl,
          scale,
          face_enhance: false,
        },
      },
      {
        headers: {
          'Authorization': `Token ${apiToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    )

    const predictionId = createResponse.data.id

    // Poll for completion
    let prediction = createResponse.data
    let attempts = 0
    const maxAttempts = 30

    while (prediction.status !== 'succeeded' && prediction.status !== 'failed') {
      if (attempts >= maxAttempts) {
        throw new Error('Upscale timed out')
      }

      await sleep(2000)
      attempts++

      const statusResponse = await axios.get(
        `${REPLICATE_API_URL}/predictions/${predictionId}`,
        {
          headers: {
            'Authorization': `Token ${apiToken}`,
          },
          timeout: 10000,
        }
      )

      prediction = statusResponse.data
    }

    if (prediction.status === 'failed') {
      throw new Error(prediction.error || 'Upscale failed')
    }

    return prediction.output
  }, RETRY_OPTIONS)
}

// Helper functions

function getImageDimensions(aspectRatio: string): { width: number; height: number } {
  const dimensions: Record<string, { width: number; height: number }> = {
    '16:9': { width: 1344, height: 768 },
    '9:16': { width: 768, height: 1344 },
    '1:1': { width: 1024, height: 1024 },
    '4:3': { width: 1152, height: 896 },
    '3:4': { width: 896, height: 1152 },
    '21:9': { width: 1536, height: 640 },
  }

  return dimensions[aspectRatio] || dimensions['16:9']
}

function enhancePromptWithStyle(prompt: string, style: string): string {
  const styleEnhancements: Record<string, string> = {
    minimalist: 'minimalist design, clean lines, simple composition, modern aesthetic, white space',
    vibrant: 'vibrant colors, energetic, bold, dynamic composition, eye-catching, saturated',
    corporate: 'professional, corporate, business, polished, clean, trustworthy',
    artistic: 'artistic, creative, painterly, expressive, unique style',
    tech: 'futuristic, high-tech, digital, sleek, modern technology, innovative',
    photorealistic: 'photorealistic, highly detailed, professional photography, 8k, sharp focus',
  }

  const enhancement = styleEnhancements[style] || styleEnhancements.photorealistic
  return `${prompt}, ${enhancement}, high quality, masterpiece`
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
