# Motia Integration in Narriq

## Summary

Narriq uses **Motia** as its complete backend framework, leveraging:
- **18 Steps** (7 API, 8 Event, 1 Cron, 2 Noop)
- **4 Plugins** (observability, states, endpoint, logs)
- **Event-driven workflow** for AI pipeline orchestration

## Step Types Used

### API Steps (7)
Handle HTTP requests from frontend:
```
POST /api/generate          → Start ad generation
GET  /api/project/:id       → Get project status
POST /api/render            → Start render job
GET  /api/render-status/:id → Check render progress
POST /api/sketch-to-storyboard → Convert sketch
GET  /api/download/:id      → Download content
GET  /api/health            → Health check
```

### Event Steps (8)
Process AI pipeline asynchronously:
```
scrape-site        → Scrapes website content
brand-extract      → AI extracts brand identity (GPT-4)
script-gen         → AI generates ad scripts (GPT-4)
content-moderation → AI checks content safety
image-gen          → Generates images (DALL-E 3)
analytics-agent    → AI predicts performance (GPT-4)
tts                → Generates voiceovers (OpenAI TTS)
enqueue-renders    → Saves project to state
```

### Cron Steps (1)
Scheduled maintenance:
```
cleanup-cron → Removes old projects hourly
```

### Noop Steps (2)
Workflow visualization:
```
workflow-start → Entry point marker
workflow-end   → Exit point marker
```

## Event Flow

```
ad.generation.started
  └→ site.scraped
       └→ brand.extracted
            └→ scripts.generated
                 └→ moderation.passed
                      └→ images.generated
                           └→ analytics.scored
                                └→ tts.completed
                                     └→ ad.generation.completed
```

## State Management

```typescript
// Store project
await ctx.state.set('projects', projectId, data)

// Retrieve project
const project = await ctx.state.get('projects', projectId)
```

**Namespaces:** `projects`, `analytics`, `audio`, `renderJobs`

## Plugins

```typescript
plugins: [
  observabilityPlugin,  // Tracing
  statesPlugin,         // State management
  endpointPlugin,       // API routing
  logsPlugin,           // Logging
]
```

## Key Benefits

1. **Decoupled Steps** - Each AI call is independent
2. **Auto-retry** - Failed calls retry automatically
3. **Built-in State** - No external database needed
4. **Visual Debugging** - Workbench shows workflow
5. **Tracing** - Every request has traceId

## Workbench

Open http://localhost:3000 to see:
- Live workflow visualization
- Step execution logs
- Event flow in real-time
