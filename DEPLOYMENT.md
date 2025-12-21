# Deployment Guide

## Local Development

### Prerequisites
- Node.js 18+
- npm or yarn

### Quick Start

```bash
# Install all dependencies
npm run install:all

# Configure environment
copy .env.example .env
# Edit narriq/motia/.env and add:
# OPENAI_API_KEY=sk-your-key

# Start development servers
npm run dev
```

This starts:
- **Motia Backend**: http://localhost:3000
- **React Frontend**: http://localhost:5173
- **Motia Workbench**: http://localhost:3000

### Manual Start

```bash
# Terminal 1: Start Motia backend
cd narriq/motia
npx motia dev

# Terminal 2: Start React frontend
cd narriq/frontend
npm run dev
```

## Environment Variables

### Required

| Variable | Description | Location |
|----------|-------------|----------|
| `OPENAI_API_KEY` | OpenAI API key | `narriq/motia/.env` |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Motia server port | 3000 |
| `VITE_API_URL` | API base URL | /api (proxied) |

## Production Deployment

### Option 1: Docker

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY . .

RUN npm run install:all
RUN cd frontend && npm run build

EXPOSE 3000

CMD ["npx", "motia", "start"]
```

### Option 2: Motia Cloud

1. Sign up at https://motia.cloud
2. Connect your repository
3. Configure environment variables
4. Deploy

### Option 3: Manual Deployment

```bash
# Build frontend
cd narriq/frontend
npm run build

# Start Motia in production
cd narriq/motia
NODE_ENV=production npx motia start
```

## Architecture for Production

```
┌─────────────────┐     ┌─────────────────┐
│   Load Balancer │────▶│   Motia Server  │
│   (nginx/ALB)   │     │   (Port 3000)   │
└─────────────────┘     └────────┬────────┘
                                 │
                    ┌────────────┼────────────┐
                    │            │            │
                    ▼            ▼            ▼
              ┌──────────┐ ┌──────────┐ ┌──────────┐
              │  Redis   │ │  OpenAI  │ │  CDN     │
              │  (State) │ │  APIs    │ │ (Assets) │
              └──────────┘ └──────────┘ └──────────┘
```

## Scaling Considerations

### Motia Workers
- Motia can scale horizontally with multiple workers
- Each worker processes events independently
- Redis is used for state coordination

### Rate Limiting
- OpenAI has rate limits
- Consider implementing request queuing
- Use exponential backoff for retries

### State Management
- Default: In-memory Redis (dev)
- Production: External Redis cluster
- Configure in `motia.config.ts`

## Monitoring

### Motia Observability
- Built-in tracing with `traceId`
- Structured logging via `ctx.logger`
- Metrics via observability plugin

### Health Check
```bash
curl http://localhost:3000/api/health
```

### Logs
```bash
# View Motia logs
npx motia dev --verbose
```

## Troubleshooting

### Common Issues

**Port 3000 in use:**
```bash
# Find and kill process
netstat -ano | findstr :3000
taskkill /PID <pid> /F
```

**OpenAI API errors:**
- Check API key is valid
- Verify rate limits
- Check account balance

**Frontend proxy errors:**
- Ensure Motia is running on port 3000
- Check vite.config.js proxy settings

**State not persisting:**
- Redis memory server resets on restart
- Use external Redis for persistence

## Security Checklist

- [ ] API keys in environment variables
- [ ] HTTPS in production
- [ ] Rate limiting enabled
- [ ] CORS configured properly
- [ ] Input validation on all endpoints
