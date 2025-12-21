import { z } from 'zod'
import OpenAI from 'openai'

const inputSchema = z.object({
  projectId: z.string(),
  brandProfile: z.any(),
  scripts: z.array(z.any()),
  variants: z.array(z.any()),
})

export const config = {
  type: 'event' as const,
  name: 'analytics-agent',
  description: 'AI agent that predicts ad performance and provides optimization suggestions',
  subscribes: ['images.generated'],
  emits: [{ topic: 'analytics.scored', label: 'Analytics Scored' }],
  input: inputSchema,
  flows: ['ad-generation'],
}

type Input = z.infer<typeof inputSchema>

export const handler = async (input: Input, ctx: any) => {
  ctx.logger.info('Starting AI analytics agent', {
    projectId: input.projectId,
    variantCount: input.variants.length,
    traceId: ctx.traceId,
  })

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const analyticsResults: any[] = []

  for (const script of input.scripts) {
    const prompt = `Analyze this 5-second video ad script and predict performance:

Brand: ${input.brandProfile.brandName}
Target Audience: ${input.brandProfile.audience}
Tone: ${input.brandProfile.tone}
CTA: ${input.brandProfile.callToAction}

Scenes:
${script.scenes.map((s: any) => `Scene ${s.sceneNumber}: "${s.textOverlay}" - ${s.visualDescription}`).join('\n')}

Provide scores (0-100) and brief suggestions in JSON format:
{
  "engagementScore": number,
  "clarityScore": number,
  "brandAlignmentScore": number,
  "ctaEffectivenessScore": number,
  "overallScore": number,
  "suggestions": ["suggestion1", "suggestion2"],
  "predictedCTR": "X.X%"
}`

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert ad performance analyst. Analyze video ad scripts and predict their effectiveness. Return only valid JSON.',
          },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      })

      const analysis = JSON.parse(completion.choices[0].message.content || '{}')

      analyticsResults.push({
        variantId: script.variantId,
        aspectRatio: script.aspectRatio,
        ...analysis,
      })

      ctx.logger.info('Variant analyzed', {
        variantId: script.variantId,
        overallScore: analysis.overallScore,
      })
    } catch (error) {
      ctx.logger.error('Analytics failed for variant', { variantId: script.variantId, error })
      analyticsResults.push({
        variantId: script.variantId,
        aspectRatio: script.aspectRatio,
        overallScore: 75,
        engagementScore: 75,
        clarityScore: 80,
        brandAlignmentScore: 70,
        ctaEffectivenessScore: 75,
        suggestions: ['Unable to analyze - using default scores'],
        predictedCTR: '2.5%',
      })
    }
  }

  // Store analytics in state
  await ctx.state.set('analytics', input.projectId, {
    projectId: input.projectId,
    results: analyticsResults,
    analyzedAt: new Date().toISOString(),
  })

  ctx.logger.info('Analytics completed', {
    projectId: input.projectId,
    avgScore: analyticsResults.reduce((a, r) => a + r.overallScore, 0) / analyticsResults.length,
  })

  await ctx.emit({
    topic: 'analytics.scored',
    data: {
      projectId: input.projectId,
      brandProfile: input.brandProfile,
      scripts: input.scripts,
      variants: input.variants,
      analytics: analyticsResults,
    },
  })
}
