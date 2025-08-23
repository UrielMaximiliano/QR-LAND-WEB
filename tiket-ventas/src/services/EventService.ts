export interface EventData {
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
  sheetId?: string
}

export class GoogleSheetsEventService {
  private sheetId: string = '1cGfDtuuKPHmYcrVf6rf3DXiege2TmanwaimRKy5E53c';
  private sheetName: string = 'Hoja 2'; // Usar Hoja 2 como en admin
  private cache: { data: EventData[], timestamp: number } | null = null
  private readonly CACHE_DURATION = 30000 // 30 segundos de cache

    async getAllEvents(): Promise<EventData[]> {
    try {
      // Verificar cache primero para mejor performance
      if (this.cache && (Date.now() - this.cache.timestamp) < this.CACHE_DURATION) {
        console.log('📦 Usando eventos en cache')
        return this.cache.data
      }

      console.log('🔄 Cargando eventos desde Google Sheets...')
      const csvUrl = `https://docs.google.com/spreadsheets/d/${this.sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(this.sheetName)}`;
      
      const response = await fetch(csvUrl, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) throw new Error('Error fetching');
      
      const csvText = await response.text();
      const rows = this.parseCsv(csvText);
      const events = rows.slice(1).map(row => ({
        id: row[0] || `${Date.now()}`,
        name: row[1] || '',
        date: row[2] || '',
        hour: row[3] || '',
        description: row[4] || '',
        location: row[5] || '',
        image: row[6] || '',
        ticketPrice: parseFloat(row[7]) || 0,
        vipPrice: parseFloat(row[8]) || 0,
        capacity: parseInt(row[9]) || 0,
        createdBy: row[10] || '',
        createdAt: row[11] || '',
        status: (row[12] as 'active' | 'inactive') || 'active',
        sheetId: row[13] || ''
      })).filter(event => event.status === 'active'); // Solo mostrar eventos activos

      // Actualizar cache
      this.cache = {
        data: events,
        timestamp: Date.now()
      }

      console.log(`✅ ${events.length} eventos activos cargados`)
      return events;
    } catch (error) {
      console.error('❌ Error cargando eventos:', error);
      // Fallback a cache si hay error
      if (this.cache) {
        console.log('⚠️ Usando cache como fallback')
        return this.cache.data
      }
      return [];
    }
  }

  private parseCsv(text: string): string[][] {
    const rows: string[][] = [];
    let current: string[] = [];
    let field = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (inQuotes) {
        if (c === '"') {
          if (text[i + 1] === '"') {
            field += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          field += c;
        }
      } else {
        if (c === '"') {
          inQuotes = true;
        } else if (c === ',') {
          current.push(field);
          field = '';
        } else if (c === '\n') {
          current.push(field);
          rows.push(current);
          current = [];
          field = '';
        } else if (c === '\r') {
          // ignorar
        } else {
          field += c;
        }
      }
    }

    if (field.length > 0 || current.length > 0) {
      current.push(field);
      rows.push(current);
    }

    return rows;
  }
}
