import { useState, memo } from 'react';
import { motion } from 'framer-motion';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import {
  ChevronDown,
  Clock,
  Target,
  Wrench,
  Package,
  Lightbulb,
  Check,
} from 'lucide-react';
import type { IStep } from '@/data/breakdown';
import { calculateStepProgress } from '@/data/breakdown';
import { DifficultyBadge } from '@/components/DifficultyBadge';
import { Checkbox } from '@/components/ui/checkbox';

interface StepCardProps {
  step: IStep;
  defaultExpanded?: boolean;
  onSubTaskToggle?: (stepId: string, subTaskId: string) => void;
  showIndex?: boolean;
  isLast?: boolean;
}

function StepCard({
  step,
  defaultExpanded = true,
  onSubTaskToggle,
  showIndex = true,
  isLast = false,
}: StepCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [parent] = useAutoAnimate({ duration: 250, easing: 'ease-in-out' });
  const progress = calculateStepProgress(step);

  return (
    <div className="relative">
      {/* Timeline connector */}
      {showIndex && !isLast && (
        <div className="absolute left-[22px] top-[60px] bottom-[-24px] w-0.5 bg-gradient-to-b from-primary/30 to-transparent" />
      )}

      <motion.div
        layout
        className="relative rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden"
        whileHover={{ y: -2 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        {/* Card header */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full p-5 flex items-start gap-4 text-left"
        >
          {/* Step number / dot */}
          {showIndex && (
            <div
              className={`shrink-0 size-11 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                progress === 100
                  ? 'bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-lg shadow-primary/30'
                  : progress > 0
                  ? 'bg-primary/15 text-primary border-2 border-primary/30'
                  : 'bg-muted text-muted-foreground border-2 border-border/50'
              }`}
            >
              {progress === 100 ? <Check className="size-5" /> : step.index}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-1.5">
              <h3 className="text-base font-semibold text-foreground leading-tight">
                {step.title}
              </h3>
              <motion.div
                animate={{ rotate: expanded ? 180 : 0 }}
                transition={{ duration: 0.25 }}
                className="shrink-0 text-muted-foreground"
              >
                <ChevronDown className="size-5" />
              </motion.div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="size-3.5" />
                {step.duration}
              </span>
              <DifficultyBadge difficulty={step.difficulty} />
              {step.subTasks.length > 0 && (
                <span className="text-primary font-medium">
                  {step.subTasks.filter((s) => s.completed).length}/{step.subTasks.length} 子任务
                </span>
              )}
            </div>
            {/* Progress bar */}
            {step.subTasks.length > 0 && (
              <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            )}
          </div>
        </button>

        {/* Expanded content */}
        <div ref={parent}>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-5 space-y-4 border-t border-border/40 pt-4">
                {/* Goal */}
                <div className="flex gap-3">
                  <div className="shrink-0 mt-0.5 size-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Target className="size-3.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-muted-foreground mb-0.5">目标</div>
                    <p className="text-sm text-foreground/90 leading-relaxed">{step.goal}</p>
                  </div>
                </div>

                {/* Sub-tasks */}
                {step.subTasks.length > 0 && (
                  <div className="flex gap-3">
                    <div className="shrink-0 mt-0.5 size-7 rounded-lg bg-secondary/50 flex items-center justify-center">
                      <Check className="size-3.5 text-secondary-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-muted-foreground mb-2">核心动作</div>
                      <ul className="space-y-2">
                        {step.subTasks.map((st) => (
                          <li key={st.id} className="flex items-start gap-2.5">
                            <Checkbox
                              id={`st-${st.id}`}
                              checked={st.completed}
                              onCheckedChange={() => onSubTaskToggle?.(step.id, st.id)}
                              className="mt-0.5 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                            />
                            <label
                              htmlFor={`st-${st.id}`}
                              className={`text-sm leading-relaxed cursor-pointer transition-colors ${
                                st.completed
                                  ? 'text-muted-foreground line-through'
                                  : 'text-foreground/90'
                              }`}
                            >
                              {st.title}
                            </label>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Tools */}
                {step.tools.length > 0 && (
                  <div className="flex gap-3">
                    <div className="shrink-0 mt-0.5 size-7 rounded-lg bg-amber-50 flex items-center justify-center">
                      <Wrench className="size-3.5 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-muted-foreground mb-1.5">推荐工具</div>
                      <div className="flex flex-wrap gap-1.5">
                        {step.tools.map((tool, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center px-2.5 py-1 rounded-md text-xs bg-muted text-foreground/70 font-medium"
                          >
                            {tool}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Deliverable */}
                <div className="flex gap-3">
                  <div className="shrink-0 mt-0.5 size-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <Package className="size-3.5 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-muted-foreground mb-0.5">产出物</div>
                    <p className="text-sm text-foreground/90">{step.deliverable}</p>
                  </div>
                </div>

                {/* Tips */}
                <div className="flex gap-3">
                  <div className="shrink-0 mt-0.5 size-7 rounded-lg bg-gradient-to-br from-primary/15 to-secondary/20 flex items-center justify-center">
                    <Lightbulb className="size-3.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-muted-foreground mb-0.5">小贴士</div>
                    <p className="text-sm text-foreground/80 leading-relaxed italic">{step.tips}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default memo(StepCard);
