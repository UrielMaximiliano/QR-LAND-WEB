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

export class GoogleSheetsEventService {
  private sheetId: string = '1cGfDtuuKPHmYcrVf6rf3DXiege2TmanwaimRKy5E53c';
  private sheetName: string = 'Eventos';

  async getAllEvents(): Promise<Event[]> {
    try {
      const csvUrl = `https://docs.google.com/spreadsheets/d/${this.sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(this.sheetName)}`;
      const response = await fetch(csvUrl);
      if (!response.ok) throw new Error('Error fetching');
      const csvText = await response.text();
      const rows = this.parseCsv(csvText);
      return rows.slice(1).map(row => ({
        id: row[0],
        name: row[1],
        date: row[2],
        ticketPrice: parseFloat(row[3]),
        coolerPrice: parseFloat(row[4]),
        description: row[5],
        location: row[6],
        image: row[7],
        createdBy: row[8] || '',
        hour: row[9] || '',
        theme: row[10] || '',
        capacity: parseInt(row[11]) || 0,
      }));
    } catch (error) {
      console.error(error);
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
