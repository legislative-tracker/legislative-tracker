import { test, expect } from '@playwright/test';

test.describe('Legislative Tracker Feature', () => {
  test('should render state dashboard for NY', async ({ page }) => {
    await page.goto('/ny');
    await expect(page).toHaveURL('/ny');
    await expect(page.locator('.app-header')).toBeVisible();
  });

  test('should display bill detail loading or content state', async ({
    page,
  }) => {
    await page.goto('/ny/bills/S1234');
    await expect(page).toHaveURL('/ny/bills/S1234');
    await expect(page.locator('.app-header')).toBeVisible();
  });
});
