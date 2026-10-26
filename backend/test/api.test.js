import 'dotenv/config';
import test from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../src/app.js';
import { taskRequestSchema, taskResultSchema } from '../src/schemas/taskSchema.js';
import { summaryRequestSchema, summaryResultSchema } from '../src/schemas/summarySchema.js';
import { parseModelJson } from '../src/utils/parseModelJson.js';
import { normalizeTaskResult, normalizeSummaryResult } from '../src/utils/normalizeModelResults.js';

test('rejects empty input and invalid timezone; accepts task text', () => {
  assert.equal(taskRequestSchema.safeParse({ text: '  ' }).success, false);
  assert.equal(taskRequestSchema.safeParse({ text: 'Ship report', timezone: 'Mars/Cloud' }).success, false);
  assert.equal(taskRequestSchema.safeParse({ text: 'Ship report', timezone: 'Asia/Kolkata' }).success, true);
});

test('validates summary length and both model result shapes', () => {
  assert.equal(summaryRequestSchema.safeParse({ text: 'Notes', length: 'detailed' }).success, true);
  assert.equal(summaryRequestSchema.safeParse({ text: 'Notes', length: 'huge' }).success, false);
  assert.equal(taskResultSchema.safeParse({ tasks: [], summary: 'No tasks', clarifications: [] }).success, true);
  assert.equal(summaryResultSchema.safeParse({ mainIdea: 'Idea', summary: 'Summary', keyPoints: [], datesAndDeadlines: [], actionItems: [] }).success, true);
});

test('rejects malformed or schema-invalid model JSON', () => {
  assert.throws(() => parseModelJson('{bad json', summaryResultSchema), { code: 'INVALID_MODEL_RESPONSE' });
  assert.throws(() => parseModelJson('{"mainIdea":"missing rest"}', summaryResultSchema), { code: 'INVALID_MODEL_RESPONSE' });
  assert.throws(() => parseModelJson('{}', taskResultSchema, normalizeTaskResult), { code: 'INVALID_MODEL_RESPONSE' });
  const parsed = parseModelJson('```json\n{"mainIdea":"Idea","summary":"Text","keyPoints":[],"datesAndDeadlines":[],"actionItems":[]}\n```', summaryResultSchema);
  assert.equal(parsed.mainIdea, 'Idea');
});

test('normalizes common Gemma task and summary response variations before strict validation', () => {
  const task = normalizeTaskResult({
    tasks: [{ id: 1, title: '', priority: 'High', deadline: 'tomorrow', reason: 'Soon', nextAction: null }],
  }, 'Submit assignment tomorrow, fix login bug by Friday, and read API documentation this week.');
  assert.equal(taskResultSchema.safeParse(task).success, true);
  assert.equal(task.tasks.length, 3);
  assert.equal(task.tasks[0].id, '1');
  assert.equal(task.tasks[0].deadline, null);
  assert.equal(task.tasks[0].deadlineText, 'tomorrow');
  assert.equal(task.tasks[0].priority, 'high');
  assert.equal(task.tasks[1].priority, 'medium');
  assert.ok(task.clarifications.some((entry) => entry.includes('preserved from your input')));

  const missingTitle = normalizeTaskResult({ tasks: [{ title: '', priority: 'medium' }] }, 'Fix login bug tomorrow');
  assert.equal(taskResultSchema.safeParse(missingTitle).success, true);
  assert.equal(missingTitle.tasks[0].title, 'Fix login bug tomorrow');
  assert.equal(missingTitle.clarifications.length, 1);

  const summary = normalizeSummaryResult({
    overview: 'The key message.', bullets: [{ point: 'The team approved the plan.' }],
    importantDates: [{ description: 'Review due by Friday' }], todoItems: [{ description: 'Submit the form' }],
  });
  assert.equal(summaryResultSchema.safeParse(summary).success, true);
  assert.deepEqual(summary.keyPoints, ['The team approved the plan.']);
  assert.deepEqual(summary.datesAndDeadlines, [{ text: 'Review due by Friday', date: null }]);
  assert.deepEqual(summary.actionItems, [{ task: 'Submit the form', deadline: null }]);

  const textSummary = parseModelJson('"A concise summary returned as plain JSON text."', summaryResultSchema, normalizeSummaryResult);
  assert.equal(textSummary.summary, 'A concise summary returned as plain JSON text.');
  assert.deepEqual(textSummary.actionItems, []);
  const nestedSummary = parseModelJson('"{\\"mainIdea\\":\\"A plan was approved.\\",\\"summary\\":\\"The plan was approved.\\",\\"keyPoints\\":[],\\"datesAndDeadlines\\":[],\\"actionItems\\":[]}"', summaryResultSchema, normalizeSummaryResult);
  assert.equal(nestedSummary.mainIdea, 'A plan was approved.');
  const wrappedSummary = normalizeSummaryResult([{ mainIdea: 'A report is due.', summary: 'Submit the report by Friday.', keyPoints: [], datesAndDeadlines: [], actionItems: [] }]);
  assert.equal(summaryResultSchema.safeParse(wrappedSummary).success, true);
});

