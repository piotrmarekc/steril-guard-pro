/**
 * System SterilGuard Pro - Router for Reports
 */

import { Router, Request, Response } from 'express';
import { query, validationResult } from 'express-validator';
import { generateSanepidReport, SanepidReportData } from '../utils/reportGenerator';
import { PrismaClient } from '@prisma/client';
import { PhysicalParameters } from '../types';

const router = Router();
const prisma = new PrismaClient();

// GET /api/reports/pdf?from=&to= - Generuj raport PDF
router.get('/pdf', [
  query('from').isDate().notEmpty(),
  query('to').isDate().notEmpty()
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { from, to } = req.query;
    const processes = await prisma.sterilizationProcess.findMany({
      where: {
        createdAt: {
          gte: new Date(from as string),
          lte: new Date(to as string)
        }
      },
      include: {
        operator: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        toolPackages: true,
        chemicalIndicators: true
      }
    });

    const reportData: SanepidReportData = {
      dateRange: {
        from: from as string,
        to: to as string
      },
      processes: processes.map(p => {
        const params = JSON.parse(p.physicalParameters) as PhysicalParameters;
        return {
          cycleNumber: p.cycleNumber,
          date: p.startTime.toLocaleDateString('pl-PL'),
          time: p.startTime.toLocaleTimeString('pl-PL'),
          operator: `${p.operator.firstName} ${p.operator.lastName}`,
          toolDescription: p.toolPackages.map(tp => tp.description).join(', '),
          physicalParams: {
            temperature: `${params.temperature} °C`,
            pressure: `${params.pressure} kPa`,
            time: `${params.time} min`
          },
          chemicalTestResult: p.chemicalIndicators[0]?.result || 'Brak',
          signature: '---'
        };
      }),
      facilityName: 'Salon Beauty',
      facilityAddress: 'ul. Example 123, 00-001 Warszawa'
    };

    const pdfBuffer = await generateSanepidReport(reportData);
    const filename = `raport_${from}_${to}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ error: 'Błąd generowania raportu' });
  }
});

// GET /api/reports/summary - Podsumowanie aktywności
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const totalProcesses = await prisma.sterilizationProcess.count();
    const completedProcesses = await prisma.sterilizationProcess.count({
      where: { status: 'COMPLETED' }
    });
    const sealedProcesses = await prisma.sterilizationProcess.count({
      where: { status: 'SEALED' }
    });

    const recentProcesses = await prisma.sterilizationProcess.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        operator: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    res.json({
      totalProcesses,
      completedProcesses,
      sealedProcesses,
      recentProcesses
    });
  } catch (error) {
    res.status(500).json({ error: 'Błąd bazy danych' });
  }
});

export default router;
