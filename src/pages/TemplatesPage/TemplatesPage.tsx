import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { Search, Clock, Target, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { MOCK_TEMPLATES, TEMPLATE_CATEGORIES } from '@/data/templates';
import { DifficultyBadge } from '@/components/DifficultyBadge';
import type { ITemplate } from '@/data/templates';

export default function TemplatesPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [keyword, setKeyword] = useState('');
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    return MOCK_TEMPLATES.filter((t) => {
      const matchCat = activeCategory === 'all' || t.category === activeCategory;
      const matchKw =
        !keyword ||
        t.title.toLowerCase().includes(keyword.toLowerCase()) ||
        t.description.toLowerCase().includes(keyword.toLowerCase());
      return matchCat && matchKw;
    });
  }, [activeCategory, keyword]);

  return (
    <div className="min-h-screen pb-16">
      {/* Page header */}
      <section className="w-full">
        <div className="max-w-5xl mx-auto px-4 md:px-6 pt-8 md:pt-12 pb-6">
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-2xl md:text-3xl font-bold text-foreground mb-2"
          >
            模板广场
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.5 }}
            className="text-muted-foreground mb-6"
          >
            精选各领域高质量模板，一键启动你的计划
          </motion.p>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="relative max-w-md"
          >
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索模板..."
              className="pl-9 h-11 rounded-xl"
            />
          </motion.div>
        </div>
      </section>

      {/* Category tabs */}
      <section className="w-full sticky top-16 z-30 bg-background/70 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <LayoutGroup id="category-tabs">
            <div className="flex gap-1 overflow-x-auto py-3 -mx-1 px-1 scrollbar-hide">
              {TEMPLATE_CATEGORIES.map((cat) => {
                const isActive = activeCategory === cat.key;
                return (
                  <button
                    key={cat.key}
                    onClick={() => setActiveCategory(cat.key)}
                    className={`relative shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                      isActive
                        ? 'text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="cat-tab-bg"
                        className="absolute inset-0 bg-primary rounded-full -z-10"
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      />
                    )}
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </LayoutGroup>
        </div>
      </section>

      {/* Template grid */}
      <section className="w-full py-6 md:py-8">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory + keyword}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5"
            >
              {filtered.map((tpl, i) => (
                <TemplateCard key={tpl.id} tpl={tpl} index={i} onClick={() => navigate(`/templates/${tpl.id}`)} />
              ))}
            </motion.div>
          </AnimatePresence>

          {filtered.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <p className="text-muted-foreground">没有找到匹配的模板</p>
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
}

function TemplateCard({ tpl, index, onClick }: { tpl: ITemplate; index: number; onClick: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4 }}
      onClick={onClick}
      className="group rounded-2xl bg-card border border-border/50 p-5 hover:border-primary/30 hover:shadow-lg transition-all duration-300 cursor-pointer"
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="size-12 rounded-xl bg-gradient-to-br from-primary/15 to-secondary/20 flex items-center justify-center text-2xl shrink-0">
          {tpl.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
            {tpl.title}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">{tpl.category}</p>
        </div>
      </div>
      <p className="text-sm text-foreground/70 leading-relaxed mb-4 line-clamp-2">
        {tpl.description}
      </p>
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-3">
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
      <div className="flex flex-wrap gap-1.5 mb-4">
        {tpl.highlights.map((h) => (
          <span
            key={h}
            className="text-[11px] px-2 py-0.5 rounded-full bg-primary/5 text-primary/80 font-medium"
          >
            {h}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-end text-sm text-primary font-medium gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        查看详情
        <ArrowRight className="size-4" />
      </div>
    </motion.div>
  );
}
