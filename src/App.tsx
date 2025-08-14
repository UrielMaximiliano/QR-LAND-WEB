import { useMemo, useState } from 'react'

// Estructura del formulario de compra
type PurchaseForm = {
	firstName: string
	lastName: string
	phone: string
	email: string
	ticketQty: number
	coolerQty: number
	paymentMethod: string
}

// Número de WhatsApp del organizador, en formato internacional sin el símbolo + (ej: 54911xxxxxxx)
const ORGANIZER_PHONE = '5491122334455'

export default function App() {
	const [form, setForm] = useState<PurchaseForm>({
		firstName: '',
		lastName: '',
		phone: '',
		email: '',
		ticketQty: 1,
		coolerQty: 0,
		paymentMethod: 'Transferencia',
	})

	// Precios unitarios (pueden ajustarse según el evento)
	const ticketPrice = 5000
	const coolerPrice = 2000

	// Cálculo del total a pagar
	const total = useMemo(() => {
		return form.ticketQty * ticketPrice + form.coolerQty * coolerPrice
	}, [form.ticketQty, form.coolerQty])

	// Helper genérico para actualizar campos del formulario
	function handleChange<T extends keyof PurchaseForm>(field: T, value: PurchaseForm[T]) {
		setForm(prev => ({ ...prev, [field]: value }))
	}

	// Construye el mensaje y el link de WhatsApp con el resumen de compra
	function buildWhatsappLink() {
		const summary = `Hola! Quiero enviar comprobante de compra.\n\n` +
			`Nombre: ${form.firstName} ${form.lastName}\n` +
			`Teléfono: ${form.phone}\n` +
			`Email: ${form.email}\n\n` +
			`Entradas: ${form.ticketQty} x $${ticketPrice}\n` +
			`Conservadora: ${form.coolerQty} x $${coolerPrice}\n` +
			`Medio de pago: ${form.paymentMethod}\n` +
			`Total: $${total}`

		const encoded = encodeURIComponent(summary)
		return `https://wa.me/${ORGANIZER_PHONE}?text=${encoded}`
	}

	const isValid = form.firstName && form.lastName && form.phone && form.email && form.ticketQty > 0

	async function savePurchase() {
		try {
			const endpoint = import.meta.env.VITE_SHEETS_WEBAPP_URL as string | undefined
			if (!endpoint) {
				console.warn('VITE_SHEETS_WEBAPP_URL no configurado. Se omite guardado en Sheets.')
				return
			}
			const payload = {
				firstName: form.firstName,
				lastName: form.lastName,
				phone: form.phone,
				email: form.email,
				ticketQty: form.ticketQty,
				coolerQty: form.coolerQty,
				total,
				paymentMethod: form.paymentMethod,
				createdAt: new Date().toISOString(),
			}
			// Enviar como x-www-form-urlencoded para evitar preflight CORS
			const body = new URLSearchParams({ data: JSON.stringify(payload) })
			await fetch(endpoint, {
				method: 'POST',
				// Modo no-cors evita el bloqueo del navegador; la respuesta será opaca,
				// pero el Apps Script recibirá los datos.
				mode: 'no-cors',
				body,
			})
		} catch (err) {
			console.error('Error guardando en Google Sheets', err)
		}
	}

	return (
		<div className="min-h-screen bg-background text-white">
			<div className="mx-auto max-w-2xl px-4 py-10">
				<header className="mb-8 text-center">
					<h1 className="text-4xl font-extrabold tracking-tight">
						<span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(167,139,250,0.5)]">
							Tiket Now
						</span>
					</h1>
					<p className="mt-2 text-neon/80">Comprá tus entradas para la fiesta</p>
				</header>

				<div className="rounded-2xl border border-neon/20 bg-black/30 p-6 shadow-neon backdrop-blur">
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<label className="flex flex-col gap-2">
							<span className="text-sm text-white/80">Nombre</span>
							<input
								type="text"
								className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 outline-none transition focus:border-neon/50"
								value={form.firstName}
								onChange={(e) => handleChange('firstName', e.target.value)}
								placeholder="Juan"
								required
							/>
						</label>
						<label className="flex flex-col gap-2">
							<span className="text-sm text-white/80">Apellido</span>
							<input
								type="text"
								className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 outline-none transition focus:border-neon/50"
								value={form.lastName}
								onChange={(e) => handleChange('lastName', e.target.value)}
								placeholder="Pérez"
								required
							/>
						</label>
						<label className="flex flex-col gap-2">
							<span className="text-sm text-white/80">Teléfono</span>
							<input
								type="tel"
								className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 outline-none transition focus:border-neon/50"
								value={form.phone}
								onChange={(e) => handleChange('phone', e.target.value)}
								placeholder="11 2345 6789"
								required
							/>
						</label>
						<label className="flex flex-col gap-2">
							<span className="text-sm text-white/80">Email</span>
							<input
								type="email"
								className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 outline-none transition focus:border-neon/50"
								value={form.email}
								onChange={(e) => handleChange('email', e.target.value)}
								placeholder="correo@ejemplo.com"
								required
							/>
						</label>
					</div>

					<div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
						<label className="flex flex-col gap-2">
							<span className="text-sm text-white/80">Cantidad de entradas</span>
							<input
								type="number"
								min={1}
								className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 outline-none transition focus:border-neon/50"
								value={form.ticketQty}
								onChange={(e) => handleChange('ticketQty', Math.max(1, Number(e.target.value)))}
							/>
						</label>
						<label className="flex flex-col gap-2">
							<span className="text-sm text-white/80">Ticket de conservadora</span>
							<input
								type="number"
								min={0}
								className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 outline-none transition focus:border-neon/50"
								value={form.coolerQty}
								onChange={(e) => handleChange('coolerQty', Math.max(0, Number(e.target.value)))}
							/>
						</label>
						<label className="flex flex-col gap-2 sm:col-span-2">
							<span className="text-sm text-white/80">Medio de pago</span>
							<select
								className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 outline-none transition focus:border-neon/50"
								value={form.paymentMethod}
								onChange={(e) => handleChange('paymentMethod', e.target.value)}
							>
								<option>Transferencia</option>
								<option>Efectivo</option>
								<option>Mercado Pago</option>
								<option>Otro</option>
							</select>
						</label>
					</div>

					<div className="mt-6 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4">
						<div className="text-white/80">
							<p>Entradas: ${form.ticketQty} x ${ticketPrice.toLocaleString('es-AR')}</p>
							<p>Conservadora: ${form.coolerQty} x ${coolerPrice.toLocaleString('es-AR')}</p>
						</div>
						<div className="text-right">
							<p className="text-sm text-white/60">Total</p>
							<p className="text-2xl font-bold text-neon">${total.toLocaleString('es-AR')}</p>
						</div>
					</div>

					<button
						type="button"
						className={`mt-6 block w-full rounded-xl px-6 py-3 text-center font-semibold text-white shadow-neon transition-transform ${isValid ? 'bg-gradient-to-r from-primary via-secondary to-accent hover:scale-[1.01]' : 'bg-white/10 cursor-not-allowed'}`}
						disabled={!isValid}
						onClick={async () => {
							if (!isValid) return
							await savePurchase()
							window.open(buildWhatsappLink(), '_blank')
						}}
					>
						Enviar comprobante por WhatsApp
					</button>
				</div>

				<p className="mt-6 text-center text-xs text-white/40">Organizador recibirá tus datos y el comprobante por WhatsApp.</p>
			</div>
		</div>
	)
}


