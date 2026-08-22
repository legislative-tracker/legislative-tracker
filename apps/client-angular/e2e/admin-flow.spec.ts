import { test, expect } from '@playwright/test';

test.describe('Admin Flow Feature', () => {
  test('should redirect unauthenticated users trying to access /admin to login page or home', async ({
    page,
  }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login|\/us-ny/);
    await expect(page.locator('.app-header')).toBeVisible();
  });

  test('should redirect unauthenticated users trying to access /admin/add-bill', async ({
    page,
  }) => {
    await page.goto('/admin/add-bill');
    await expect(page).toHaveURL(/\/login|\/us-ny/);
    await expect(page.locator('.app-header')).toBeVisible();
  });

  test('should redirect unauthenticated users trying to access /admin/edit-bill', async ({
    page,
  }) => {
    await page.goto('/admin/edit-bill/test-bill-1');
    await expect(page).toHaveURL(/\/login|\/us-ny/);
    await expect(page.locator('.app-header')).toBeVisible();
  });
});
