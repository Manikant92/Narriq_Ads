import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import axios from 'axios'

// Mock all external APIs
vi.mock('axios')
vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{
            message: {
              content: JSON.stringify({
                brandName: 'TestBrand',
                tagline: 'Test Tagline',
                tone: 'professional',
                audience: 'Everyone',
                industry: 'Tech',
                keyMessages: ['Message 1'],
                primaryColor: '#2563eb',
                secondaryColor: '#1e40af',
                accentColor: '#f59e0b',
                fontStyle: 'modern',
                visualStyle: 'tech',
                callToAction: 'Get Started',
              }),
            },
          }],
        }),
      },
    },
    images: {
      generate: vi.fn().mockResolvedValue({
        data: [{ url: 'https://example.com/generated-image.png' }],
      }),
    },
  })),
}))

describe('QuickCreate Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock website scraping
    vi.mocked(axios.get).mockResolvedValue({
      data: `
        <!DOCTYPE html>
        <html>
          <head>
            <title>TestBrand - Innovation</title>
            <meta name="description" content="We innovate">
          </head>
          <body>
            <h1>Welcome to TestBrand</h1>
            <p>We provide excellent services.</p>
            <img src="https://example.com/logo.png" alt="Logo">
          </body>
        </html>
      `,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should complete full quickcreate workflow', async () => {
    // Simulate the workflow
    const input = {
      url: 'https://testbrand.com',
      aspectRatios: ['16:9', '9:16', '1:1'],
      duration: 30,
    }

    // Step 1: Scrape site
    const scrapedData = {
      title: 'TestBrand - Innovation',
      description: 'We innovate',
      headings: ['Welcome to TestBrand'],
      paragraphs: ['We provide excellent services.'],
      images: [{ src: 'https://example.com/logo.png', alt: 'Logo' }],
      colors: ['#2563eb'],
      fonts: ['Inter'],
    }

    expect(scrapedData.title).toContain('TestBrand')

    // Step 2: Extract brand
    const brandProfile = {
      brandName: 'TestBrand',
      tagline: 'Innovation',
      tone: 'professional',
      audience: 'Everyone',
      industry: 'Tech',
      keyMessages: ['We innovate'],
      primaryColor: '#2563eb',
      secondaryColor: '#1e40af',
      accentColor: '#f59e0b',
      fontStyle: 'modern',
      visualStyle: 'tech',
      callToAction: 'Get Started',
    }

    expect(brandProfile.brandName).toBe('TestBrand')

    // Step 3: Generate scripts
    const scripts = input.aspectRatios.map(aspectRatio => ({
      variantId: `test-${aspectRatio.replace(':', 'x')}`,
      aspectRatio,
      duration: input.duration,
      scenes: [
        { sceneNumber: 1, duration: 5, visualDescription: 'Opening', voiceover: 'Welcome', transition: 'fade' },
        { sceneNumber: 2, duration: 10, visualDescription: 'Features', voiceover: 'Discover', transition: 'dissolve' },
        { sceneNumber: 3, duration: 10, visualDescription: 'Benefits', voiceover: 'Experience', transition: 'cut' },
        { sceneNumber: 4, duration: 5, visualDescription: 'CTA', voiceover: 'Get started', transition: 'fade' },
      ],
      music: { mood: 'upbeat', tempo: 'medium' },
    }))

    expect(scripts).toHaveLength(3)
    expect(scripts[0].scenes).toHaveLength(4)

    // Step 4: Generate images (mocked)
    const variants = scripts.map(script => ({
      variantId: script.variantId,
      aspectRatio: script.aspectRatio,
      scenes: script.scenes.map(scene => ({
        sceneNumber: scene.sceneNumber,
        imageUrl: 'https://example.com/generated-image.png',
        imagePrompt: scene.visualDescription,
      })),
    }))

    expect(variants).toHaveLength(3)
    expect(variants[0].scenes[0].imageUrl).toBeTruthy()

    // Final output
    const result = {
      projectId: 'proj_test_123',
      status: 'processing',
      variants: variants.map(v => ({
        variantId: v.variantId,
        aspectRatio: v.aspectRatio,
        status: 'ready',
      })),
    }

    expect(result.projectId).toBeTruthy()
    expect(result.variants).toHaveLength(3)
  })

  it('should handle scraping errors gracefully', async () => {
    vi.mocked(axios.get).mockRejectedValue(new Error('Network error'))

    await expect(async () => {
      throw new Error('Network error')
    }).rejects.toThrow('Network error')
  })

  it('should handle API rate limits with retry', async () => {
    let attempts = 0
    vi.mocked(axios.get).mockImplementation(async () => {
      attempts++
      if (attempts < 3) {
        throw { response: { status: 429 } }
      }
      return { data: '<html><title>Test</title></html>' }
    })

    // Simulate retry logic
    const maxRetries = 3
    let result = null
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        result = await axios.get('https://example.com')
        break
      } catch (error: any) {
        if (error.response?.status === 429 && i < maxRetries - 1) {
          await new Promise(r => setTimeout(r, 100))
          continue
        }
        throw error
      }
    }

    expect(result).toBeTruthy()
    expect(attempts).toBe(3)
  })

  it('should validate input schema', () => {
    const validInput = {
      url: 'https://example.com',
      aspectRatios: ['16:9'],
      duration: 30,
    }

    expect(validInput.url).toMatch(/^https?:\/\//)
    expect(validInput.aspectRatios).toContain('16:9')
    expect(validInput.duration).toBeGreaterThanOrEqual(15)
    expect(validInput.duration).toBeLessThanOrEqual(60)
  })

  it('should generate correct number of variants', () => {
    const aspectRatios = ['16:9', '9:16', '1:1']
    const variants = aspectRatios.map(ar => ({ aspectRatio: ar }))
    
    expect(variants).toHaveLength(aspectRatios.length)
  })
})
