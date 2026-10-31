import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@data': path.resolve(__dirname, './data'),
    },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'aplicacion',
          environment: 'jsdom',
          include: ['src/**/*.{test,spec}.{ts,tsx}'],
          globals: true,
          setupFiles: ['./src/test/setup.ts'],
        },
      },
    ],
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    globals: true,
  },
});
