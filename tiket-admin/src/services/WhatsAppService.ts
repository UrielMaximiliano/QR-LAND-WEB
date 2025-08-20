// Servicio para comunicación por WhatsApp
// Responsabilidad única: formatear y enviar mensajes por WhatsApp

import type { WhatsAppService } from './interfaces'
import type { Purchase, QRCode } from '../types'

export class WaMeWhatsAppService implements WhatsAppService {
  sendQRCodes(purchase: Purchase, qrCodes: QRCode[]): void {
    const phone = this.formatPhoneNumber(purchase.phone)
    const message = this.buildMessage(purchase, qrCodes)
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    
    window.open(whatsappUrl, '_blank')
  }

  formatPhoneNumber(phone: string): string {
    // Limpiar y formatear número para Argentina
    const digits = phone.replace(/\D/g, '')
    
    if (digits.startsWith('549')) return digits
    if (digits.startsWith('54')) return '549' + digits.slice(2)
    if (digits.startsWith('9')) return '549' + digits
    
    return '549' + digits // Por defecto agregar código de país
  }

  private buildMessage(purchase: Purchase, qrCodes: QRCode[]): string {
    const lines = [
      `🎉 ¡Hola ${purchase.firstName}!`,
      '',
      '🎫 Aquí están tus códigos QR de entrada:',
      '',
      ...qrCodes.map((qr, idx) => 
        `${this.getTicketEmoji(idx)} **Entrada ${qr.ticketIndex}:** ${qr.url}`
      ),
      '',
      '📱 *Instrucciones:*',
      '• Guarda estos códigos en tu teléfono',
      '• Presenta cada QR en la entrada del evento',
      '• Un QR = Una persona',
      '',
      purchase.coolerQty > 0 
        ? `🧊 *Conservadora incluida:* ${purchase.coolerQty} unidad(es)`
        : '',
      '',
      '🎵 *¡Nos vemos en la fiesta!* 🎵',
      '',
      '---',
      '🎪 Tiket Now - Tu entrada al mejor evento'
    ].filter(line => line !== '') // Remover líneas vacías
    
    return lines.join('\n')
  }

  private getTicketEmoji(index: number): string {
    const emojis = ['🎫', '🎟️', '🎪', '🎭', '🎨', '🎯', '🎲', '🎸']
    return emojis[index % emojis.length]
  }
}
