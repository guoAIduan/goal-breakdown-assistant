import { Outlet } from 'react-router-dom';
import Header from '@/components/Header';
import { Toaster } from '@/components/ui/sonner';

export function Layout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10">
      <Header />
      <main className="w-full">
        <Outlet />
      </main>
      <Toaster position="top-center" richColors closeButton />
    </div>
  );
}
