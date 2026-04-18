import 'dotenv/config'

import express from 'express'
import morgan from 'morgan'
import cors from 'cors'
import cookieParser from 'cookie-parser'

import { globalApiLimiter } from './middleware/rateLimit.js'
import authRouter from './routes/auth.js'
import linkCheckerRouter from './routes/link-checker.js'
import contactRouter from './routes/contact.js'

const app = express()

console.log('FRONTEND_ORIGIN = ', process.env.FRONTEND_ORIGIN)

app.use(cors({
  origin: process.env.FRONTEND_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-Requested-With'],
}))
app.use(morgan('tiny'))
app.use(express.json())
app.use(cookieParser())
app.set("trust proxy", 1);
app.use(globalApiLimiter)
app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    frontendOrigin: process.env.FRONTEND_ORIGIN ?? null,
  })
})
app.use('/auth', authRouter)
app.use('/link-checker', linkCheckerRouter)
app.use('/contact', contactRouter)

const PORT = process.env.PORT || 4000
app.listen(PORT, (error) => {
  if (error) throw error
  console.log(`Running at http://localhost:${PORT}`)
})