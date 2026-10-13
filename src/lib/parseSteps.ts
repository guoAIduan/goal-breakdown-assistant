import { generateId, type IDifficulty, type IStep, type ISubTask } from '@/data/breakdown';

/**
 * 把模型返回的文本解析成结构化步骤。
 *
 * 优先按 JSON 解析（新版提示词要求模型输出 JSON），失败时回退到
 * 兼容 markdown 标题 / 列表的自然语言解析，避免模型"自由发挥"导致页面空白。
 */
export function parseStepsFromText(text: string): IStep[] {
  const fromJson = parseStepsFromJson(text);
  if (fromJson.length > 0) return fromJson;
  return parseStepsFromMarkdown(text);
}

/* ------------------------------------------------------------------ */
/* JSON 解析                                                           */
/* ------------------------------------------------------------------ */

function stripCodeFence(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return fenced ? fenced[1] : text;
}

function parseStepsFromJson(text: string): IStep[] {
  const cleaned = stripCodeFence(text).trim();
  const candidates: string[] = [];

  const arrayStart = cleaned.indexOf('[');
  const arrayEnd = cleaned.lastIndexOf(']');
  if (arrayStart !== -1 && arrayEnd > arrayStart) candidates.push(cleaned.slice(arrayStart, arrayEnd + 1));

  const objectStart = cleaned.indexOf('{');
  const objectEnd = cleaned.lastIndexOf('}');
  if (objectStart !== -1 && objectEnd > objectStart) candidates.push(cleaned.slice(objectStart, objectEnd + 1));

  for (const candidate of candidates) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(candidate);
    } catch {
      continue;
    }

    const rawList = Array.isArray(parsed)
      ? parsed
      : Array.isArray((parsed as { steps?: unknown }).steps)
        ? (parsed as { steps: unknown[] }).steps
        : Array.isArray((parsed as { 步骤?: unknown }).步骤)
          ? (parsed as { 步骤: unknown[] }).步骤
          : null;

    if (!rawList) continue;

    const steps = rawList
      .map((item, index) => normalizeStep(item, index + 1))
      .filter((step): step is IStep => step !== null);

    if (steps.length > 0) return reindex(steps);
  }

  return [];
}

function asString(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
}

