import { test, expect } from '@playwright/test';

test.describe('Legislative Tracker Feature', () => {
  test('should render state dashboard for US-NY', async ({ page }) => {
    await page.goto('/us-ny');
    await expect(page).toHaveURL('/us-ny');
    await expect(page.locator('.app-header')).toBeVisible();
  });

  test('should display bill detail loading or content state', async ({
    page,
  }) => {
    await page.goto('/us-ny/ocd-bill/ocd-bill-test');
    await expect(page).toHaveURL('/us-ny/ocd-bill/ocd-bill-test');
    await expect(page.locator('.app-header')).toBeVisible();
  });
});
