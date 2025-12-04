/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    environmentMatchGlobs: [
      ['src/components/**', 'jsdom'],
      ['src/pages/**', 'jsdom'],
      ['tests/**', 'jsdom'],
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      reportsDirectory: './coverage',
      include: [
        'src/**/*.{ts,tsx,js,jsx}',
        'supabase/functions/**/*.{ts,tsx,js,jsx}',
        'api/**/*.{ts,tsx,js,jsx}',
        'scripts/**/*.{ts,tsx,js,jsx,mjs,cjs}',
      ],
      exclude: [
        '**/*.d.ts',
        '**/*.test.*',
        '**/*.spec.*',
        '**/node_modules/**',
        '**/dist/**',
      ],
      // HOTFIX PROTOCOL 1.0 - Cobertura mínima obrigatória
      thresholds: {
        statements: 70,
        branches: 65,
        functions: 70,
        lines: 70,
      },
    },
  },
});
