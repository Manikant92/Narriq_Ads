import { z } from 'zod'
import { v4 as uuid } from 'uuid'

const requestSchema = z.object({
  projectId: z.string(),
  variantId: z.string(),
  quality: z.enum(['preview', 'hd', '4k']).default('preview'),
  watermark: z.boolean().default(true),
})

export const config = {
  type: 'api' as const,
  name: 'render-api',
  description: 'Starts a render job for a variant',
  path: '/api/render',
  method: 'POST' as const,
  emits: [{ topic: 'render.requested', label: 'Render Requested' }],
  flows: ['ad-generation'],
  bodySchema: requestSchema,
}

export const handler = async (req: any, ctx: any) => {
  const body = requestSchema.parse(req.body)

  ctx.logger.info('Render requested', {
    projectId: body.projectId,
    variantId: body.variantId,
    quality: body.quality,
    traceId: ctx.traceId,
  })

  const jobId = `job_${uuid()}`

  // Get project from state
  const project = await ctx.state.get('projects', body.projectId)
  
  if (!project) {
    return {
      status: 404,
      body: { error: 'Project not found' },
    }
  }

  const variant = project.variants?.find((v: any) => v.variantId === body.variantId)
  
  if (!variant) {
    return {
      status: 404,
      body: { error: 'Variant not found' },
    }
  }

  // Store render job in state
  await ctx.state.set('renderJobs', jobId, {
    jobId,
    projectId: body.projectId,
    variantId: body.variantId,
    quality: body.quality,
    watermark: body.watermark,
    status: 'queued',
    progress: 0,
    createdAt: Date.now(),
  })

  // Emit render requested event
  await ctx.emit({
    topic: 'render.requested',
    data: {
      jobId,
      projectId: body.projectId,
      variantId: body.variantId,
      variant,
      quality: body.quality,
      watermark: body.watermark,
    },
  })

  return {
    status: 200,
    body: {
      jobId,
      status: 'queued',
      message: 'Render job queued successfully',
      estimatedTime: body.quality === 'preview' ? 30 : 120,
    },
  }
}
