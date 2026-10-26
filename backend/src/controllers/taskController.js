import { taskRequestSchema } from '../schemas/taskSchema.js';
import { prioritizeTasks } from '../services/taskService.js';

export async function postPrioritize(req, res, next) {
  try {
    const input = taskRequestSchema.parse(req.body);
    res.json(await prioritizeTasks(input.text, input.timezone));
  } catch (error) { next(error); }
}