function pickString(source: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = asString(source[key]);
    if (value) return value;
  }
  return '';
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => asString(item)).filter(Boolean);
  }
  const text = asString(value);
  if (!text) return [];
  return text
    .split(/[,，、;；/|]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

const DIFFICULTY_PATTERNS: Array<[IDifficulty, RegExp]> = [
  ['easy', /^(简单|容易|易|轻松|easy|low)$/i],
  ['medium', /^(中等|一般|适中|medium|normal|mid)$/i],
  ['hard', /^(困难|较难|难|高|hard|high|difficult)$/i],
];

export function normalizeDifficulty(value: unknown): IDifficulty {
  const text = asString(value);
  for (const [level, pattern] of DIFFICULTY_PATTERNS) {
    if (pattern.test(text)) return level;
  }
  if (/简单|容易|轻松/i.test(text)) return 'easy';
  if (/较难|困难|很难|挑战/i.test(text)) return 'hard';
  return 'medium';
}

function normalizeSubTasks(value: unknown): ISubTask[] {
  if (!Array.isArray(value)) {
    return asStringArray(value).map((title) => ({ id: generateId(), title, completed: false }));
  }
  return value
    .map((item) => {
      if (typeof item === 'string') return item.trim();
      if (item && typeof item === 'object') {
        const record = item as Record<string, unknown>;
        return pickString(record, ['title', 'name', 'text', 'content', '子任务', '动作', '描述']);
      }
      return '';
    })
    .filter(Boolean)
    .map((title) => ({ id: generateId(), title, completed: false }));
}

function normalizeStep(raw: unknown, index: number): IStep | null {
  if (typeof raw === 'string') {
    const title = raw.trim();
    return title ? buildStep(title, {}, index) : null;
  }
  if (!raw || typeof raw !== 'object') return null;

  const record = raw as Record<string, unknown>;
  const title = pickString(record, ['title', 'name', 'step', '步骤名称', '步骤', '标题']);
  if (!title) return null;
  return buildStep(title, record, index);
}

function buildStep(title: string, record: Record<string, unknown>, index: number): IStep {
  const subTasks = normalizeSubTasks(
    record.subTasks ?? record.subtasks ?? record.sub_tasks ?? record.子任务 ?? record.核心动作 ?? record.actions,
  );
  const tools = asStringArray(
    record.tools ?? record.tool ?? record.工具 ?? record.推荐工具 ?? record.所需工具,
  );

  return {
    id: generateId(),
    index,
    title,
    goal: pickString(record, ['goal', 'objective', 'description', '目标', '描述']) || title,
    subTasks,
    tools,
    duration: pickString(record, ['duration', 'time', 'estimatedTime', '耗时', '预计耗时', '预估耗时']) || '待定',
    difficulty: normalizeDifficulty(record.difficulty ?? record.level ?? record.难度),
    deliverable: pickString(record, ['deliverable', 'output', 'result', '产出物', '产出', '成果']),
    tips: pickString(record, ['tips', 'tip', 'advice', 'note', '小贴士', '贴士', '提示', '建议']),
  };
}

/* ------------------------------------------------------------------ */
/* markdown / 自然语言解析（回退路径）                                  */
/* ------------------------------------------------------------------ */

const STEP_HEADING = /^(?:#{1,4}\s*)?(?:\*\*)?(?:步骤|step)\s*([0-9一二三四五六七八九十]+)\s*[:：.、\s-]*(.*?)(?:\*\*)?$/i;
const NUMBERED_HEADING = /^(?:#{1,4}\s*)?(?:\*\*)?(\d{1,2})\s*[.、)]\s*(.+?)(?:\*\*)?$/;
const SECTION_LINE =
  /^(?:[-*•·]\s*)?(?:\*\*)?(目标|子任务|核心动作|关键动作|推荐工具|所需工具|工具|资源|耗时|预计耗时|预估耗时|难度|产出物|产出|成果|小贴士|贴士|提示|建议)(?:\*\*)?\s*[:：]\s*(.*)$/i;
const BULLET = /^(?:[-*•·]|\d+[.、)])\s*(.+)$/;

function parseStepsFromMarkdown(text: string): IStep[] {
  const lines = text.split('\n');
  const steps: Partial<IStep>[] = [];
  let current: Partial<IStep> | null = null;
  let section = '';
  let inFence = false;

  const flush = () => {
    if (current?.title) steps.push(current);
    current = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line.startsWith('```')) {
      inFence = !inFence;
      continue;
    }
    if (inFence || !line) continue;

    const stepMatch = line.match(STEP_HEADING) ?? line.match(NUMBERED_HEADING);
    if (stepMatch) {
      const title = (stepMatch[2] ?? '').trim();
      if (title && !SECTION_LINE.test(title) && title.length <= 40) {
        flush();
        current = {
          id: generateId(),
          title,
          goal: '',
          subTasks: [],
          tools: [],
          duration: '',
          difficulty: 'medium',
          deliverable: '',
          tips: '',
        };
        section = '';
        continue;
      }
    }

    if (!current) continue;

    const sectionMatch = line.match(SECTION_LINE);
    if (sectionMatch) {
      section = sectionMatch[1];
      const rest = sectionMatch[2]?.trim();
      if (rest) applySection(current, section, rest, false);
      continue;
    }

    const bullet = line.match(BULLET);
    if (bullet) {
      applySection(current, section, bullet[1].trim(), true);
      continue;
    }

    if (section) applySection(current, section, line, false);
  }

  flush();
  return reindex(
    steps
      .filter((step): step is Partial<IStep> & { title: string } => Boolean(step.title))
      .map((step, index) => ({
        id: step.id ?? generateId(),
        index: index + 1,
        title: step.title,
        goal: step.goal?.trim() || step.title,
        subTasks: step.subTasks ?? [],
        tools: step.tools ?? [],
        duration: step.duration?.trim() || '待定',
        difficulty: (step.difficulty ?? 'medium') as IDifficulty,
        deliverable: step.deliverable?.trim() ?? '',
        tips: step.tips?.trim() ?? '',
      })),
  );
}

function applySection(step: Partial<IStep>, section: string, text: string, isListItem: boolean) {
  const value = text.trim();
  if (!value) return;
  const append = (current: string | undefined) => (current ? `${current} ${value}` : value);

  switch (section) {
    case '目标':
      step.goal = append(step.goal);
      break;
    case '子任务':
    case '核心动作':
    case '关键动作':
      if (isListItem || value.length < 60) {
        step.subTasks = [...(step.subTasks ?? []), { id: generateId(), title: value, completed: false }];
      }
      break;
    case '推荐工具':
    case '所需工具':
    case '工具':
    case '资源': {
      const tools = isListItem
        ? [value]
        : value.split(/[,，、;/]/).map((item) => item.trim()).filter(Boolean);
      step.tools = [...(step.tools ?? []), ...tools];
      break;
    }
    case '耗时':
    case '预计耗时':
    case '预估耗时':
      step.duration = value;
      break;
    case '难度':
      step.difficulty = normalizeDifficulty(value);
      break;
    case '产出物':
    case '产出':
    case '成果':
      step.deliverable = append(step.deliverable);
      break;
    case '小贴士':
    case '贴士':
    case '提示':
    case '建议':
      step.tips = append(step.tips);
      break;
  }
}

/* ------------------------------------------------------------------ */
/* 汇总工具                                                            */
/* ------------------------------------------------------------------ */

function reindex(steps: IStep[]): IStep[] {
  return steps.map((step, index) => ({ ...step, index: index + 1 }));
}

const DURATION_UNITS: Array<[RegExp, number]> = [
  [/(分钟|min|mins|minute|minutes)/i, 1],
  [/(小时|时|hour|hours|hrs?|h)\b/i, 60],
  [/(天|day|days)/i, 8 * 60],
  [/(周|星期|week|weeks|个月|月|month|months)/i, 5 * 8 * 60],
];

function toMinutes(value: number, unit: string): number {
  for (const [pattern, factor] of DURATION_UNITS) {
    if (pattern.test(unit)) return value * factor;
  }
  return value * 60;
}

/** 粗略汇总各步骤耗时，用于概览卡片展示。 */
export function sumDurationText(steps: IStep[]): string {
  let totalMinutes = 0;
  let matched = 0;

  for (const step of steps) {
    const range = step.duration.match(
      /(\d+(?:\.\d+)?)\s*[-~～至到]\s*(\d+(?:\.\d+)?)\s*(分钟|小时|时|天|周|星期|个月|月|min|mins|minute|minutes|hour|hours|hrs?|h|day|days|week|weeks|month|months)/i,
    );
    const single = step.duration.match(
      /(\d+(?:\.\d+)?)\s*(分钟|小时|时|天|周|星期|个月|月|min|mins|minute|minutes|hour|hours|hrs?|h|day|days|week|weeks|month|months)/i,
    );

    if (range) {
      totalMinutes += (toMinutes(Number(range[1]), range[3]) + toMinutes(Number(range[2]), range[3])) / 2;
      matched += 1;
    } else if (single) {
      totalMinutes += toMinutes(Number(single[1]), single[2]);
      matched += 1;
    }
  }

  if (matched === 0 || totalMinutes <= 0) return `共 ${steps.length} 步`;
  if (totalMinutes < 60) return `约 ${Math.round(totalMinutes)} 分钟`;
  if (totalMinutes < 8 * 60) return `约 ${(totalMinutes / 60).toFixed(1).replace(/\.0$/, '')} 小时`;
  const days = totalMinutes / (8 * 60);
  return `约 ${days.toFixed(1).replace(/\.0$/, '')} 天工作量`;
}

/** 按步骤难度加权得到整体难度。 */
export function overallDifficultyOf(steps: IStep[]): IDifficulty {
  if (steps.length === 0) return 'medium';
  const weights: Record<IDifficulty, number> = { easy: 1, medium: 2, hard: 3 };
  const average = steps.reduce((sum, step) => sum + weights[step.difficulty], 0) / steps.length;
  if (average <= 1.4) return 'easy';
  if (average <= 2.3) return 'medium';
  return 'hard';
}
