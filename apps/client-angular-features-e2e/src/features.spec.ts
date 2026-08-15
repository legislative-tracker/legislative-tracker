import { test, expect } from '@playwright/test';

test.describe('Client Angular Features E2E', () => {
  test('should render state dashboard feature page', async ({ page }) => {
    await page.goto('/ny');
    await expect(page).toHaveURL(/\/ny$/);
  });

  test('should protect admin feature route', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).not.toHaveURL(/\/admin$/);
  });
});
