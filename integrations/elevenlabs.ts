import axios from 'axios'
import pRetry from 'p-retry'

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1'

// Default voice ID (Rachel - conversational)
const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM'

// Retry configuration
const RETRY_OPTIONS = {
  retries: 3,
  minTimeout: 1000,
  maxTimeout: 10000,
  onFailedAttempt: (error: any) => {
    console.warn(`ElevenLabs request failed, attempt ${error.attemptNumber}:`, error.message)
  },
}

interface VoiceSettings {
  stability: number
  similarityBoost: number
  style?: number
  useSpeakerBoost?: boolean
}

interface GenerateSpeechOptions {
  text: string
  voiceId?: string
  voiceSettings?: Partial<VoiceSettings>
  modelId?: string
}

interface GenerateSpeechResult {
  audioUrl: string
  duration: number
  voiceId: string
}

/**
 * Generate speech from text using ElevenLabs
 */
export async function generateSpeech(options: GenerateSpeechOptions): Promise<GenerateSpeechResult> {
  const {
    text,
    voiceId = DEFAULT_VOICE_ID,
    voiceSettings = {},
    modelId = 'eleven_monolingual_v1',
  } = options

  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY is not configured')
  }

  return pRetry(async () => {
    const response = await axios.post(
      `${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`,
      {
        text,
        model_id: modelId,
        voice_settings: {
          stability: voiceSettings.stability ?? 0.5,
          similarity_boost: voiceSettings.similarityBoost ?? 0.75,
          style: voiceSettings.style ?? 0,
          use_speaker_boost: voiceSettings.useSpeakerBoost ?? true,
        },
      },
      {
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        responseType: 'arraybuffer',
        timeout: 60000,
      }
    )

    // Convert to base64 data URL (in production, upload to storage)
    const audioBuffer = Buffer.from(response.data)
    const audioUrl = `data:audio/mpeg;base64,${audioBuffer.toString('base64')}`

    // Estimate duration (rough: ~150 words per minute)
    const wordCount = text.split(/\s+/).length
    const duration = (wordCount / 150) * 60

    return {
      audioUrl,
      duration,
      voiceId,
    }
  }, RETRY_OPTIONS)
}

/**
 * Get available voices from ElevenLabs
 */
export async function getVoices(): Promise<Voice[]> {
  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) {
    return getDefaultVoices()
  }

  try {
    const response = await axios.get(`${ELEVENLABS_API_URL}/voices`, {
      headers: {
        'xi-api-key': apiKey,
      },
      timeout: 10000,
    })

    return response.data.voices.map((voice: any) => ({
      voiceId: voice.voice_id,
      name: voice.name,
      category: voice.category || 'general',
      description: voice.description,
      previewUrl: voice.preview_url,
      labels: voice.labels || {},
    }))
  } catch (error) {
    console.warn('Failed to fetch ElevenLabs voices, using defaults:', error)
    return getDefaultVoices()
  }
}

interface Voice {
  voiceId: string
  name: string
  category: string
  description?: string
  previewUrl?: string
  labels?: Record<string, string>
}

function getDefaultVoices(): Voice[] {
  return [
    {
      voiceId: '21m00Tcm4TlvDq8ikWAM',
      name: 'Rachel',
      category: 'conversational',
      description: 'Calm and conversational female voice',
    },
    {
      voiceId: 'AZnzlk1XvdvUeBnXmlld',
      name: 'Domi',
      category: 'conversational',
      description: 'Strong and confident female voice',
    },
    {
      voiceId: 'EXAVITQu4vr4xnSDxMaL',
      name: 'Bella',
      category: 'conversational',
      description: 'Soft and gentle female voice',
    },
    {
      voiceId: 'ErXwobaYiN019PkySvjV',
      name: 'Antoni',
      category: 'conversational',
      description: 'Well-rounded male voice',
    },
    {
      voiceId: 'MF3mGyEYCl7XYWbV9V6O',
      name: 'Elli',
      category: 'conversational',
      description: 'Emotional and expressive female voice',
    },
    {
      voiceId: 'TxGEqnHWrfWFTfGW9XjX',
      name: 'Josh',
      category: 'conversational',
      description: 'Deep and authoritative male voice',
    },
    {
      voiceId: 'VR6AewLTigWG4xSOukaG',
      name: 'Arnold',
      category: 'conversational',
      description: 'Crisp and clear male voice',
    },
    {
      voiceId: 'pNInz6obpgDQGcFmaJgB',
      name: 'Adam',
      category: 'conversational',
      description: 'Deep and narrative male voice',
    },
    {
      voiceId: 'yoZ06aMxZJJ28mfd3POQ',
      name: 'Sam',
      category: 'conversational',
      description: 'Raspy and dynamic male voice',
    },
  ]
}

/**
 * Get voice by ID
 */
export async function getVoice(voiceId: string): Promise<Voice | null> {
  const voices = await getVoices()
  return voices.find(v => v.voiceId === voiceId) || null
}

/**
 * Generate speech with streaming (for real-time playback)
 */
export async function generateSpeechStream(options: GenerateSpeechOptions): Promise<NodeJS.ReadableStream> {
  const {
    text,
    voiceId = DEFAULT_VOICE_ID,
    voiceSettings = {},
    modelId = 'eleven_monolingual_v1',
  } = options

  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY is not configured')
  }

  const response = await axios.post(
    `${ELEVENLABS_API_URL}/text-to-speech/${voiceId}/stream`,
    {
      text,
      model_id: modelId,
      voice_settings: {
        stability: voiceSettings.stability ?? 0.5,
        similarity_boost: voiceSettings.similarityBoost ?? 0.75,
      },
    },
    {
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      responseType: 'stream',
      timeout: 60000,
    }
  )

  return response.data
}
