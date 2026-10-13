import { lazy, Suspense, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, LayoutGrid, ListChecks, Menu, X, Sparkles, Settings2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAppSettings } from '@/hooks/useSettings';
import { resolveMode } from '@/lib/settings';

// 设置弹窗里的下拉框、对话框体积不小，等用户真正点开时再加载
const SettingsDialog = lazy(() => import('@/components/SettingsDialog'));

const NAV_ITEMS = [
  { path: '/', label: '首页', icon: Home },
  { path: '/templates', label: '模板广场', icon: LayoutGrid },
  { path: '/my', label: '我的拆解', icon: ListChecks },
];

export default function Header() {
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { pathname } = useLocation();
  const settings = useAppSettings();
  const isAiMode = resolveMode(settings) === 'ai';

  return (
    <header className="sticky top-0 z-50 w-full bg-background/70 backdrop-blur-xl border-b border-border/40">
      <div className="max-w-7xl mx-auto px-4 md:px-6 flex h-16 items-center justify-between gap-3">
        <NavLink to="/" className="flex items-center gap-2 group">
          <div className="size-9 rounded-xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground flex items-center justify-center shadow-md shadow-primary/20 group-hover:scale-105 transition-transform">
            <Sparkles className="size-5" />
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            拆解大师
          </span>
        </NavLink>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = item.path === '/' ? pathname === '/' : pathname.startsWith(item.path);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                }`}
              >
                <Icon className="size-4" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setSettingsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
            aria-label="拆解方式设置"
            title={isAiMode ? '当前：AI 拆解' : '当前：内置规则拆解'}
          >
            <Settings2 className="size-4" />
            <span className="hidden sm:inline">{isAiMode ? 'AI 模式' : '本地模式'}</span>
          </button>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-xl hover:bg-accent/50 transition-colors"
            aria-label="菜单"
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile nav drawer */}
      <AnimatePresence>
        {isMobile && mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="md:hidden overflow-hidden border-b border-border/40 bg-background/95 backdrop-blur-xl"
          >
            <nav className="px-4 py-3 space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = item.path === '/' ? pathname === '/' : pathname.startsWith(item.path);
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/'}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'text-primary bg-primary/10'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                    }`}
                  >
                    <Icon className="size-5" />
                    {item.label}
                  </NavLink>
                );
              })}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {settingsOpen && (
        <Suspense fallback={null}>
          <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
        </Suspense>
      )}
    </header>
  );
}
