#!/usr/bin/env node

/**
 * Narriq Demo Script
 * 
 * This script demonstrates the QuickCreate flow by:
 * 1. Calling the /api/quickcreate endpoint
 * 2. Polling for status updates
 * 3. Displaying the generated variants
 */

import axios from 'axios'

const API_URL = process.env.API_URL || 'http://localhost:3000'
const DEMO_URL = process.argv[2] || 'https://example.com'

async function runDemo() {
  console.log('🎬 Narriq Demo - QuickCreate Flow')
  console.log('==================================')
  console.log(`Target URL: ${DEMO_URL}`)
  console.log('')

  try {
    // Step 1: Create project
    console.log('📝 Step 1: Creating project...')
    const createResponse = await axios.post(`${API_URL}/api/quickcreate`, {
      url: DEMO_URL,
      aspectRatios: ['16:9', '9:16', '1:1'],
      duration: 30,
    })

    const { projectId, variants, estimatedTime } = createResponse.data
    console.log(`✅ Project created: ${projectId}`)
    console.log(`   Variants: ${variants.length}`)
    console.log(`   Estimated time: ${estimatedTime}s`)
    console.log('')

    // Step 2: Poll for status
    console.log('⏳ Step 2: Waiting for generation...')
    let completed = false
    let attempts = 0
    const maxAttempts = 60 // 2 minutes max

    while (!completed && attempts < maxAttempts) {
      await sleep(2000)
      attempts++

      try {
        // In a real implementation, we'd poll a status endpoint
        // For demo, we'll simulate progress
        const progress = Math.min(100, attempts * 5)
        process.stdout.write(`\r   Progress: ${progress}%`)

        if (progress >= 100) {
          completed = true
        }
      } catch (error) {
        // Continue polling
      }
    }

    console.log('')
    console.log('')

    // Step 3: Display results
    console.log('🎉 Step 3: Generation complete!')
    console.log('')
    console.log('Generated Variants:')
    console.log('-------------------')

    for (const variant of variants) {
      console.log(`  📹 ${variant.aspectRatio}`)
      console.log(`     ID: ${variant.variantId}`)
      console.log(`     Status: ${variant.status}`)
      console.log(`     Preview: ${variant.previewUrl || 'Generating...'}`)
      console.log('')
    }

    // Step 4: Show next steps
    console.log('Next Steps:')
    console.log('-----------')
    console.log(`1. View project: http://localhost:5173/project/${projectId}`)
    console.log('2. Edit variants in the Timeline Editor')
    console.log('3. Render final videos (removes watermark)')
    console.log('')
    console.log('API Endpoints:')
    console.log(`  POST ${API_URL}/api/render - Start final render`)
    console.log(`  GET  ${API_URL}/api/render-status/:jobId - Check render status`)
    console.log(`  GET  ${API_URL}/api/analytics/${projectId} - View analytics`)

  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('❌ API Error:', error.response?.data || error.message)
    } else {
      console.error('❌ Error:', error)
    }
    process.exit(1)
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Run demo
runDemo().catch(console.error)
