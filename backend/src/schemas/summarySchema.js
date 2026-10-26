import { z } from 'zod';

export const summaryRequestSchema = z.object({
  text: z.string().trim().min(1, 'Paste text to summarize.').max(30000, 'Text must be 30,000 characters or fewer.'),
  length: z.enum(['short', 'balanced', 'detailed']).default('balanced'),
}).strict();

export const summaryResultSchema = z.object({
  mainIdea: z.string().min(1).max(1200), summary: z.string().min(1).max(8000),
  keyPoints: z.array(z.string().min(1).max(1200)).max(50),
  datesAndDeadlines: z.array(z.object({ text: z.string().min(1).max(300), date: z.union([z.string().datetime({ offset: true }), z.string().date()]).nullable() }).strict()).max(50),
  actionItems: z.array(z.object({ task: z.string().min(1).max(1000), deadline: z.union([z.string().datetime({ offset: true }), z.string().date()]).nullable() }).strict()).max(50),
}).strict();
