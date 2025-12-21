export const config = {
  type: 'api' as const,
  name: 'project-status-api',
  description: 'Gets the status and analytics of a project',
  path: '/api/project/:projectId',
  method: 'GET' as const,
  emits: [],
  flows: ['ad-generation'],
}

export const handler = async (req: any, ctx: any) => {
  // In Motia, path params are in req.pathParams
  const projectId = req.pathParams?.projectId || req.params?.projectId

  if (!projectId) {
    ctx.logger.warn('No projectId provided', { pathParams: req.pathParams, params: req.params })
    return {
      status: 400,
      body: { error: 'Project ID is required' },
    }
  }

  ctx.logger.info('Getting project status', { projectId, traceId: ctx.traceId })

  try {
    // Get project data from state
    const project = await ctx.state.get('projects', projectId)
    const analytics = await ctx.state.get('analytics', projectId)

    if (!project) {
      return {
        status: 404,
        body: { error: 'Project not found', projectId },
      }
    }

    return {
      status: 200,
      body: {
        projectId,
        ...project,
        analytics: analytics?.results || [],
      },
    }
  } catch (error: any) {
    ctx.logger.error('Failed to get project status', { projectId, error: error.message })
    return {
      status: 500,
      body: { error: 'Failed to get project status' },
    }
  }
}
