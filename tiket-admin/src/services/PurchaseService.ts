// Servicio para gestión de compras
// Responsabilidad única: obtener y actualizar datos de compras

import type { PurchaseService } from './interfaces'
import type { Purchase } from '../types'

export class GoogleSheetsPurchaseService implements PurchaseService {
  private readonly sheetId: string
  private readonly sheetName: string

  constructor(sheetId: string, sheetName: string = 'Hoja 1') {
    this.sheetId = sheetId
    this.sheetName = sheetName
  }

  async getAllPurchases(): Promise<Purchase[]> {
    try {
      const csvUrl = `https://docs.google.com/spreadsheets/d/${this.sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(this.sheetName)}`
      
      const response = await fetch(csvUrl)
      if (!response.ok) {
        throw new Error(`Error al obtener datos: ${response.status}`)
      }
      
      const csvText = await response.text()
      const rows = this.parseCsv(csvText)
      
      return this.mapRowsToPurchases(rows)
    } catch (error) {
      console.error('Error loading purchases:', error)
      throw new Error('No se pudieron cargar las compras. Verifica que el Sheet sea público.')
    }
  }

  async updatePurchaseStatus(purchaseId: string, status: Purchase['status']): Promise<void> {
    // En una implementación real, esto actualizaría el Sheet
    // Por ahora solo simulamos el cambio
    console.log(`Actualizando compra ${purchaseId} a estado: ${status}`)
  }

  private mapRowsToPurchases(rows: string[][]): Purchase[] {
    const purchases: Purchase[] = []
    
    // Saltar encabezados (primera fila)
    for (let i = 1; i < rows.length; i++) {
      const cols = rows[i]
      if (cols.length >= 10 && cols[1]?.trim()) {
        purchases.push({
          id: `${i}-${cols[1]}-${cols[2]}-${cols[0]}`, // ID único basado en datos
          timestamp: cols[0] || '',
          firstName: cols[1] || '',
          lastName: cols[2] || '',
          phone: cols[3] || '',
          email: cols[4] || '',
          ticketQty: parseInt(cols[5]) || 0,
          coolerQty: parseInt(cols[6]) || 0,
          paymentMethod: cols[7] || '',
          total: parseFloat(cols[8]) || 0,
          status: this.parseStatus(cols[9]),
          eventId: cols[10] || '', // ID del evento (si existe)
          eventName: cols[11] || '' // Nombre del evento (si existe)
        })
      }
    }
    
    return purchases.reverse() // Más recientes primero
  }

  private parseStatus(statusText: string): Purchase['status'] {
    const status = statusText?.toLowerCase() || ''
    if (status.includes('enviado')) return 'Enviado'
    if (status.includes('confirmado')) return 'Confirmado'
    return 'Pendiente'
  }

  private parseCsv(text: string): string[][] {
    const rows: string[][] = []
    let current: string[] = []
    let field = ''
    let inQuotes = false
    
    for (let i = 0; i < text.length; i++) {
      const c = text[i]
      if (inQuotes) {
        if (c === '"') {
          if (text[i + 1] === '"') { 
            field += '"'
            i++ 
          } else { 
            inQuotes = false 
          }
        } else { 
          field += c 
        }
      } else {
        if (c === '"') { 
          inQuotes = true 
        } else if (c === ',') { 
          current.push(field)
          field = '' 
        } else if (c === '\n') { 
          current.push(field)
          rows.push(current)
          current = []
          field = '' 
        } else if (c === '\r') { 
          // ignorar 
        } else { 
          field += c 
        }
      }
    }
    
    if (field.length > 0 || current.length > 0) { 
      current.push(field)
      rows.push(current) 
    }
    
    return rows
  }
}
