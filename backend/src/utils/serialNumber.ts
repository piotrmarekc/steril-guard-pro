/**
 * System SterilGuard Pro - Generowanie numerów seryjnych
 * Unikalne numery dla pakietów sterylnych
 */

import { v4 as uuidv4 } from 'uuid';
import moment from 'moment';

/**
 * Generuje unikalny numer seryjny dla pakietu
 * Format: SG-YYYYMMDD-XXXX
 * SG = SterilGuard
 * YYYYMMDD = data sterylizacji
 * XXXX = unikalny identyfikator
 */
export function generateSerialNumber(): string {
  const date = new Date();
  const dateString = date.toISOString().slice(0, 10).replace(/-/g, '');
  const uniqueId = uuidv4().slice(0, 4).toUpperCase();

  return `SG-${dateString}-${uniqueId}`;
}

/**
 * Generuje zakres numerów seryjnych dla pakietów
 */
export function generateSerialNumberRange(count: number): string[] {
  const numbers: string[] = [];

  for (let i = 0; i < count; i++) {
    const baseDate = new Date();
    const dateString = baseDate.toISOString().slice(0, 10).replace(/-/g, '');
    const uniqueId = `${uuidv4().slice(0, 4).toUpperCase()}-${i + 1}`;

    numbers.push(`SG-${dateString}-${uniqueId}`);
  }

  return numbers;
}

/**
 * Waliduje numer seryjny
 */
export function validateSerialNumber(serialNumber: string): boolean {
  const pattern = /^SG-\d{8}-[A-Z0-9]+$/;
  return pattern.test(serialNumber);
}

/**
 * Pobiera datę z numeru seryjnego
 */
export function getDateFromSerial(serialNumber: string): Date | null {
  const match = serialNumber.match(/^SG-(\d{8})-/);
  if (match) {
    const dateString = match[1];
    return new Date(`${dateString.slice(0, 4)}-${dateString.slice(4, 6)}-${dateString.slice(6, 8)}`);
  }
  return null;
}
