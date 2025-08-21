// Servicio para gestión de eventos usando Google Sheets
// Responsabilidad única: CRUD de eventos en Hoja 2
// Implementa principios SOLID y comentarios en español

import type { Event } from '../types'

export class GoogleSheetsEventService {
  private readonly sheetId: string
  private readonly sheetName: string = 'Hoja 2' // Hoja específica para eventos
  private cache: { data: Event[], timestamp: number } | null = null
  private readonly CACHE_DURATION = 30000 // 30 segundos de cache

  constructor(sheetId: string) {
    this.sheetId = sheetId
  }

  // Método para obtener todos los eventos desde Google Sheets - Con cache optimizado
  async getAllEvents(): Promise<Event[]> {
    try {
      // Verificar cache primero
      if (this.cache && (Date.now() - this.cache.timestamp) < this.CACHE_DURATION) {
        console.log('📦 Usando datos en cache para eventos')
        return this.cache.data
      }

      console.log('🔄 Obteniendo eventos desde Google Sheets...')
      const csvUrl = `https://docs.google.com/spreadsheets/d/${this.sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(this.sheetName)}`
      
      const response = await fetch(csvUrl, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      
      if (!response.ok) {
        throw new Error(`Error al obtener eventos: ${response.status}`)
      }
      
      const csvText = await response.text()
      const rows = this.parseCsv(csvText)
      const events = this.mapRowsToEvents(rows)
      
      // Actualizar cache
      this.cache = {
        data: events,
        timestamp: Date.now()
      }
      
      console.log(`✅ ${events.length} eventos cargados exitosamente`)
      return events
    } catch (error) {
      console.error('Error loading events:', error)
      // Si hay cache disponible, usarlo como fallback
      if (this.cache) {
        console.log('⚠️ Usando cache como fallback')
        return this.cache.data
      }
      throw new Error('No se pudieron cargar los eventos. Verifica que el Sheet sea público.')
    }
  }

  // Método para crear un nuevo evento
  async createEvent(event: Omit<Event, 'id' | 'createdAt'>): Promise<Event> {
    const newEvent: Event = {
      ...event,
      id: Date.now().toString(), // ID único basado en timestamp
      createdAt: new Date().toISOString()
    }

    try {
      const params = new URLSearchParams({
        action: 'create',
        id: newEvent.id,
        name: newEvent.name,
        date: newEvent.date,
        hour: newEvent.hour,
        description: newEvent.description,
        location: newEvent.location,
        image: newEvent.image,
        ticketPrice: newEvent.ticketPrice.toString(),
        vipPrice: newEvent.vipPrice.toString(),
        capacity: newEvent.capacity.toString(),
        createdBy: newEvent.createdBy,
        status: newEvent.status
      })

      // URL real del Google Apps Script deployado
      const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxrmRVPNRpRZ6n-MPWA4XViVZmvAblvxcycRyVRoAesGEexpwgj9pHnbHS1qgR-lBlrcg/exec';
      
      await fetch(APPS_SCRIPT_URL, { 
        method: 'POST', 
        body: params,
        mode: 'no-cors'
      })

      console.log('✅ Evento creado exitosamente:', newEvent.name)
      // Invalidar cache después de crear
      this.cache = null
    } catch (error) {
      console.error('❌ Error creando evento:', error)
      throw error
    }

    return newEvent
  }

  // Método para actualizar un evento existente
  async updateEvent(event: Event): Promise<void> {
    try {
      const params = new URLSearchParams({
        action: 'update',
        id: event.id,
        name: event.name,
        date: event.date,
        hour: event.hour,
        description: event.description,
        location: event.location,
        image: event.image,
        ticketPrice: event.ticketPrice.toString(),
        vipPrice: event.vipPrice.toString(),
        capacity: event.capacity.toString(),
        createdBy: event.createdBy,
        status: event.status
      })

      const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxrmRVPNRpRZ6n-MPWA4XViVZmvAblvxcycRyVRoAesGEexpwgj9pHnbHS1qgR-lBlrcg/exec';
      
      await fetch(APPS_SCRIPT_URL, { 
        method: 'POST', 
        body: params,
        mode: 'no-cors'
      })

      console.log('✅ Evento actualizado exitosamente:', event.name)
      // Invalidar cache después de actualizar
      this.cache = null
    } catch (error) {
      console.error('❌ Error actualizando evento:', error)
      throw error
    }
  }

  // Método para eliminar un evento
  async deleteEvent(id: string): Promise<void> {
    try {
      const params = new URLSearchParams({
        action: 'delete',
        id: id
      })

      const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxrmRVPNRpRZ6n-MPWA4XViVZmvAblvxcycRyVRoAesGEexpwgj9pHnbHS1qgR-lBlrcg/exec';
      
      await fetch(APPS_SCRIPT_URL, { 
        method: 'POST', 
        body: params,
        mode: 'no-cors'
      })

      console.log('✅ Evento eliminado exitosamente:', id)
      // Invalidar cache después de eliminar
      this.cache = null
    } catch (error) {
      console.error('❌ Error eliminando evento:', error)
      throw error
    }
  }

  // Mapea las filas CSV a objetos Event
  private mapRowsToEvents(rows: string[][]): Event[] {
    const events: Event[] = []
    
    // Saltar encabezados (primera fila)
    for (let i = 1; i < rows.length; i++) {
      const cols = rows[i]
      if (cols.length >= 12 && cols[1]?.trim()) {
        events.push({
          id: cols[0] || `${i}-${Date.now()}`,
          name: cols[1] || '',
          date: cols[2] || '',
          hour: cols[3] || '',
          description: cols[4] || '',
          location: cols[5] || '',
          image: cols[6] || '',
          ticketPrice: parseFloat(cols[7]) || 0,
          vipPrice: parseFloat(cols[8]) || 0,
          capacity: parseInt(cols[9]) || 0,
          createdBy: cols[10] || '',
          createdAt: cols[11] || '',
          status: (cols[12] as 'active' | 'inactive') || 'active'
        })
      }
    }
    
    return events.reverse() // Más recientes primero
  }

  // Parser CSV (copiado de PurchaseService para consistencia)
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
