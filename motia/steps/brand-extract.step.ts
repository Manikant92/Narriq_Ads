import { z } from 'zod'
import OpenAI from 'openai'

const inputSchema = z.object({
  projectId: z.string(),
  url: z.string(),
  scrapedData: z.object({
    title: z.string(),
    description: z.string(),
    headings: z.array(z.string()),
    paragraphs: z.array(z.string()),
    images: z.array(z.object({
      src: z.string(),
      alt: z.string().optional(),
    })),
    metadata: z.object({
      ogTitle: z.string().optional(),
      ogDescription: z.string().optional(),
      ogImage: z.string().optional(),
    }),
    colors: z.array(z.string()),
    fonts: z.array(z.string()),
  }),
  aspectRatios: z.array(z.string()).default(['16:9', '9:16', '1:1']),
  duration: z.number().default(30),
})

export const config = {
  type: 'event' as const,
  name: 'brand-extract',
  description: 'Extracts brand identity from scraped website data using AI',
  subscribes: ['site.scraped'],
  emits: [{ topic: 'brand.extracted', label: 'Brand Extracted' }],
  input: inputSchema,
  flows: ['ad-generation'],
}

type Input = z.infer<typeof inputSchema>

export const handler = async (input: Input, ctx: any) => {
  ctx.logger.info('Starting brand extraction', { projectId: input.projectId, traceId: ctx.traceId })

  const { scrapedData } = input

  // Build context for LLM
  const context = `
Website: ${input.url}
Title: ${scrapedData.title}
Description: ${scrapedData.description}

Headings:
${scrapedData.headings.join('\n')}

Content excerpts:
${scrapedData.paragraphs.slice(0, 5).join('\n\n')}

Detected colors: ${scrapedData.colors.join(', ')}
Detected fonts: ${scrapedData.fonts.join(', ')}
  `.trim()

  let brandProfile: any

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a brand analyst expert. Analyze the provided website content and extract a comprehensive brand profile. Return your analysis as a JSON object with the following structure:
{
  "brandName": "string - the brand/company name",
  "tagline": "string - a catchy tagline for the brand",
  "tone": "professional|casual|playful|luxury|technical|friendly",
  "audience": "string - target audience description",
  "industry": "string - industry/sector",
  "keyMessages": ["array of 3-5 key marketing messages"],
  "primaryColor": "hex color code",
  "secondaryColor": "hex color code", 
  "accentColor": "hex color code",
  "fontStyle": "modern|classic|bold|elegant|minimal",
  "visualStyle": "minimalist|vibrant|corporate|artistic|tech",
  "callToAction": "string - suggested CTA text"
}

Use the detected colors from the website when possible. Be creative but stay true to the brand's apparent identity.`,
        },
        {
          role: 'user',
          content: context,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    })

    brandProfile = JSON.parse(completion.choices[0].message.content || '{}')

    ctx.logger.info('Brand extraction completed', { 
      projectId: input.projectId,
      brandName: brandProfile.brandName,
      tone: brandProfile.tone,
    })
  } catch (error) {
    ctx.logger.error('Brand extraction failed, using fallback', { projectId: input.projectId, error })
    
    // Fallback to basic extraction
    brandProfile = {
      brandName: scrapedData.title || 'Brand',
      tagline: scrapedData.description?.slice(0, 50) || 'Your trusted partner',
      tone: 'professional',
      audience: 'General consumers',
      industry: 'Business',
      keyMessages: [scrapedData.headings[0] || 'Quality products and services'],
      primaryColor: scrapedData.colors[0] || '#2563eb',
      secondaryColor: scrapedData.colors[1] || '#1e40af',
      accentColor: scrapedData.colors[2] || '#f59e0b',
      fontStyle: 'modern',
      visualStyle: 'minimalist',
      callToAction: 'Learn More',
    }
  }

  // Emit brand extracted event
  await ctx.emit({
    topic: 'brand.extracted',
    data: {
      projectId: input.projectId,
      url: input.url,
      scrapedData: input.scrapedData,
      brandProfile,
      aspectRatios: input.aspectRatios,
      duration: input.duration,
    },
  })
}
