import { z } from 'zod'
import OpenAI from 'openai'

const requestSchema = z.object({
  imageData: z.string(), // Base64 image data
  projectId: z.string().optional(),
  hints: z.object({
    brandName: z.string().optional(),
    tone: z.string().optional(),
    duration: z.number().optional(),
  }).optional(),
})

export const config = {
  type: 'api' as const,
  name: 'sketch-storyboard-api',
  description: 'Converts a sketch image to a storyboard JSON',
  path: '/api/sketch-to-storyboard',
  method: 'POST' as const,
  emits: [],
  flows: ['ad-generation'],
  bodySchema: requestSchema,
}

export const handler = async (req: any, ctx: any) => {
  const body = requestSchema.parse(req.body)

  ctx.logger.info('Converting sketch to storyboard', {
    hasImage: !!body.imageData,
    imageLength: body.imageData?.length,
    projectId: body.projectId,
    traceId: ctx.traceId,
  })

  // If no image or very short data, return fallback
  if (!body.imageData || body.imageData.length < 100) {
    ctx.logger.warn('No valid image data provided, returning fallback storyboard')
    return {
      status: 200,
      body: {
        success: true,
        storyboard: createFallbackStoryboard(body.hints),
        fallback: true,
        message: 'No sketch detected, using default storyboard',
      },
    }
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    // Ensure proper data URL format
    const imageUrl = body.imageData.startsWith('data:') 
      ? body.imageData 
      : `data:image/png;base64,${body.imageData}`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a storyboard analyst. Analyze the sketch/drawing and convert it into a video ad storyboard. Return JSON:
{
  "scenes": [
    {
      "sceneNumber": 1,
      "duration": 2.5,
      "visualDescription": "Description of what to show",
      "textOverlay": "Text to display",
      "cameraMotion": "zoom-in|zoom-out|pan-left|pan-right|static",
      "transition": "fade|cut|dissolve"
    }
  ],
  "totalDuration": 5,
  "mood": "upbeat|calm|energetic|professional",
  "suggestedMusic": "description of music style"
}
Create 2 scenes for a 5-second ad based on the sketch elements.`,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this sketch and create a 5-second video ad storyboard. ${body.hints?.brandName ? `Brand: ${body.hints.brandName}` : ''} ${body.hints?.tone ? `Tone: ${body.hints.tone}` : ''}`,
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
              },
            },
          ],
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 1000,
    })

    const storyboard = JSON.parse(completion.choices[0].message.content || '{}')

    ctx.logger.info('Storyboard generated', {
      sceneCount: storyboard.scenes?.length,
      totalDuration: storyboard.totalDuration,
    })

    return {
      status: 200,
      body: {
        success: true,
        storyboard,
      },
    }
  } catch (error: any) {
    ctx.logger.error('Sketch to storyboard failed', { error: error.message })
    
    // Return fallback storyboard
    return {
      status: 200,
      body: {
        success: true,
        storyboard: createFallbackStoryboard(body.hints),
        fallback: true,
        error: error.message,
      },
    }
  }
}

function createFallbackStoryboard(hints: any) {
  return {
    scenes: [
      {
        sceneNumber: 1,
        duration: 2.5,
        visualDescription: 'Opening scene with brand introduction',
        textOverlay: hints?.brandName || 'Your Brand',
        cameraMotion: 'zoom-in',
        transition: 'fade',
      },
      {
        sceneNumber: 2,
        duration: 2.5,
        visualDescription: 'Call to action with engaging visuals',
        textOverlay: 'Learn More',
        cameraMotion: 'static',
        transition: 'fade',
      },
    ],
    totalDuration: 5,
    mood: 'professional',
    suggestedMusic: 'Upbeat corporate background music',
  }
}
