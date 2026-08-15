import { test, expect } from '@playwright/test';

test.describe('Admin & User Profile Features', () => {
  test('should protect admin route when unauthenticated', async ({ page }) => {
    await page.goto('/admin');
    // Guard redirects unauthenticated user to / or /login
    await expect(page).not.toHaveURL(/\/admin$/);
    await expect(page.locator('.app-header')).toBeVisible();
  });

  test('should load profile page', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.locator('.app-header')).toBeVisible();
  });
});
