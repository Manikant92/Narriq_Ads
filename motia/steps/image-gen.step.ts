import { z } from 'zod'
import OpenAI from 'openai'

const inputSchema = z.object({
  projectId: z.string(),
  url: z.string(),
  brandProfile: z.any(),
  scrapedData: z.any(),
  scripts: z.array(z.object({
    variantId: z.string(),
    aspectRatio: z.string(),
    duration: z.number(),
    scenes: z.array(z.object({
      sceneNumber: z.number(),
      duration: z.number(),
      visualDescription: z.string(),
      textOverlay: z.string().optional(),
      voiceover: z.string(),
      transition: z.string(),
      cameraMotion: z.string().optional(),
    })),
    music: z.any(),
  })),
})

export const config = {
  type: 'event' as const,
  name: 'image-gen',
  description: 'Generates images for each scene using DALL-E',
  subscribes: ['moderation.passed'],
  emits: [{ topic: 'images.generated', label: 'Images Generated' }],
  input: inputSchema,
  flows: ['ad-generation'],
}

type Input = z.infer<typeof inputSchema>

export const handler = async (input: Input, ctx: any) => {
  ctx.logger.info('Starting image generation', { 
    projectId: input.projectId, 
    variantCount: input.scripts.length,
    traceId: ctx.traceId,
  })

  const { brandProfile, scripts } = input
  const variants: any[] = []

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  for (const script of scripts) {
    const sceneImages: { sceneNumber: number; imageUrl: string; imagePrompt: string }[] = []

    for (const scene of script.scenes) {
      // Create enhanced prompt for image generation
      const imagePrompt = createImagePrompt(scene.visualDescription, brandProfile, script.aspectRatio)
      
      ctx.logger.info('Generating image for scene', { 
        variantId: script.variantId, 
        sceneNumber: scene.sceneNumber,
      })

      try {
        const imageUrl = await generateWithDallE(openai, imagePrompt, script.aspectRatio)

        sceneImages.push({
          sceneNumber: scene.sceneNumber,
          imageUrl,
          imagePrompt,
        })

        ctx.logger.info('Image generated', { 
          variantId: script.variantId, 
          sceneNumber: scene.sceneNumber,
        })
      } catch (error) {
        ctx.logger.error('Image generation failed', { 
          variantId: script.variantId, 
          sceneNumber: scene.sceneNumber, 
          error,
        })
        
        // Use placeholder image
        sceneImages.push({
          sceneNumber: scene.sceneNumber,
          imageUrl: getPlaceholderImage(script.aspectRatio),
          imagePrompt,
        })
      }
    }

    variants.push({
      variantId: script.variantId,
      aspectRatio: script.aspectRatio,
      scenes: sceneImages,
    })
  }

  ctx.logger.info('All images generated', { 
    projectId: input.projectId, 
    totalImages: variants.reduce((acc, v) => acc + v.scenes.length, 0),
  })

  // Emit images generated event
  await ctx.emit({
    topic: 'images.generated',
    data: {
      projectId: input.projectId,
      url: input.url,
      brandProfile: input.brandProfile,
      scripts: input.scripts,
      variants,
    },
  })
}

function createImagePrompt(visualDescription: string, brandProfile: any, aspectRatio: string): string {
  const styleGuide: Record<string, string> = {
    minimalist: 'clean, simple, lots of white space, modern',
    vibrant: 'colorful, energetic, bold colors, dynamic',
    corporate: 'professional, polished, business-like, trustworthy',
    artistic: 'creative, unique, artistic, expressive',
    tech: 'futuristic, sleek, digital, innovative',
  }

  const style = styleGuide[brandProfile.visualStyle] || 'professional'
  
  return `${visualDescription}. Style: ${style}. Brand colors: ${brandProfile.primaryColor}, ${brandProfile.secondaryColor}. High quality, ${aspectRatio} aspect ratio, suitable for video ad, no text overlays.`
}

async function generateWithDallE(openai: OpenAI, prompt: string, aspectRatio: string): Promise<string> {
  const sizeMap: Record<string, '1024x1024' | '1792x1024' | '1024x1792'> = {
    '16:9': '1792x1024',
    '9:16': '1024x1792',
    '1:1': '1024x1024',
  }

  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt: prompt,
    n: 1,
    size: sizeMap[aspectRatio] || '1024x1024',
    quality: 'standard',
  })

  return response.data?.[0]?.url || ''
}

function getPlaceholderImage(aspectRatio: string): string {
  const dimensions: Record<string, string> = {
    '16:9': '1920x1080',
    '9:16': '1080x1920',
    '1:1': '1080x1080',
  }
  const dim = dimensions[aspectRatio] || '1920x1080'
  return `https://placehold.co/${dim}/2563eb/ffffff?text=Scene+Preview`
}
