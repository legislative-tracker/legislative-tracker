import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'path';

export default defineConfig({
  root: path.resolve(__dirname, '../../'),
  plugins: [
    tsconfigPaths({
      projects: [path.resolve(__dirname, '../../tsconfig.base.json')],
    }),
  ],
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
