/**
 * One-time script: embed all cached LinkedIn profiles using Gemini
 * and save vectors to server/data/profileEmbeddings.json
 *
 * Run with: node --env-file=../.env scripts/precomputeEmbeddings.js
 *
 * Safe to re-run — resumes from last completed batch if interrupted.
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '..', 'data')
const OUTPUT_PATH = join(DATA_DIR, 'profileEmbeddings.json')

const BATCH_SIZE = 100
const MS_BETWEEN_BATCHES = 65000 // free tier: 100 req/min, each profile = 1 request

function buildProfileText(profile) {
  const parts = []

  if (profile['Full Name']) parts.push(profile['Full Name'])
  if (profile['Workplace']) parts.push(profile['Workplace'])
  if (profile['Location']) parts.push(profile['Location'])
  if (profile['About']) parts.push(`About: ${profile['About']}`)

  const skills = profile['Skills']
  if (skills?.length) parts.push(`Skills: ${skills.join(', ')}`)

  const experiences = profile['Experiences']
  if (experiences?.length) {
    const expText = experiences
      .slice(0, 4)
      .map(e => [e.Role, e.Workplace].filter(Boolean).join(' at '))
      .join('; ')
    parts.push(`Experience: ${expText}`)
  }

  const educations = profile['Educations']
  if (educations?.length) {
    const eduText = educations
      .slice(0, 2)
      .map(e => [e.Degree, e.Institute].filter(Boolean).join(' at '))
      .join('; ')
    parts.push(`Education: ${eduText}`)
  }

  return parts.join('\n')
}

async function main() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not set')

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' })

  const profiles = JSON.parse(readFileSync(join(DATA_DIR, 'cachedProfiles.json'), 'utf-8'))
  console.log(`Loaded ${profiles.length} profiles`)

  // Resume from previous partial run if available
  let allVectors = []
  if (existsSync(OUTPUT_PATH)) {
    const existing = JSON.parse(readFileSync(OUTPUT_PATH, 'utf-8'))
    if (existing.vectors?.length > 0 && existing.vectors.length < profiles.length) {
      allVectors = existing.vectors
      console.log(`Resuming from ${allVectors.length} already-embedded profiles`)
    }
  }

  const startIndex = allVectors.length
  const texts = profiles.slice(startIndex).map(buildProfileText)
  const totalBatches = Math.ceil(profiles.length / BATCH_SIZE)

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE)
    const batchIndex = Math.floor((startIndex + i) / BATCH_SIZE) + 1
    const profileStart = startIndex + i
    console.log(`Embedding batch ${batchIndex}/${totalBatches} (profiles ${profileStart}–${profileStart + batch.length - 1})...`)

    const result = await model.batchEmbedContents({
      requests: batch.map(text => ({
        content: { parts: [{ text }], role: 'user' },
      })),
    })

    for (const embedding of result.embeddings) {
      allVectors.push(embedding.values)
    }

    // Save after every batch so a crash doesn't lose progress
    writeFileSync(OUTPUT_PATH, JSON.stringify({ count: profiles.length, vectors: allVectors }))

    if (i + BATCH_SIZE < texts.length) {
      console.log(`  Waiting ${MS_BETWEEN_BATCHES / 1000}s for rate limit...`)
      await new Promise(r => setTimeout(r, MS_BETWEEN_BATCHES))
    }
  }

  console.log(`Done. Saved ${allVectors.length} embeddings to data/profileEmbeddings.json`)
}

main().catch(err => { console.error(err); process.exit(1) })
