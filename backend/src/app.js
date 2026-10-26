import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { taskRoutes } from './routes/taskRoutes.js';
import { summaryRoutes } from './routes/summaryRoutes.js';
import { healthRoutes } from './routes/healthRoutes.js';
import { errorHandler } from './utils/errors.js';

export const app = express();
const frontendOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
app.disable('x-powered-by');
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    callback(null, !origin || frontendOrigins.includes(origin));
  },
}));
app.use(express.json({ limit: '256kb', strict: true }));
const aiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-8', legacyHeaders: false, message: { error: { code: 'RATE_LIMITED', message: 'Too many AI requests. Please wait and try again.' } } });
app.use('/api/tasks', aiLimiter, taskRoutes);
app.use('/api/summary', aiLimiter, summaryRoutes);
app.use('/api/health', healthRoutes);
app.use((_req, res) => res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Endpoint not found.' } }));
app.use(errorHandler);
