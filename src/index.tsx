import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';
import { Button } from '@/components/ui/button';
import App from './app';
import './index.css';

/** GitHub Pages 等项目页会把站点挂在子路径下，BASE_URL 形如 "/repo/"。 */
const basename = import.meta.env.BASE_URL.replace(/\/+$/, '');

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
        <h1 className="text-lg font-semibold text-foreground mb-2">页面出错了</h1>
        <p className="text-sm text-muted-foreground mb-5 break-words">{message}</p>
        <div className="flex justify-center gap-2">
          <Button onClick={resetErrorBoundary}>重试</Button>
          <Button variant="outline" onClick={() => window.location.assign(import.meta.env.BASE_URL)}>
            回到首页
          </Button>
        </div>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={basename}>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <App />
      </ErrorBoundary>
    </BrowserRouter>
  </StrictMode>,
);
