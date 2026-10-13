import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Clock,
  Copy,
  Download,
  FileJson,
  Layers,
  Pencil,
  Printer,
  RefreshCw,
  Share2,
  Target,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import StepCard from '@/components/StepCard';
import ProgressRing from '@/components/ProgressRing';
import Celebration from '@/components/Celebration';
import { DifficultyBadge } from '@/components/DifficultyBadge';
import { useBreakdownStore } from '@/hooks/useBreakdownStore';
import { useAppSettings } from '@/hooks/useSettings';
import { AiRequestError, streamBreakdown } from '@/lib/ai';
import { generateLocalBreakdown } from '@/lib/localBreakdown';
import { overallDifficultyOf, parseStepsFromText, sumDurationText } from '@/lib/parseSteps';
import { resolveMode } from '@/lib/settings';
import {
  copyText,
  downloadText,
  recordToJson,
  recordToMarkdown,
  safeFileName,
} from '@/lib/exporters';
import { calculateOverallProgress, type IDifficulty, type IStep } from '@/data/breakdown';

const REVEAL_INTERVAL_MS = 180;

function sleep(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve) => {
    if (signal.aborted) {
      resolve();
      return;
    }
    const timer = window.setTimeout(resolve, ms);
    signal.addEventListener(
      'abort',
      () => {
        window.clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });
}

