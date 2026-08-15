import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  outputDir: '../../../dist/.playwright/libs/server/util-core/results',
  reporter: [
    [
      'html',
      {
        outputFolder: '../../../dist/.playwright/libs/server/util-core/report',
      },
    ],
  ],
  use: {
    baseURL: process.env['PLAYWRIGHT_TEST_BASE_URL'] || 'http://localhost:4200',
    trace: 'on-first-retry',
  },
});
