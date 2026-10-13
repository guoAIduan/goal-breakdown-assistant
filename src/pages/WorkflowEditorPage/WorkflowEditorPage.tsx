import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Save,
  Target,
  Lightbulb,
  Package,
  Wrench,
  Settings,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useMyTemplatesStore } from '@/hooks/useBreakdownStore';
import { overallDifficultyOf, sumDurationText } from '@/lib/parseSteps';
import {
  generateId,
  type IStep,
  type IDifficulty,
  type IUserTemplate,
} from '@/data/breakdown';

function createEmptyStep(index: number): IStep {
  return {
    id: generateId(),
    index,
    title: '',
    goal: '',
    subTasks: [],
    tools: [],
    duration: '',
    difficulty: 'medium',
    deliverable: '',
    tips: '',
  };
}

export default function WorkflowEditorPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { templateId?: string; mode?: 'edit' | 'use' } | null;
  const { templates, addTemplate, updateTemplate } = useMyTemplatesStore();

  const editingId = state?.templateId || null;
  const mode = state?.mode || 'new';
  const editingTemplate = editingId ? templates.find((t) => t.id === editingId) : null;

  // 编辑已有模板时直接用它初始化表单（store 在首次渲染前已完成本地数据读取），
  // 避免"先渲染空表单、再在 effect 里回填"造成的闪烁。
  const isEditing = mode === 'edit' && Boolean(editingTemplate);
  const [title, setTitle] = useState(() => (isEditing ? editingTemplate!.title : ''));
  const [category, setCategory] = useState(() => (isEditing ? editingTemplate!.category : '自定义'));
  const [steps, setSteps] = useState<IStep[]>(() =>
    isEditing ? editingTemplate!.steps.map((step, index) => ({ ...step, index: index + 1 })) : [],
  );
  const [highlights, setHighlights] = useState<string[]>(() =>
    isEditing ? editingTemplate!.highlights : [],
  );
  const [highlightInput, setHighlightInput] = useState('');

  const addStep = () => {
    const newStep = createEmptyStep(steps.length + 1);
    setSteps([...steps, newStep]);
  };

  const updateStep = (id: string, updates: Partial<IStep>) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    );
  };

  const deleteStep = (id: string) => {
    setSteps((prev) =>
      prev.filter((s) => s.id !== id).map((s, i) => ({ ...s, index: i + 1 })),
    );
  };

  const moveStep = (id: string, direction: 'up' | 'down') => {
    const idx = steps.findIndex((s) => s.id === id);
    if (idx === -1) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === steps.length - 1) return;

    const newSteps = [...steps];
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    [newSteps[idx], newSteps[swapIdx]] = [newSteps[swapIdx], newSteps[idx]];
    newSteps.forEach((s, i) => (s.index = i + 1));
    setSteps(newSteps);
  };

  const addSubTask = (stepId: string) => {
    setSteps((prev) =>
      prev.map((s) =>
        s.id === stepId
          ? {
              ...s,
              subTasks: [
                ...s.subTasks,
                { id: generateId(), title: '', completed: false },
              ],
            }
          : s,
      ),
    );
  };

  const updateSubTask = (stepId: string, subId: string, title: string) => {
    setSteps((prev) =>
      prev.map((s) =>
        s.id === stepId
          ? {
              ...s,
              subTasks: s.subTasks.map((st) =>
                st.id === subId ? { ...st, title } : st,
              ),
            }
          : s,
      ),
    );
  };

  const deleteSubTask = (stepId: string, subId: string) => {
    setSteps((prev) =>
      prev.map((s) =>
        s.id === stepId
          ? { ...s, subTasks: s.subTasks.filter((st) => st.id !== subId) }
          : s,
      ),
    );
  };

  const addTool = (stepId: string) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === stepId ? { ...s, tools: [...s.tools, ''] } : s)),
    );
  };

  const updateTool = (stepId: string, idx: number, value: string) => {
    setSteps((prev) =>
      prev.map((s) => {
        if (s.id !== stepId) return s;
        const newTools = [...s.tools];
        newTools[idx] = value;
        return { ...s, tools: newTools };
      }),
    );
  };

  const deleteTool = (stepId: string, idx: number) => {
    setSteps((prev) =>
      prev.map((s) =>
        s.id === stepId ? { ...s, tools: s.tools.filter((_, i) => i !== idx) } : s,
      ),
    );
  };

  const addHighlight = () => {
    const v = highlightInput.trim();
    if (!v) return;
    if (highlights.length >= 5) {
      toast.info('最多添加5个亮点标签');
      return;
    }
    setHighlights([...highlights, v]);
    setHighlightInput('');
  };

  const removeHighlight = (idx: number) => {
    setHighlights(highlights.filter((_, i) => i !== idx));
  };

  const validateAndSave = (): { valid: boolean; template?: IUserTemplate } => {
    if (!title.trim()) {
      toast.error('请填写模板名称');
      return { valid: false };
    }
    if (steps.length === 0) {
      toast.error('至少添加一个步骤');
      return { valid: false };
    }
    const emptyStep = steps.find((s) => !s.title.trim());
    if (emptyStep) {
      toast.error(`第 ${emptyStep.index} 步请填写步骤名称`);
      return { valid: false };
    }

    // Filter out empty sub-tasks and tools
    const cleanedSteps = steps.map((s) => ({
      ...s,
      subTasks: s.subTasks.filter((st) => st.title.trim()),
      tools: s.tools.filter((t) => t.trim()),
    }));

    const totalDuration = sumDurationText(cleanedSteps);
    const overallDifficulty = overallDifficultyOf(cleanedSteps);

    const template: IUserTemplate = {
      id: editingId || generateId(),
      title: title.trim(),
      category,
      steps: cleanedSteps,
      totalDuration,
      overallDifficulty,
      highlights,
      createdAt: editingTemplate?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    return { valid: true, template };
  };

  const handleSave = () => {
    const { valid, template } = validateAndSave();
    if (!valid || !template) return;

    if (mode === 'edit' && editingId) {
      updateTemplate(editingId, template);
      toast.success('模板已更新');
    } else {
      addTemplate(template);
      toast.success('模板已保存');
    }
    navigate('/my');
  };

  return (
    <div className="min-h-screen pb-28">
      {/* Top bar */}
      <div className="sticky top-16 z-40 bg-background/70 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-4xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-4" />
            <span className="hidden sm:inline">返回</span>
          </button>
          <h1 className="text-sm font-medium text-foreground truncate flex-1 text-center">
            {mode === 'edit' ? '编辑模板' : '新建模板'}
          </h1>
          <div className="w-12" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 pt-6 md:pt-8 space-y-6">
        {/* Basic info */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-2xl bg-card border border-border/50 p-5 space-y-4"
        >
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Settings className="size-5 text-primary" />
            基本信息
          </h2>
          <div className="space-y-3">
            <div>
              <Label>模板名称</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例如：我的周末学习计划"
                className="mt-1.5"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>分类</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AI创作">AI 创作</SelectItem>
                    <SelectItem value="内容运营">内容运营</SelectItem>
                    <SelectItem value="学习成长">学习成长</SelectItem>
                    <SelectItem value="生活管理">生活管理</SelectItem>
                    <SelectItem value="职业发展">职业发展</SelectItem>
                    <SelectItem value="创业副业">创业副业</SelectItem>
                    <SelectItem value="自定义">自定义</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>步骤数</Label>
                <div className="mt-1.5 h-10 px-3 flex items-center text-sm text-muted-foreground border border-input rounded-md">
                  {steps.length} 步
                </div>
              </div>
            </div>
            <div>
              <Label>亮点标签（最多5个）</Label>
              <div className="flex flex-wrap gap-1.5 mt-1.5 mb-2">
                {highlights.map((h, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-primary/10 text-primary font-medium"
                  >
                    {h}
                    <button
                      onClick={() => removeHighlight(i)}
                      className="opacity-60 hover:opacity-100"
                      aria-label="移除"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={highlightInput}
                  onChange={(e) => setHighlightInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addHighlight())}
                  placeholder="输入亮点后按回车添加"
                  className="flex-1"
                />
                <Button variant="outline" size="sm" onClick={addHighlight}>
                  添加
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Steps editor */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.4 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Target className="size-5 text-primary" />
              步骤列表
            </h2>
            <Button variant="outline" size="sm" onClick={addStep} className="gap-1">
              <Plus className="size-4" />
              添加步骤
            </Button>
          </div>

          {steps.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/60 bg-card/50 py-12 text-center">
              <p className="text-muted-foreground text-sm mb-3">还没有步骤</p>
              <Button onClick={addStep} size="sm" className="gap-1">
                <Plus className="size-4" />
                添加第一步
              </Button>
            </div>
          ) : (
            <Accordion type="multiple" defaultValue={steps.map((s) => s.id)}>
              {steps.map((step, stepIdx) => (
                <AccordionItem
                  key={step.id}
                  value={step.id}
                  className="rounded-2xl border border-border/50 bg-card mb-3 overflow-hidden data-[state=open]:shadow-md transition-shadow"
                >
                  <AccordionTrigger className="px-5 py-4 hover:no-underline">
                    <div className="flex items-center gap-3 flex-1 text-left pr-3">
                      <div className="size-8 rounded-full bg-primary/10 text-primary font-semibold text-sm flex items-center justify-center shrink-0">
                        {step.index}
                      </div>
                      <span className="font-medium text-foreground truncate">
                        {step.title || `第 ${step.index} 步（未命名）`}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-5 pb-5">
                    <StepEditor
                      step={step}
                      onUpdate={(updates) => updateStep(step.id, updates)}
                      onDelete={() => deleteStep(step.id)}
                      onMoveUp={() => moveStep(step.id, 'up')}
                      onMoveDown={() => moveStep(step.id, 'down')}
                      canMoveUp={stepIdx > 0}
                      canMoveDown={stepIdx < steps.length - 1}
                      onAddSubTask={() => addSubTask(step.id)}
                      onUpdateSubTask={(sid, val) => updateSubTask(step.id, sid, val)}
                      onDeleteSubTask={(sid) => deleteSubTask(step.id, sid)}
                      onAddTool={() => addTool(step.id)}
                      onUpdateTool={(idx, val) => updateTool(step.id, idx, val)}
                      onDeleteTool={(idx) => deleteTool(step.id, idx)}
                    />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}

          {steps.length > 0 && (
            <Button
              variant="outline"
              onClick={addStep}
              className="w-full h-12 border-dashed gap-1"
            >
              <Plus className="size-4" />
              再添加一步
            </Button>
          )}
        </motion.div>
      </div>

      {/* Bottom save bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-xl border-t border-border/40">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-3">
          <Button
            onClick={handleSave}
            className="w-full h-12 rounded-xl text-base gap-2 shadow-lg shadow-primary/20"
          >
            <Save className="size-5" />
            保存模板
          </Button>
        </div>
      </div>
    </div>
  );
}

interface StepEditorProps {
  step: IStep;
  onUpdate: (updates: Partial<IStep>) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onAddSubTask: () => void;
  onUpdateSubTask: (subId: string, value: string) => void;
  onDeleteSubTask: (subId: string) => void;
  onAddTool: () => void;
  onUpdateTool: (idx: number, value: string) => void;
  onDeleteTool: (idx: number) => void;
}

function StepEditor({
  step,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  onAddSubTask,
  onUpdateSubTask,
  onDeleteSubTask,
  onAddTool,
  onUpdateTool,
  onDeleteTool,
}: StepEditorProps) {
  return (
    <div className="space-y-4">
      {/* Step title + actions */}
      <div className="flex items-start gap-2">
        <Input
          value={step.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          placeholder="步骤名称"
          className="flex-1"
        />
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMoveUp}
            disabled={!canMoveUp}
            className="size-9"
            aria-label="上移"
          >
            <ChevronUp className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onMoveDown}
            disabled={!canMoveDown}
            className="size-9"
            aria-label="下移"
          >
            <ChevronDown className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="size-9 text-destructive hover:text-destructive"
            aria-label="删除"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">预计耗时</Label>
          <Input
            value={step.duration}
            onChange={(e) => onUpdate({ duration: e.target.value })}
            placeholder="如：2-3小时"
            className="mt-1 h-9 text-sm"
          />
        </div>
        <div>
          <Label className="text-xs">难度</Label>
          <Select
            value={step.difficulty}
            onValueChange={(v) => onUpdate({ difficulty: v as IDifficulty })}
          >
            <SelectTrigger className="mt-1 h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">简单</SelectItem>
              <SelectItem value="medium">中等</SelectItem>
              <SelectItem value="hard">较难</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Goal */}
      <div>
        <Label className="flex items-center gap-1.5 text-xs">
          <Target className="size-3.5 text-primary" />
          目标
        </Label>
        <Textarea
          value={step.goal}
          onChange={(e) => onUpdate({ goal: e.target.value })}
          placeholder="这一步要达成什么目标"
          className="mt-1 text-sm min-h-[60px] resize-none"
        />
      </div>

      {/* Sub-tasks */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <Label className="flex items-center gap-1.5 text-xs">
            核心动作
          </Label>
          <Button
            variant="ghost"
            size="sm"
            onClick={onAddSubTask}
            className="h-7 text-xs gap-1 text-primary"
          >
            <Plus className="size-3.5" />
            添加
          </Button>
        </div>
        <div className="space-y-1.5">
          {step.subTasks.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">暂无子任务</p>
          ) : (
            step.subTasks.map((st, i) => (
              <div key={st.id} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground shrink-0 w-5">{i + 1}.</span>
                <Input
                  value={st.title}
                  onChange={(e) => onUpdateSubTask(st.id, e.target.value)}
                  placeholder="子任务描述"
                  className="h-8 text-sm"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDeleteSubTask(st.id)}
                  className="size-8 text-muted-foreground hover:text-destructive shrink-0"
                  aria-label="删除"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Tools */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <Label className="flex items-center gap-1.5 text-xs">
            <Wrench className="size-3.5 text-amber-600" />
            推荐工具
          </Label>
          <Button
            variant="ghost"
            size="sm"
            onClick={onAddTool}
            className="h-7 text-xs gap-1 text-primary"
          >
            <Plus className="size-3.5" />
            添加
          </Button>
        </div>
        <div className="space-y-1.5">
          {step.tools.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">暂无推荐工具</p>
          ) : (
            step.tools.map((tool, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  value={tool}
                  onChange={(e) => onUpdateTool(i, e.target.value)}
                  placeholder="工具名称"
                  className="h-8 text-sm"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDeleteTool(i)}
                  className="size-8 text-muted-foreground hover:text-destructive shrink-0"
                  aria-label="删除"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {/* Deliverable */}
        <div>
          <Label className="flex items-center gap-1.5 text-xs">
            <Package className="size-3.5 text-emerald-600" />
            产出物
          </Label>
          <Input
            value={step.deliverable}
            onChange={(e) => onUpdate({ deliverable: e.target.value })}
            placeholder="这一步的产出物是什么"
            className="mt-1 h-9 text-sm"
          />
        </div>

        {/* Tips */}
        <div>
          <Label className="flex items-center gap-1.5 text-xs">
            <Lightbulb className="size-3.5 text-primary" />
            小贴士
          </Label>
          <Textarea
            value={step.tips}
            onChange={(e) => onUpdate({ tips: e.target.value })}
            placeholder="实用建议或注意事项"
            className="mt-1 text-sm min-h-[50px] resize-none"
          />
        </div>
      </div>
    </div>
  );
}
