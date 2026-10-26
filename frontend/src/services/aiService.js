const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '');

async function post(path, body) {
    let response;
    try {
        response = await fetch(`${API_BASE_URL}${path}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        });
    } catch {
        throw new Error('Could not reach SlothDesk. Check that the backend is running and try again.');
    }
    const payload = await response.json().catch(() => null);
    if (!response.ok) throw new Error(payload?.error?.message || 'The request could not be completed. Please try again.');
    return payload;
}

export async function prioritizeTasks(text, timezone = Intl.DateTimeFormat().resolvedOptions().timeZone) {
    const data = await post('/api/tasks/prioritize', { text, timezone });
    return data.tasks.map((task) => ({
        ...task,
        priority: task.priority[0].toUpperCase() + task.priority.slice(1),
        deadline: task.deadlineText || (task.deadline ? new Date(task.deadline).toLocaleString() : ''),
    }));
}

export async function summarizeText(text, length = 'balanced') {
    const data = await post('/api/summary/generate', { text, length });
    return {
        ...data,
        dates: data.datesAndDeadlines.map(({ text: label, date }) => ({
            label: 'Mentioned', value: date ? `${label} (${new Date(date).toLocaleString()})` : label,
        })),
        actionItems: data.actionItems.map(({ task, deadline }) => deadline ? `${task} (${new Date(deadline).toLocaleString()})` : task),
    };
}