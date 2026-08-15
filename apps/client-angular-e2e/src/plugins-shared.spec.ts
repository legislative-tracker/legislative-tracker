import { test, expect } from '@playwright/test';

test.describe('Plugins & Shared Models E2E Integration', () => {
  test('should load state dashboard with NY legislature plugin integration', async ({
    page,
  }) => {
    await page.goto('/ny');
    await expect(page).toHaveURL(/\/ny$/);
    const headerTitle = page.locator('.title');
    await expect(headerTitle).toContainText('Legislative Tracker');
  });
});
