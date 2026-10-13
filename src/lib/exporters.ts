import type { IBreakdownRecord } from '@/data/breakdown';
import { difficultyLabel } from '@/lib/difficulty';

export { difficultyLabel };

/** 导出成可粘贴到文档 / 聊天窗口的 markdown 清单。 */
export function recordToMarkdown(record: IBreakdownRecord): string {
  const lines: string[] = [
    `# ${record.title}`,
    '',
    `- 进度：${record.progress}%`,
    `- 总耗时：${record.totalDuration}`,
    `- 整体难度：${difficultyLabel(record.overallDifficulty)}`,
    '',
  ];

  record.steps.forEach((step, index) => {
    lines.push(`## ${index + 1}. ${step.title}`);
    lines.push('');
    lines.push(`- 目标：${step.goal}`);
    if (step.subTasks.length > 0) {
      lines.push('- 核心动作：');
      step.subTasks.forEach((subTask) => {
        lines.push(`  - [${subTask.completed ? 'x' : ' '}] ${subTask.title}`);
      });
    }
    if (step.tools.length > 0) lines.push(`- 推荐工具：${step.tools.join('、')}`);
    lines.push(`- 耗时：${step.duration}`);
    lines.push(`- 难度：${difficultyLabel(step.difficulty)}`);
    if (step.deliverable) lines.push(`- 产出物：${step.deliverable}`);
    if (step.tips) lines.push(`- 小贴士：${step.tips}`);
    lines.push('');
  });

  return lines.join('\n');
}

export function recordToJson(record: IBreakdownRecord): string {
  return JSON.stringify(record, null, 2);
}

export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // 走下面的兜底方案
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

export function downloadText(filename: string, text: string, mime = 'text/markdown;charset=utf-8') {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/** 把目标名转成安全的文件名。 */
export function safeFileName(title: string): string {
  const cleaned = title.replace(/[\\/:*?"<>|\s]+/g, '-').replace(/^-+|-+$/g, '');
  return (cleaned || 'breakdown').slice(0, 60);
}
