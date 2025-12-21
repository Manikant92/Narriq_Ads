import OpenAI from 'openai'
import pRetry from 'p-retry'

// Initialize OpenAI client - handle missing API key gracefully
const apiKey = process.env.OPENAI_API_KEY || ''

export const openai = new OpenAI({
  apiKey: apiKey || 'dummy-key-for-dev', // Prevent initialization error
})

// Check if API key is configured
export function isOpenAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY
}

// Retry configuration
const RETRY_OPTIONS = {
  retries: 3,
  minTimeout: 1000,
  maxTimeout: 10000,
  onFailedAttempt: (error: any) => {
    console.warn(`OpenAI request failed, attempt ${error.attemptNumber}/${error.retriesLeft + error.attemptNumber}:`, error.message)
  },
}

/**
 * Generate a chat completion with retry logic
 */
export async function generateCompletion(options: {
  messages: OpenAI.ChatCompletionMessageParam[]
  model?: string
  temperature?: number
  maxTokens?: number
  responseFormat?: 'text' | 'json'
}): Promise<string> {
  const {
    messages,
    model = 'gpt-4o',
    temperature = 0.7,
    maxTokens = 2000,
    responseFormat = 'text',
  } = options

  return pRetry(async () => {
    const completion = await openai.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      response_format: responseFormat === 'json' ? { type: 'json_object' } : undefined,
    })

    return completion.choices[0].message.content || ''
  }, RETRY_OPTIONS)
}

/**
 * Generate an image with DALL-E
 */
export async function generateDallEImage(options: {
  prompt: string
  size?: '1024x1024' | '1792x1024' | '1024x1792'
  quality?: 'standard' | 'hd'
  style?: 'vivid' | 'natural'
}): Promise<string> {
  const {
    prompt,
    size = '1024x1024',
    quality = 'standard',
    style = 'vivid',
  } = options

  return pRetry(async () => {
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size,
      quality,
      style,
    })

    return response.data[0].url || ''
  }, RETRY_OPTIONS)
}

/**
 * Generate TTS audio with OpenAI
 */
export async function generateOpenAITTS(options: {
  text: string
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'
  speed?: number
}): Promise<Buffer> {
  const {
    text,
    voice = 'alloy',
    speed = 1.0,
  } = options

  return pRetry(async () => {
    const response = await openai.audio.speech.create({
      model: 'tts-1',
      voice,
      input: text,
      speed,
      response_format: 'mp3',
    })

    return Buffer.from(await response.arrayBuffer())
  }, RETRY_OPTIONS)
}

/**
 * Run content moderation
 */
export async function moderateContent(text: string): Promise<{
  flagged: boolean
  categories: Record<string, boolean>
  scores: Record<string, number>
}> {
  return pRetry(async () => {
    const response = await openai.moderations.create({
      input: text,
    })

    const result = response.results[0]
    return {
      flagged: result.flagged,
      categories: result.categories as unknown as Record<string, boolean>,
      scores: result.category_scores as unknown as Record<string, number>,
    }
  }, RETRY_OPTIONS)
}

/**
 * Analyze image with GPT-4 Vision
 */
export async function analyzeImage(options: {
  imageUrl: string
  prompt: string
  maxTokens?: number
}): Promise<string> {
  const { imageUrl, prompt, maxTokens = 1000 } = options

  return pRetry(async () => {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: imageUrl } },
            { type: 'text', text: prompt },
          ],
        },
      ],
      max_tokens: maxTokens,
    })

    return response.choices[0].message.content || ''
  }, RETRY_OPTIONS)
}

/**
 * Generate embeddings for text
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  return pRetry(async () => {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    })

    return response.data[0].embedding
  }, RETRY_OPTIONS)
}
