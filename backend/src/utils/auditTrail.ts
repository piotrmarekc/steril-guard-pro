/**
 * System SterilGuard Pro - Moduł Audit Trail (Ślad Auditowy)
 * Zapewnia integralność danych i niezmienniczość dokumentacji
 *
 * Zgodnie z wymogami Sanepidu - dokumentacja musi być niezmienna po zamknięciu
 */

import { createHash, randomBytes } from 'crypto';
import { PrismaClient } from '@prisma/client';
import { ProcessStatus } from '../config/constants';

const prisma = new PrismaClient();

/**
 * Generuje hash dla rekordu procesu sterylizacji
 */
export function generateProcessHash(processData: any): string {
  const dataString = JSON.stringify({
    ...processData,
    timestamp: new Date().toISOString()
  });

  return createHash('sha256').update(dataString).digest('hex');
}

/**
 * Sprawdza, czy proces może być edytowany
 */
export function canEditProcess(status: ProcessStatus): boolean {
  return status === ProcessStatus.DRAFT ||
         status === ProcessStatus.INITIAL_DISINFECTING ||
         status === ProcessStatus.PREPARING ||
         status === ProcessStatus.PACKAGING ||
         status === ProcessStatus.STERILIZING ||
         status === ProcessStatus.VERIFYING;
}

/**
 * Zamyka proces i generuje hash integralności
 */
export async function sealProcess(
  processId: string,
  userId: string,
  ipAddress?: string
): Promise<{ success: boolean; message: string }> {
  const process = await prisma.sterilizationProcess.findUnique({
    where: { id: processId }
  });

  if (!process) {
    return { success: false, message: 'Proces nie istnieje' };
  }

  if (process.sealedAt) {
    return { success: false, message: 'Zgodność z Sanepidem: Proces został już zamrożony' };
  }

  if (process.status !== ProcessStatus.COMPLETED) {
    return { success: false, message: 'Zgodność z Sanepidem: Proces musi być zakończony przed zamrożeniem' };
  }

  // Generowanie hashu
  const processHash = generateProcessHash({
    id: process.id,
    cycleNumber: process.cycleNumber,
    startTime: process.startTime.toISOString(),
    endTime: process.endTime?.toISOString(),
    status: process.status,
    operatorId: process.operatorId,
    biologicalTestId: process.biologicalTestId,
    physicalParameters: process.physicalParameters,
    notes: process.notes,
    createdAt: process.createdAt.toISOString(),
    sealedAt: new Date().toISOString()
  });

  // Aktualizacja procesu
  await prisma.sterilizationProcess.update({
    where: { id: processId },
    data: {
      status: ProcessStatus.SEALED,
      sealedAt: new Date(),
      sealHash: processHash
    }
  });

  // Logowanie akcji
  await prisma.auditLog.create({
    data: {
      action: 'process.sealed',
      model: 'SterilizationProcess',
      modelId: processId,
      userId: userId,
      newValue: JSON.stringify({ sealHash: processHash })
    }
  });

  return {
    success: true,
    message: 'Proces został zamrożony. Edycja jest teraz zabroniona.'
  };
}

/**
 * Sprawdza integralność procesu po edycji
 */
export function verifyProcessIntegrity(
  originalData: any,
  newData: any,
  originalHash: string
): boolean {
  // Jeśli hash nie istnieje, integralność nie może zostać sprawdzona
  if (!originalHash) return true;

  // Generowanie nowego hashu dla oryginalnych danych
  const newHash = generateProcessHash(originalData);

  // Porównanie hashy
  return newHash === originalHash;
}

/**
 * Tworzy wpis w logu auditowym
 */
export async function createAuditLog(
  action: string,
  model: string,
  modelId: string,
  userId: string,
  oldValue?: any,
  newValue?: any
): Promise<void> {
  await prisma.auditLog.create({
    data: {
      action,
      model,
      modelId,
      userId,
      oldValue: oldValue ? JSON.stringify(oldValue) : null,
      newValue: newValue ? JSON.stringify(newValue) : null
    }
  });
}
