/**
 * System SterilGuard Pro - Główny plik aplikacji
 * Zgodny z wymogami Sanepidu dla salonów beauty
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';

// Import routerów
import sterilizationRouter from './routes/sterilization.routes';
import userRouter from './routes/user.routes';
import reportRouter from './routes/report.routes';

// Konfiguracja
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Statyczne pliki (dla frontendu)
app.use(express.static(path.join(__dirname, '../frontend/build')));

// Routers
app.use('/api/sterilization', sterilizationRouter);
app.use('/api/users', userRouter);
app.use('/api/reports', reportRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', message: `Endpoint ${req.method} ${req.path} nie istnieje` });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Błąd:', err.message);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// Start serwera
app.listen(PORT, () => {
  console.log(`SterilGuard Pro serwer uruchomiony na porcie ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

export default app;
