// Cron job to clean up old projects - runs every hour
export const config = {
  type: 'cron' as const,
  name: 'cleanup-old-projects',
  description: 'Scheduled task to clean up old preview renders and temporary files',
  cron: '0 * * * *', // Every hour
  emits: [{ topic: 'cleanup.completed', label: 'Cleanup Completed' }],
  flows: ['maintenance'],
}

export const handler = async (ctx: any) => {
  ctx.logger.info('Starting scheduled cleanup job', { traceId: ctx.traceId })

  // Get projects older than 24 hours from state
  const oldProjects = await ctx.state.getGroup('projects')
  const now = Date.now()
  const maxAge = 24 * 60 * 60 * 1000 // 24 hours

  let cleanedCount = 0

  for (const project of oldProjects || []) {
    if (project.createdAt && now - project.createdAt > maxAge) {
      await ctx.state.delete('projects', project.projectId)
      cleanedCount++
      ctx.logger.info('Cleaned up old project', { projectId: project.projectId })
    }
  }

  await ctx.emit({
    topic: 'cleanup.completed',
    data: {
      cleanedCount,
      timestamp: new Date().toISOString(),
    },
  })

  ctx.logger.info('Cleanup job completed', { cleanedCount })
}
