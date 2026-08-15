import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './src',
  outputDir: '../../dist/.playwright/apps/data-access-google-maps-e2e/results',
  reporter: [
    [
      'html',
      {
        outputFolder:
          '../../dist/.playwright/apps/data-access-google-maps-e2e/report',
      },
    ],
  ],
  use: {
    baseURL: process.env['PLAYWRIGHT_TEST_BASE_URL'] || 'http://localhost:4200',
    trace: 'on-first-retry',
  },
});
