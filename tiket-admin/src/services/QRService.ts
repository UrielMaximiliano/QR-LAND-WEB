// Servicio para generación de códigos QR
// Responsabilidad única: crear y gestionar códigos QR para entradas

import type { QRService } from './interfaces'
import type { Purchase, QRCode } from '../types'

export class QuickChartQRService implements QRService {
  private readonly baseUrl = 'https://quickchart.io/qr'
  private readonly defaultSize = 512

  generateTicketQRs(purchase: Purchase): QRCode[] {
    const qrCodes: QRCode[] = []
    
    for (let i = 1; i <= purchase.ticketQty; i++) {
      const content = this.buildQRContent(purchase, i)
      const url = this.generateQRUrl(content)
      
      qrCodes.push({
        id: `${purchase.id}-ticket-${i}`,
        content,
        url,
        ticketIndex: i
      })
    }
    
    return qrCodes
  }

  generateQRUrl(content: string): string {
    const params = new URLSearchParams({
      text: content,
      size: this.defaultSize.toString(),
      margin: '10',
      format: 'png'
    })
    
    return `${this.baseUrl}?${params.toString()}`
  }

  private buildQRContent(purchase: Purchase, ticketIndex: number): string {
    // Contenido estructurado y legible del QR
    return [
      '🎫 TIKET NOW',
      '',
      `👤 ${purchase.firstName} ${purchase.lastName}`,
      `📱 ${purchase.phone}`,
      `📧 ${purchase.email}`,
      '',
      `🎟️ Entrada: ${ticketIndex}/${purchase.ticketQty}`,
      `🧊 Conservadora: ${purchase.coolerQty > 0 ? 'Incluida' : 'No incluida'}`,
      `💰 Total: $${purchase.total.toLocaleString()}`,
      '',
      `🎉 ¡Válido para el evento!`
    ].join('\n')
  }
}
