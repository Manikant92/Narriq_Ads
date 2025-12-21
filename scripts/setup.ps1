# Narriq Setup Script for Windows
# Run with: .\scripts\setup.ps1

Write-Host "🚀 Setting up Narriq - AI Ad Studio" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan

# Check Node.js version
try {
    $nodeVersion = (node -v) -replace 'v', '' -split '\.' | Select-Object -First 1
    if ([int]$nodeVersion -lt 18) {
        Write-Host "❌ Node.js 18+ is required. Current version: $(node -v)" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Node.js version: $(node -v)" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js 18+" -ForegroundColor Red
    exit 1
}

# Check for npm
if (Get-Command npm -ErrorAction SilentlyContinue) {
    Write-Host "✅ npm found" -ForegroundColor Green
} else {
    Write-Host "❌ npm not found" -ForegroundColor Red
    exit 1
}

# Check for FFmpeg (optional)
if (Get-Command ffmpeg -ErrorAction SilentlyContinue) {
    Write-Host "✅ FFmpeg found" -ForegroundColor Green
} else {
    Write-Host "⚠️  FFmpeg not found. Video rendering will require Docker or manual FFmpeg installation." -ForegroundColor Yellow
    Write-Host "   Download from: https://ffmpeg.org/download.html" -ForegroundColor Yellow
}

# Create .env if not exists
if (-not (Test-Path ".env")) {
    Write-Host "📝 Creating .env from .env.example..." -ForegroundColor Cyan
    Copy-Item ".env.example" ".env"
    Write-Host "⚠️  Please edit .env and add your API keys" -ForegroundColor Yellow
}

# Install root dependencies
Write-Host "📦 Installing root dependencies..." -ForegroundColor Cyan
npm install

# Install Motia dependencies
Write-Host "📦 Installing Motia dependencies..." -ForegroundColor Cyan
Push-Location motia
npm install
Pop-Location

# Install frontend dependencies
Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Cyan
Push-Location frontend
npm install
Pop-Location

# Install worker dependencies
Write-Host "📦 Installing worker dependencies..." -ForegroundColor Cyan
Push-Location worker
npm install
Pop-Location

# Create storage directory
if (-not (Test-Path "storage")) {
    New-Item -ItemType Directory -Path "storage" | Out-Null
}
if (-not (Test-Path "tmp")) {
    New-Item -ItemType Directory -Path "tmp" | Out-Null
}

Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Edit .env and add your API keys:" -ForegroundColor White
Write-Host "   - OPENAI_API_KEY (already set)" -ForegroundColor Gray
Write-Host "   - ELEVENLABS_API_KEY (optional)" -ForegroundColor Gray
Write-Host "   - REPLICATE_API_TOKEN (optional)" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Start development:" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor Yellow
Write-Host ""
Write-Host "3. Or start components separately:" -ForegroundColor White
Write-Host "   npm run dev:motia    # Backend on :3000" -ForegroundColor Yellow
Write-Host "   npm run dev:frontend # Frontend on :5173" -ForegroundColor Yellow
Write-Host ""
Write-Host "4. Run tests:" -ForegroundColor White
Write-Host "   npm test" -ForegroundColor Yellow
Write-Host ""
Write-Host "Happy building! 🎬" -ForegroundColor Cyan
