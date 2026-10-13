import type { IDifficulty } from '@/data/breakdown';

export const DIFFICULTY_LABELS: Record<IDifficulty, string> = {
  easy: '简单',
  medium: '中等',
  hard: '较难',
};

export function difficultyLabel(difficulty: IDifficulty): string {
  return DIFFICULTY_LABELS[difficulty];
}
