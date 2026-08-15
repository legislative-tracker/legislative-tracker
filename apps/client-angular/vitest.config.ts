import { defineConfig } from 'vitest/config';
import angular from '@analogjs/vite-plugin-angular';
import path from 'path';

export default defineConfig({
  root: path.resolve(import.meta.dirname, '../../'),
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    angular({
      tsconfig: path.resolve(import.meta.dirname, 'tsconfig.spec.json'),
    }),
  ],
  test: {
    watch: false,
    globals: true,
    environment: 'jsdom',
    pool: 'forks',
    setupFiles: [path.resolve(import.meta.dirname, 'src/test-setup.ts')],
    include: [
      'apps/client-angular/src/**/*.spec.ts',
      'libs/client-angular/**/*.spec.ts',
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/e2e/**',
      'libs/client-angular/*-e2e/**',
      '**/*-e2e/**',
    ],
    server: {
      deps: {
        inline: [/@angular\//, /rxfire/],
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
    },
  },
});
