.PHONY: dev dev-motia dev-frontend build test lint clean docker-build docker-up docker-down install

# Development
dev:
	@echo "Starting Narriq development environment..."
	npx concurrently "make dev-motia" "make dev-frontend"

dev-motia:
	@echo "Starting Motia backend..."
	cd motia && npx motia dev

dev-frontend:
	@echo "Starting frontend..."
	cd frontend && npm run dev

# Build
build:
	@echo "Building Narriq..."
	cd motia && npm run build
	cd frontend && npm run build

build-worker:
	@echo "Building FFmpeg worker..."
	docker build -t narriq-ffmpeg-worker ./worker

# Testing
test:
	@echo "Running tests..."
	npx vitest run

test-watch:
	@echo "Running tests in watch mode..."
	npx vitest

test-coverage:
	@echo "Running tests with coverage..."
	npx vitest run --coverage

# Linting
lint:
	@echo "Linting code..."
	npx eslint . --ext .ts,.tsx,.js,.jsx

lint-fix:
	@echo "Fixing lint issues..."
	npx eslint . --ext .ts,.tsx,.js,.jsx --fix

# Installation
install:
	@echo "Installing dependencies..."
	npm install
	cd frontend && npm install
	cd worker && npm install

# Docker
docker-build:
	@echo "Building Docker images..."
	docker-compose build

docker-up:
	@echo "Starting Docker containers..."
	docker-compose up -d

docker-down:
	@echo "Stopping Docker containers..."
	docker-compose down

docker-logs:
	@echo "Showing Docker logs..."
	docker-compose logs -f

docker-scale-workers:
	@echo "Scaling FFmpeg workers to $(n)..."
	docker-compose up -d --scale ffmpeg-worker=$(n)

# Database
db-migrate:
	@echo "Running database migrations..."
	npx prisma migrate dev

db-generate:
	@echo "Generating Prisma client..."
	npx prisma generate

db-studio:
	@echo "Opening Prisma Studio..."
	npx prisma studio

# Cleanup
clean:
	@echo "Cleaning up..."
	rm -rf node_modules
	rm -rf frontend/node_modules
	rm -rf worker/node_modules
	rm -rf dist
	rm -rf .motia
	rm -rf tmp
	rm -rf coverage

# Demo
demo:
	@echo "Running demo quickcreate flow..."
	curl -X POST http://localhost:3000/api/quickcreate \
		-H "Content-Type: application/json" \
		-d '{"url": "https://example.com", "aspectRatios": ["16:9", "9:16", "1:1"], "duration": 30}'

# Help
help:
	@echo "Narriq - AI Ad Studio"
	@echo ""
	@echo "Usage: make [target]"
	@echo ""
	@echo "Development:"
	@echo "  dev              Start full development environment"
	@echo "  dev-motia        Start Motia backend only"
	@echo "  dev-frontend     Start frontend only"
	@echo ""
	@echo "Build:"
	@echo "  build            Build all components"
	@echo "  build-worker     Build FFmpeg worker Docker image"
	@echo ""
	@echo "Testing:"
	@echo "  test             Run tests"
	@echo "  test-watch       Run tests in watch mode"
	@echo "  test-coverage    Run tests with coverage"
	@echo ""
	@echo "Docker:"
	@echo "  docker-build     Build Docker images"
	@echo "  docker-up        Start Docker containers"
	@echo "  docker-down      Stop Docker containers"
	@echo "  docker-logs      Show Docker logs"
	@echo ""
	@echo "Other:"
	@echo "  install          Install dependencies"
	@echo "  lint             Run linter"
	@echo "  clean            Clean up build artifacts"
	@echo "  demo             Run demo quickcreate flow"
