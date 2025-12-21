#!/usr/bin/env node

/**
 * Cross-platform installation script for Narriq
 * Run with: node scripts/install-all.js
 */

import { execSync } from 'child_process'
import { existsSync, mkdirSync, copyFileSync } from 'fs'
import { join } from 'path'

const rootDir = process.cwd()

function run(cmd, cwd = rootDir) {
  console.log(`\n📦 Running: ${cmd}`)
  console.log(`   in: ${cwd}\n`)
  try {
    execSync(cmd, { cwd, stdio: 'inherit', shell: true })
  } catch (error) {
    console.error(`Failed to run: ${cmd}`)
    process.exit(1)
  }
}

function ensureDir(dir) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
    console.log(`📁 Created directory: ${dir}`)
  }
}

console.log('🚀 Narriq - AI Ad Studio Setup')
console.log('================================\n')

// Check Node version
const nodeVersion = process.version.slice(1).split('.')[0]
if (parseInt(nodeVersion) < 18) {
  console.error('❌ Node.js 18+ is required')
  process.exit(1)
}
console.log(`✅ Node.js ${process.version}`)

// Create .env if not exists
const envPath = join(rootDir, '.env')
const envExamplePath = join(rootDir, '.env.example')
if (!existsSync(envPath) && existsSync(envExamplePath)) {
  copyFileSync(envExamplePath, envPath)
  console.log('📝 Created .env from .env.example')
  console.log('⚠️  Please edit .env and verify your API keys\n')
}

// Create directories
ensureDir(join(rootDir, 'storage'))
ensureDir(join(rootDir, 'tmp'))

// Install dependencies
console.log('\n📦 Installing dependencies...\n')

run('npm install', rootDir)
run('npm install', join(rootDir, 'motia'))
run('npm install', join(rootDir, 'frontend'))
run('npm install', join(rootDir, 'worker'))

console.log('\n✅ Setup complete!\n')
console.log('Next steps:')
console.log('  1. Verify .env has your API keys')
console.log('  2. Run: npm run dev')
console.log('')
console.log('Or start separately:')
console.log('  npm run dev:motia    # Backend on :3000')
console.log('  npm run dev:frontend # Frontend on :5173')
console.log('')
