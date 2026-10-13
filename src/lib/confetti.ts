export interface ConfettiPiece {
  id: number;
  delay: number;
  left: number;
  color: string;
  duration: number;
  size: number;
  rotateEnd: number;
  xDrift: number;
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  '#f472b6',
  '#a78bfa',
  '#60a5fa',
  '#34d399',
  '#fbbf24',
];

/** 可复现的伪随机数生成器：同一个 seed 永远得到同一组彩带。 */
function mulberry32(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * 由 seed 纯函数式地算出彩带参数。
 * 渲染期不做随机取值，保证组件可重复渲染、结果稳定。
 */
export function createConfetti(seed: number, count = 50): ConfettiPiece[] {
  const random = mulberry32(Math.floor(seed) || 1);
  return Array.from({ length: count }, (_, index) => ({
    id: index,
    delay: random() * 0.8,
    left: random() * 100,
    color: COLORS[Math.floor(random() * COLORS.length)],
    duration: 3 + random() * 2,
    size: 6 + random() * 8,
    rotateEnd: random() * 720 - 360,
    xDrift: random() * 200 - 100,
  }));
}
