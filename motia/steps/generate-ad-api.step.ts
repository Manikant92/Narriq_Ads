import { z } from 'zod'
import { v4 as uuid } from 'uuid'

const requestSchema = z.object({
  url: z.string().url().optional(),
  googleMapsId: z.string().optional(),
  aspectRatios: z.array(z.enum(['16:9', '9:16', '1:1'])).default(['16:9']),
  brandHints: z.object({
    tone: z.string().optional(),
    audience: z.string().optional(),
    colors: z.array(z.string()).optional(),
  }).optional(),
  duration: z.number().min(5).max(5).default(5), // Fixed 5 second videos
})

export const config = {
  type: 'api' as const,
  name: 'generate-ad-api',
  description: 'Generates AI video ads from a URL - main entry point',
  path: '/api/generate',
  method: 'POST' as const,
  emits: [{ topic: 'ad.generation.started', label: 'Ad Generation Started' }],
  flows: ['ad-generation'],
  bodySchema: requestSchema,
}

export const handler = async (req: any, ctx: any) => {
  const body = requestSchema.parse(req.body)

  if (!body.url && !body.googleMapsId) {
    return {
      status: 400,
      body: { error: 'Either url or googleMapsId must be provided' },
    }
  }

  const projectId = `proj_${uuid()}`
  const url = body.url || `https://maps.google.com/maps?cid=${body.googleMapsId}`

  ctx.logger.info('Ad generation started', {
    projectId,
    url,
    aspectRatios: body.aspectRatios,
    duration: body.duration,
    traceId: ctx.traceId,
  })

  // Create variant placeholders
  const variants = body.aspectRatios.map((aspectRatio) => ({
    variantId: `${projectId}-${aspectRatio.replace(':', 'x')}`,
    aspectRatio,
    status: 'pending' as const,
  }))

  // Emit event to start the workflow
  await ctx.emit({
    topic: 'ad.generation.started',
    data: {
      projectId,
      url,
      aspectRatios: body.aspectRatios,
      brandHints: body.brandHints,
      duration: body.duration,
    },
  })

  // Estimate processing time (about 30 sec per variant)
  const estimatedTime = variants.length * 30

  return {
    status: 200,
    body: {
      projectId,
      status: 'processing',
      variants,
      estimatedTime,
      message: `Generating ${variants.length} ad variant(s) for ${url}`,
    },
  }
}
