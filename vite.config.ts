import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@schoolhub/ui': path.resolve(__dirname, 'src/vendor/schoolhub-ui/index.ts'),
      '@boredkevin/ui': path.resolve(__dirname, 'src/vendor/schoolhub-ui/index.ts'),
      '@bkui': path.resolve(__dirname, 'src/vendor/schoolhub-ui'),
      '@shui': path.resolve(__dirname, 'src/vendor/schoolhub-ui'),
    },
  },
  server: { port: 5173, strictPort: true },
  build: { sourcemap: false },
});