export default function BreakdownPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getRecord, updateRecord, deleteRecord } = useBreakdownStore();
  const settings = useAppSettings();
  const mode = resolveMode(settings);
  const record = id ? getRecord(id) : undefined;

  const [isGenerating, setIsGenerating] = useState(false);
  const [rawText, setRawText] = useState('');
  const [fallbackNote, setFallbackNote] = useState<string | null>(null);
  const [generationKey, setGenerationKey] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [confettiSeed, setConfettiSeed] = useState(1);
  const [editTitleOpen, setEditTitleOpen] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const generatedRef = useRef<Set<string>>(new Set());
  const recordId = record?.id;
  const recordTitle = record?.title;
  const recordSource = record?.source;

  // 只有「从首页自由输入」创建的记录才需要现场拆解；模板/自定义记录已带步骤
  useEffect(() => {
    if (!recordId || !recordTitle || recordSource !== 'ai') return;

    const runKey = `${recordId}#${generationKey}`;
    const generated = generatedRef.current;
    if (generated.has(runKey)) return;
    generated.add(runKey);

    const controller = new AbortController();
    let cancelled = false;

    const commit = (
      steps: IStep[],
      meta?: { totalDuration?: string; overallDifficulty?: IDifficulty },
    ) => {
      updateRecord(recordId, (current) => ({
        ...current,
        steps,
        totalDuration: meta?.totalDuration ?? sumDurationText(steps),
        overallDifficulty: meta?.overallDifficulty ?? overallDifficultyOf(steps),
        progress: 0,
        status: 'in_progress',
      }));
    };

    const runLocal = async (): Promise<boolean> => {
      const { steps, matchedTemplateTitle, totalDuration, overallDifficulty } =
        generateLocalBreakdown(recordTitle);
      for (let index = 0; index < steps.length; index += 1) {
        if (cancelled) return false;
        commit(steps.slice(0, index + 1));
        await sleep(REVEAL_INTERVAL_MS, controller.signal);
      }
      if (cancelled) return false;
      if (totalDuration || overallDifficulty) {
        commit(steps, { totalDuration, overallDifficulty });
      }
      toast.success(
        matchedTemplateTitle ? `已套用「${matchedTemplateTitle}」配置拆解` : '拆解完成！',
      );
      return true;
    };

    const run = async () => {
      setIsGenerating(true);
      setFallbackNote(null);
      try {
        if (mode === 'local') {
          await runLocal();
          return;
        }

        let accumulated = '';
        const text = await streamBreakdown(
          recordTitle,
          { baseUrl: settings.baseUrl, apiKey: settings.apiKey, model: settings.model },
          {
            signal: controller.signal,
            onDelta: (delta) => {
              accumulated += delta;
              if (!cancelled) setRawText(accumulated);
            },
          },
        );
        if (cancelled) return;

        const steps = parseStepsFromText(text || accumulated);
        if (steps.length === 0) throw new AiRequestError('模型没有返回可解析的步骤');
        commit(steps);
        setRawText('');
        toast.success('AI 拆解完成！');
      } catch (error) {
        if (cancelled) return;
        const message =
          error instanceof AiRequestError
            ? error.message
            : error instanceof Error
              ? error.message
              : '生成失败，请稍后重试';

        // AI 不可用时自动降级到内置规则，保证用户总能拿到一份可执行清单
        const { steps } = generateLocalBreakdown(recordTitle);
        commit(steps);
        setRawText('');
        setFallbackNote(`AI 调用失败：${message}。已自动改用内置规则拆解。`);
        toast.error('AI 调用失败，已用内置规则拆解');
      } finally {
        if (!cancelled) setIsGenerating(false);
      }
    };

    run();

    return () => {
      cancelled = true;
      controller.abort();
      generated.delete(runKey);
    };
  }, [recordId, recordTitle, recordSource, generationKey, mode, settings.baseUrl, settings.apiKey, settings.model, updateRecord]);

  const handleSubTaskToggle = useCallback(
    (stepId: string, subTaskId: string) => {
      if (!record) return;
      const newSteps = record.steps.map((step) =>
        step.id === stepId
          ? {
              ...step,
              subTasks: step.subTasks.map((subTask) =>
                subTask.id === subTaskId ? { ...subTask, completed: !subTask.completed } : subTask,
              ),
            }
          : step,
      );
      const newProgress = calculateOverallProgress(newSteps);
      const justCompleted = newProgress === 100 && record.status !== 'completed';
      updateRecord(record.id, (current) => ({
        ...current,
        steps: newSteps,
        progress: newProgress,
        status: justCompleted ? 'completed' : 'in_progress',
      }));
      if (justCompleted) setShowCelebration(true);
      if (justCompleted) setConfettiSeed(Math.random() * 1_000_000 + 1);
    },
    [record, updateRecord],
  );

  const handleSaveTitle = () => {
    if (!record || !titleInput.trim()) return;
    updateRecord(record.id, (current) => ({ ...current, title: titleInput.trim() }));
    setEditTitleOpen(false);
    toast.success('已重命名');
  };

  const handleDelete = () => {
    if (!record) return;
    deleteRecord(record.id);
    toast.success('已删除');
    navigate('/my');
  };

  const handleRegenerate = () => {
    if (!record) return;
    updateRecord(record.id, (current) => ({
      ...current,
      steps: [],
      progress: 0,
      status: 'in_progress',
      totalDuration: '计算中...',
    }));
    setRawText('');
    setFallbackNote(null);
    setGenerationKey((key) => key + 1);
  };

  const markdown = useMemo(() => (record ? recordToMarkdown(record) : ''), [record]);

  const handleCopyMarkdown = async () => {
    const ok = await copyText(markdown);
    if (ok) toast.success('已复制到剪贴板');
    else toast.error('复制失败，请手动选择文本');
  };

  if (!record) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">未找到该拆解记录</p>
          <Button onClick={() => navigate('/')}>返回首页</Button>
        </div>
      </div>
    );
  }

  const progress = record.progress;
  const completedSteps = record.steps.filter(
    (step) => step.subTasks.length > 0 && step.subTasks.every((subTask) => subTask.completed),
  ).length;
  const showSkeleton = isGenerating && record.steps.length === 0;

  return (
    <div className="min-h-screen pb-20">
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
            {record.title}
          </h1>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => setShareOpen(true)}
              aria-label="导出 / 分享"
              title="导出 / 分享"
            >
              <Share2 className="size-4" />
            </Button>
            {record.source === 'ai' && (
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={handleRegenerate}
                disabled={isGenerating}
                aria-label="重新拆解"
                title="重新拆解"
              >
                <RefreshCw className={`size-4 ${isGenerating ? 'animate-spin' : ''}`} />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => {
                setTitleInput(record.title);
                setEditTitleOpen(true);
              }}
              aria-label="重命名"
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-destructive hover:text-destructive"
              onClick={() => setDeleteOpen(true)}
              aria-label="删除"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Overview card */}
      <div className="max-w-4xl mx-auto px-4 md:px-6 pt-6 md:pt-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-card to-secondary/10 border border-border/50 shadow-lg p-6 md:p-8"
        >
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/20 rounded-full blur-3xl opacity-40 pointer-events-none" />

          <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-8">
            <ProgressRing progress={progress} size={110} strokeWidth={7} />

            <div className="flex-1 min-w-0">
              <h2 className="text-xl md:text-2xl font-bold text-foreground mb-1 break-words">
                {record.title}
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                {record.status === 'completed' ? '已全部完成 🎉' : '进行中，继续加油！'}
              </p>

              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Layers className="size-4 text-primary" />
                  <span className="text-muted-foreground">步骤</span>
                  <span className="font-semibold text-foreground">
                    {record.steps.length > 0 ? `${completedSteps}/${record.steps.length}` : '—'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="size-4 text-primary" />
                  <span className="text-muted-foreground">总耗时</span>
                  <span className="font-semibold text-foreground">{record.totalDuration}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="size-4 text-primary" />
                  <span className="text-muted-foreground">整体难度</span>
                  <DifficultyBadge difficulty={record.overallDifficulty} />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {fallbackNote && (
          <div className="mt-4 rounded-2xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning-foreground">
            {fallbackNote}
          </div>
        )}
      </div>

      {/* Steps timeline */}
      <div className="max-w-4xl mx-auto px-4 md:px-6 pt-8 md:pt-10">
        {showSkeleton ? (
          <LoadingSkeleton rawText={mode === 'ai' ? rawText : ''} />
        ) : record.steps.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">暂无步骤</p>
          </div>
        ) : (
          <div className="space-y-6 md:space-y-8">
            {record.steps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                <StepCard
                  step={step}
                  onSubTaskToggle={handleSubTaskToggle}
                  isLast={index === record.steps.length - 1}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Celebration
        show={showCelebration}
        seed={confettiSeed}
        title="恭喜完成！"
        subtitle={`你已经完成了「${record.title}」的全部步骤，真棒！`}
        onClose={() => setShowCelebration(false)}
      />

      {/* Rename dialog */}
      <Dialog open={editTitleOpen} onOpenChange={setEditTitleOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>重命名目标</DialogTitle>
            <DialogDescription>修改这个拆解的标题</DialogDescription>
          </DialogHeader>
          <Input
            value={titleInput}
            onChange={(event) => setTitleInput(event.target.value)}
            placeholder="输入新的目标名称"
            autoFocus
            onKeyDown={(event) => event.key === 'Enter' && handleSaveTitle()}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditTitleOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveTitle}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export dialog */}
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>导出这份拆解</DialogTitle>
            <DialogDescription>
              复制成 markdown 可以直接贴进文档、飞书或聊天窗口；导出文件方便归档。
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="h-auto py-3 flex-col gap-1.5" onClick={handleCopyMarkdown}>
              <Copy className="size-4" />
              复制 Markdown
            </Button>
            <Button
              variant="outline"
              className="h-auto py-3 flex-col gap-1.5"
              onClick={() => {
                downloadText(`${safeFileName(record.title)}.md`, markdown);
                toast.success('已下载 markdown 文件');
              }}
            >
              <Download className="size-4" />
              下载 .md
            </Button>
            <Button
              variant="outline"
              className="h-auto py-3 flex-col gap-1.5"
              onClick={() => {
                downloadText(
                  `${safeFileName(record.title)}.json`,
                  recordToJson(record),
                  'application/json;charset=utf-8',
                );
                toast.success('已下载 JSON 文件');
              }}
            >
              <FileJson className="size-4" />
              下载 .json
            </Button>
            <Button
              variant="outline"
              className="h-auto py-3 flex-col gap-1.5"
              onClick={() => {
                setShareOpen(false);
                window.print();
              }}
            >
              <Printer className="size-4" />
              打印 / 存 PDF
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            提示：拆解数据保存在你自己的浏览器里，换设备需要重新导出导入。
          </p>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除？</AlertDialogTitle>
            <AlertDialogDescription>
              删除后无法恢复，确定要删除「{record.title}」吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function LoadingSkeleton({ rawText }: { rawText: string }) {
  return (
    <div className="space-y-6">
      {rawText && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <p className="text-xs font-medium text-primary mb-2">AI 正在生成…</p>
          <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-words text-xs text-muted-foreground font-mono">
            {rawText.slice(-800)}
          </pre>
        </div>
      )}
      {Array.from({ length: 4 }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 * index, duration: 0.4 }}
          className="rounded-2xl border border-border/50 bg-card p-5"
        >
          <div className="flex items-start gap-4">
            <motion.div
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: index * 0.1 }}
              className="size-11 rounded-full bg-muted"
            />
            <div className="flex-1 space-y-3">
              <motion.div
                animate={{ opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: index * 0.1 + 0.1 }}
                className="h-5 w-1/3 bg-muted rounded-md"
              />
              <div className="flex gap-2">
                <motion.div
                  animate={{ opacity: [0.4, 0.8, 0.4] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: index * 0.1 + 0.2 }}
                  className="h-4 w-16 bg-muted rounded-md"
                />
                <motion.div
                  animate={{ opacity: [0.4, 0.8, 0.4] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: index * 0.1 + 0.3 }}
                  className="h-4 w-12 bg-muted rounded-md"
                />
              </div>
              <motion.div
                animate={{ opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: index * 0.1 + 0.4 }}
                className="h-2 w-full bg-muted rounded-full"
              />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
