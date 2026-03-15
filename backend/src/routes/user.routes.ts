/**
 * System SterilGuard Pro - Router for User management
 */

import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/users - Pobierz wszystkich użytkowników
router.get('/', async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        certification: true,
        expiryDate: true,
        createdAt: true
      }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Błąd bazy danych' });
  }
});

// GET /api/users/:id - Pobierz użytkownika po ID
router.get('/:id', param('id').isUUID(), async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params!.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        certification: true,
        expiryDate: true,
        createdAt: true,
        processes: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Błąd bazy danych' });
  }
});

// POST /api/users - Utwórz nowego użytkownika
router.post('/', [
  body('firstName').isString().notEmpty(),
  body('lastName').isString().notEmpty(),
  body('email').isEmail(),
  body('role').isIn(['STYLIST', 'SUPERVISOR', 'ADMIN']).optional(),
  body('certification').isString().optional()
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const user = await prisma.user.create({
      data: req.body
    });
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: 'Błąd bazy danych' });
  }
});

export default router;
