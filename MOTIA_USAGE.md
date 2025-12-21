# How Narriq Uses Motia

This document explains how Narriq leverages Motia's capabilities to build a production-ready AI video ad generation platform.

## 🎯 Why Motia?

Motia provides the perfect foundation for Narriq because:

1. **Event-Driven Architecture** - Each AI step (scraping, extraction, generation) runs independently
2. **Built-in State Management** - Store projects, analytics, and audio without external databases
3. **Visual Workflow Debugging** - See the entire pipeline in Motia Workbench
4. **Automatic Retries** - Failed AI calls are automatically retried
5. **Observability** - Full tracing and logging out of the box

## 📊 Motia Features Used

### 1. API Steps (HTTP Endpoints)

Motia API steps handle all HTTP requests:

```typescript
// generate-ad-api.step.ts
export const config = {
  type: 'api',
  name: 'generate-ad-api',
  path: '/api/generate',
  method: 'POST',
  emits: [{ topic: 'ad.generation.started' }],
  flows: ['ad-generation'],
}
```

**API Steps in Narriq:**
| Endpoint | Step | Purpose |
|----------|------|---------|
| `POST /api/generate` | generate-ad-api | Start ad generation |
| `GET /api/project/:id` | project-status-api | Get project status |
| `POST /api/render` | render-api | Start render job |
| `GET /api/render-status/:id` | render-status-api | Check render progress |
| `POST /api/sketch-to-storyboard` | sketch-storyboard-api | Convert sketch to scenes |
| `GET /api/health` | health-api | Health check |
| `GET /api/download/:id` | download-api | Download rendered content |

### 2. Event Steps (Background Processing)

Event steps subscribe to topics and process data asynchronously:

```typescript
// brand-extract.step.ts
export const config = {
  type: 'event',
  name: 'brand-extract',
  subscribes: ['site.scraped'],        // Triggered when site is scraped
  emits: [{ topic: 'brand.extracted' }], // Triggers next step
  flows: ['ad-generation'],
}
```

**Event Flow:**
```
ad.generation.started
    └─▶ scrape-site
            └─▶ site.scraped
                    └─▶ brand-extract
                            └─▶ brand.extracted
                                    └─▶ script-gen
                                            └─▶ scripts.generated
                                                    └─▶ content-moderation
                                                            └─▶ moderation.passed
                                                                    └─▶ image-gen
                                                                            └─▶ images.generated
                                                                                    └─▶ analytics-agent
                                                                                            └─▶ analytics.scored
                                                                                                    └─▶ tts
                                                                                                            └─▶ tts.completed
                                                                                                                    └─▶ enqueue-renders
                                                                                                                            └─▶ ad.generation.completed
```

### 3. Cron Steps (Scheduled Tasks)

Cron steps run on a schedule:

```typescript
// cleanup-cron.step.ts
export const config = {
  type: 'cron',
  name: 'cleanup-old-projects',
  cron: '0 * * * *',  // Every hour
  emits: [{ topic: 'cleanup.completed' }],
  flows: ['maintenance'],
}
```

**Scheduled Tasks:**
- `cleanup-cron` - Removes projects older than 24 hours

### 4. Noop Steps (Workflow Visualization)

Noop steps help visualize workflow boundaries:

```typescript
// workflow-start.step.ts
export const config = {
  type: 'noop',
  name: 'workflow-start',
  virtualSubscribes: ['ad.generation.started'],
  virtualEmits: ['scrape.requested'],
  flows: ['ad-generation'],
}
```

### 5. State Management

Motia's state plugin stores data without external databases:

```typescript
// Store project data
await ctx.state.set('projects', projectId, {
  projectId,
  brandProfile,
  variants,
  status: 'ready',
})

// Retrieve project data
const project = await ctx.state.get('projects', projectId)

// Store analytics
await ctx.state.set('analytics', projectId, {
  results: analyticsResults,
  analyzedAt: new Date().toISOString(),
})
```

**State Namespaces:**
| Namespace | Purpose |
|-----------|---------|
| `projects` | Project data and variants |
| `analytics` | AI performance predictions |
| `audio` | TTS audio data (base64) |
| `renderJobs` | Render job status |

### 6. Flows (Workflow Grouping)

Flows group related steps for visualization:

```typescript
flows: ['ad-generation']  // Main workflow
flows: ['maintenance']    // Cleanup tasks
flows: ['system']         // Health checks
```

### 7. Logging & Observability

Every step has access to structured logging:

```typescript
ctx.logger.info('Starting image generation', {
  projectId: input.projectId,
  variantCount: input.scripts.length,
  traceId: ctx.traceId,  // Automatic trace correlation
})
```

### 8. Event Emission

Steps communicate via events:

```typescript
await ctx.emit({
  topic: 'brand.extracted',
  data: {
    projectId,
    brandProfile,
    // ... data for next step
  },
})
```

## 🔄 How It Works: Complete Flow

### When User Clicks "Generate Ad":

1. **Frontend** calls `POST /api/generate` with URL
2. **generate-ad-api** (API Step) validates input, creates projectId
3. **Emits** `ad.generation.started` event
4. **scrape-site** (Event Step) receives event, scrapes website
5. **Emits** `site.scraped` with extracted content
6. **brand-extract** uses GPT-4 to analyze brand
7. **Emits** `brand.extracted` with brand profile
8. **script-gen** creates 5-second ad scripts
9. **content-moderation** checks for inappropriate content
10. **image-gen** generates DALL-E images for each scene
11. **analytics-agent** predicts ad performance
12. **tts** generates voiceovers
13. **enqueue-renders** saves project to state
14. **Frontend** polls `GET /api/project/:id` to get results

### Motia Workbench View:

Open http://localhost:3000 to see:
- Visual workflow graph
- Real-time event flow
- Step execution logs
- State inspection

## 📈 Benefits of Using Motia

| Feature | Benefit |
|---------|---------|
| Event-driven | Each AI call is isolated, failures don't break the pipeline |
| Auto-retry | Failed OpenAI calls are automatically retried |
| State plugin | No need for external database setup |
| Tracing | Every request has a traceId for debugging |
| Workbench | Visual debugging of complex workflows |
| Type-safe | TypeScript schemas validate all inputs |
| Scalable | Steps can be distributed across workers |

## 🛠️ Motia Plugins Used

```typescript
// motia.config.ts
export default defineConfig({
  plugins: [
    observabilityPlugin,  // Tracing and metrics
    statesPlugin,         // State management
    endpointPlugin,       // API routing
    logsPlugin,           // Structured logging
  ],
})
```

## 📊 Step Summary

| Type | Count | Examples |
|------|-------|----------|
| API | 7 | generate-ad-api, project-status-api, render-api |
| Event | 8 | scrape-site, brand-extract, image-gen, tts |
| Cron | 1 | cleanup-cron |
| Noop | 2 | workflow-start, workflow-end |
| **Total** | **18** | |

## 🎯 Key Takeaways

1. **Motia simplifies complex AI pipelines** - Each step is a simple function
2. **Events decouple components** - Easy to add/modify steps
3. **State management is built-in** - No database setup required
4. **Observability is automatic** - Full tracing without extra code
5. **Visual debugging** - Workbench shows exactly what's happening