test('health endpoint is public and does not expose configuration', async (t) => {
  const server = app.listen(0, '127.0.0.1');
  t.after(() => server.close());
  await new Promise((resolve) => server.once('listening', resolve));
  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/api/health`, { headers: { origin: 'http://localhost:5173' } });
  assert.equal(response.headers.get('access-control-allow-origin'), 'http://localhost:5173');
  assert.deepEqual(await response.json(), { status: 'ok' });

  const secondPortResponse = await fetch(`http://127.0.0.1:${port}/api/health`, { headers: { origin: 'http://localhost:5174' } });
  assert.equal(secondPortResponse.headers.get('access-control-allow-origin'), 'http://localhost:5174');
  const preflight = await fetch(`http://127.0.0.1:${port}/api/tasks/prioritize`, {
    method: 'OPTIONS',
    headers: { origin: 'http://localhost:5174', 'access-control-request-method': 'POST', 'access-control-request-headers': 'content-type' },
  });
  assert.equal(preflight.headers.get('access-control-allow-origin'), 'http://localhost:5174');
  const disallowedOriginResponse = await fetch(`http://127.0.0.1:${port}/api/health`, { headers: { origin: 'http://localhost:5175' } });
  assert.equal(disallowedOriginResponse.headers.get('access-control-allow-origin'), null);
});

test('validation errors are safe and missing API key is reported as configuration error', async (t) => {
  const priorKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  const server = app.listen(0, '127.0.0.1');
  t.after(() => { server.close(); if (priorKey !== undefined) process.env.GEMINI_API_KEY = priorKey; });
  await new Promise((resolve) => server.once('listening', resolve));
  const { port } = server.address();
  const empty = await fetch(`http://127.0.0.1:${port}/api/tasks/prioritize`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text: '  ' }) });
  assert.equal(empty.status, 400);
  const configured = await fetch(`http://127.0.0.1:${port}/api/tasks/prioritize`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text: 'Task tomorrow' }) });
  assert.equal(configured.status, 503);
  assert.equal((await configured.json()).error.code, 'AI_NOT_CONFIGURED');
});

test('rate limits AI routes', async (t) => {
  const priorKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  const server = app.listen(0, '127.0.0.1');
  t.after(() => { server.close(); if (priorKey !== undefined) process.env.GEMINI_API_KEY = priorKey; });
  await new Promise((resolve) => server.once('listening', resolve));
  const { port } = server.address();
  let lastResponse;
  for (let i = 0; i < 25; i += 1) {
    lastResponse = await fetch(`http://127.0.0.1:${port}/api/tasks/prioritize`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text: 'A task' }),
    });
  }
  assert.equal(lastResponse.status, 429);
  assert.equal((await lastResponse.json()).error.code, 'RATE_LIMITED');
});
