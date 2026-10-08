import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PdfExportService {
  downloadDataReport(data: unknown, filename = 'getingo-szemelyes-adataim.pdf'): void {
    const report = data as Record<string, unknown>;
    const account = (report['account'] ?? {}) as Record<string, unknown>;
    const lines: string[] = [
      'GETINGO - Szemelyes adatjelentes',
      `Nev: ${this.ascii(account['name'])}`,
      `Email: ${this.ascii(account['email'])}`,
      `Keszult: ${new Date().toLocaleString('hu-HU')}`,
      '',
    ];

    for (const [key, value] of Object.entries(report)) {
      if (key === 'account') continue;
      lines.push(this.ascii(key.replaceAll('_', ' ').toUpperCase()));
      const pretty = JSON.stringify(value, null, 2) ?? '';
      for (const raw of pretty.split('\n')) lines.push(...this.wrap(this.ascii(raw), 88));
      lines.push('');
    }

    const pdf = this.buildPdf(lines);
    const url = URL.createObjectURL(pdf);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  private buildPdf(lines: string[]): Blob {
    const pageLines = 50;
    const pages: string[][] = [];
    for (let i = 0; i < lines.length; i += pageLines) pages.push(lines.slice(i, i + pageLines));
    if (!pages.length) pages.push(['GETINGO - Szemelyes adatjelentes']);

    const objects = new Map<number, string>();
    const pageObjectIds: number[] = [];
    const contentObjectIds: number[] = [];
    let nextId = 4;
    for (let i = 0; i < pages.length; i++) {
      pageObjectIds.push(nextId++);
      contentObjectIds.push(nextId++);
    }

    objects.set(1, '<< /Type /Catalog /Pages 2 0 R >>');
    objects.set(2, `<< /Type /Pages /Kids [${pageObjectIds.map(id => `${id} 0 R`).join(' ')}] /Count ${pageObjectIds.length} >>`);
    objects.set(3, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');

    pages.forEach((page, index) => {
      const pageId = pageObjectIds[index];
      const contentId = contentObjectIds[index];
      const streamLines = page.map(line => `(${this.pdfEscape(line)}) Tj T*`).join('\n');
      const stream = `BT\n/F1 9 Tf\n42 800 Td\n14 TL\n${streamLines}\nET`;
      objects.set(pageId, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`);
      objects.set(contentId, `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
    });

    let pdf = '%PDF-1.4\n%GETINGO\n';
    const offsets: number[] = [0];
    for (let id = 1; id < nextId; id++) {
      offsets[id] = pdf.length;
      pdf += `${id} 0 obj\n${objects.get(id) ?? '<<>>'}\nendobj\n`;
    }
    const xrefOffset = pdf.length;
    pdf += `xref\n0 ${nextId}\n0000000000 65535 f \n`;
    for (let id = 1; id < nextId; id++) pdf += `${String(offsets[id]).padStart(10, '0')} 00000 n \n`;
    pdf += `trailer\n<< /Size ${nextId} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

    return new Blob([pdf], { type: 'application/pdf' });
  }

  private ascii(value: unknown): string {
    return String(value ?? '')
      .replace(/[őŐ]/g, match => match === 'Ő' ? 'O' : 'o')
      .replace(/[űŰ]/g, match => match === 'Ű' ? 'U' : 'u')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\x20-\x7E]/g, '?');
  }

  private wrap(value: string, max: number): string[] {
    if (value.length <= max) return [value];
    const result: string[] = [];
    let remaining = value;
    while (remaining.length > max) {
      let split = remaining.lastIndexOf(' ', max);
      if (split < Math.floor(max * .5)) split = max;
      result.push(remaining.slice(0, split));
      remaining = remaining.slice(split).trimStart();
    }
    result.push(remaining);
    return result;
  }

  private pdfEscape(value: string): string {
    return value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  }
}
