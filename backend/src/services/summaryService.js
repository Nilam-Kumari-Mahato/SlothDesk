import { summaryResultSchema } from '../schemas/summarySchema.js';
import { parseModelJson } from '../utils/parseModelJson.js';
import { normalizeSummaryResult } from '../utils/normalizeModelResults.js';
import { generateJson } from './gemmaService.js';

const instructions = `Summarize source text faithfully. Return only JSON matching {"mainIdea":"...","summary":"...","keyPoints":["..."],"datesAndDeadlines":[{"text":"verbatim date/deadline wording","date":"ISO datetime with timezone or null"}],"actionItems":[{"task":"action explicitly required","deadline":"ISO datetime with timezone or null"}]}. Preserve qualifications, names, dates, numbers, requirements and warnings; add no outside facts. Dates only normalize when unambiguous; otherwise date is null. Use empty arrays when none exist. Separate actions and decisions where evident. Length preference: `;

export async function summarizeText(text, length) {
  const raw = await generateJson(`${instructions}${length}.`, JSON.stringify({ text }));
  return parseModelJson(raw, summaryResultSchema, normalizeSummaryResult);
}
