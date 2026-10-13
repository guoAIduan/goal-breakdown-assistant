// EXPORTS: ISubTask, IStep, IBreakdownRecord, IUserTemplate, IDifficulty, calculateStepProgress, calculateOverallProgress, generateId

export type IDifficulty = 'easy' | 'medium' | 'hard';

export interface ISubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface IStep {
  id: string;
  index: number;
  title: string;
  goal: string;
  subTasks: ISubTask[];
  tools: string[];
  duration: string;
  difficulty: IDifficulty;
  deliverable: string;
  tips: string;
}

export interface IBreakdownRecord {
  id: string;
  title: string;
  source: 'ai' | 'template' | 'custom';
  templateId?: string;
  steps: IStep[];
  totalDuration: string;
  overallDifficulty: IDifficulty;
  progress: number;
  status: 'in_progress' | 'completed';
  createdAt: number;
  updatedAt: number;
}

export interface IUserTemplate {
  id: string;
  title: string;
  category: string;
  steps: IStep[];
  totalDuration: string;
  overallDifficulty: IDifficulty;
  highlights: string[];
  createdAt: number;
  updatedAt: number;
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function calculateStepProgress(step: IStep): number {
  if (step.subTasks.length === 0) return 0;
  const completed = step.subTasks.filter((s) => s.completed).length;
  return Math.round((completed / step.subTasks.length) * 100);
}

export function calculateOverallProgress(steps: IStep[]): number {
  if (steps.length === 0) return 0;
  const total = steps.reduce((sum, s) => sum + calculateStepProgress(s), 0);
  return Math.round(total / steps.length);
}
