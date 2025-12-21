import { z } from 'zod'
import OpenAI from 'openai'

const inputSchema = z.object({
  projectId: z.string(),
  brandProfile: z.any(),
  scripts: z.array(z.any()),
  variants: z.array(z.any()),
  analytics: z.array(z.any()).optional(),
})

export const config = {
  type: 'event' as const,
  name: 'tts',
  description: 'Generates text-to-speech audio for all variants using OpenAI TTS',
  subscribes: ['analytics.scored'],
  emits: [{ topic: 'tts.completed', label: 'TTS Completed' }],
  input: inputSchema,
  flows: ['ad-generation'],
}

type Input = z.infer<typeof inputSchema>

export const handler = async (input: Input, ctx: any) => {
  ctx.logger.info('Starting TTS generation for all variants', {
    projectId: input.projectId,
    variantCount: input.scripts.length,
    traceId: ctx.traceId,
  })

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const ttsResults: any[] = []

  for (const script of input.scripts) {
    // Combine all voiceovers for the variant
    const fullVoiceover = script.scenes
      .map((s: any) => s.voiceover)
      .filter(Boolean)
      .join('. ')

    ctx.logger.info('Generating TTS for variant', {
      variantId: script.variantId,
      textLength: fullVoiceover.length,
    })

    try {
      const response = await openai.audio.speech.create({
        model: 'tts-1',
        voice: 'alloy',
        input: fullVoiceover,
        response_format: 'mp3',
      })

      // Store audio in state instead of passing in event (to avoid ENAMETOOLONG)
      const buffer = Buffer.from(await response.arrayBuffer())
      const audioKey = `audio_${script.variantId}`
      
      // Store audio data in state
      await ctx.state.set('audio', audioKey, {
        data: buffer.toString('base64'),
        createdAt: Date.now(),
      })

      // Estimate duration
      const wordCount = fullVoiceover.split(/\s+/).length
      const duration = Math.max(5, (wordCount / 150) * 60)

      ttsResults.push({
        variantId: script.variantId,
        audioKey, // Reference to state instead of full data
        duration,
        provider: 'openai',
      })

      ctx.logger.info('TTS completed for variant', {
        variantId: script.variantId,
        duration,
      })
    } catch (error) {
      ctx.logger.error('TTS failed for variant', { variantId: script.variantId, error })
      ttsResults.push({
        variantId: script.variantId,
        audioKey: null,
        duration: 5,
        provider: 'failed',
        error: 'TTS generation failed',
      })
    }
  }

  ctx.logger.info('All TTS completed', {
    projectId: input.projectId,
    successCount: ttsResults.filter((r) => r.audioKey).length,
  })

  await ctx.emit({
    topic: 'tts.completed',
    data: {
      projectId: input.projectId,
      brandProfile: input.brandProfile,
      scripts: input.scripts,
      variants: input.variants,
      analytics: input.analytics,
      ttsResults,
    },
  })
}
