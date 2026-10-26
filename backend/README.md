# SlothDesk API

Express API for Gemma task prioritization and note summarization. The API key is read only by the backend and is never returned to clients.

## Configure and run (Windows PowerShell)

```powershell
cd .\backend
Copy-Item .env.example .env
notepad .env
npm install
npm run dev
```

Set `GEMINI_API_KEY` in `.env`. `GEMMA_MODEL` defaults to `gemma-4-26b-a4b-it`; `PORT` defaults to `5000`; `FRONTEND_URL` defaults to `http://localhost:5173`. Obtain the key from Google AI Studio. Never put it in a `VITE_` variable.

Run checks with `npm test`. Confirm the service is running at `http://localhost:5000/api/health`.

## Routes

- `POST /api/tasks/prioritize` — `{ "text": "...", "timezone": "Asia/Kolkata" }`
- `POST /api/summary/generate` — `{ "text": "...", "length": "short|balanced|detailed" }`
- `GET /api/health` — `{ "status": "ok" }`

The React client should POST JSON to these routes at `http://localhost:5000` (or the configured `VITE_API_BASE_URL`). Task response priorities are lowercase and task objects include `deadline`, `deadlineText`, `importance`, `urgency`, `reason`, `nextAction`, and `deadlineType`. Summary responses use `datesAndDeadlines` objects and `actionItems` objects, plus `summary`.

Input limits are 12,000 characters for tasks and 30,000 for summaries. AI endpoints allow 20 requests per IP per 15 minutes. CORS allows only the origins listed in `FRONTEND_URL`, separated by commas. The default allows both `http://localhost:5173` and `http://localhost:5174` because Vite may choose the next port when 5173 is occupied.

Gemma's supported model IDs can change; verify the configured model is available to the API key. The backend reports a specific configuration error for an unavailable model and will not fall back to a Gemini model.
