import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  outputDir: '../../dist/.playwright/apps/server-firebase/results',
  reporter: [
    [
      'html',
      {
        outputFolder: '../../dist/.playwright/apps/server-firebase/report',
      },
    ],
  ],
  use: {
    baseURL: process.env['PLAYWRIGHT_TEST_BASE_URL'] || 'http://127.0.0.1:5001',
    trace: 'on-first-retry',
  },
});
