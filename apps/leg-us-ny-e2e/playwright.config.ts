import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './src',
  outputDir: '../../../dist/.playwright/libs/plugins/leg-us-ny-e2e/results',
  reporter: [
    [
      'html',
      {
        outputFolder:
          '../../../dist/.playwright/libs/plugins/leg-us-ny-e2e/report',
      },
    ],
  ],
  use: {
    baseURL: process.env['PLAYWRIGHT_TEST_BASE_URL'] || 'http://localhost:4200',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npx nx serve client-angular -c firebase',
    url: 'http://localhost:4200',
    reuseExistingServer: true,
    timeout: 120 * 1000,
  },
});
