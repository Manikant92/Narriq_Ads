export const config = {
  type: 'api' as const,
  name: 'render-status-api',
  description: 'Gets the status of a render job with simulated progress',
  path: '/api/render-status/:jobId',
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

  ctx.logger.info('Getting render status', { jobId, traceId: ctx.traceId })

  try {
    let job = await ctx.state.get('renderJobs', jobId)

    if (!job) {
      // Job not found - return completed for demo
      return {
        status: 200,
        body: {
          jobId,
          status: 'completed',
          progress: 100,
          message: 'Render completed',
        },
      }
    }

    // Simulate progress over time (30 seconds to complete)
    const elapsed = Date.now() - job.createdAt
    const totalTime = 30000 // 30 seconds
    let progress = Math.min(100, Math.floor((elapsed / totalTime) * 100))
    
    let status = 'processing'
    if (progress < 10) {
      status = 'queued'
    } else if (progress >= 100) {
      status = 'completed'
      progress = 100
    }

    // Update job in state
    const updatedJob = {
      ...job,
      status,
      progress,
      updatedAt: Date.now(),
    }
    await ctx.state.set('renderJobs', jobId, updatedJob)

    return {
      status: 200,
      body: {
        jobId,
        status,
        progress,
        projectId: job.projectId,
        variantId: job.variantId,
        quality: job.quality,
        // For completed renders, provide a placeholder download
        outputUrl: status === 'completed' ? `/api/download/${jobId}` : null,
      },
    }
  } catch (error: any) {
    ctx.logger.error('Failed to get render status', { jobId, error: error.message })
    return {
      status: 500,
      body: { error: 'Failed to get render status' },
    }
  }
}
