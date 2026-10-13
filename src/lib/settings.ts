import { createEmitter, readJSON, writeJSON } from '@/lib/storage';

export type BreakdownMode = 'local' | 'ai';

export interface AppSettings {
  /** local = 内置规则拆解（无需 Key）；ai = 调用自定义模型接口 */
  mode: BreakdownMode;
  baseUrl: string;
  apiKey: string;
  model: string;
}

export interface ProviderPreset {
  id: string;
  label: string;
  baseUrl: string;
  model: string;
  hint?: string;
}

export const PROVIDER_PRESETS: ProviderPreset[] = [
  { id: 'deepseek', label: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1', model: 'deepseek-chat' },
  { id: 'openai', label: 'OpenAI', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
  {
    id: 'dashscope',
    label: '通义千问（兼容模式）',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    model: 'qwen-plus',
  },
  {
    id: 'zhipu',
    label: '智谱 GLM',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    model: 'glm-4-flash',
  },
  { id: 'custom', label: '自定义接口', baseUrl: '', model: '' },
];

export const DEFAULT_SETTINGS: AppSettings = {
  mode: 'local',
  baseUrl: PROVIDER_PRESETS[0].baseUrl,
  apiKey: '',
  model: PROVIDER_PRESETS[0].model,
};

const STORAGE_KEY = 'settings';

const emitter = createEmitter();
let settings: AppSettings = DEFAULT_SETTINGS;
let hydrated = false;

function hydrate() {
  if (hydrated) return;
  hydrated = true;
  if (typeof window === 'undefined') return;
  settings = { ...DEFAULT_SETTINGS, ...readJSON<Partial<AppSettings>>(STORAGE_KEY, {}) };
}

/** 只要填了 Key 就视为可用 AI 模式。 */
export function resolveMode(value: AppSettings): BreakdownMode {
  return value.mode === 'ai' && value.apiKey.trim() !== '' ? 'ai' : 'local';
}

export const settingsStore = {
  subscribe(listener: () => void) {
    hydrate();
    return emitter.subscribe(listener);
  },
  getSnapshot(): AppSettings {
    hydrate();
    return settings;
  },
  update(patch: Partial<AppSettings>) {
    hydrate();
    settings = { ...settings, ...patch };
    writeJSON(STORAGE_KEY, settings);
    emitter.emit();
  },
  reset() {
    hydrate();
    settings = DEFAULT_SETTINGS;
    writeJSON(STORAGE_KEY, settings);
    emitter.emit();
  },
};
