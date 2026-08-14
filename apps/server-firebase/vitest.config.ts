import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  root: path.resolve(import.meta.dirname, '../../'),
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    globals: true,
    environment: 'node',
    include: [
      'apps/server-firebase/src/**/*.spec.ts',
      'apps/server-firebase/src/**/*.test.ts',
      'libs/server/**/*.spec.ts',
      'libs/server-firebase/**/*.spec.ts',
    ],
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
    },
  },
});
