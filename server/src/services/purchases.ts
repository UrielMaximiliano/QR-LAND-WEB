import path from 'node:path'
import fs from 'node:fs/promises'
import QRCode from 'qrcode'
import { google } from 'googleapis'

type PurchaseRow = {
	rowNumber: number
	timestamp: string
	firstName: string
	lastName: string
	phone: string
	email: string
	ticketQty: number
	coolerQty: number
	paymentMethod: string
	total: number
}

const SHEET_ID = process.env.SHEET_ID
const SHEET_NAME = process.env.SHEET_NAME || 'Hoja 1'
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL
const GOOGLE_PRIVATE_KEY = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n')

function assertConfigured() {
	if (!SHEET_ID || !GOOGLE_CLIENT_EMAIL || !GOOGLE_PRIVATE_KEY) {
		throw new Error('Faltan variables de entorno: SHEET_ID, GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY')
	}
}

function getSheets() {
	assertConfigured()
	const auth = new google.auth.JWT({
		email: GOOGLE_CLIENT_EMAIL,
		key: GOOGLE_PRIVATE_KEY,
		scopes: ['https://www.googleapis.com/auth/spreadsheets']
	})
	return google.sheets({ version: 'v4', auth })
}

export async function listPurchases(): Promise<PurchaseRow[]> {
	const sheets = getSheets()
	const range = `${SHEET_NAME}!A1:J` // Timestamp, Nombre, Apellido, Telefono, Email, Entradas, Conservadora, MedioPago, Total, CreatedAt
	const res = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID!, range })
	const values = res.data.values || []
	if (values.length <= 1) return []

	const rows: PurchaseRow[] = []
	for (let i = 1; i < values.length; i++) {
		const row = values[i]
		rows.push({
			rowNumber: i + 1, // 1-indexed con headers en fila 1
			timestamp: row[0] || '',
			firstName: row[1] || '',
			lastName: row[2] || '',
			phone: row[3] || '',
			email: row[4] || '',
			ticketQty: Number(row[5] || 0),
			coolerQty: Number(row[6] || 0),
			paymentMethod: row[7] || '',
			total: Number(row[8] || 0),
		})
	}
	return rows
}

export async function confirmPurchase(rowNumber: number) {
	const purchases = await listPurchases()
	const purchase = purchases.find(p => p.rowNumber === rowNumber)
	if (!purchase) throw new Error('Compra no encontrada')

	// Generar QR por ticket
	const count = purchase.ticketQty
	const outDir = path.resolve(process.cwd(), 'public/qr')
	await fs.mkdir(outDir, { recursive: true })
	const codes: { index: number, url: string, content: string }[] = []
	for (let i = 1; i <= count; i++) {
		const content = JSON.stringify({
			purchaseRow: rowNumber,
			code: `${rowNumber}-${i}-${Date.now()}`,
			firstName: purchase.firstName,
			lastName: purchase.lastName,
			email: purchase.email,
			phone: purchase.phone,
		})
		const filename = `ticket-${rowNumber}-${i}.png`
		const filepath = path.join(outDir, filename)
		await QRCode.toFile(filepath, content, { width: 512 })
		const baseUrl = process.env.PUBLIC_BASE_URL || 'http://localhost:3001'
		codes.push({ index: i, url: `${baseUrl}/public/qr/${filename}`, content })
	}

	// TODO: actualizar estado en la hoja (opcional: escribir "Confirmado" y los códigos)
	// Se podría escribir en columnas K/L con estado y códigos

	// TODO: envío por WhatsApp via Twilio/Meta si están configuradas

	return { purchase, codes }
}


