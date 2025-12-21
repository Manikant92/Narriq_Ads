import { z } from 'zod'
import { v4 as uuid } from 'uuid'

const inputSchema = z.object({
  projectId: z.string(),
  brandProfile: z.any(),
  scripts: z.array(z.any()),
  variants: z.array(z.object({
    variantId: z.string(),
    aspectRatio: z.string(),
    scenes: z.array(z.object({
      sceneNumber: z.number(),
      imageUrl: z.string(),
      imagePrompt: z.string(),
    })),
  })),
  analytics: z.array(z.any()).optional(),
  ttsResults: z.array(z.any()).optional(),
})

export const config = {
  type: 'event' as const,
  name: 'enqueue-renders',
  description: 'Enqueues watermarked preview render jobs for all variants',
  subscribes: ['tts.completed'],
  emits: [
    { topic: 'render.enqueued', label: 'Render Enqueued' },
    { topic: 'ad.generation.completed', label: 'Ad Generation Completed' },
  ],
  input: inputSchema,
  flows: ['ad-generation'],
}

type Input = z.infer<typeof inputSchema>

export const handler = async (input: Input, ctx: any) => {
  ctx.logger.info('Enqueuing render jobs', { 
    projectId: input.projectId,
    variantCount: input.variants.length,
    traceId: ctx.traceId,
  })

  const renderJobs: { jobId: string; variantId: string; status: string }[] = []
  const finalVariants: any[] = []

  for (const variant of input.variants) {
    const script = input.scripts.find((s: any) => s.variantId === variant.variantId)
    
    if (!script) {
      ctx.logger.warn('No script found for variant', { variantId: variant.variantId })
      continue
    }

    const jobId = `job_${uuid()}`
    const ttsResult = input.ttsResults?.find((t: any) => t.variantId === variant.variantId)

    // Merge script scenes with generated images
    const scenes = script.scenes.map((scene: any) => {
      const imageData = variant.scenes.find((s: any) => s.sceneNumber === scene.sceneNumber)
      return {
        ...scene,
        imageUrl: imageData?.imageUrl || '',
        audioKey: ttsResult?.audioKey || null,
      }
    })

    finalVariants.push({
      variantId: variant.variantId,
      aspectRatio: variant.aspectRatio,
      status: 'ready',
      scenes,
      music: script.music,
    })

    // Emit render job
    await ctx.emit({
      topic: 'render.enqueued',
      data: {
        jobId,
        projectId: input.projectId,
        variantId: variant.variantId,
        aspectRatio: variant.aspectRatio,
        scenes,
        music: script.music,
        watermark: true,
        quality: 'preview',
        brandProfile: {
          primaryColor: input.brandProfile.primaryColor,
          secondaryColor: input.brandProfile.secondaryColor,
          brandName: input.brandProfile.brandName,
        },
      },
    })

    renderJobs.push({
      jobId,
      variantId: variant.variantId,
      status: 'queued',
    })

    ctx.logger.info('Render job enqueued', { 
      jobId,
      variantId: variant.variantId,
      aspectRatio: variant.aspectRatio,
    })
  }

  // Store project in state for API retrieval
  await ctx.state.set('projects', input.projectId, {
    projectId: input.projectId,
    brandProfile: input.brandProfile,
    variants: finalVariants,
    renderJobs,
    status: 'ready',
    createdAt: Date.now(),
  })

  ctx.logger.info('Project saved to state', { projectId: input.projectId })

  // Emit workflow completion
  await ctx.emit({
    topic: 'ad.generation.completed',
    data: {
      projectId: input.projectId,
      brandProfile: input.brandProfile,
      variants: finalVariants.map((v: any) => ({
        variantId: v.variantId,
        aspectRatio: v.aspectRatio,
        status: 'ready',
      })),
      renderJobs,
      analytics: input.analytics,
    },
  })

  ctx.logger.info('All render jobs enqueued', { 
    projectId: input.projectId,
    jobCount: renderJobs.length,
  })
}
