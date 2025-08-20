// Interfaces de servicios - Inversión de dependencias (SOLID)
// Los componentes dependen de estas abstracciones, no de implementaciones concretas

import type { Purchase, User, QRCode } from '../types'

export interface AuthService {
  login(username: string, password: string): Promise<User | null>
  logout(): void
  getCurrentUser(): User | null
  isAuthenticated(): boolean
}

export interface PurchaseService {
  getAllPurchases(): Promise<Purchase[]>
  updatePurchaseStatus(purchaseId: string, status: Purchase['status']): Promise<void>
}

export interface QRService {
  generateTicketQRs(purchase: Purchase): QRCode[]
  generateQRUrl(content: string): string
}

export interface WhatsAppService {
  sendQRCodes(purchase: Purchase, qrCodes: QRCode[]): void
  formatPhoneNumber(phone: string): string
}
