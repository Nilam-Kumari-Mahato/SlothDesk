import { z } from 'zod';

const level = z.enum(['high', 'medium', 'low']);
export const taskRequestSchema = z.object({
  text: z.string().trim().min(1, 'Enter at least one task.').max(12000, 'Tasks must be 12,000 characters or fewer.'),
  timezone: z.string().trim().min(1).max(100).optional().refine((value) => {
    if (!value) return true;
    try { Intl.DateTimeFormat('en-US', { timeZone: value }); return true; } catch { return false; }
  }, 'Timezone must be a valid IANA timezone.'),
}).strict();

export const taskResultSchema = z.object({
  tasks: z.array(z.object({
    id: z.string().min(1).max(80), title: z.string().min(1).max(200), priority: level,
    deadline: z.union([z.string().datetime({ offset: true }), z.string().date()]).nullable(), deadlineText: z.string().max(200).nullable(),
    importance: level, urgency: level, reason: z.string().min(1).max(500), nextAction: z.string().max(300),
    deadlineType: z.enum(['explicit', 'suggested', 'none']),
  }).strict()).max(100),
  summary: z.string().max(500),
  clarifications: z.array(z.string().max(300)).max(30),
}).strict();
