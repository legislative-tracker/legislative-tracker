import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  outputDir: '../../../dist/.playwright/libs/client-angular/ui/results',
  reporter: [
    [
      'html',
      {
        outputFolder: '../../../dist/.playwright/libs/client-angular/ui/report',
      },
    ],
  ],
  use: {
    baseURL: process.env['PLAYWRIGHT_TEST_BASE_URL'] || 'http://localhost:4200',
    trace: 'on-first-retry',
  },
  webServer: {
    command:
      "node -e \"const { spawn } = require('child_process'); const env = { ...process.env }; Object.keys(env).forEach(k => k.startsWith('NX_') && delete env[k]); const child = spawn('npx', ['nx', 'serve', 'client-angular', '-c', 'firebase'], { env, stdio: 'inherit' }); child.on('exit', code => process.exit(code || 0));\"",
    url: 'http://localhost:4200',
    reuseExistingServer: true,
    timeout: 120 * 1000,
    cwd: process.cwd(),
  },
});
