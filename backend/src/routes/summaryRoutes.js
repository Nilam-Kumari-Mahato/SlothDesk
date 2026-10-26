import { Router } from 'express';
import { postSummary } from '../controllers/summaryController.js';
export const summaryRoutes = Router();
summaryRoutes.post('/generate', postSummary);
