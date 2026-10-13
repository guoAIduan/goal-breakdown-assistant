import { useState, useRef, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, TrendingUp, Clock, Target, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { HeroIllustration } from '@/components/HeroIllustration';
import { MOCK_EXAMPLES } from '@/data/examples';
import { MOCK_TEMPLATES } from '@/data/templates';
import { DifficultyBadge } from '@/components/DifficultyBadge';
import { generateId } from '@/data/breakdown';
import type { IBreakdownRecord } from '@/data/breakdown';
import { useBreakdownStore } from '@/hooks/useBreakdownStore';

const FEATURES = [
  { icon: Target, title: '精准拆解', desc: '把模糊目标拆成清晰步骤，每一步都知道做什么' },
  { icon: TrendingUp, title: '进度追踪', desc: '勾选推进，实时可视化，看着进度一点点前进' },
  { icon: Clock, title: '时间预估', desc: '每步附耗时与难度，合理规划不焦虑' },
  { icon: Zap, title: '即开即用', desc: '精选模板一键启动，也可自由输入AI拆解' },
];

export default function HomePage() {
  const [keyword, setKeyword] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { addRecord } = useBreakdownStore();

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const text = keyword.trim();
    if (!text) {
      inputRef.current?.focus();
      return;
    }
    startBreakdown(text);
  };

  const startBreakdown = (title: string) => {
    const id = generateId();
    const record: IBreakdownRecord = {
      id,
      title,
      source: 'ai',
      steps: [],
      totalDuration: '计算中...',
      overallDifficulty: 'medium',
      progress: 0,
      status: 'in_progress',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    addRecord(record);
    toast.success('开始拆解...');
    navigate(`/breakdown/${id}`);
  };

  const featuredTemplates = MOCK_TEMPLATES.filter((t) => t.featured).slice(0, 4);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="w-full relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-primary/20 via-secondary/10 to-transparent rounded-full blur-3xl opacity-60" />
        </div>

        <div className="max-w-5xl mx-auto px-4 md:px-6 pt-16 md:pt-24 pb-12 md:pb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="text-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6"
            >
              <Sparkles className="size-4" />
              把大目标拆成小步骤
            </motion.div>

            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-4 leading-tight">
              任何目标，
              <span className="bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">
                一键拆解
              </span>
              <br />
              步步可执行
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto mb-8 md:mb-10 leading-relaxed">
              输入你想做的任何事，AI 帮你拆成具体步骤，附带工具推荐、耗时预估和实用贴士，让行动不再卡壳。
            </p>

            {/* Main input */}
            <motion.form
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5 }}
              onSubmit={onSubmit}
              className="max-w-2xl mx-auto"
            >
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary via-secondary to-primary rounded-2xl opacity-30 group-focus-within:opacity-60 blur transition-opacity duration-300" />
                <div className="relative flex items-center gap-2 bg-card rounded-2xl border border-border/60 shadow-lg p-2">
                  <Input
                    ref={inputRef}
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="输入任何目标/想做的事，例如：制作一部AI短剧"
                    className="h-12 md:h-14 border-0 bg-transparent text-base focus-visible:ring-0 focus-visible:ring-offset-0 px-3"
                  />
                  <Button
                    type="submit"
                    size="lg"
                    className="h-10 md:h-12 px-4 md:px-6 rounded-xl shrink-0 gap-1.5"
                  >
                    <span className="hidden sm:inline">开始拆解</span>
                    <span className="sm:hidden">拆解</span>
                    <ArrowRight className="size-4" />
                  </Button>
                </div>
              </div>
            </motion.form>

            <p className="mt-4 text-xs md:text-sm text-muted-foreground">
              无需配置即可使用内置规则拆解；在右上角「设置」里接入自己的模型接口，可获得更贴合目标的 AI 拆解。
            </p>
          </motion.div>
        </div>

        {/* Hero image */}
        <div className="max-w-5xl mx-auto px-4 md:px-6 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative rounded-3xl overflow-hidden shadow-2xl border border-border/40"
          >
            <div className="aspect-[21/9] w-full">
              <HeroIllustration className="w-full h-full" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="w-full py-12 md:py-20">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="rounded-2xl bg-card/60 backdrop-blur-sm border border-border/50 p-5 hover:shadow-md hover:border-primary/20 transition-all duration-300"
                >
                  <div className="size-10 rounded-xl bg-gradient-to-br from-primary/15 to-secondary/20 flex items-center justify-center mb-3">
                    <Icon className="size-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Quick start examples */}
      <section className="w-full py-12 md:py-20 bg-gradient-to-b from-transparent via-primary/5 to-transparent">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              试试这些目标
            </h2>
            <p className="text-muted-foreground">点击任意卡片，立即开始拆解</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {MOCK_EXAMPLES.map((ex, i) => (
              <motion.button
                key={ex.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.5 }}
                whileHover={{ y: -4, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => startBreakdown(ex.title)}
                className="text-left rounded-2xl bg-card border border-border/50 p-5 hover:border-primary/30 hover:shadow-lg transition-all duration-300 group"
              >
                <div className="text-3xl mb-3">{ex.icon}</div>
                <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                  {ex.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{ex.description}</p>
                <div className="mt-3 flex items-center text-xs text-primary/70 font-medium gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  立即拆解 <ArrowRight className="size-3.5" />
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured templates */}
      <section className="w-full py-12 md:py-20">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-end justify-between mb-8"
          >
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-1">
                精选模板
              </h2>
              <p className="text-muted-foreground text-sm">专业规划，拿来即用</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/templates')}
              className="hidden sm:flex gap-1"
            >
              查看全部
              <ArrowRight className="size-4" />
            </Button>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
            {featuredTemplates.map((tpl, i) => (
              <motion.div
                key={tpl.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                whileHover={{ y: -3 }}
                onClick={() => navigate(`/templates/${tpl.id}`)}
                className="rounded-2xl bg-card border border-border/50 p-5 hover:border-primary/30 hover:shadow-lg transition-all duration-300 cursor-pointer group"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="size-11 rounded-xl bg-gradient-to-br from-primary/15 to-secondary/20 flex items-center justify-center text-xl shrink-0">
                    {tpl.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                      {tpl.title}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate">{tpl.description}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Target className="size-3.5" />
                    {tpl.steps.length} 步
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="size-3.5" />
                    {tpl.totalDuration}
                  </span>
                  <DifficultyBadge difficulty={tpl.overallDifficulty} />
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {tpl.highlights.map((h) => (
                    <span
                      key={h}
                      className="text-[11px] px-2 py-0.5 rounded-full bg-primary/5 text-primary/80 font-medium"
                    >
                      {h}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mt-6 text-center sm:hidden"
          >
            <Button variant="outline" onClick={() => navigate('/templates')}>
              查看全部模板
              <ArrowRight className="size-4" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-10 border-t border-border/40">
        <div className="max-w-5xl mx-auto px-4 md:px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="size-7 rounded-lg bg-gradient-to-br from-primary to-primary/60 text-primary-foreground flex items-center justify-center">
              <Sparkles className="size-4" />
            </div>
            <span className="font-bold text-foreground">拆解大师</span>
          </div>
          <p className="text-sm text-muted-foreground">
            把大目标拆成小步骤，每一步都知道怎么做
          </p>
        </div>
      </footer>
    </div>
  );
}
