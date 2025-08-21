// Tipos de dominio - Entidades centrales del sistema
export interface Purchase {
  id: string
  timestamp: string
  firstName: string
  lastName: string
  phone: string
  email: string
  ticketQty: number
  coolerQty: number
  paymentMethod: string
  total: number
  status: 'Pendiente' | 'Confirmado' | 'Enviado'
  eventId?: string // Campo opcional para filtrar por evento
  eventName?: string // Nombre del evento para mejor UX
}

export interface User {
  username: string
  role: 'admin' | 'super-admin'
}

export interface QRCode {
  id: string
  content: string
  url: string
  ticketIndex: number
}

// Interfaz para eventos - Event Manager
export interface Event {
  id: string
  name: string
  date: string
  hour: string
  description: string
  location: string
  image: string
  ticketPrice: number
  vipPrice: number
  capacity: number
  createdBy: string
  createdAt: string
  status: 'active' | 'inactive'
}