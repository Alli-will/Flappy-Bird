import * as dotenv from 'dotenv'
dotenv.config()

import express, { json } from 'express'
import { connect } from 'mongoose'
import { authRoute } from './routes/auth'
import { matchRoute } from './routes/match'
import { authUser } from './middleware/auth'
import { gameUpdate } from './game/utils'
import http from 'http'
import { initSocket } from './socket'
import cors from 'cors'

const PORT = Number(process.env.PORT) ?? 3000
const MONGO_DB = String(process.env.MONGO_DB) ?? 'mongodb://127.0.0.1:27017/test'

const app = express()
const server = http.createServer(app)  // ✅ Mantém assim

app.use(json())
app.use(express.urlencoded({ extended: true }))

// ✅ CORS
app.use(cors({
  origin: 'http://localhost:3001',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}))

app.get('/', (req, res) => {
  res.json({
    ok: 1,
    date: new Date(),
    timestamp: Date.now()
  })
})

app.use('/auth', authRoute)
app.use('/match', matchRoute)

async function startServer() {
  try {
    await connect(MONGO_DB)
    console.log('✅ Conectado ao MongoDB')

    gameUpdate()

    initSocket(server)  // ✅ Inicializa Socket.IO

    server.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`)
    })
  } catch (error) {
    console.error('❌ Erro ao iniciar o servidor:', error)
  }
}

startServer()
