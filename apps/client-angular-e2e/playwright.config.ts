import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './src',
  outputDir: '../../dist/.playwright/apps/client-angular-e2e/results',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: process.env['CI'] ? 1 : undefined,
  reporter: [
    [
      'html',
      { outputFolder: '../../dist/.playwright/apps/client-angular-e2e/report' },
    ],
    ['list'],
  ],
  use: {
    baseURL: process.env['PLAYWRIGHT_TEST_BASE_URL'] || 'http://localhost:4200',
    trace: 'on-first-retry',
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command:
      "node -e \"const { spawn } = require('child_process'); const env = { ...process.env }; Object.keys(env).forEach(k => k.startsWith('NX_') && delete env[k]); const child = spawn('npx', ['nx', 'serve', 'client-angular', '-c', 'firebase'], { env, stdio: 'inherit' }); child.on('exit', code => process.exit(code || 0));\"",
    url: 'http://localhost:4200',
    reuseExistingServer: true,
    timeout: 120 * 1000,
    cwd: process.cwd(),
  },
});
