import { z } from 'zod'
import OpenAI from 'openai'

const inputSchema = z.object({
  projectId: z.string(),
  url: z.string(),
  scrapedData: z.any(),
  brandProfile: z.object({
    brandName: z.string(),
    tagline: z.string(),
    tone: z.string(),
    audience: z.string(),
    industry: z.string(),
    keyMessages: z.array(z.string()),
    callToAction: z.string(),
    primaryColor: z.string().optional(),
    secondaryColor: z.string().optional(),
  }),
  aspectRatios: z.array(z.string()).default(['16:9']),
  duration: z.number().default(5), // 5 second videos
})

export const config = {
  type: 'event' as const,
  name: 'script-gen',
  description: 'Generates 5-second ad scripts for variants using OpenAI',
  subscribes: ['brand.extracted'],
  emits: [{ topic: 'scripts.generated', label: 'Scripts Generated' }],
  input: inputSchema,
  flows: ['ad-generation'],
}

type Input = z.infer<typeof inputSchema>

export const handler = async (input: Input, ctx: any) => {
  ctx.logger.info('Starting script generation', {
    projectId: input.projectId,
    aspectRatios: input.aspectRatios,
    duration: input.duration,
    traceId: ctx.traceId,
  })

  const { brandProfile, aspectRatios, duration } = input
  const scripts: any[] = []

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  // Generate script for each aspect ratio
  for (const aspectRatio of aspectRatios) {
    const variantId = `${input.projectId}-${aspectRatio.replace(':', 'x')}-${Date.now()}`

    const prompt = `Create a ${duration} second video ad script for:

Brand: ${brandProfile.brandName}
Tagline: ${brandProfile.tagline}
Tone: ${brandProfile.tone}
Target Audience: ${brandProfile.audience}
Call to Action: ${brandProfile.callToAction}
Aspect Ratio: ${aspectRatio}

Create exactly 2 scenes for a 5-second ad:
- Scene 1 (2.5 sec): Hook/Brand intro
- Scene 2 (2.5 sec): CTA`

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an expert video ad scriptwriter. Create a punchy 5-second ad. Return JSON:
{
  "scenes": [
    {
      "sceneNumber": 1,
      "duration": 2.5,
      "visualDescription": "What to show",
      "textOverlay": "Short text",
      "voiceover": "Brief narration",
      "transition": "fade",
      "cameraMotion": "zoom-in"
    }
  ],
  "music": { "mood": "upbeat", "tempo": "fast" }
}
Create exactly 2 scenes totaling 5 seconds.`,
          },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.8,
      })

      const scriptData = JSON.parse(completion.choices[0].message.content || '{}')

      scripts.push({
        variantId,
        aspectRatio,
        duration,
        scenes: scriptData.scenes || createFallbackScenes(brandProfile),
        music: scriptData.music || { mood: 'upbeat', tempo: 'fast' },
      })

      ctx.logger.info('Script generated', { variantId, aspectRatio, sceneCount: scriptData.scenes?.length })
    } catch (error) {
      ctx.logger.error('Script generation failed, using fallback', { variantId, error })
      scripts.push({
        variantId,
        aspectRatio,
        duration,
        scenes: createFallbackScenes(brandProfile),
        music: { mood: 'upbeat', tempo: 'fast' },
      })
    }
  }

  ctx.logger.info('All scripts generated', { projectId: input.projectId, variantCount: scripts.length })

  await ctx.emit({
    topic: 'scripts.generated',
    data: {
      projectId: input.projectId,
      url: input.url,
      brandProfile: input.brandProfile,
      scrapedData: input.scrapedData,
      scripts,
    },
  })
}

function createFallbackScenes(brandProfile: any) {
  return [
    {
      sceneNumber: 1,
      duration: 2.5,
      visualDescription: `${brandProfile.brandName} logo reveal`,
      textOverlay: brandProfile.brandName,
      voiceover: brandProfile.tagline,
      transition: 'fade',
      cameraMotion: 'zoom-in',
    },
    {
      sceneNumber: 2,
      duration: 2.5,
      visualDescription: 'Call to action',
      textOverlay: brandProfile.callToAction,
      voiceover: `${brandProfile.callToAction} now!`,
      transition: 'fade',
      cameraMotion: 'zoom-out',
    },
  ]
}
