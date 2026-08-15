import { test, expect } from '@playwright/test';

test.describe('Member Detail Feature', () => {
  test('should render member detail route for state NY', async ({ page }) => {
    await page.goto('/ny/member/S100');
    await expect(page.locator('.app-header')).toBeVisible();
  });
});
