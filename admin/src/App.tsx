import { useEffect, useMemo, useState } from 'react'

type Purchase = {
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

export default function App() {
	const [purchases, setPurchases] = useState<Purchase[]>([])
	const [loading, setLoading] = useState(false)
	const [actioning, setActioning] = useState<number | null>(null)

	const SHEET_ID = import.meta.env.VITE_SHEET_ID as string | undefined
	const SHEET_NAME = (import.meta.env.VITE_SHEET_NAME as string | undefined) || 'Hoja 1'

	const gvizCsvUrl = useMemo(() => {
		if (!SHEET_ID) return ''
		const sheetParam = encodeURIComponent(SHEET_NAME)
		return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${sheetParam}`
	}, [SHEET_ID, SHEET_NAME])

	async function load() {
		setLoading(true)
		try {
			if (!gvizCsvUrl) return
			const res = await fetch(gvizCsvUrl)
			const csv = await res.text()
			const rows = parseCsv(csv)
			// Espera encabezados: Timestamp, Nombre, Apellido, Telefono, Email, Entradas, Conservadora, MedioPago, Total, CreatedAt
			const items: Purchase[] = rows.slice(1).map((r, idx) => ({
				rowNumber: idx + 2,
				timestamp: r[0] || '',
				firstName: r[1] || '',
				lastName: r[2] || '',
				phone: r[3] || '',
				email: r[4] || '',
				ticketQty: Number(r[5] || 0),
				coolerQty: Number(r[6] || 0),
				paymentMethod: r[7] || '',
				total: Number(r[8] || 0),
			}))
			setPurchases(items)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => { load() }, [])

	function toIntlPhone(raw: string) {
		const digits = raw.replace(/\D/g, '')
		if (digits.startsWith('549')) return digits
		if (digits.startsWith('54')) return '549' + digits.slice(2)
		return '549' + digits // por defecto AR
	}

	async function confirmAndSend(p: Purchase) {
		setActioning(p.rowNumber)
		try {
			// Generar links QR usando QuickChart (no requiere backend)
			const codes: string[] = []
			for (let i = 1; i <= p.ticketQty; i++) {
				// Contenido multilínea legible
				const content = [
					'Tiket Now',
					`Fila:${p.rowNumber} Ticket:${i}`,
					`Nombre:${p.firstName} ${p.lastName}`,
					`Tel:${p.phone}`,
					`Email:${p.email}`,
					`Entradas:${p.ticketQty}`,
					`Conservadora:${p.coolerQty > 0 ? 'si' : 'no'}`,
				].join('\n')
				const url = `https://quickchart.io/qr?text=${encodeURIComponent(content)}&size=512`
				codes.push(url)
			}
			// Mensaje a WhatsApp con links
			const lines = [
				`Hola ${p.firstName}! Aquí están tus códigos QR de entrada:`,
				...codes.map((u, idx) => `${idx + 1}) ${u}`)
			]
			const message = lines.join('\n')
			const phone = toIntlPhone(p.phone)
			const wa = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
			window.open(wa, '_blank')

			// Opcional: marcar confirmación en Apps Script (no leemos respuesta por CORS)
			const webapp = import.meta.env.VITE_SHEETS_WEBAPP_URL as string | undefined
			if (webapp) {
				const body = new URLSearchParams({ action: 'confirm', rowNumber: String(p.rowNumber), codes: JSON.stringify(codes) })
				fetch(webapp, { method: 'POST', body, mode: 'no-cors' }).catch(() => {})
			}
		} finally {
			setActioning(null)
		}
	}

	return (
		<div className="min-h-screen bg-background text-white px-6 py-8">
			<h1 className="text-3xl font-bold">Panel Admin - Tiket Now</h1>
			<div className="mt-4">
				<button onClick={load} className="rounded-lg bg-white/10 px-3 py-2">{loading ? 'Actualizando...' : 'Actualizar'}</button>
			</div>
			<div className="mt-6 overflow-x-auto">
				<table className="min-w-[900px] w-full border border-white/10">
					<thead className="bg-white/5">
						<tr>
							<th className="p-2 text-left">Fila</th>
							<th className="p-2 text-left">Fecha</th>
							<th className="p-2 text-left">Nombre</th>
							<th className="p-2 text-left">Teléfono</th>
							<th className="p-2 text-left">Email</th>
							<th className="p-2 text-left">Entradas</th>
							<th className="p-2 text-left">Conservadora</th>
							<th className="p-2 text-left">Medio</th>
							<th className="p-2 text-left">Total</th>
							<th className="p-2 text-left">Acción</th>
						</tr>
					</thead>
					<tbody>
						{purchases.map(p => (
							<tr key={p.rowNumber} className="border-t border-white/10">
								<td className="p-2">{p.rowNumber}</td>
								<td className="p-2">{p.timestamp}</td>
								<td className="p-2">{p.firstName} {p.lastName}</td>
								<td className="p-2">{p.phone}</td>
								<td className="p-2">{p.email}</td>
								<td className="p-2">{p.ticketQty}</td>
								<td className="p-2">{p.coolerQty}</td>
								<td className="p-2">{p.paymentMethod}</td>
								<td className="p-2">${'{'}p.total.toLocaleString('es-AR'){'}'}</td>
								<td className="p-2">
									<button disabled={actioning === p.rowNumber} onClick={() => confirmAndSend(p)} className="rounded-lg bg-gradient-to-r from-primary via-secondary to-accent px-3 py-2">
										{actioning === p.rowNumber ? 'Enviando...' : 'Confirmar y enviar QRs'}
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	)
}

// CSV parser simple (maneja comas dentro de comillas)
function parseCsv(text: string): string[][] {
	const rows: string[][] = []
	let current: string[] = []
	let field = ''
	let inQuotes = false
	for (let i = 0; i < text.length; i++) {
		const c = text[i]
		if (inQuotes) {
			if (c === '"') {
				if (text[i + 1] === '"') { field += '"'; i++ } else { inQuotes = false }
			} else { field += c }
		} else {
			if (c === '"') { inQuotes = true }
			else if (c === ',') { current.push(field); field = '' }
			else if (c === '\n') { current.push(field); rows.push(current); current = []; field = '' }
			else if (c === '\r') { /* ignore */ }
			else { field += c }
		}
	}
	if (field.length > 0 || current.length > 0) { current.push(field); rows.push(current) }
	return rows
}


