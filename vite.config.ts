import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/**
 * 部署到 GitHub Pages 时站点挂在 https://<user>.github.io/<repo>/ 下，
 * 资源路径需要带前缀；CI 通过 BASE_PATH 传入仓库名，本地默认为根路径。
 */
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
