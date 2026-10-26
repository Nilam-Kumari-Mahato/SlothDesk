import { AppError } from './errors.js';

export function parseModelJson(text, schema, normalize = (value) => value) {
  if (typeof text !== 'string' || !text.trim()) throw new AppError('The AI returned an empty response. Please try again.', 502, 'INVALID_MODEL_RESPONSE');
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  let value;
  try { value = JSON.parse(cleaned); } catch {
    throw new AppError('The AI returned an invalid response. Please try again.', 502, 'INVALID_MODEL_RESPONSE');
  }
  if (typeof value === 'string' && /^[\[{]/.test(value.trim())) {
    try { value = JSON.parse(value.trim()); } catch { /* Treat it as plain generated text and let its normalizer decide. */ }
  }
  let normalized;
  try { normalized = normalize(value); } catch {
    throw new AppError('The AI response did not match the expected format. Please try again.', 502, 'INVALID_MODEL_RESPONSE');
  }
  const parsed = schema.safeParse(normalized);
  if (!parsed.success) {
    console.warn('Gemma JSON validation failed', {
      issues: parsed.error.issues.slice(0, 12).map(({ path, code }) => ({ path: path.join('.'), code })),
      taskFields: Array.isArray(normalized?.tasks) ? normalized.tasks.slice(0, 5).map((task) => task && typeof task === 'object' ? Object.keys(task) : []) : undefined,
      modelFields: value && typeof value === 'object' && !Array.isArray(value) ? Object.keys(value).slice(0, 20) : undefined,
      modelType: value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value,
      modelArrayLength: Array.isArray(value) ? value.length : undefined,
      modelFieldTypes: value && typeof value === 'object' && !Array.isArray(value)
        ? Object.fromEntries(['mainIdea', 'main_idea', 'summary', 'overview', 'keyPoints', 'key_points', 'datesAndDeadlines', 'dates', 'actionItems', 'actions'].filter((key) => key in value).map((key) => [key, Array.isArray(value[key]) ? 'array' : typeof value[key]]))
        : undefined,
    });
    throw new AppError('The AI response did not match the expected format. Please try again.', 502, 'INVALID_MODEL_RESPONSE');
  }
  return parsed.data;
}
