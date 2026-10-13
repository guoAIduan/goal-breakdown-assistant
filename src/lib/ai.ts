export interface AiConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

export class AiRequestError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'AiRequestError';
    this.status = status;
  }
}

export const BREAKDOWN_SYSTEM_PROMPT = [
  '你是一位专业的目标拆解教练，擅长把模糊目标变成可立刻执行的结构化步骤。',
  '你的输出必须是可以被程序直接解析的 JSON，不要输出任何解释性文字或 markdown 代码块以外的内容。',
].join('\n');

export function buildBreakdownPrompt(goal: string): string {
  return [
    `目标：${goal}`,
    '',
    '请把这个目标拆解为 4-8 个按执行顺序排列的步骤。',
    '只输出一个 JSON 数组，不要有任何额外说明。数组每一项的字段如下：',
    '{',
    '  "title": "步骤名称，8 字以内",',
    '  "goal": "这一步要达成的具体目标，一句话",',
    '  "subTasks": ["2-5 个具体可执行的动作"],',
    '  "tools": ["推荐使用的工具或资源"],',
    '  "duration": "耗时，例如 \\"2-3 小时\\"",',
    '  "difficulty": "easy | medium | hard",',
    '  "deliverable": "这一步完成后应产出的成果",',
    '  "tips": "一条实用建议或易踩的坑"',
    '}',
    '要求：内容具体可落地，避免空泛；步骤之间逻辑连贯，符合真实执行流程；使用中文。',
  ].join('\n');
}

function describeHttpError(status: number): string {
  switch (status) {
    case 400:
      return '请求被模型拒绝（400），请检查模型名称是否正确';
    case 401:
    case 403:
      return 'API Key 无效或没有访问权限，请重新填写';
    case 404:
      return '接口地址不存在（404），请检查 Base URL 是否需要以 /v1 结尾';
    case 429:
      return '请求过于频繁或额度已用尽（429），请稍后再试';
    default:
      return status >= 500 ? `模型服务暂时不可用（${status}）` : `请求失败（${status}）`;
  }
}

interface StreamOptions {
  signal?: AbortSignal;
  onDelta?: (delta: string) => void;
}

/**
 * 调用任意 OpenAI 兼容的 /chat/completions 接口，流式返回模型输出。
 * 不依赖任何平台 SDK，任何兼容服务（DeepSeek、OpenAI、通义、智谱等）都能直接使用。
 */
export async function streamBreakdown(
  goal: string,
  config: AiConfig,
  { signal, onDelta }: StreamOptions = {},
): Promise<string> {
  const endpoint = `${config.baseUrl.replace(/\/+$/, '')}/chat/completions`;

  const timeout = AbortSignal.timeout(180_000);
  const composed = signal ? AbortSignal.any([signal, timeout]) : timeout;

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        stream: true,
        temperature: 0.5,
        messages: [
          { role: 'system', content: BREAKDOWN_SYSTEM_PROMPT },
          { role: 'user', content: buildBreakdownPrompt(goal) },
        ],
      }),
      signal: composed,
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    if (error instanceof DOMException && error.name === 'TimeoutError') {
      throw new AiRequestError('模型响应超时，请稍后重试');
    }
    throw new AiRequestError('网络请求失败，请检查网络连接或接口地址');
  }

  if (!response.ok) {
    throw new AiRequestError(describeHttpError(response.status), response.status);
  }

  if (!response.body) {
    const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = data.choices?.[0]?.message?.content ?? '';
    if (content) onDelta?.(content);
    return content;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line.startsWith('data:')) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === '[DONE]') continue;

      try {
        const chunk = JSON.parse(payload) as {
          choices?: Array<{ delta?: { content?: string }; text?: string }>;
        };
        const delta = chunk.choices?.[0]?.delta?.content ?? chunk.choices?.[0]?.text ?? '';
        if (delta) {
          fullText += delta;
          onDelta?.(delta);
        }
      } catch {
        // 单个分片解析失败不影响整段输出
      }
    }
  }

  return fullText;
}
