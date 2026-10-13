// EXPORTS: DifficultyBadge
import { Badge } from '@/components/ui/badge';
import type { IDifficulty } from '@/data/breakdown';
import { difficultyLabel as getDifficultyLabel } from '@/lib/difficulty';

interface DifficultyBadgeProps {
  difficulty: IDifficulty;
}

export function DifficultyBadge({ difficulty }: DifficultyBadgeProps) {
  const label = getDifficultyLabel(difficulty);
  const variant =
    difficulty === 'easy'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50'
      : difficulty === 'medium'
      ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50'
      : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-50';
  return (
    <Badge variant="outline" className={`${variant} font-medium`}>
      {label}
    </Badge>
  );
}
