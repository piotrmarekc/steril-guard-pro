/**
 * System SterilGuard Pro - Generowanie raportów PDF
 * Zgodne z wymogami Sanepidu dla dziennika sterylizacji
 */

import { PDFDocument, rgb } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { existsSync, mkdirSync } from 'fs';

/**
 * Dane wejściowe dla raportu Sanepid
 */
export interface SanepidReportData {
  dateRange: {
    from: string;
    to: string;
  };
  processes: ProcessReportData[];
  facilityName: string;
  facilityAddress: string;
}

export interface ProcessReportData {
  cycleNumber: number;
  date: string;
  time: string;
  operator: string;
  toolDescription: string;
  physicalParams: {
    temperature: string;
    pressure: string;
    time: string;
  };
  chemicalTestResult: string;
  signature: string;
}

/**
 * Generuje PDF dziennika kontroli procesów sterylizacji
 */
export async function generateSanepidReport(data: SanepidReportData): Promise<Buffer> {
  // Sprawdzenie i utworzenie katalogu raportów
  const reportsDir = path.join(__dirname, '..', 'reports');
  if (!existsSync(reportsDir)) {
    mkdirSync(reportsDir, { recursive: true });
  }

  // Tworzenie nowego dokumentu PDF
  const pdfDoc = await PDFDocument.create();

  // Dodanie strony
  const page = pdfDoc.addPage([612, 792]); // Format A4 (8.5 x 11 cali)
  const { width, height } = page.getSize();

  // Rysowanie nagłówka
  drawHeader(page, width, data);

  // Rysowanie tabeli
  drawTable(page, width, height, data.processes, pdfDoc);

  // Rysowanie podpisu
  drawFooter(page, width, height);

  // Serializacja dokumentu
  const pdfBytes = await pdfDoc.save();

  return Buffer.from(pdfBytes);
}

/**
 * Rysuje nagłówek raportu
 */
function drawHeader(page: any, width: number, data: SanepidReportData) {
  const title = 'Dziennik kontroli procesów sterylizacji';
  const subtitle = `Zakres: ${data.dateRange.from} do ${data.dateRange.to}`;

  page.drawText(title, {
    x: 50,
    y: height - 50,
    size: 18,
    font: null,
    color: rgb(0, 0, 0)
  });

  page.drawText(subtitle, {
    x: 50,
    y: height - 75,
    size: 12,
    font: null,
    color: rgb(0.3, 0.3, 0.3)
  });

  page.drawText(`Nazwa zakładu: ${data.facilityName}`, {
    x: 50,
    y: height - 100,
    size: 10,
    font: null,
    color: rgb(0, 0, 0)
  });

  page.drawText(`Adres: ${data.facilityAddress}`, {
    x: 50,
    y: height - 115,
    size: 10,
    font: null,
    color: rgb(0, 0, 0)
  });
}

/**
 * Rysuje tabelę z danymi procesów
 */
function drawTable(page: any, width: number, height: number, processes: ProcessReportData[], pdfDoc: any) {
  const startX = 50;
  const startY = height - 150;
  const rowHeight = 15;
  const colWidths = [40, 60, 60, 80, 120, 50, 50, 50];

  // Nagłówki kolumn
  const headers = ['Nr', 'Data', 'Godz.', 'Operator', 'Opis wsadu', 'T (°C)', 'Czas', 'Test'];

  // Rysowanie nagłówków
  let currentX = startX;
  headers.forEach((header, i) => {
    page.drawText(header, {
      x: currentX,
      y: startY,
      size: 10,
      font: null,
      color: rgb(0, 0, 0),
      bold: true
    });
    currentX += colWidths[i];
  });

  // Rysowanie separatora
  page.moveTo(startX, startY - 5).lineTo(width - 50, startY - 5).stroke();

  // Rysowanie wierszy danych
  let currentY = startY - 20;
  processes.forEach((process, index) => {
    // Dodanie nowej strony po 40 wierszach
    if (index > 0 && index % 40 === 0) {
      page = pdfDoc.addPage([612, 792]);
      currentY = height - 50;
    }

    const rowData = [
      process.cycleNumber.toString(),
      process.date,
      process.time,
      process.operator,
      process.toolDescription,
      process.physicalParams.temperature,
      process.physicalParams.time,
      process.chemicalTestResult
    ];

    currentX = startX;
    rowData.forEach((cell, i) => {
      page.drawText(cell, {
        x: currentX,
        y: currentY,
        size: 9,
        font: null,
        color: rgb(0, 0, 0)
      });
      currentX += colWidths[i];
    });

    currentY -= rowHeight;
  });
}

/**
 * Rysuje stopkę z informacjami o odpowiedzialności
 */
function drawFooter(page: any, width: number, height: number) {
  const footerY = 50;

  page.drawText('Dokument jest generowany automatycznie przez System SterilGuard Pro', {
    x: 50,
    y: footerY,
    size: 8,
    font: null,
    color: rgb(0.5, 0.5, 0.5)
  });

  page.drawText('Data wydruku: ' + new Date().toLocaleDateString('pl-PL'), {
    x: width - 250,
    y: footerY,
    size: 8,
    font: null,
    color: rgb(0.5, 0.5, 0.5)
  });
}

/**
 * Zapisuje raport do pliku
 */
export function saveReport(buffer: Buffer, filename: string): string {
  const filePath = path.join('reports', filename);
  fs.writeFileSync(filePath, buffer);
  return filePath;
}
