# Narriq - AI Video Ad Studio

**Generate 5-second video ads from any URL using AI** - Built with Motia

![Narriq](https://img.shields.io/badge/Narriq-AI%20Ad%20Studio-blue)
![Motia](https://img.shields.io/badge/Backend-Motia-purple)
![React](https://img.shields.io/badge/Frontend-React-61dafb)

## 🎯 What is Narriq?

Narriq is an AI-powered video ad generation platform that creates professional 5-second video ads from any website URL. Simply paste a URL, and our AI pipeline will:

1. **Scrape** the website for brand information
2. **Extract** brand identity using GPT-4
3. **Generate** ad scripts optimized for engagement
4. **Moderate** content for brand safety
5. **Create** images using DALL-E 3
6. **Analyze** predicted ad performance
7. **Generate** voiceovers using OpenAI TTS
8. **Render** final video previews

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- OpenAI API Key

### Installation

```bash
# Clone and install
cd narriq
npm run install:all

# Set up environment
copy .env.example .env
# Add your OPENAI_API_KEY to narriq/motia/.env

# Start the application
npm run dev
```

This starts:
- **Motia Backend** on http://localhost:3000
- **React Frontend** on http://localhost:5173
- **Motia Workbench** on http://localhost:3000 (workflow visualization)

### Usage

1. Open http://localhost:5173
2. Click "Generate Ad"
3. Enter any website URL (e.g., https://stripe.com)
4. Select aspect ratios (16:9, 9:16, 1:1)
5. Watch the AI generate your ads!

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │ Generate │ │ Variants │ │ Timeline │ │ Sketch Canvas    │   │
│  │   Modal  │ │ Gallery  │ │  Editor  │ │ (Storyboard)     │   │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────────┬─────────┘   │
└───────┼────────────┼────────────┼────────────────┼─────────────┘
        │            │            │                │
        ▼            ▼            ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      MOTIA BACKEND (Port 3000)                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    API STEPS                             │   │
│  │  /api/generate  /api/project/:id  /api/render  /api/...  │   │
│  └─────────────────────────┬───────────────────────────────┘   │
│                            │                                    │
│  ┌─────────────────────────▼───────────────────────────────┐   │
│  │              EVENT-DRIVEN WORKFLOW                       │   │
│  │                                                          │   │
│  │  ┌──────────┐    ┌──────────┐    ┌──────────┐           │   │
│  │  │ scrape   │───▶│ brand    │───▶│ script   │           │   │
│  │  │ site     │    │ extract  │    │ gen      │           │   │
│  │  └──────────┘    └──────────┘    └────┬─────┘           │   │
│  │                                       │                  │   │
│  │  ┌──────────┐    ┌──────────┐    ┌────▼─────┐           │   │
│  │  │ enqueue  │◀───│ tts      │◀───│ content  │           │   │
│  │  │ renders  │    │          │    │ moderate │           │   │
│  │  └──────────┘    └──────────┘    └────┬─────┘           │   │
│  │       │                               │                  │   │
│  │       │          ┌──────────┐    ┌────▼─────┐           │   │
│  │       │          │ analytics│◀───│ image    │           │   │
│  │       │          │ agent    │    │ gen      │           │   │
│  │       │          └──────────┘    └──────────┘           │   │
│  └───────┼──────────────────────────────────────────────────┘   │
│          │                                                      │
│  ┌───────▼──────────────────────────────────────────────────┐   │
│  │  CRON JOBS          │  STATE MANAGEMENT  │  PLUGINS      │   │
│  │  cleanup-cron       │  projects, audio   │  observability│   │
│  │  (hourly cleanup)   │  analytics, jobs   │  logs, states │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
narriq/
├── frontend/                 # React + Tailwind frontend
│   └── src/
│       ├── components/       # UI components
│       ├── pages/            # Page components
│       └── api/              # API client
├── motia/                    # Motia backend
│   └── steps/                # All Motia steps
│       ├── generate-ad-api.step.ts      # Main API endpoint
│       ├── scrape-site.step.ts          # Website scraper
│       ├── brand-extract.step.ts        # AI brand extraction
│       ├── script-gen.step.ts           # Ad script generation
│       ├── content-moderation.step.ts   # Content safety check
│       ├── image-gen.step.ts            # DALL-E image generation
│       ├── analytics-agent.step.ts      # Performance prediction
│       ├── tts.step.ts                  # Voice generation
│       ├── enqueue-renders.step.ts      # Render job queue
│       └── cleanup-cron.step.ts         # Scheduled cleanup
├── integrations/             # External API adapters
└── prompts/                  # AI prompt templates
```

## 🔧 Environment Variables

Create `narriq/motia/.env`:

```env
OPENAI_API_KEY=sk-your-openai-key
```

## 📚 Documentation

- [Motia Usage Guide](./MOTIA_USAGE.md) - How Motia powers Narriq
- [Project Description](./PROJECT_DESCRIPTION.md) - Full project details
- [Deployment Guide](./DEPLOYMENT.md) - Production deployment

## 🛠️ Tech Stack

- **Backend**: Motia (event-driven workflow orchestration)
- **Frontend**: React, Tailwind CSS, Framer Motion
- **AI**: OpenAI GPT-4, DALL-E 3, TTS
- **State**: Motia State Plugin (Redis-backed)

## 📄 License

MIT License - Built for the Motia Hackathon 2024
