import { z } from 'zod'
import OpenAI from 'openai'

const inputSchema = z.object({
  projectId: z.string(),
  scripts: z.array(z.any()),
  brandProfile: z.any(),
})

export const config = {
  type: 'event' as const,
  name: 'content-moderation',
  description: 'AI agent that moderates content for brand safety before rendering',
  subscribes: ['scripts.generated'],
  emits: [
    { topic: 'moderation.passed', label: 'Content Approved' },
    { topic: 'moderation.flagged', label: 'Content Flagged' },
  ],
  input: inputSchema,
  flows: ['ad-generation'],
}

type Input = z.infer<typeof inputSchema>

export const handler = async (input: Input, ctx: any) => {
  ctx.logger.info('Starting AI content moderation', {
    projectId: input.projectId,
    scriptCount: input.scripts.length,
    traceId: ctx.traceId,
  })

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const moderationResults: any[] = []

  for (const script of input.scripts) {
    const contentToCheck = script.scenes
      .map((s: any) => `${s.textOverlay} ${s.voiceover}`)
      .join(' ')

    try {
      // Use OpenAI moderation API
      const moderation = await openai.moderations.create({
        input: contentToCheck,
      })

      const result = moderation.results[0]
      moderationResults.push({
        variantId: script.variantId,
        flagged: result.flagged,
        categories: result.categories,
        scores: result.category_scores,
      })

      ctx.logger.info('Script moderated', {
        variantId: script.variantId,
        flagged: result.flagged,
      })
    } catch (error) {
      ctx.logger.warn('Moderation API failed, allowing content', { variantId: script.variantId })
      moderationResults.push({
        variantId: script.variantId,
        flagged: false,
        error: 'Moderation check skipped',
      })
    }
  }

  const anyFlagged = moderationResults.some((r) => r.flagged)

  if (anyFlagged) {
    ctx.logger.warn('Content flagged by moderation', { projectId: input.projectId })
    await ctx.emit({
      topic: 'moderation.flagged',
      data: {
        projectId: input.projectId,
        moderationResults,
        scripts: input.scripts,
        brandProfile: input.brandProfile,
      },
    })
  } else {
    ctx.logger.info('Content passed moderation', { projectId: input.projectId })
    await ctx.emit({
      topic: 'moderation.passed',
      data: {
        projectId: input.projectId,
        moderationResults,
        scripts: input.scripts,
        brandProfile: input.brandProfile,
      },
    })
  }
}
