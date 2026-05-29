import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import type { InlineConfig } from 'vitest/node';

interface VitestConfig {
  test?: InlineConfig;
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/claudeGame/',
  ...(({
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test-setup.ts',
    },
  }) as VitestConfig),
});
