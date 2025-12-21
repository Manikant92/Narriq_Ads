#!/bin/bash

# Narriq Setup Script
# This script sets up the development environment

set -e

echo "🚀 Setting up Narriq - AI Ad Studio"
echo "===================================="

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 18+ is required. Current version: $(node -v)"
    exit 1
fi
echo "✅ Node.js version: $(node -v)"

# Check for pnpm or npm
if command -v pnpm &> /dev/null; then
    PKG_MANAGER="pnpm"
elif command -v npm &> /dev/null; then
    PKG_MANAGER="npm"
else
    echo "❌ No package manager found. Please install pnpm or npm."
    exit 1
fi
echo "✅ Using package manager: $PKG_MANAGER"

# Check for FFmpeg (optional for local development)
if command -v ffmpeg &> /dev/null; then
    echo "✅ FFmpeg found: $(ffmpeg -version | head -n1)"
else
    echo "⚠️  FFmpeg not found. Video rendering will require Docker."
fi

# Create .env if not exists
if [ ! -f .env ]; then
    echo "📝 Creating .env from .env.example..."
    cp .env.example .env
    echo "⚠️  Please edit .env and add your API keys"
fi

# Install root dependencies
echo "📦 Installing root dependencies..."
$PKG_MANAGER install

# Install Motia dependencies
echo "📦 Installing Motia dependencies..."
cd motia && $PKG_MANAGER install && cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend && $PKG_MANAGER install && cd ..

# Install worker dependencies
echo "📦 Installing worker dependencies..."
cd worker && $PKG_MANAGER install && cd ..

# Create storage directory
mkdir -p storage
mkdir -p tmp

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env and add your API keys:"
echo "   - OPENAI_API_KEY"
echo "   - ELEVENLABS_API_KEY (optional)"
echo "   - REPLICATE_API_TOKEN (optional)"
echo ""
echo "2. Start development:"
echo "   make dev"
echo ""
echo "3. Or start components separately:"
echo "   make dev-motia    # Backend on :3000"
echo "   make dev-frontend # Frontend on :5173"
echo ""
echo "4. Run tests:"
echo "   make test"
echo ""
echo "Happy building! 🎬"
