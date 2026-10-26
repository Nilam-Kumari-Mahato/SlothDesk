const priorityValues = new Set(['high', 'medium', 'low']);

function cleanString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeLevel(value, fallback) {
  const level = cleanString(value).toLowerCase();
  if (priorityValues.has(level)) return level;
  if (['critical', 'urgent', 'top', 'p1'].includes(level)) return 'high';
  if (['normal', 'moderate', 'p2'].includes(level)) return 'medium';
  if (['minor', 'p3'].includes(level)) return 'low';
  return fallback;
}

function normalizeDate(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  const date = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(`${date}T00:00:00Z`))) return date;
  if (/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:?\d{2})$/i.test(date) && !Number.isNaN(Date.parse(date))) return new Date(date).toISOString();
  return null;
}

export function normalizeTaskResult(value, sourceText = '') {
  const sourceTasks = Array.isArray(value) ? value : value?.tasks ?? value?.prioritizedTasks ?? value?.priorities;
  if (!Array.isArray(sourceTasks)) return value;
  const tasks = sourceTasks;
  let usedSourceTitle = false;
  const sourceTitles = typeof sourceText === 'string' ? sourceText.split(/[,;\n]+/).map((part) => part.trim()).filter(Boolean) : [];
  const normalizedTasks = tasks.map((item, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return item;
    const priority = normalizeLevel(item.priority ?? item.priorityLevel, 'medium');
    const rawDeadline = item.deadline ?? item.dueDate ?? null;
    const deadline = normalizeDate(rawDeadline);
    const deadlineText = cleanString(item.deadlineText ?? item.deadline_text)
      || (typeof rawDeadline === 'string' && !deadline ? rawDeadline.trim() : '')
      || null;
    const rawType = cleanString(item.deadlineType ?? item.deadline_type).toLowerCase();
    const deadlineType = ['explicit', 'suggested', 'none'].includes(rawType)
      ? rawType
      : deadlineText || deadline ? 'explicit' : 'none';
    let title = cleanString(item.title) || cleanString(item.task) || cleanString(item.name) || cleanString(item.description) || cleanString(item.action);
    if (!title && typeof sourceText === 'string' && sourceText.trim()) {
      title = sourceTitles[index] || sourceText.trim();
      usedSourceTitle = true;
    }
    if (title.length > 200) title = `${title.slice(0, 197).trimEnd()}...`;
    return {
      id: item.id == null || item.id === '' ? `task-${index + 1}` : String(item.id),
      title,
      priority,
      deadline,
      deadlineText,
      importance: normalizeLevel(item.importance, priority),
      urgency: normalizeLevel(item.urgency, priority),
      reason: cleanString(item.reason ?? item.explanation) || 'Tentative priority based on the information provided.',
      nextAction: cleanString(item.nextAction ?? item.next_action ?? item.nextStep),
      deadlineType,
    };
  });
  const summary = cleanString(value?.summary ?? value?.overview)
    || `${normalizedTasks.length} task${normalizedTasks.length === 1 ? '' : 's'} identified and sorted by priority.`;
  const clarifications = value?.clarifications ?? value?.questions ?? [];
  return {
    tasks: normalizedTasks,
    summary,
    clarifications: [
      ...(Array.isArray(clarifications) ? clarifications.filter((entry) => typeof entry === 'string') : []),
      ...(usedSourceTitle ? ['The AI omitted a task title; the displayed title uses wording from your input. Review this task.'] : []),
      ...(sourceTitles.length > normalizedTasks.length ? ['The input may contain more tasks than the AI returned; verify that the list is complete.'] : []),
    ],
  };
}

export function normalizeSummaryResult(value) {
  const mainIdea = cleanString(value?.mainIdea ?? value?.main_idea ?? value?.centralIdea);
  const summary = cleanString(value?.summary ?? value?.overview) || mainIdea;
  const rawPoints = value?.keyPoints ?? value?.key_points ?? value?.points ?? [];
  const rawDates = value?.datesAndDeadlines ?? value?.dates ?? value?.deadlines ?? [];
  const rawActions = value?.actionItems ?? value?.action_items ?? value?.actions ?? [];
  return {
    mainIdea: mainIdea || summary,
    summary,
    keyPoints: Array.isArray(rawPoints) ? rawPoints.map((point) => typeof point === 'string' ? point.trim() : '').filter(Boolean) : [],
    datesAndDeadlines: Array.isArray(rawDates) ? rawDates.map((entry) => {
      if (typeof entry === 'string') return { text: entry.trim(), date: null };
      if (!entry || typeof entry !== 'object') return null;
      const text = cleanString(entry.text ?? entry.label ?? entry.value);
      return text ? { text, date: normalizeDate(entry.date ?? entry.deadline) } : null;
    }).filter(Boolean) : [],
    actionItems: Array.isArray(rawActions) ? rawActions.map((entry) => {
      if (typeof entry === 'string') return { task: entry.trim(), deadline: null };
      if (!entry || typeof entry !== 'object') return null;
      const task = cleanString(entry.task ?? entry.text ?? entry.action ?? entry.title);
      return task ? { task, deadline: normalizeDate(entry.deadline ?? entry.date) } : null;
    }).filter(Boolean) : [],
  };
}
