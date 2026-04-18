import { GoogleGenerativeAI } from '@google/generative-ai'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '..', 'data')

let cachedProfiles = null
let cachedVectors = null

function loadData() {
  if (cachedProfiles && cachedVectors) return

  cachedProfiles = JSON.parse(readFileSync(join(DATA_DIR, 'cachedProfiles.json'), 'utf-8'))

  const embeddings = JSON.parse(readFileSync(join(DATA_DIR, 'profileEmbeddings.json'), 'utf-8'))
  cachedVectors = embeddings.vectors

  if (cachedVectors.length < cachedProfiles.length) {
    console.warn(`Partial embeddings: searching ${cachedVectors.length} of ${cachedProfiles.length} profiles`)
    cachedProfiles = cachedProfiles.slice(0, cachedVectors.length)
  }

  console.log(`Loaded ${cachedProfiles.length} profiles and embeddings into memory`)
}

function cosineSimilarity(a, b) {
  let dot = 0, magA = 0, magB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    magA += a[i] * a[i]
    magB += b[i] * b[i]
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB))
}

async function embedQuery(query) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not set')

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' })
  const result = await model.embedContent(query)
  return result.embedding.values
}

/**
 * Search cached profiles by semantic similarity to a natural language prompt.
 * Returns the top N raw LinkedIn profile objects.
 */
export async function searchProfiles(prompt, topN = 30) {
  loadData()

  const queryVector = await embedQuery(prompt)

  const scored = cachedVectors.map((vector, i) => ({
    index: i,
    score: cosineSimilarity(queryVector, vector),
  }))

  scored.sort((a, b) => b.score - a.score)

  return scored.slice(0, topN).map(({ index }) => cachedProfiles[index])
}
