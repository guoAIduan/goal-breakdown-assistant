import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Clock, Target, Plus, Trash2, Play, Edit2, FolderOpen } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
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
import { DifficultyBadge } from '@/components/DifficultyBadge';
import { useBreakdownStore, useMyTemplatesStore } from '@/hooks/useBreakdownStore';
import type { IBreakdownRecord, IUserTemplate } from '@/data/breakdown';

type TabType = 'history' | 'templates';

export default function MyBreakdownsPage() {
  const [tab, setTab] = useState<TabType>('history');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<'record' | 'template'>('record');
  const navigate = useNavigate();
  const { records, deleteRecord } = useBreakdownStore();
  const { templates, deleteTemplate } = useMyTemplatesStore();

  const confirmDelete = (id: string, type: 'record' | 'template') => {
    setDeleteId(id);
    setDeleteType(type);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    if (deleteType === 'record') {
      deleteRecord(deleteId);
    } else {
      deleteTemplate(deleteId);
    }
    toast.success('已删除');
    setDeleteId(null);
  };

  const handleUseTemplate = (tpl: IUserTemplate) => {
    navigate('/editor', { state: { templateId: tpl.id, mode: 'use' } });
  };

  const handleEditTemplate = (tpl: IUserTemplate) => {
    navigate('/editor', { state: { templateId: tpl.id, mode: 'edit' } });
  };

  const inProgressRecords = records.filter((r) => r.status === 'in_progress');
  const completedRecords = records.filter((r) => r.status === 'completed');

  return (
    <div className="min-h-screen pb-20">
      {/* Page header */}
      <section className="w-full">
        <div className="max-w-4xl mx-auto px-4 md:px-6 pt-8 md:pt-12 pb-4">
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-2xl md:text-3xl font-bold text-foreground mb-2"
          >
            我的拆解
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.5 }}
            className="text-muted-foreground"
          >
            你的进度自动保存，随时回来继续
          </motion.p>
        </div>
      </section>

      {/* Tabs */}
      <section className="w-full sticky top-16 z-30 bg-background/70 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          <LayoutGroup id="my-tabs">
            <div className="flex gap-1 py-3">
              {[
                { key: 'history' as TabType, label: '历史拆解', count: records.length },
                { key: 'templates' as TabType, label: '我的模板', count: templates.length },
              ].map((t) => {
                const isActive = tab === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={`relative px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                      isActive
                        ? 'text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="my-tab-bg"
                        className="absolute inset-0 bg-primary rounded-full -z-10"
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      />
                    )}
                    {t.label}
                    <span
                      className={`ml-1.5 text-xs ${isActive ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}
                    >
                      {t.count}
                    </span>
                  </button>
                );
              })}

              {tab === 'templates' && (
                <Button
                  size="sm"
                  onClick={() => navigate('/editor')}
                  className="ml-auto gap-1 h-8 rounded-full"
                >
                  <Plus className="size-4" />
                  新建
                </Button>
              )}
            </div>
          </LayoutGroup>
        </div>
      </section>

      {/* Content */}
      <section className="w-full py-6">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          <AnimatePresence mode="wait">
            {tab === 'history' ? (
              <motion.div
                key="history"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                {records.length === 0 ? (
                  <EmptyState
                    icon={<Target className="size-12 text-primary/30" />}
                    title="还没有拆解记录"
                    desc="去首页输入一个目标，或从模板广场选一个模板开始吧"
                    actionText="去首页看看"
                    onAction={() => navigate('/')}
                  />
                ) : (
                  <>
                    {inProgressRecords.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-3 px-1">
                          进行中 ({inProgressRecords.length})
                        </h3>
                        <div className="space-y-3">
                          {inProgressRecords.map((r, i) => (
                            <RecordCard
                              key={r.id}
                              record={r}
                              index={i}
                              onClick={() => navigate(`/breakdown/${r.id}`)}
                              onDelete={() => confirmDelete(r.id, 'record')}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    {completedRecords.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-3 px-1">
                          已完成 ({completedRecords.length})
                        </h3>
                        <div className="space-y-3">
                          {completedRecords.map((r, i) => (
                            <RecordCard
                              key={r.id}
                              record={r}
                              index={i}
                              onClick={() => navigate(`/breakdown/${r.id}`)}
                              onDelete={() => confirmDelete(r.id, 'record')}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="templates"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="space-y-3"
              >
                {templates.length === 0 ? (
                  <EmptyState
                    icon={<FolderOpen className="size-12 text-primary/30" />}
                    title="还没有自定义模板"
                    desc="创建你自己的工作流模板，下次直接使用"
                    actionText="新建模板"
                    onAction={() => navigate('/editor')}
                  />
                ) : (
                  templates.map((tpl, i) => (
                    <TemplateItemCard
                      key={tpl.id}
                      template={tpl}
                      index={i}
                      onUse={() => handleUseTemplate(tpl)}
                      onEdit={() => handleEditTemplate(tpl)}
                      onDelete={() => confirmDelete(tpl.id, 'template')}
                    />
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除？</AlertDialogTitle>
            <AlertDialogDescription>
              删除后无法恢复，确定要删除吗？
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

function RecordCard({
  record,
  index,
  onClick,
  onDelete,
}: {
  record: IBreakdownRecord;
  index: number;
  onClick: () => void;
  onDelete: () => void;
}) {
  const completed = record.status === 'completed';
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35 }}
      className="group relative rounded-2xl bg-card border border-border/50 p-4 hover:border-primary/30 hover:shadow-md transition-all duration-300"
    >
      <div className="flex items-start gap-4" onClick={onClick}>
        <div className="flex-1 min-w-0 cursor-pointer">
          <h3 className="font-semibold text-foreground mb-1.5 truncate group-hover:text-primary transition-colors">
            {record.title}
          </h3>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-3">
            <span className="flex items-center gap-1">
              <Target className="size-3.5" />
              {record.steps.length} 步
            </span>
            <span className="flex items-center gap-1">
              <Clock className="size-3.5" />
              {format(record.updatedAt, 'MM-dd HH:mm', { locale: zhCN })}
            </span>
            <DifficultyBadge difficulty={record.overallDifficulty} />
            {completed && (
              <span className="text-emerald-600 font-medium">✓ 已完成</span>
            )}
          </div>
          {/* Progress bar */}
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${record.progress}%` }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
          <div className="text-xs text-muted-foreground mt-1.5">
            进度 {record.progress}%
          </div>
        </div>

        <div className="flex flex-col gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            aria-label="删除"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

function TemplateItemCard({
  template,
  index,
  onUse,
  onEdit,
  onDelete,
}: {
  template: IUserTemplate;
  index: number;
  onUse: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35 }}
      className="group rounded-2xl bg-card border border-border/50 p-4 hover:border-primary/30 hover:shadow-md transition-all duration-300"
    >
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground mb-1 truncate">{template.title}</h3>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-2">
            <span>{template.category}</span>
            <span className="flex items-center gap-1">
              <Target className="size-3.5" />
              {template.steps.length} 步
            </span>
            <DifficultyBadge difficulty={template.overallDifficulty} />
          </div>
          <p className="text-xs text-muted-foreground line-clamp-1">
            {template.totalDuration}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-border/40">
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="text-destructive hover:text-destructive h-8"
        >
          <Trash2 className="size-4 mr-1" />
          删除
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onEdit}
          className="h-8"
        >
          <Edit2 className="size-4 mr-1" />
          编辑
        </Button>
        <Button
          size="sm"
          onClick={onUse}
          className="h-8 gap-1"
        >
          <Play className="size-3.5" />
          使用
        </Button>
      </div>
    </motion.div>
  );
}

function EmptyState({
  icon,
  title,
  desc,
  actionText,
  onAction,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  actionText: string;
  onAction: () => void;
}) {
  return (
    <div className="text-center py-20">
      <div className="mx-auto mb-4 flex justify-center">{icon}</div>
      <h3 className="text-lg font-semibold text-foreground mb-1.5">{title}</h3>
      <p className="text-sm text-muted-foreground mb-5 max-w-sm mx-auto">{desc}</p>
      <Button onClick={onAction}>{actionText}</Button>
    </div>
  );
}
