export const config = {
  type: 'api' as const,
  name: 'health-api',
  description: 'Health check endpoint for the Narriq API',
  path: '/api/health',
  method: 'GET' as const,
  emits: [],
  flows: ['system'],
}

export const handler = async (req: any, ctx: any) => {
  ctx.logger.info('Health check', { traceId: ctx.traceId })

  return {
    status: 200,
    body: {
      status: 'healthy',
      service: 'narriq-api',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      capabilities: {
        quickcreate: true,
        tts: true,
        imageGeneration: true,
        analytics: true,
        contentModeration: true,
      },
    },
  }
}
