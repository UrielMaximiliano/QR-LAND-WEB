import { Router } from 'express'
import { listPurchases, confirmPurchase } from '../services/purchases.ts'

export const purchasesRouter = Router()

purchasesRouter.get('/', async (_req, res) => {
	try {
		const rows = await listPurchases()
		res.json({ ok: true, rows })
	} catch (err) {
		res.status(500).json({ ok: false, error: String(err) })
	}
})

purchasesRouter.post('/:rowNumber/confirm', async (req, res) => {
	try {
		const rowNumber = Number(req.params.rowNumber)
		if (!Number.isFinite(rowNumber)) return res.status(400).json({ ok: false, error: 'rowNumber inválido' })
		const result = await confirmPurchase(rowNumber)
		res.json({ ok: true, ...result })
	} catch (err) {
		res.status(500).json({ ok: false, error: String(err) })
	}
})


