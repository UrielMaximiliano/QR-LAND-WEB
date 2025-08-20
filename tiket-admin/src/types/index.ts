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
