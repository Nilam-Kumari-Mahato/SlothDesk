import { GoogleGenAI } from '@google/genai';

export function getGemmaClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const error = new Error('AI service is not configured. Add GEMINI_API_KEY to backend/.env.');
    error.status = 503;
    error.code = 'AI_NOT_CONFIGURED';
    throw error;
  }
  return { client: new GoogleGenAI({ apiKey }), model: process.env.GEMMA_MODEL || 'gemma-4-26b-a4b-it' };
}
