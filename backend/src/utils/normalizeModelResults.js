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

function splitSourceTasks(text) {
  const action = '(?:submit|fix|read|send|write|review|call|email|finish|pay|schedule|prepare|update|complete|book|create|check|reply|meet|buy|file|renew|ask|plan|test|deploy|organize|study|present|discuss|confirm|launch|deliver|attend|research|draft|share|install|remove|cancel|follow)';
  return text.split(new RegExp(`[,;\\n]+|\\s+(?:and|then)\\s+(?=(?:to\\s+)?${action}\\b)`, 'i'))
    .map((part) => part.trim().replace(/^(?:and|then)\s+/i, '').replace(/[.!?]+$/, '').trim())
    .filter(Boolean);
}

function matchingTaskTitle(candidate, title) {
  const words = (value) => new Set(value.toLowerCase().match(/[a-z0-9]{3,}/g) || []);
  const candidateWords = words(candidate);
  const titleWords = words(title);
  if (!candidateWords.size || !titleWords.size) return false;
  let overlap = 0;
  for (const word of candidateWords) if (titleWords.has(word)) overlap += 1;
  return overlap / candidateWords.size >= 0.34;
}

export function normalizeTaskResult(value, sourceText = '') {
  const sourceTasks = Array.isArray(value) ? value : value?.tasks ?? value?.prioritizedTasks ?? value?.priorities;
  if (!Array.isArray(sourceTasks)) return value;
  const tasks = sourceTasks;
  let usedSourceTitle = false;
  const sourceTitles = typeof sourceText === 'string' ? splitSourceTasks(sourceText) : [];
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
  let recoveredTaskCount = 0;
  for (const sourceTitle of sourceTitles) {
    if (normalizedTasks.some((task) => task && typeof task.title === 'string' && matchingTaskTitle(sourceTitle, task.title))) continue;
    const index = normalizedTasks.length;
    const deadlineMatch = sourceTitle.match(/\b(?:today|tomorrow|tonight|this week|next week|by\s+(?:\w+\s+)?\w+|before\s+(?:\w+\s+)?\w+|on\s+(?:\w+\s+)?\w+)\b/i);
    normalizedTasks.push({
      id: `source-task-${index + 1}`,
      title: sourceTitle.length > 200 ? `${sourceTitle.slice(0, 197).trimEnd()}...` : sourceTitle,
      priority: 'medium',
      deadline: null,
      deadlineText: deadlineMatch?.[0] || null,
      importance: 'medium',
      urgency: 'medium',
      reason: 'Tentative Medium priority; the AI did not return a separate classification for this task.',
      nextAction: 'Review this task and choose its priority and next step.',
      deadlineType: deadlineMatch ? 'explicit' : 'none',
    });
    recoveredTaskCount += 1;
  }
  const summary = cleanString(value?.summary ?? value?.overview)
    || `${normalizedTasks.length} task${normalizedTasks.length === 1 ? '' : 's'} identified and sorted by priority.`;
  const clarifications = value?.clarifications ?? value?.questions ?? [];
  return {
    tasks: normalizedTasks,
    summary,
    clarifications: [
      ...(Array.isArray(clarifications) ? clarifications.filter((entry) => typeof entry === 'string') : []),
      ...(usedSourceTitle ? ['The AI omitted a task title; the displayed title uses wording from your input. Review this task.'] : []),
      ...(recoveredTaskCount ? [`${recoveredTaskCount} task${recoveredTaskCount === 1 ? ' was' : 's were'} preserved from your input without a separate AI classification. Review the tentative priorities.`] : []),
    ],
  };
}

export function normalizeSummaryResult(value) {
  if (Array.isArray(value) && value.length === 1 && value[0] && typeof value[0] === 'object' && !Array.isArray(value[0])) {
    return normalizeSummaryResult(value[0]);
  }
  if (typeof value === 'string' && value.trim()) {
    const text = value.trim();
    return {
      mainIdea: text.slice(0, 1200),
      summary: text.slice(0, 8000),
      keyPoints: [],
      datesAndDeadlines: [],
      actionItems: [],
    };
  }
  if (Array.isArray(value) && value.length && value.every((item) => typeof item === 'string')) {
    const points = value.map((item) => item.trim()).filter(Boolean);
    return {
      mainIdea: (points[0] || '').slice(0, 1200),
      summary: points.join(' ').slice(0, 8000),
      keyPoints: points.slice(0, 50).map((point) => point.slice(0, 1200)),
      datesAndDeadlines: [],
      actionItems: [],
    };
  }
  const rawPoints = value?.keyPoints ?? value?.key_points ?? value?.points ?? value?.bullets ?? [];
  const rawDates = value?.datesAndDeadlines ?? value?.dates_and_deadlines ?? value?.importantDates ?? value?.dates ?? value?.deadlines ?? [];
  const rawActions = value?.actionItems ?? value?.action_items ?? value?.todoItems ?? value?.actions ?? [];
  const keyPoints = Array.isArray(rawPoints)
    ? rawPoints.map((point) => typeof point === 'string' ? point.trim() : cleanString(point?.text ?? point?.point ?? point?.detail)).filter(Boolean)
    : [];
  const summary = cleanString(value?.summary ?? value?.overview) || keyPoints.join(' ');
  const mainIdea = cleanString(value?.mainIdea ?? value?.main_idea ?? value?.centralIdea ?? value?.headline) || summary;
  return {
    mainIdea: mainIdea || summary,
    summary,
    keyPoints,
    datesAndDeadlines: Array.isArray(rawDates) ? rawDates.map((entry) => {
      if (typeof entry === 'string') return { text: entry.trim(), date: null };
      if (!entry || typeof entry !== 'object') return null;
      const text = cleanString(entry.text ?? entry.label ?? entry.value ?? entry.description ?? entry.dateText ?? entry.date);
      return text ? { text, date: normalizeDate(entry.date ?? entry.deadline) } : null;
    }).filter(Boolean) : [],
    actionItems: Array.isArray(rawActions) ? rawActions.map((entry) => {
      if (typeof entry === 'string') return { task: entry.trim(), deadline: null };
      if (!entry || typeof entry !== 'object') return null;
      const task = cleanString(entry.task ?? entry.text ?? entry.action ?? entry.title ?? entry.description ?? entry.item);
      return task ? { task, deadline: normalizeDate(entry.deadline ?? entry.date) } : null;
    }).filter(Boolean) : [],
  };
}
