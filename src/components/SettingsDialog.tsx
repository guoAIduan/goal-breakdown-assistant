import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppSettings } from '@/hooks/useSettings';
import { DEFAULT_SETTINGS, PROVIDER_PRESETS, settingsStore, type AppSettings } from '@/lib/settings';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const settings = useAppSettings();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        {/* 弹窗关闭时 Radix 会卸载内容，表单因此总是以最新配置重新挂载 */}
        <SettingsForm initial={settings} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function SettingsForm({ initial, onClose }: { initial: AppSettings; onClose: () => void }) {
  const [draft, setDraft] = useState<AppSettings>(initial);

  const applyPreset = (presetId: string) => {
    const preset = PROVIDER_PRESETS.find((item) => item.id === presetId);
    if (!preset) return;
    setDraft((prev) => ({
      ...prev,
      baseUrl: preset.baseUrl || prev.baseUrl,
      model: preset.model || prev.model,
    }));
  };

  const matchedPreset = PROVIDER_PRESETS.find(
    (preset) => preset.baseUrl && preset.baseUrl === draft.baseUrl,
  );

  const handleSave = () => {
    if (draft.mode === 'ai' && !draft.apiKey.trim()) {
      toast.error('选择 AI 模式时需要填写 API Key');
      return;
    }
    if (draft.mode === 'ai' && !/^https?:\/\//i.test(draft.baseUrl.trim())) {
      toast.error('Base URL 需要以 http:// 或 https:// 开头');
      return;
    }

    settingsStore.update({
      ...draft,
      baseUrl: draft.baseUrl.trim(),
      apiKey: draft.apiKey.trim(),
      model: draft.model.trim(),
    });
    toast.success('设置已保存');
    onClose();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>拆解方式设置</DialogTitle>
        <DialogDescription>
          默认使用内置规则拆解，无需任何配置；填入自己的模型接口后，可获得更贴合目标的 AI 拆解。
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="mode">拆解方式</Label>
          <Select
            value={draft.mode}
            onValueChange={(value) =>
              setDraft((prev) => ({ ...prev, mode: value as AppSettings['mode'] }))
            }
          >
            <SelectTrigger id="mode" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="local">内置规则拆解（无需 Key，离线可用）</SelectItem>
              <SelectItem value="ai">调用我的模型接口（AI 拆解）</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {draft.mode === 'ai' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="provider">服务商预设</Label>
              <Select value={matchedPreset?.id ?? 'custom'} onValueChange={applyPreset}>
                <SelectTrigger id="provider" className="w-full">
                  <SelectValue placeholder="选择预设" />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDER_PRESETS.map((preset) => (
                    <SelectItem key={preset.id} value={preset.id}>
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="baseUrl">Base URL</Label>
              <Input
                id="baseUrl"
                value={draft.baseUrl}
                onChange={(event) => setDraft((prev) => ({ ...prev, baseUrl: event.target.value }))}
                placeholder="https://api.deepseek.com/v1"
              />
              <p className="text-xs text-muted-foreground">
                需要兼容 OpenAI 的 /chat/completions 接口，通常以 /v1 结尾。
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">模型名称</Label>
              <Input
                id="model"
                value={draft.model}
                onChange={(event) => setDraft((prev) => ({ ...prev, model: event.target.value }))}
                placeholder="deepseek-chat"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                autoComplete="off"
                value={draft.apiKey}
                onChange={(event) => setDraft((prev) => ({ ...prev, apiKey: event.target.value }))}
                placeholder="sk-..."
              />
              <p className="text-xs text-muted-foreground">
                Key 只保存在你浏览器的 localStorage 里，不会上传到任何服务器。
              </p>
            </div>
          </>
        )}
      </div>

      <DialogFooter className="gap-2 sm:justify-between">
        <Button
          variant="ghost"
          onClick={() => {
            settingsStore.reset();
            setDraft(DEFAULT_SETTINGS);
            toast.success('已恢复默认设置');
          }}
        >
          恢复默认
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleSave}>保存设置</Button>
        </div>
      </DialogFooter>
    </>
  );
}
