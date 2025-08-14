import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { purchasesRouter } from './routes/purchases.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
app.use(cors())
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

// Archivos estáticos para exponer QR generados
const publicDir = path.join(__dirname, '../public')
app.use('/public', express.static(publicDir))

app.get('/api/health', (_req, res) => {
	res.json({ ok: true })
})

app.use('/api/purchases', purchasesRouter)

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
	console.log(`[server] listening on http://localhost:${PORT}`)
})


