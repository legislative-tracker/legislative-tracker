import { test, expect } from '@playwright/test';

test.describe('Client Angular UI Components E2E', () => {
  test('should render toolbar header and navigation items', async ({
    page,
  }) => {
    await page.goto('/ny');
    await expect(page.locator('.app-header')).toBeVisible();
    await expect(page.locator('.title')).toContainText('Legislative Tracker');
  });

  test('should render app footer component', async ({ page }) => {
    await page.goto('/ny');
    await expect(page.locator('.app-footer')).toBeVisible();
  });
});
