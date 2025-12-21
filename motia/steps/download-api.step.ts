export const config = {
  type: 'api' as const,
  name: 'download-api',
  description: 'Downloads rendered video or preview images',
  path: '/api/download/:jobId',
  method: 'GET' as const,
  emits: [],
  flows: ['ad-generation'],
}

export const handler = async (req: any, ctx: any) => {
  const jobId = req.pathParams?.jobId || req.params?.jobId

  if (!jobId) {
    return {
      status: 400,
      body: { error: 'Job ID is required' },
    }
  }

  ctx.logger.info('Download requested', { jobId, traceId: ctx.traceId })

  try {
    const job = await ctx.state.get('renderJobs', jobId)

    if (!job) {
      return {
        status: 404,
        body: { error: 'Render job not found' },
      }
    }

    // Get the project to find the variant images
    const project = await ctx.state.get('projects', job.projectId)
    
    if (!project) {
      return {
        status: 404,
        body: { error: 'Project not found' },
      }
    }

    const variant = project.variants?.find((v: any) => v.variantId === job.variantId)
    
    if (!variant) {
      return {
        status: 404,
        body: { error: 'Variant not found' },
      }
    }

    // Return the scene images as the "render" output
    // In a real implementation, this would be an actual video file
    const images = variant.scenes?.map((s: any) => s.imageUrl).filter(Boolean) || []

    return {
      status: 200,
      body: {
        jobId,
        projectId: job.projectId,
        variantId: job.variantId,
        aspectRatio: variant.aspectRatio,
        status: 'completed',
        type: 'preview',
        message: 'Video rendering is simulated. In production, this would return an actual video file.',
        images,
        scenes: variant.scenes,
        brandName: project.brandProfile?.brandName,
      },
    }
  } catch (error: any) {
    ctx.logger.error('Download failed', { jobId, error: error.message })
    return {
      status: 500,
      body: { error: 'Download failed' },
    }
  }
}
