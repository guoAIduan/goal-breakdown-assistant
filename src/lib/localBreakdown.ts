import { generateId, type IDifficulty, type IStep } from '@/data/breakdown';
import { MOCK_TEMPLATES } from '@/data/templates';

export interface LocalBreakdownResult {
  steps: IStep[];
  /** 命中内置模板时返回模板名，用于提示用户结果的来源。 */
  matchedTemplateTitle?: string;
  /** 命中模板时沿用模板自带的耗时 / 难度，比按步骤重算更贴近真实工作量。 */
  totalDuration?: string;
  overallDifficulty?: IDifficulty;
}

const TOKEN_STOPWORDS = new Set([
  '一个', '这个', '那个', '我们', '我的', '想要', '想要', '帮我', '如何', '怎么', '怎样', '计划', '目标', '准备', '开始', '进行', '完成',
]);

/** 中文按 2 字滑窗切词，英文/数字按单词切分，够用且不引入分词依赖。 */
function tokenize(text: string): string[] {
  const normalized = text.toLowerCase();
  const tokens = new Set<string>();

  for (const word of normalized.match(/[a-z0-9]+/g) ?? []) {
    if (word.length >= 2) tokens.add(word);
  }

  const cjk = normalized.replace(/[^\u4e00-\u9fa5]/g, ' ');
  for (const run of cjk.split(/\s+/)) {
    for (let i = 0; i < run.length - 1; i += 1) {
      const gram = run.slice(i, i + 2);
      if (!TOKEN_STOPWORDS.has(gram)) tokens.add(gram);
    }
    if (run.length >= 2) tokens.add(run);
  }

  return [...tokens];
}

function cloneSteps(steps: IStep[]): IStep[] {
  return steps.map((step, index) => ({
    ...step,
    id: generateId(),
    index: index + 1,
    subTasks: step.subTasks.map((subTask) => ({ ...subTask, id: generateId(), completed: false })),
    tools: [...step.tools],
  }));
}

function matchTemplate(goal: string) {
  const goalTokens = new Set(tokenize(goal));
  let best: {
    title: string;
    steps: IStep[];
    totalDuration: string;
    overallDifficulty: IDifficulty;
    score: number;
  } | null = null;

  for (const template of MOCK_TEMPLATES) {
    const bodyTokens = tokenize(
      [
        template.title,
        template.description,
        ...template.highlights,
        ...template.steps.flatMap((step) => [step.title, step.goal]),
      ].join(' '),
    );
    const titleTokens = tokenize(template.title);

    let score = 0;
    for (const token of goalTokens) {
      if (titleTokens.includes(token)) score += 3;
      else if (bodyTokens.includes(token)) score += 1;
    }

    if (score >= 3 && (!best || score > best.score)) {
      best = {
        title: template.title,
        steps: template.steps,
        totalDuration: template.totalDuration,
        overallDifficulty: template.overallDifficulty,
        score,
      };
    }
  }

  return best;
}

interface GenericStepSeed {
  title: string;
  goal: (goal: string) => string;
  subTasks: (goal: string) => string[];
  tools: string[];
  duration: string;
  difficulty: IDifficulty;
  deliverable: (goal: string) => string;
  tips: string;
}

const GENERIC_STEPS: GenericStepSeed[] = [
  {
    title: '明确目标与验收标准',
    goal: (goal) => `把「${goal}」变成一句可判断是否完成的话，并写清完成标准`,
    subTasks: (goal) => [
      `用一句话写清楚「${goal}」最终要达成的结果`,
      '写下 3 条可验证的完成标准（第三方也能判断是否达标）',
      '确定截止时间与每周可投入的时间',
      '列出已有的资源和限制条件',
    ],
    tools: ['飞书文档 / Notion', '思维导图'],
    duration: '1-2 小时',
    difficulty: 'easy',
    deliverable: () => '目标定义卡（目标 + 验收标准 + 时间盒）',
    tips: '验收标准要写到"别人也能判断"的程度，否则执行阶段会反复返工。',
  },
  {
    title: '拆解路径并排优先级',
    goal: () => '把达成目标需要做的事全部列出来，排成有先后顺序的清单',
    subTasks: () => [
      '列出达成目标必须做的 10 件事',
      '按"必须做 / 可以补"分类',
      '标注每件事的前置依赖关系',
      '排出先后顺序，标出关键路径',
    ],
    tools: ['白板 / 表格', '飞书多维表格'],
    duration: '2-3 小时',
    difficulty: 'medium',
    deliverable: () => '带依赖关系的任务清单',
    tips: '先找关键路径：把"卡住整体进度"的那件事排到最前面。',
  },
  {
    title: '准备资源与工具',
    goal: () => '把执行需要的人、工具、预算提前备齐',
    subTasks: () => [
      '列出所需的工具、资料和预算',
      '把缺失的工具注册或采购到位',
      '建好统一的文件与记录模板',
      '找到可以求助的人或社群',
    ],
    tools: ['清单工具', '日历提醒'],
    duration: '1-3 小时',
    difficulty: 'easy',
    deliverable: () => '资源就绪清单',
    tips: '10 分钟能解决的工具问题不要留到执行阶段，那会打断节奏。',
  },
  {
    title: '分阶段执行并记录',
    goal: () => '把计划落到每天的具体动作上，让进度看得见',
    subTasks: () => [
      '把方案切成这周就能完成的第一个小任务',
      '每天固定时间段推进 25-90 分钟',
      '完成后勾选并记录当天产出',
      '每周复盘一次进度与阻碍',
    ],
    tools: ['日历 / 番茄钟', '本页的进度勾选'],
    duration: '视目标规模，建议 10-20 小时',
    difficulty: 'hard',
    deliverable: () => '阶段性产出 + 每周进度记录',
    tips: '先完成再完美：每勾掉一个子任务，进度条前进一次，长周期才撑得住。',
  },
  {
    title: '复盘迭代并正式交付',
    goal: (goal) => `对照标准检查成果，交付「${goal}」并沉淀经验`,
    subTasks: () => [
      '对照验收标准逐条检查',
      '补齐差距和细节问题',
      '整理最终产出并交付 / 发布',
      '记录可复用的经验和下次改进点',
    ],
    tools: ['复盘模板', '文档归档'],
    duration: '2-4 小时',
    difficulty: 'medium',
    deliverable: () => '最终成果 + 复盘笔记',
    tips: '把这次踩过的坑写下来，下次做同类目标能省一半时间。',
  },
];

/**
 * 无需任何 API Key 的本地拆解：
 * 先按关键词匹配内置模板，匹配不到就用通用五步法，保证任何目标都有可用产出。
 */
export function generateLocalBreakdown(goal: string): LocalBreakdownResult {
  const matched = matchTemplate(goal);
  if (matched) {
    return {
      steps: cloneSteps(matched.steps),
      matchedTemplateTitle: matched.title,
      totalDuration: matched.totalDuration,
      overallDifficulty: matched.overallDifficulty,
    };
  }

  const steps: IStep[] = GENERIC_STEPS.map((seed, index) => ({
    id: generateId(),
    index: index + 1,
    title: seed.title,
    goal: seed.goal(goal),
    subTasks: seed.subTasks(goal).map((title) => ({ id: generateId(), title, completed: false })),
    tools: [...seed.tools],
    duration: seed.duration,
    difficulty: seed.difficulty,
    deliverable: seed.deliverable(goal),
    tips: seed.tips,
  }));

  return { steps };
}
