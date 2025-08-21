import type { Event } from '../types';

// Interfaz para eventos
export interface Event {
  id: string;
  name: string;
  date: string;
  ticketPrice: number;
  coolerPrice: number;
}

// Clase que maneja eventos en Google Sheets (Principio de Responsabilidad Única)
export class GoogleSheetsEventService {
  private sheetId: string;
  private sheetName: string = 'Eventos';

  constructor(sheetId: string) {
    this.sheetId = sheetId;
  }

  // Método para obtener todos los eventos
  async getAllEvents(): Promise<Event[]> {
    try {
      const csvUrl = `https://docs.google.com/spreadsheets/d/${this.sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(this.sheetName)}`;
      const response = await fetch(csvUrl);
      if (!response.ok) throw new Error('Error fetching');
      const csvText = await response.text();
      // Parse CSV similar a PurchaseService
      const rows = this.parseCsv(csvText);
      return rows.slice(1).map(row => ({
        id: row[0],
        name: row[1],
        date: row[2],
        ticketPrice: parseFloat(row[3]),
        coolerPrice: parseFloat(row[4]),
        description: row[5] || '',
        location: row[6] || '',
        image: row[7] || '',
        createdBy: row[8] || '',
        hour: row[9] || '',
        theme: row[10] || '',
        capacity: parseFloat(row[11]) || 0,
      }));
    } catch (error) {
      console.error(error);
      return [];
    }
  }

  // Método para crear un nuevo evento
  async createEvent(event: Omit<Event, 'id'>): Promise<Event> {
    const params = new URLSearchParams({
      name: event.name,
      date: event.date,
      ticketPrice: event.ticketPrice.toString(),
      coolerPrice: event.coolerPrice.toString(),
    });

    params.set('description', event.description);
    params.set('location', event.location);
    params.set('image', event.image);
    params.set('createdBy', event.createdBy);
    params.set('hour', event.hour);
    params.set('theme', event.theme);
    params.set('capacity', event.capacity.toString());

    const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/.../exec'; // Reemplazar con real

    await fetch(APPS_SCRIPT_URL, { // Reemplaza con URL real
      method: 'POST',
      body: params,
    });

    return { ...event, id: Date.now().toString() }; // ID temporal
  }

  async updateEvent(event: Event): Promise<void> {
    const params = new URLSearchParams({
      id: event.id,
      name: event.name,
      date: event.date,
      ticketPrice: event.ticketPrice.toString(),
      coolerPrice: event.coolerPrice.toString(),
    });

    params.set('description', event.description);
    params.set('location', event.location);
    params.set('image', event.image);
    params.set('createdBy', event.createdBy);
    params.set('hour', event.hour);
    params.set('theme', event.theme);
    params.set('capacity', event.capacity.toString());

    const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/.../exec'; // Reemplazar con real

    await fetch(APPS_SCRIPT_URL, {
      method: 'POST', // O PATCH si Apps Script lo soporta
      body: params,
    });
  }

  async deleteEvent(id: string): Promise<void> {
    const params = new URLSearchParams({
      action: 'delete',
      id,
    });

    await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      body: params,
    });
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
