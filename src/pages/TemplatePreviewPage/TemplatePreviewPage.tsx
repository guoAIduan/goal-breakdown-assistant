import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Target, Play } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { MOCK_TEMPLATES } from '@/data/templates';
import { DifficultyBadge } from '@/components/DifficultyBadge';
import StepCard from '@/components/StepCard';
import { useBreakdownStore } from '@/hooks/useBreakdownStore';
import {
  generateId,
  type IBreakdownRecord,
  type IStep,
} from '@/data/breakdown';

export default function TemplatePreviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addRecord } = useBreakdownStore();

  const template = useMemo(() => MOCK_TEMPLATES.find((t) => t.id === id), [id]);

  if (!template) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">模板不存在</p>
          <Button onClick={() => navigate('/templates')}>返回模板广场</Button>
        </div>
      </div>
    );
  }

  const handleUseTemplate = () => {
    // Deep copy steps with new IDs and reset completed status
    const steps: IStep[] = template.steps.map((s, i) => ({
      ...s,
      id: generateId(),
      index: i + 1,
      subTasks: s.subTasks.map((st) => ({
        ...st,
        id: generateId(),
        completed: false,
      })),
    }));

    const record: IBreakdownRecord = {
      id: generateId(),
      title: template.title,
      source: 'template',
      templateId: template.id,
      steps,
      totalDuration: template.totalDuration,
      overallDifficulty: template.overallDifficulty,
      progress: 0,
      status: 'in_progress',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    addRecord(record);
    toast.success('已添加到我的拆解');
    navigate(`/breakdown/${record.id}`);
  };

  return (
    <div className="min-h-screen pb-28">
      {/* Top bar */}
      <div className="sticky top-16 z-40 bg-background/70 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-4xl mx-auto px-4 md:px-6 h-14 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-4" />
            <span className="hidden sm:inline">返回</span>
          </button>
          <h1 className="text-sm font-medium text-foreground truncate flex-1 text-center pr-10">
            模板详情
          </h1>
        </div>
      </div>

      {/* Template header */}
      <div className="max-w-4xl mx-auto px-4 md:px-6 pt-6 md:pt-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-card to-secondary/10 border border-border/50 shadow-lg p-6 md:p-8"
        >
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/20 rounded-full blur-3xl opacity-40 pointer-events-none" />

          <div className="relative flex items-start gap-4 mb-5">
            <div className="size-16 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/30 flex items-center justify-center text-3xl shrink-0 shadow-inner">
              {template.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl md:text-2xl font-bold text-foreground mb-1">
                {template.title}
              </h2>
              <p className="text-sm text-muted-foreground">{template.description}</p>
            </div>
          </div>

          <div className="relative flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Target className="size-4 text-primary" />
              <span className="text-muted-foreground">共</span>
              <span className="font-semibold text-foreground">{template.steps.length} 步</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-primary" />
              <span className="text-muted-foreground">总耗时</span>
              <span className="font-semibold text-foreground">{template.totalDuration}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">难度</span>
              <DifficultyBadge difficulty={template.overallDifficulty} />
            </div>
          </div>

          <div className="relative mt-5 flex flex-wrap gap-1.5">
            {template.highlights.map((h) => (
              <span
                key={h}
                className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium"
              >
                {h}
              </span>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Steps preview */}
      <div className="max-w-4xl mx-auto px-4 md:px-6 pt-8 md:pt-10">
        <h3 className="text-lg font-semibold text-foreground mb-4">步骤预览</h3>
        <div className="space-y-5">
          {template.steps.map((step, i) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <StepCard
                step={{ ...step, subTasks: step.subTasks.map((st) => ({ ...st, completed: false })) }}
                isLast={i === template.steps.length - 1}
                defaultExpanded={i < 2}
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-xl border-t border-border/40">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-3">
          <Button
            onClick={handleUseTemplate}
            className="w-full h-12 rounded-xl text-base gap-2 shadow-lg shadow-primary/20"
          >
            <Play className="size-5" />
            使用此模板
          </Button>
        </div>
      </div>
    </div>
  );
}
