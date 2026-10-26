import { summaryRequestSchema } from '../schemas/summarySchema.js';
import { summarizeText } from '../services/summaryService.js';

export async function postSummary(req, res, next) {
  try {
    const input = summaryRequestSchema.parse(req.body);
    res.json(await summarizeText(input.text, input.length));
  } catch (error) { next(error); }
}
