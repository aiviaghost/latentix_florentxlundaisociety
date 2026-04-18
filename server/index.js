import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import societyRouter from './routes/society.js'
import simulateRouter from './routes/simulate.js'
import personaRouter from './routes/persona.js'

// Load environment variables
dotenv.config({ path: '../.env', override: true })

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))

// Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    anthropic_configured: !!process.env.ANTHROPIC_API_KEY,
  })
})

app.use('/api/society', societyRouter)
app.use('/api/simulate', simulateRouter)
app.use('/api/persona', personaRouter)

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Latentix server running on http://localhost:${PORT}`)
  console.log(`📊 API Health: http://localhost:${PORT}/api/health`)

  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('⚠️  WARNING: ANTHROPIC_API_KEY not set in .env')
  }

})
