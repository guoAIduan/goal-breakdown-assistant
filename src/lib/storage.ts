/**
 * 带命名空间的 localStorage 封装。
 * 所有写入都包在 try/catch 里：隐私模式或存储配额用尽时应用仍可正常使用。
 */
const PREFIX = 'gba:';

function resolveKey(key: string) {
  return `${PREFIX}${key}`;
}

export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(resolveKey(key));
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJSON(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(resolveKey(key), JSON.stringify(value));
  } catch {
    // 忽略写入失败（隐私模式 / 配额不足）
  }
}

export function removeKey(key: string): void {
  try {
    window.localStorage.removeItem(resolveKey(key));
  } catch {
    // 忽略
  }
}

/** 监听其他标签页对同一 key 的修改。 */
export function onStorageChange(key: string, handler: () => void): () => void {
  const listener = (event: StorageEvent) => {
    if (event.key === resolveKey(key)) handler();
  };
  window.addEventListener('storage', listener);
  return () => window.removeEventListener('storage', listener);
}

/** 简易发布订阅，用于把模块级 store 接到 React。 */
export function createEmitter() {
  const listeners = new Set<() => void>();
  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    emit() {
      for (const listener of listeners) listener();
    },
  };
}
