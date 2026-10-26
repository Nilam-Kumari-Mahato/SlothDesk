import { taskResultSchema } from '../schemas/taskSchema.js';
import { parseModelJson } from '../utils/parseModelJson.js';
import { normalizeTaskResult } from '../utils/normalizeModelResults.js';
import { generateJson } from './gemmaService.js';

const instructions = `You extract and prioritize tasks. Return only JSON matching this shape: {"tasks":[{"id":"stable short id","title":"non-empty concise task title copied from the input","priority":"high|medium|low","deadline":"ISO datetime with timezone or null","deadlineText":"original wording or null","importance":"high|medium|low","urgency":"high|medium|low","reason":"brief plain-language rationale","nextAction":"practical action or empty string","deadlineType":"explicit|suggested|none"}],"summary":"short workload overview","clarifications":["questions about unresolved deadlines or importance"]}. Every task MUST have a non-empty title; never return an empty title. Split compound statements into separate tasks. Use the supplied timezone and current date/time context only to resolve clear relative deadlines; if uncertain, keep the original wording and use null. Never invent a deadline. Classify using urgency, importance and impact; do not mark everything high. deadlineType is explicit for user-stated deadlines and none when absent; do not make suggested deadlines. Mention uncertainty in clarifications. Sort high, medium, low, then earlier known deadline. No markdown.`;

export async function prioritizeTasks(text, timezone) {
  const now = new Date().toISOString();
  const input = JSON.stringify({ text, timezone: timezone || 'UTC', currentDateTime: now });
  const raw = await generateJson(instructions, input);
  const result = parseModelJson(raw, taskResultSchema, (value) => normalizeTaskResult(value, text));
  result.tasks.sort((a, b) => ({ high: 0, medium: 1, low: 2 })[a.priority] - ({ high: 0, medium: 1, low: 2 })[b.priority] || (Date.parse(a.deadline || '') || Infinity) - (Date.parse(b.deadline || '') || Infinity));
  return result;
}
