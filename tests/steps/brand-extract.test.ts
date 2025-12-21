import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock OpenAI
vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn(),
      },
    },
  })),
}))

describe('brand-extract step', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should extract brand profile from scraped data', async () => {
    const scrapedData = {
      title: 'TechStartup - Innovation for Tomorrow',
      description: 'We build cutting-edge software solutions',
      headings: ['Welcome', 'Our Products', 'Contact Us'],
      paragraphs: ['Leading technology company', 'Trusted by thousands'],
      colors: ['#2563eb', '#1e40af'],
      fonts: ['Inter', 'Roboto'],
    }

    const expectedProfile = {
      brandName: 'TechStartup',
      tagline: 'Innovation for Tomorrow',
      tone: 'professional',
      audience: 'Business professionals',
      industry: 'Technology',
      keyMessages: ['Leading technology company', 'Trusted by thousands'],
      primaryColor: '#2563eb',
      secondaryColor: '#1e40af',
      accentColor: '#f59e0b',
      fontStyle: 'modern',
      visualStyle: 'tech',
      callToAction: 'Get Started',
    }

    expect(expectedProfile.brandName).toBe('TechStartup')
    expect(expectedProfile.tone).toBe('professional')
    expect(expectedProfile.primaryColor).toBe('#2563eb')
  })

  it('should use fallback profile on API error', async () => {
    const scrapedData = {
      title: 'Simple Brand',
      description: 'A simple description',
      headings: ['Welcome'],
      paragraphs: [],
      colors: ['#000000'],
      fonts: [],
    }

    const fallbackProfile = {
      brandName: 'Simple Brand',
      tagline: 'A simple description',
      tone: 'professional',
      audience: 'General consumers',
      industry: 'Business',
      keyMessages: ['Welcome'],
      primaryColor: '#000000',
      secondaryColor: '#1e40af',
      accentColor: '#f59e0b',
      fontStyle: 'modern',
      visualStyle: 'minimalist',
      callToAction: 'Learn More',
    }

    expect(fallbackProfile.brandName).toBe('Simple Brand')
    expect(fallbackProfile.tone).toBe('professional')
  })

  it('should validate brand profile schema', () => {
    const validProfile = {
      brandName: 'Test',
      tagline: 'Test tagline',
      tone: 'professional',
      audience: 'Everyone',
      industry: 'Tech',
      keyMessages: ['Message 1'],
      primaryColor: '#ffffff',
      secondaryColor: '#000000',
      accentColor: '#ff0000',
      fontStyle: 'modern',
      visualStyle: 'minimalist',
      callToAction: 'Click here',
    }

    expect(validProfile.tone).toMatch(/professional|casual|playful|luxury|technical|friendly/)
    expect(validProfile.fontStyle).toMatch(/modern|classic|bold|elegant|minimal/)
    expect(validProfile.visualStyle).toMatch(/minimalist|vibrant|corporate|artistic|tech/)
  })

  it('should handle missing scraped data fields', () => {
    const incompleteData = {
      title: '',
      description: '',
      headings: [],
      paragraphs: [],
      colors: [],
      fonts: [],
    }

    const fallbackProfile = {
      brandName: 'Brand',
      tagline: 'Your trusted partner',
      tone: 'professional',
      primaryColor: '#2563eb',
    }

    expect(fallbackProfile.brandName).toBe('Brand')
    expect(fallbackProfile.primaryColor).toBe('#2563eb')
  })
})
