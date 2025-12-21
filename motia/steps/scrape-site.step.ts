import { z } from 'zod'
import * as cheerio from 'cheerio'
import axios from 'axios'

// Input schema
const inputSchema = z.object({
  projectId: z.string(),
  url: z.string().url(),
  googleMapsId: z.string().optional(),
  aspectRatios: z.array(z.string()).default(['16:9', '9:16', '1:1']),
  duration: z.number().default(30),
})

export const config = {
  type: 'event' as const,
  name: 'scrape-site',
  description: 'Scrapes a website to extract content, images, and brand assets',
  subscribes: ['ad.generation.started'],
  emits: [{ topic: 'site.scraped', label: 'Site Scraped' }],
  input: inputSchema,
  flows: ['ad-generation'],
}

type Input = z.infer<typeof inputSchema>

export const handler = async (input: Input, ctx: any) => {
  ctx.logger.info('Starting site scrape', { url: input.url, traceId: ctx.traceId })

  try {
    // Fetch the page
    const response = await axios.get(input.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NarriqBot/1.0; +https://narriq.ai)',
      },
      timeout: 30000,
    })

    const $ = cheerio.load(response.data)

    // Extract content
    const title = $('title').text() || $('h1').first().text() || ''
    const description = $('meta[name="description"]').attr('content') || 
                       $('meta[property="og:description"]').attr('content') || ''

    // Extract headings
    const headings: string[] = []
    $('h1, h2, h3').each((_, el) => {
      const text = $(el).text().trim()
      if (text) headings.push(text)
    })

    // Extract paragraphs
    const paragraphs: string[] = []
    $('p').each((_, el) => {
      const text = $(el).text().trim()
      if (text && text.length > 20) paragraphs.push(text)
    })

    // Extract images
    const images: { src: string; alt?: string }[] = []
    $('img').each((_, el) => {
      const src = $(el).attr('src')
      if (src) {
        const absoluteSrc = src.startsWith('http') ? src : new URL(src, input.url).href
        images.push({
          src: absoluteSrc,
          alt: $(el).attr('alt'),
        })
      }
    })

    // Extract links
    const links: string[] = []
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href')
      if (href && href.startsWith('http')) {
        links.push(href)
      }
    })

    // Extract metadata
    const metadata = {
      ogTitle: $('meta[property="og:title"]').attr('content'),
      ogDescription: $('meta[property="og:description"]').attr('content'),
      ogImage: $('meta[property="og:image"]').attr('content'),
      favicon: $('link[rel="icon"]').attr('href') || $('link[rel="shortcut icon"]').attr('href'),
    }

    // Extract colors from inline styles (basic extraction)
    const colors: string[] = []
    const colorRegex = /#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}|rgb\([^)]+\)/g
    const styleContent = $('style').text() + $('[style]').map((_, el) => $(el).attr('style')).get().join(' ')
    const foundColors = styleContent.match(colorRegex) || []
    colors.push(...[...new Set(foundColors)].slice(0, 10))

    // Extract fonts
    const fonts: string[] = []
    const fontRegex = /font-family:\s*([^;]+)/gi
    let match
    while ((match = fontRegex.exec(styleContent)) !== null) {
      fonts.push(match[1].trim().replace(/['"]/g, ''))
    }

    const scrapedData = {
      title,
      description,
      headings: headings.slice(0, 10),
      paragraphs: paragraphs.slice(0, 10),
      images: images.slice(0, 20),
      links: links.slice(0, 20),
      metadata,
      colors: colors.length > 0 ? colors : ['#000000', '#ffffff'],
      fonts: [...new Set(fonts)].slice(0, 5),
    }

    ctx.logger.info('Site scrape completed', { 
      url: input.url, 
      imagesFound: images.length,
      paragraphsFound: paragraphs.length,
    })

    // Emit scraped event
    await ctx.emit({
      topic: 'site.scraped',
      data: {
        projectId: input.projectId,
        url: input.url,
        scrapedData,
        aspectRatios: input.aspectRatios,
        duration: input.duration,
      },
    })

  } catch (error) {
    ctx.logger.error('Site scrape failed', { url: input.url, error })
    throw error
  }
}
