import { Router } from 'express';
import { postPrioritize } from '../controllers/taskController.js';
export const taskRoutes = Router();
taskRoutes.post('/prioritize', postPrioritize);
