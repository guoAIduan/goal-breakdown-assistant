import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";

/**
 * 路由级懒加载：首屏只加载首页需要的代码，
 * 拆解详情、工作流编辑器等较重的页面在访问时才下载。
 */
const HomePage = lazy(() => import("@/pages/HomePage/HomePage"));
const BreakdownPage = lazy(() => import("@/pages/BreakdownPage/BreakdownPage"));
const TemplatesPage = lazy(() => import("@/pages/TemplatesPage/TemplatesPage"));
const TemplatePreviewPage = lazy(() => import("@/pages/TemplatePreviewPage/TemplatePreviewPage"));
const MyBreakdownsPage = lazy(() => import("@/pages/MyBreakdownsPage/MyBreakdownsPage"));
const WorkflowEditorPage = lazy(() => import("@/pages/WorkflowEditorPage/WorkflowEditorPage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage/NotFoundPage"));

function RouteFallback() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="size-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
        <p className="text-sm text-muted-foreground">加载中…</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="templates" element={<TemplatesPage />} />
          <Route path="templates/:id" element={<TemplatePreviewPage />} />
          <Route path="breakdown/:id" element={<BreakdownPage />} />
          <Route path="my" element={<MyBreakdownsPage />} />
          <Route path="editor" element={<WorkflowEditorPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
