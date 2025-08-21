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
  eventId: string;
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

// Interfaz para eventos
export interface Event {
  id: string;
  name: string;
  date: string;
  ticketPrice: number;
  coolerPrice: number;
  description: string;
  location: string;
  image: string;
  createdBy: string;
  hour: string;
  theme: string;
  capacity: number;
}